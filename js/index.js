import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { addToCart, updateCartBadge } from "./cart.js";
import { formatPrice, showToast, escapeHtml, initScrollHeader } from "./utils.js";

initScrollHeader();
updateCartBadge();

const grid = document.getElementById("products-grid");
const noProducts = document.getElementById("no-products");
const filtersEl = document.getElementById("filters");

let allProducts = [];
let activeFilter = "all";

async function loadProducts() {
  // Abort early if Firebase config is still placeholder
  if (isFirebasePlaceholder()) {
    grid.innerHTML = "";
    showConfigWarning();
    return;
  }

  // Set a 8s timeout so we don't wait forever on bad config
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), 8000)
  );

  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await Promise.race([getDocs(q), timeout]);
    allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    buildFilters();
    renderProducts(allProducts);
  } catch (err) {
    console.error("Greška:", err);
    grid.innerHTML = "";
    if (err.message === "timeout" || err.code === "unavailable" || err.code === "permission-denied") {
      showConfigWarning();
    } else {
      noProducts.style.display = "block";
    }
  }
}

function isFirebasePlaceholder() {
  // Detect if someone forgot to replace the placeholder config
  try {
    const app = db.app;
    return app.options.apiKey === "YOUR_API_KEY" || !app.options.projectId || app.options.projectId === "YOUR_PROJECT_ID";
  } catch { return false; }
}

function showConfigWarning() {
  grid.innerHTML = `
    <div style="grid-column:1/-1;">
      <div style="background:#fff8e6;border:1.5px solid #f0c040;border-radius:16px;padding:32px;text-align:center;max-width:560px;margin:0 auto;">
        <div style="font-size:2rem;margin-bottom:12px;">🔧</div>
        <h3 style="font-family:var(--font-serif);font-size:1.3rem;margin-bottom:10px;">Firebase nije konfigurisan</h3>
        <p style="color:var(--color-text-muted);font-size:0.88rem;line-height:1.7;margin-bottom:16px;">
          Da bi shop radio, potrebno je unijeti Firebase config.<br>
          Otvori fajl <code style="background:#f4f2ee;padding:2px 7px;border-radius:4px;font-size:0.82rem;">js/firebase-config.js</code> i zamijeni placeholder vrijednosti sa stvarnim Firebase projektom.
        </p>
        <a href="https://console.firebase.google.com/" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:10px 20px;background:var(--color-primary);color:#fff;border-radius:10px;font-size:0.85rem;font-weight:600;">
          Otvori Firebase Console
        </a>
      </div>
    </div>
  `;
}

function buildFilters() {
  const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  categories.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.dataset.filter = cat;
    btn.textContent = cat;
    filtersEl.appendChild(btn);
  });
  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    filtersEl.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    const filtered = activeFilter === "all" ? allProducts : allProducts.filter(p => p.category === activeFilter);
    renderProducts(filtered);
  });
}

function renderProducts(products) {
  grid.innerHTML = "";
  if (!products.length) { noProducts.style.display = "block"; return; }
  noProducts.style.display = "none";
  products.forEach(p => grid.appendChild(createCard(p)));
}

function createCard(p) {
  const outOfStock = p.stock <= 0;
  const lowStock = p.stock > 0 && p.stock <= 5;
  const isNew = p.createdAt && (Date.now() - p.createdAt.toMillis() < 7 * 24 * 60 * 60 * 1000);
  const mlDisplay = p.ml ? `<span style="font-size:0.72rem;color:var(--color-text-light);font-weight:400;margin-left:4px;">(${p.ml} ml)</span>` : "";

  const card = document.createElement("div");
  card.className = "product-card";
  card.innerHTML = `
    <div class="product-card__image-wrap">
      ${outOfStock ? '<span class="product-card__badge badge--out">Nema na zalihi</span>' : lowStock ? '<span class="product-card__badge badge--low">Malo na zalihi</span>' : isNew ? '<span class="product-card__badge badge--new">Novo</span>' : ""}
      <img src="${escapeHtml((p.images?.[0] || "").replace(/^\/images\//, "./images/"))}" alt="${escapeHtml(p.name)}" loading="lazy"
        onerror="this.style.display='none';this.parentElement.style.background='var(--color-bg-muted)'" />
    </div>
    <div class="product-card__body">
      <div class="product-card__name">${escapeHtml(p.name)}${mlDisplay}</div>
      <div class="product-card__desc">${escapeHtml(p.description || "")}</div>
      <div class="product-card__footer">
        <span class="product-card__price">${formatPrice(p.price)}</span>
        <button class="product-card__add" data-id="${p.id}" aria-label="Dodaj u korpu" ${outOfStock ? "disabled" : ""}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
      </div>
    </div>
  `;

  card.addEventListener("click", (e) => {
    if (e.target.closest(".product-card__add")) {
      e.stopPropagation();
      if (!outOfStock) {
        addToCart(p, 1);
        showToast(`${p.name} dodano u korpu`);
      }
      return;
    }
    window.location.href = `.//hiwebshom/product.html?id=${p.id}`;
  });

  return card;
}

loadProducts();
