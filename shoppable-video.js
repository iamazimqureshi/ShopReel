/**
 * ShopReel — Shoppable Video Widget
 * Injected into Shopify storefront via Script Tag
 */
(function () {
  'use strict';

  const HOST = document.currentScript?.src?.split('/widget/')[0] || '';
  const SHOP = document.currentScript?.dataset?.shop || window.Shopify?.shop || '';

  if (!SHOP) return;

  // ─── Styles ─────────────────────────────────────────────────────────────────
  const styles = `
    #shopreel-launcher {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9999;
      cursor: pointer;
      animation: shopreel-pulse 2.5s infinite;
    }

    @keyframes shopreel-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.04); }
    }

    #shopreel-launcher-btn {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff5c35, #ff8f6b);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 30px rgba(255,92,53,0.5);
      color: white;
      font-size: 1.5rem;
      position: relative;
    }

    #shopreel-launcher-label {
      position: absolute;
      bottom: -22px;
      left: 50%;
      transform: translateX(-50%);
      white-space: nowrap;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #ff5c35;
      font-family: sans-serif;
      text-transform: uppercase;
    }

    #shopreel-count-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: white;
      color: #ff5c35;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
    }

    #shopreel-panel {
      position: fixed;
      bottom: 0;
      right: 0;
      width: 100%;
      max-width: 420px;
      height: 100%;
      max-height: 100vh;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      background: #0a0a0f;
      transform: translateX(110%);
      transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      box-shadow: -8px 0 60px rgba(0,0,0,0.6);
    }

    @media (max-width: 480px) {
      #shopreel-panel {
        max-width: 100%;
        width: 100%;
      }
    }

    #shopreel-panel.open {
      transform: translateX(0);
    }

    #shopreel-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
      backdrop-filter: blur(2px);
    }

    #shopreel-overlay.open {
      opacity: 1;
      pointer-events: all;
    }

    /* Video swipe container */
    #shopreel-videos {
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .shopreel-video-slide {
      position: absolute;
      inset: 0;
      transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .shopreel-video-slide video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Gradient overlays */
    .shopreel-video-slide::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 120px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
      z-index: 2;
      pointer-events: none;
    }

    .shopreel-video-slide::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 55%;
      background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%);
      z-index: 2;
      pointer-events: none;
    }

    /* Panel header */
    #shopreel-header {
      position: absolute;
      top: 0; left: 0; right: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 0;
    }

    .shopreel-logo {
      font-family: sans-serif;
      font-weight: 900;
      font-size: 1rem;
      color: white;
      letter-spacing: -0.3px;
    }

    .shopreel-logo span { color: #ff5c35; }

    .shopreel-close-btn {
      width: 34px;
      height: 34px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(8px);
      border: none;
      border-radius: 50%;
      color: white;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Nav arrows */
    .shopreel-nav {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .shopreel-nav-btn {
      width: 38px;
      height: 38px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 50%;
      color: white;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }

    .shopreel-nav-btn:hover { background: rgba(255,255,255,0.25); }
    .shopreel-nav-btn:disabled { opacity: 0.3; cursor: default; }

    /* Progress indicators */
    .shopreel-progress {
      position: absolute;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 5px;
      z-index: 10;
    }

    .shopreel-dot {
      width: 6px;
      height: 6px;
      border-radius: 3px;
      background: rgba(255,255,255,0.35);
      transition: all 0.3s;
    }

    .shopreel-dot.active {
      background: white;
      width: 18px;
    }

    /* Product overlay at bottom */
    .shopreel-product-area {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      z-index: 5;
      padding: 20px 18px 24px;
    }

    .shopreel-video-title {
      color: rgba(255,255,255,0.8);
      font-size: 0.75rem;
      font-family: sans-serif;
      margin-bottom: 10px;
      letter-spacing: 0.3px;
    }

    .shopreel-product-card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 16px;
      padding: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
      transition: background 0.2s;
    }

    .shopreel-product-card:hover {
      background: rgba(255,255,255,0.18);
    }

    .shopreel-product-img {
      width: 56px;
      height: 56px;
      border-radius: 10px;
      object-fit: cover;
      background: rgba(255,255,255,0.1);
      flex-shrink: 0;
    }

    .shopreel-product-info {
      flex: 1;
      min-width: 0;
    }

    .shopreel-product-name {
      color: white;
      font-family: sans-serif;
      font-weight: 700;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 3px;
    }

    .shopreel-product-price {
      color: #ff8f6b;
      font-family: sans-serif;
      font-weight: 700;
      font-size: 0.92rem;
    }

    .shopreel-add-btn {
      background: #ff5c35;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 9px 14px;
      font-family: sans-serif;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background 0.15s, transform 0.1s;
    }

    .shopreel-add-btn:hover { background: #e04d2a; }
    .shopreel-add-btn:active { transform: scale(0.96); }
    .shopreel-add-btn.loading { opacity: 0.7; cursor: wait; }
    .shopreel-add-btn.added { background: #2dda93; color: #000; }

    /* Mute button */
    .shopreel-mute-btn {
      position: absolute;
      bottom: 14px;
      right: 58px;
      z-index: 10;
      width: 34px;
      height: 34px;
      background: rgba(0,0,0,0.4);
      border: none;
      border-radius: 50%;
      color: white;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Loader */
    .shopreel-loader {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0f;
      z-index: 20;
    }

    .shopreel-spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(255,92,53,0.2);
      border-top-color: #ff5c35;
      border-radius: 50%;
      animation: shopreel-spin 0.7s linear infinite;
    }

    @keyframes shopreel-spin {
      to { transform: rotate(360deg); }
    }

    /* Empty state */
    .shopreel-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: rgba(255,255,255,0.5);
      font-family: sans-serif;
      text-align: center;
      padding: 40px;
    }
  `;

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // ─── State ───────────────────────────────────────────────────────────────────
  let videos = [];
  let currentIndex = 0;
  let isMuted = false;
  let currentVideo = null;

  // ─── DOM Build ───────────────────────────────────────────────────────────────
  function buildUI() {
    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'shopreel-overlay';
    overlay.onclick = closePanel;

    // Panel
    const panel = document.createElement('div');
    panel.id = 'shopreel-panel';
    panel.innerHTML = `
      <div id="shopreel-header">
        <div class="shopreel-logo">Shop<span>Reel</span></div>
        <button class="shopreel-close-btn" onclick="document.getElementById('shopreel-panel').classList.remove('open');document.getElementById('shopreel-overlay').classList.remove('open')">✕</button>
      </div>
      <div id="shopreel-videos">
        <div class="shopreel-loader" id="shopreel-loader">
          <div class="shopreel-spinner"></div>
        </div>
      </div>
    `;

    // Launcher
    const launcher = document.createElement('div');
    launcher.id = 'shopreel-launcher';
    launcher.innerHTML = `
      <button id="shopreel-launcher-btn" onclick="openPanel()">
        ▶
        <div id="shopreel-count-badge">0</div>
      </button>
      <div id="shopreel-launcher-label">Shop Videos</div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    document.body.appendChild(launcher);
  }

  function openPanel() {
    document.getElementById('shopreel-panel').classList.add('open');
    document.getElementById('shopreel-overlay').classList.add('open');
    if (currentVideo) currentVideo.play();
  }

  function closePanel() {
    document.getElementById('shopreel-panel').classList.remove('open');
    document.getElementById('shopreel-overlay').classList.remove('open');
    if (currentVideo) currentVideo.pause();
  }

  // ─── Load & Render Videos ────────────────────────────────────────────────────
  async function loadVideos() {
    try {
      const res = await fetch(`${HOST}/api/public/videos?shop=${encodeURIComponent(SHOP)}`);
      videos = await res.json();
    } catch (e) {
      videos = [];
    }

    const badge = document.getElementById('shopreel-count-badge');
    if (badge) badge.textContent = videos.length;

    if (videos.length === 0) {
      document.getElementById('shopreel-launcher').style.display = 'none';
      return;
    }

    renderSlides();
  }

  function renderSlides() {
    const container = document.getElementById('shopreel-videos');
    container.innerHTML = '';

    // Progress dots
    const progressEl = document.createElement('div');
    progressEl.className = 'shopreel-progress';
    progressEl.innerHTML = videos.map((_, i) =>
      `<div class="shopreel-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></div>`
    ).join('');
    container.appendChild(progressEl);

    // Nav buttons
    const nav = document.createElement('div');
    nav.className = 'shopreel-nav';
    nav.innerHTML = `
      <button class="shopreel-nav-btn" id="shopreel-prev" onclick="navigate(-1)" disabled>↑</button>
      <button class="shopreel-nav-btn" id="shopreel-next" onclick="navigate(1)" ${videos.length <= 1 ? 'disabled' : ''}>↓</button>
    `;
    container.appendChild(nav);

    // Video slides
    videos.forEach((video, i) => {
      const slide = document.createElement('div');
      slide.className = 'shopreel-video-slide';
      slide.dataset.idx = i;
      slide.style.transform = i === 0 ? 'translateX(0)' : 'translateX(100%)';

      const videoEl = document.createElement('video');
      videoEl.src = video.video_url.startsWith('/') ? HOST + video.video_url : video.video_url;
      videoEl.loop = true;
      videoEl.muted = false;
      videoEl.playsInline = true;
      videoEl.preload = 'metadata';
      if (i === 0) {
        videoEl.autoplay = true;
        currentVideo = videoEl;
        // Track view
        trackEvent(video.id, 'view');
      }

      slide.appendChild(videoEl);

      // Product area
      const productArea = document.createElement('div');
      productArea.className = 'shopreel-product-area';
      productArea.innerHTML = `<div class="shopreel-video-title">${video.title}</div>`;

      (video.products || []).forEach(product => {
        const card = document.createElement('div');
        card.className = 'shopreel-product-card';
        card.innerHTML = `
          ${product.image ? `<img class="shopreel-product-img" src="${product.image}" alt="${product.title}">` : '<div class="shopreel-product-img"></div>'}
          <div class="shopreel-product-info">
            <div class="shopreel-product-name">${product.title}</div>
            <div class="shopreel-product-price">$${product.price}</div>
          </div>
          <button class="shopreel-add-btn" data-variant="${product.variant_id}" data-product-id="${product.id}"
            onclick="addToCart(this, '${product.variant_id}', '${video.id}')">
            Add to Cart
          </button>
        `;
        productArea.appendChild(card);
      });

      slide.appendChild(productArea);

      // Mute toggle
      const muteBtn = document.createElement('button');
      muteBtn.className = 'shopreel-mute-btn';
      muteBtn.innerHTML = '🔊';
      muteBtn.onclick = () => toggleMute(videoEl, muteBtn);
      slide.appendChild(muteBtn);

      container.appendChild(slide);
    });

    // Touch swipe support
    let touchStartY = 0;
    container.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; });
    container.addEventListener('touchend', e => {
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
    });

    document.getElementById('shopreel-loader').remove();
  }

  function navigate(dir) {
    const newIdx = currentIndex + dir;
    if (newIdx < 0 || newIdx >= videos.length) return;

    const slides = document.querySelectorAll('.shopreel-video-slide');
    const dots = document.querySelectorAll('.shopreel-dot');

    // Pause current
    const curVideo = slides[currentIndex]?.querySelector('video');
    if (curVideo) curVideo.pause();

    // Animate out
    slides[currentIndex].style.transform = dir > 0 ? 'translateY(-100%)' : 'translateY(100%)';
    // Animate in
    slides[newIdx].style.transform = 'translateY(0)';

    currentIndex = newIdx;

    // Play new
    const newVideo = slides[currentIndex]?.querySelector('video');
    if (newVideo) {
      newVideo.play();
      currentVideo = newVideo;
    }

    // Update dots
    dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));

    // Update nav buttons
    document.getElementById('shopreel-prev').disabled = currentIndex === 0;
    document.getElementById('shopreel-next').disabled = currentIndex === videos.length - 1;

    // Track view
    trackEvent(videos[currentIndex].id, 'view');
  }

  // ─── Add to Cart (Shopify AJAX API) ──────────────────────────────────────────
  async function addToCart(btn, variantId, videoId) {
    if (!variantId || variantId === 'undefined') {
      alert('Product unavailable');
      return;
    }

    btn.classList.add('loading');
    btn.textContent = '...';

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(variantId), quantity: 1 })
      });

      if (res.ok) {
        btn.classList.remove('loading');
        btn.classList.add('added');
        btn.textContent = '✓ Added!';
        trackEvent(videoId, 'click');

        // Update cart count in header if available
        updateCartCount();

        setTimeout(() => {
          btn.classList.remove('added');
          btn.textContent = 'Add to Cart';
        }, 2500);
      } else {
        throw new Error('Add to cart failed');
      }
    } catch (e) {
      btn.classList.remove('loading');
      btn.textContent = 'Add to Cart';
      alert('Could not add to cart. Please try again.');
    }
  }

  async function updateCartCount() {
    try {
      const res = await fetch('/cart.js');
      const cart = await res.json();
      // Try common cart count selectors
      const selectors = ['.cart-count', '.cart__count', '[data-cart-count]', '.header__cart-count', '.cart-item-count'];
      selectors.forEach(sel => {
        const els = document.querySelectorAll(sel);
        els.forEach(el => { el.textContent = cart.item_count; });
      });
    } catch (e) {}
  }

  function toggleMute(videoEl, btn) {
    videoEl.muted = !videoEl.muted;
    btn.innerHTML = videoEl.muted ? '🔇' : '🔊';
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────
  function trackEvent(videoId, type) {
    fetch(`${HOST}/api/videos/${videoId}/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    }).catch(() => {});
  }

  // Expose navigate globally for onclick handlers
  window.navigate = navigate;
  window.openPanel = openPanel;
  window.addToCart = addToCart;

  // ─── Boot ────────────────────────────────────────────────────────────────────
  function boot() {
    buildUI();
    loadVideos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
