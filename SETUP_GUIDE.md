# 🎬 ShopReel — Complete Setup Guide
## Shoppable Video App for Shopify

---

## What You're Getting

A **private Shopify app** (just for your store) that adds:
- 📹 **Admin dashboard** to upload & manage videos
- 🏷️ **Product tagging** — link your Shopify products to videos
- 🛍️ **Storefront widget** — floating ▶ button on your store that opens a vertical video feed
- ➕ **Add to Cart** — shoppers can buy directly from the video player
- 📊 **Analytics** — track views and clicks per video

---

## Step 1 — Set Up Hosting (Railway — Free to Start)

1. Go to **[railway.app](https://railway.app)** and sign up (free)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Upload this project folder to GitHub first (or use Railway's CLI)
4. Railway will detect it's a Node.js app and deploy automatically
5. Once deployed, copy your **public URL** (looks like `https://shopreel-production.up.railway.app`)

> **Alternative:** Use [Render.com](https://render.com) — also free tier available

---

## Step 2 — Create Your Shopify App

1. Go to **[partners.shopify.com](https://partners.shopify.com)** → Log in
2. Click **"Apps"** in the left menu
3. Click **"Create app"** → Choose **"Create app manually"**
4. Name it: `ShopReel` (or anything you like)
5. Under **App setup → URLs**, set:
   - **App URL:** `https://YOUR-RAILWAY-URL/admin`
   - **Allowed redirection URLs:** `https://YOUR-RAILWAY-URL/auth/callback`
6. Copy your **API key** and **API secret key**

---

## Step 3 — Configure Environment Variables

In your Railway project:
1. Go to **Settings** → **Variables**
2. Add these 3 variables:

| Variable | Value |
|---|---|
| `SHOPIFY_API_KEY` | (from Step 2) |
| `SHOPIFY_API_SECRET` | (from Step 2) |
| `HOST` | `https://YOUR-RAILWAY-URL` |

---

## Step 4 — Install on Your Store

1. In your Shopify Partner Dashboard, go to your app
2. Click **"Select store"** and choose your development/production store
3. Click **"Install app"**
4. You'll be redirected to your ShopReel dashboard ✅

---

## Step 5 — Upload Your First Video

1. In the ShopReel dashboard, click **"Upload Video"**
2. Enter a title (e.g. "Summer Collection")
3. Upload your MP4/MOV video file (up to 100MB)
4. Search and tag your Shopify products
5. Click **"Upload & Publish"**

Your video will appear as a floating **▶** button on your Shopify store immediately!

---

## How It Works on Your Store

- A small **▶ Shop Videos** button appears in the bottom-right corner
- Shoppers click it to open a full-screen vertical video feed (like Instagram Reels)
- Each video shows tagged products with **name, price, and Add to Cart**
- Shoppers swipe up/down to browse videos
- Clicking **Add to Cart** adds the product without leaving the video

---

## Managing Videos

| Action | How |
|---|---|
| Upload video | Click **"+ Upload Video"** |
| Pause a video | Toggle the green switch on the video card |
| Delete a video | Click the 🗑 button |
| Preview a video | Click the **Preview** button |
| Track performance | Click **Analytics** in the sidebar |

---

## Troubleshooting

**Widget not showing on store?**
→ Go to Settings → copy the embed code → paste before `</body>` in your theme's `theme.liquid`

**Products not loading in search?**
→ Make sure your app has `read_products` permission (re-install if needed)

**Videos not playing?**
→ Make sure your video is MP4 format (H.264 codec works best)

---

## Need Help?

The app stores all data in a simple `db.json` file on your server.
Videos are stored in the `/uploads` folder.

For production use, consider:
- Moving to a database like **Supabase** (free tier)
- Using **Cloudinary** or **AWS S3** for video storage
