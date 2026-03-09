const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Simple file-based DB ────────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, 'db.json');
function readDB() {
  if (!fs.existsSync(DB_PATH)) return { shops: {}, videos: [] };
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ─── File uploads ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// ─── Serve static files ──────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/widget', express.static(path.join(__dirname, '../widget')));

// ─── Shopify OAuth ───────────────────────────────────────────────────────────
const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, HOST } = process.env;
const SCOPES = 'read_products,write_script_tags';

app.get('/auth', (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).send('Missing shop');
  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${HOST}/auth/callback`;
  const url = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&redirect_uri=${redirectUri}&state=${state}`;
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  const { shop, code, hmac, state } = req.query;
  // Verify HMAC
  const params = Object.keys(req.query).filter(k => k !== 'hmac').sort()
    .map(k => `${k}=${req.query[k]}`).join('&');
  const digest = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(params).digest('hex');
  if (digest !== hmac) return res.status(401).send('HMAC validation failed');

  // Exchange code for token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: SHOPIFY_API_KEY, client_secret: SHOPIFY_API_SECRET, code })
  });
  const { access_token } = await tokenRes.json();

  // Save to DB
  const db = readDB();
  db.shops[shop] = { access_token, installed_at: new Date().toISOString() };
  writeDB(db);

  // Install script tag
  await installScriptTag(shop, access_token);

  res.redirect(`/admin?shop=${shop}`);
});

async function installScriptTag(shop, token) {
  const src = `${HOST}/widget/shoppable-video.js`;
  // Check existing
  const existing = await fetch(`https://${shop}/admin/api/2024-01/script_tags.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  }).then(r => r.json());

  const already = existing.script_tags?.find(s => s.src === src);
  if (already) return;

  await fetch(`https://${shop}/admin/api/2024-01/script_tags.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ script_tag: { event: 'onload', src } })
  });
}

// ─── Videos API ──────────────────────────────────────────────────────────────
app.get('/api/videos', (req, res) => {
  const db = readDB();
  res.json(db.videos || []);
});

app.post('/api/videos', upload.single('video'), async (req, res) => {
  const { shop, title, products } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No video file' });

  const db = readDB();
  const shopData = db.shops[shop];
  if (!shopData) return res.status(401).json({ error: 'Shop not authenticated' });

  // Fetch thumbnail from products
  let productDetails = [];
  let parsedProducts = [];
  try { parsedProducts = JSON.parse(products || '[]'); } catch {}

  for (const pid of parsedProducts) {
    const pRes = await fetch(`https://${shop}/admin/api/2024-01/products/${pid}.json`, {
      headers: { 'X-Shopify-Access-Token': shopData.access_token }
    });
    const { product } = await pRes.json();
    if (product) {
      productDetails.push({
        id: product.id,
        title: product.title,
        price: product.variants[0]?.price,
        image: product.images[0]?.src,
        handle: product.handle,
        variant_id: product.variants[0]?.id
      });
    }
  }

  const video = {
    id: Date.now().toString(),
    title,
    shop,
    video_url: `/uploads/${req.file.filename}`,
    products: productDetails,
    created_at: new Date().toISOString(),
    active: true,
    views: 0,
    clicks: 0
  };

  db.videos = db.videos || [];
  db.videos.unshift(video);
  writeDB(db);

  res.json(video);
});

app.delete('/api/videos/:id', (req, res) => {
  const db = readDB();
  db.videos = db.videos.filter(v => v.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

app.patch('/api/videos/:id', (req, res) => {
  const db = readDB();
  const idx = db.videos.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.videos[idx] = { ...db.videos[idx], ...req.body };
  writeDB(db);
  res.json(db.videos[idx]);
});

// Track analytics
app.post('/api/videos/:id/event', (req, res) => {
  const { type } = req.body;
  const db = readDB();
  const video = db.videos.find(v => v.id === req.params.id);
  if (video) {
    if (type === 'view') video.views = (video.views || 0) + 1;
    if (type === 'click') video.clicks = (video.clicks || 0) + 1;
    writeDB(db);
  }
  res.json({ success: true });
});

// Public videos endpoint for widget
app.get('/api/public/videos', (req, res) => {
  const { shop } = req.query;
  const db = readDB();
  const videos = (db.videos || []).filter(v => v.shop === shop && v.active);
  res.json(videos);
});

// Shopify products search
app.get('/api/products', async (req, res) => {
  const { shop, q } = req.query;
  const db = readDB();
  const shopData = db.shops[shop];
  if (!shopData) return res.status(401).json({ error: 'Not authenticated' });

  const url = `https://${shop}/admin/api/2024-01/products.json?title=${encodeURIComponent(q || '')}&limit=20`;
  const pRes = await fetch(url, { headers: { 'X-Shopify-Access-Token': shopData.access_token } });
  const data = await pRes.json();
  res.json(data.products || []);
});

// ─── Add to cart proxy ────────────────────────────────────────────────────────
// Cart is handled client-side via Shopify AJAX API on the storefront

app.listen(3000, () => console.log('🎬 Shoppable Video App running on port 3000'));
