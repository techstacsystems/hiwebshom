import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { addToCart, updateCartBadge } from "./cart.js";
import { formatPrice, showToast, escapeHtml, initScrollHeader } from "./utils.js";

initScrollHeader();
updateCartBadge();

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
if (!productId) { window.location.href = `${import.meta.env.BASE_URL}index.html`; }

async function loadProduct() {
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000));
  try {
    const snap = await Promise.race([getDoc(doc(db, "products", productId)), timeout]);
    if (!snap.exists()) { window.location.href = `${import.meta.env.BASE_URL}index.html`; return; }
    renderProduct({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error(err);
    const isConfigErr = !db.app.options.apiKey || db.app.options.apiKey === "YOUR_API_KEY";
    document.getElementById("product-content").innerHTML = isConfigErr
      ? `<div class="empty-state"><h3>Firebase nije konfigurisan</h3><p>Otvori <code>js/firebase-config.js</code> i unesi pravi Firebase config.</p></div>`
      : `<div class="empty-state"><h3>Greška pri učitavanju</h3><p>Pokušajte ponovo.</p></div>`;
  }
}

function renderProduct(p) {
  document.title = `${p.name} – Hareem Istanbul`;
  document.getElementById("breadcrumb-name").textContent = p.name;

  const images = p.images?.length ? p.images : [];
  const outOfStock = p.stock <= 0;
  const lowStock = p.stock > 0 && p.stock <= 5;
  const mlDisplay = p.ml ? ` <span style="font-size:0.9rem;font-weight:400;color:var(--color-text-muted);">(${p.ml} ml)</span>` : "";

  const stockBadge = outOfStock
    ? `<span class="product-info__stock stock--out"><span class="stock-dot"></span>Nema na zalihi</span>`
    : lowStock
    ? `<span class="product-info__stock stock--low"><span class="stock-dot"></span>Malo na zalihi (${p.stock} kom.)</span>`
    : `<span class="product-info__stock stock--ok"><span class="stock-dot"></span>Na zalihi (${p.stock} kom.)</span>`;

  const thumbsHtml = images.length > 1 ? images.map((img, i) => `
    <div class="gallery-thumb ${i === 0 ? "active" : ""}" data-idx="${i}">
      <img src="${escapeHtml(img.replace(/^\/images\//, "./images/"))}" alt="" loading="lazy" />
    </div>`).join("") : "";

  const mainImgSrc = (images[0] || "").replace(/^\/images\//, "./images/");

  document.getElementById("product-content").innerHTML = `
    <div class="product-layout">
      <div class="product-gallery">
        <div class="gallery-main">
          ${mainImgSrc ? `<img id="main-img" src="${escapeHtml(mainImgSrc)}" alt="${escapeHtml(p.name)}" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--color-text-light);font-size:0.85rem;">Nema slike</div>`}
        </div>
        ${images.length > 1 ? `<div class="gallery-thumbs" id="thumbs">${thumbsHtml}</div>` : ""}
      </div>
      <div class="product-info">
        ${p.category ? `<div class="product-info__category">${escapeHtml(p.category)}</div>` : ""}
        <h1 class="product-info__name heading-serif">${escapeHtml(p.name)}${mlDisplay}</h1>
        <div class="product-info__price">${formatPrice(p.price)}</div>
        <div class="product-info__divider"></div>
        <p class="product-info__desc">${escapeHtml(p.description || "").replace(/\n/g, "<br>")}</p>
        ${stockBadge}
        ${!outOfStock ? `
        <div class="quantity-row">
          <div class="quantity-control">
            <button class="qty-btn" id="qty-minus">−</button>
            <input type="number" class="qty-input" id="qty-input" value="1" min="1" max="${p.stock}" />
            <button class="qty-btn" id="qty-plus">+</button>
          </div>
          <button class="btn btn-primary" id="atc-btn" style="flex:1;">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" style="width:17px;height:17px;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.863-7.158a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
            Dodaj u korpu
          </button>
        </div>
        <a href="./cart.html" class="btn btn-outline btn--full" style="display:flex;">Idi u korpu</a>
        ` : `<button class="btn btn-primary btn--full" disabled>Nema na zalihi</button>`}
        <div style="display:flex;align-items:center;gap:8px;padding:13px;background:var(--color-bg-soft);border-radius:var(--radius-md);font-size:0.8rem;color:var(--color-text-muted);">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" style="width:17px;height:17px;flex-shrink:0;"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
          Plaćanje pouzećem.
        </div>
      </div>
    </div>
  `;

  // Gallery
  if (images.length > 1) {
    document.getElementById("thumbs").querySelectorAll(".gallery-thumb").forEach(thumb => {
      thumb.addEventListener("click", () => {
        document.getElementById("main-img").src = images[parseInt(thumb.dataset.idx)];
        document.querySelectorAll(".gallery-thumb").forEach(t => t.classList.remove("active"));
        thumb.classList.add("active");
      });
    });
  }

  // Qty controls
  if (!outOfStock) {
    const qi = document.getElementById("qty-input");
    document.getElementById("qty-minus").addEventListener("click", () => { if (parseInt(qi.value) > 1) qi.value--; });
    document.getElementById("qty-plus").addEventListener("click", () => { if (parseInt(qi.value) < p.stock) qi.value++; });
    document.getElementById("atc-btn").addEventListener("click", () => {
      addToCart(p, Math.max(1, Math.min(parseInt(qi.value) || 1, p.stock)));
      showToast(`${p.name} dodano u korpu`);
    });
  }
}

loadProduct();
