import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { formatPrice, showToast, escapeHtml } from "./utils.js";

// ===== STATE =====
let products = [];
let orders = [];
let manifestImages = []; // paths from images-manifest.json

// Selected images for add/edit forms
let addSelectedImages = [];  // string paths
let editSelectedImages = [];  // string paths (current product's images, mutated)

// ===== AUTH =====
onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("admin-screen").style.display = "block";
    document.getElementById("sidebar-user-email").textContent = user.email;
    initDashboard();
  } else {
    document.getElementById("login-screen").style.display = "flex";
    document.getElementById("admin-screen").style.display = "none";
  }
});

document.getElementById("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const btn = document.getElementById("login-btn");
  const errEl = document.getElementById("login-error");
  errEl.style.display = "none";
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    errEl.textContent = "Pogrešan email ili lozinka.";
    errEl.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Prijavi se";
  }
});

// Logout buttons (desktop + mobile)
document.getElementById("logout-btn").addEventListener("click", () => signOut(auth));
document.getElementById("mobile-logout-btn")?.addEventListener("click", () => signOut(auth));

// ===== MOBILE SIDEBAR TOGGLE =====
const sidebar = document.getElementById("admin-sidebar");
const overlay = document.getElementById("mobile-sidebar-overlay");
const sidebarToggle = document.getElementById("mobile-sidebar-toggle");

function closeSidebar() {
  sidebar?.classList.remove("open");
  overlay?.classList.remove("open");
  document.body.style.overflow = "";
}

sidebarToggle?.addEventListener("click", () => {
  sidebar?.classList.add("open");
  overlay?.classList.add("open");
  document.body.style.overflow = "hidden";
});

overlay?.addEventListener("click", closeSidebar);

// ===== INIT =====
async function initDashboard() {
  // Load manifest first (needed for image picker)
  await loadManifest();
  // Load data in parallel
  await Promise.all([loadOrders(), loadProducts()]);
  // After both load, update dashboard stats
  renderDashboardStats();
  // Initialize image picker for add product form
  buildImagePicker("add-img-picker", addSelectedImages, () => renderSelectedPreview("add-img-preview", addSelectedImages));
  renderSelectedPreview("add-img-preview", addSelectedImages);
}

async function loadManifest() {
  try {
    const res = await fetch("./images-manifest.json");
    if (res.ok) manifestImages = await res.json();
  } catch {
    manifestImages = [];
  }
}

// ===== TABS =====
const tabMap = {
  dashboard: "tab-dashboard",
  orders: "tab-orders",
  products: "tab-products",
  "add-product": "tab-add-product"
};
const tabTitles = {
  dashboard: "Dashboard",
  orders: "Narudžbe",
  products: "Svi proizvodi",
  "add-product": "Dodaj proizvod"
};

function switchTab(key) {
  document.querySelectorAll(".sidebar-nav-item").forEach(t => t.classList.remove("active"));
  document.querySelector(`.sidebar-nav-item[data-tab="${key}"]`)?.classList.add("active");
  Object.values(tabMap).forEach(id => document.getElementById(id)?.classList.remove("active"));
  document.getElementById(tabMap[key])?.classList.add("active");
  const topbarTitle = document.getElementById("topbar-title");
  if (topbarTitle) topbarTitle.textContent = tabTitles[key] || "";
  if (key === "add-product") resetAddForm();
  closeSidebar();
}

document.querySelectorAll(".sidebar-nav-item").forEach(item => {
  item.addEventListener("click", () => switchTab(item.dataset.tab));
});

// Button handlers for tab switching
document.getElementById("btn-view-all-orders")?.addEventListener("click", () => switchTab("orders"));
document.getElementById("btn-add-product")?.addEventListener("click", () => switchTab("add-product"));

// ===== DASHBOARD STATS =====
function renderDashboardStats() {
  document.getElementById("ds-total-products").textContent = products.length;
  document.getElementById("ds-total-orders").textContent = orders.length;
  const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  document.getElementById("ds-revenue").textContent = formatPrice(revenue);
  const today = new Date().toDateString();
  const todayCount = orders.filter(o => o.createdAt && new Date(o.createdAt.toMillis()).toDateString() === today).length;
  document.getElementById("ds-today").textContent = todayCount;

  // Recent orders list on dashboard
  const recentEl = document.getElementById("ds-recent-orders");
  if (!orders.length) {
    recentEl.innerHTML = `<p style="color:var(--color-text-muted);padding:20px;text-align:center;font-size:0.88rem;">Nema narudžbi još.</p>`;
    return;
  }
  recentEl.innerHTML = orders.slice(0, 5).map(o => {
    const date = o.createdAt ? new Date(o.createdAt.toMillis()).toLocaleDateString("bs-BA") : "–";
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--color-border-light);">
        <div>
          <div style="font-weight:600;font-size:0.86rem;">${escapeHtml(o.customer?.fullName || "–")}</div>
          <div style="font-size:0.75rem;color:var(--color-text-light);">${escapeHtml(o.orderNumber || o.id.slice(0,8))} · ${date}</div>
        </div>
        <span style="font-weight:700;font-size:0.9rem;">${formatPrice(o.total || 0)}</span>
      </div>`;
  }).join("");
}

// ===== ORDERS =====
async function loadOrders() {
  try {
    const snap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
    orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderOrders();
    // Update order stats
    const statTotal = document.getElementById("stat-total-orders");
    if (statTotal) {
      statTotal.textContent = orders.length;
      document.getElementById("stat-revenue").textContent = formatPrice(orders.reduce((s, o) => s + (o.total || 0), 0));
      const today = new Date().toDateString();
      document.getElementById("stat-today").textContent = orders.filter(o => o.createdAt && new Date(o.createdAt.toMillis()).toDateString() === today).length;
    }
  } catch (err) {
    console.error(err);
    const el = document.getElementById("orders-list");
    if (el) el.innerHTML = `<p style="color:var(--color-error);padding:20px;">Greška pri učitavanju narudžbi.</p>`;
  }
}

function renderOrders() {
  const el = document.getElementById("orders-list");
  if (!el) return;
  if (!orders.length) {
    el.innerHTML = `<div class="empty-state"><h3>Nema narudžbi</h3><p>Narudžbe će se pojaviti ovdje kada kupci naruče.</p></div>`;
    return;
  }
  el.innerHTML = orders.map(o => {
    const date = o.createdAt ? new Date(o.createdAt.toMillis()).toLocaleString("bs-BA") : "–";
    const items = (o.items || []).map(i =>
      `<div class="order-product-line"><span>${escapeHtml(i.name)} × ${i.quantity}</span><span>${formatPrice(i.subtotal || i.price * i.quantity)}</span></div>`
    ).join("");
    return `
      <div class="order-row" id="order-${o.id}">
        <div class="order-row-header" data-order-id="${o.id}">
          <div class="order-meta">
            <span class="order-num">${escapeHtml(o.orderNumber || o.id.slice(0,8))}</span>
            <span class="order-date">${date}</span>
            <span class="order-customer">${escapeHtml(o.customer?.fullName || "–")}</span>
            <span class="badge-status badge-status--new">${escapeHtml(o.status || "nova")}</span>
          </div>
          <div style="display:flex;align-items:center;gap:14px;">
            <span class="order-total">${formatPrice(o.total || 0)}</span>
            <div class="order-toggle">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
          </div>
        </div>
        <div class="order-body">
          <div class="order-details-grid">
            <div><div class="order-detail-label">Ime kupca</div><div class="order-detail-value">${escapeHtml(o.customer?.fullName || "–")}</div></div>
            <div><div class="order-detail-label">Telefon</div><div class="order-detail-value">${escapeHtml(o.customer?.phone || "–")}</div></div>
            <div><div class="order-detail-label">Adresa</div><div class="order-detail-value">${escapeHtml(o.customer?.address || "–")}</div></div>
            <div><div class="order-detail-label">Grad</div><div class="order-detail-value">${escapeHtml(o.customer?.city || "–")}</div></div>
            <div style="grid-column:1/-1;"><div class="order-detail-label">Napomena</div><div class="order-detail-value">${escapeHtml(o.customer?.note || "–")}</div></div>
          </div>
          <div class="order-detail-label" style="margin-bottom:8px;margin-top:4px;">Naručeni proizvodi</div>
          <div class="order-products-list">${items}</div>
        </div>
      </div>`;
  }).join("");

  // Add click handlers for order expansion
  el.querySelectorAll(".order-row-header").forEach(header => {
    header.addEventListener("click", () => {
      const orderId = header.dataset.orderId;
      document.getElementById(`order-${orderId}`)?.classList.toggle("expanded");
    });
  });
}

// ===== PRODUCTS =====
async function loadProducts() {
  try {
    const snap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
    products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProductsTable();
  } catch (err) {
    console.error(err);
  }
}

function renderProductsTable() {
  const tbody = document.getElementById("products-tbody");
  if (!tbody) return;
  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--color-text-muted);">Nema proizvoda – dodajte prvi!</td></tr>`;
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div class="product-mini">
          <img class="product-thumb" src="${escapeHtml(p.images?.[0] || "")}" alt=""
            onerror="this.style.opacity='0'" />
          <div>
            <div class="product-mini__name">${escapeHtml(p.name)}</div>
            ${p.category ? `<div style="font-size:0.72rem;color:var(--color-text-light);">${escapeHtml(p.category)}</div>` : ""}
          </div>
        </div>
      </td>
      <td>${formatPrice(p.price)}</td>
      <td>${p.ml ? `${p.ml} ml` : "–"}</td>
      <td>
        <span style="padding:3px 10px;border-radius:100px;font-size:0.75rem;font-weight:600;
          background:${p.stock <= 0 ? "var(--color-error-light)" : p.stock <= 5 ? "var(--color-warning-light)" : "var(--color-success-light)"};
          color:${p.stock <= 0 ? "var(--color-error)" : p.stock <= 5 ? "var(--color-warning)" : "var(--color-success)"};">
          ${p.stock ?? 0}
        </span>
      </td>
      <td>${p.images?.length || 0}</td>
      <td>
        <div class="table-actions">
          <button class="icon-btn icon-btn--edit" data-edit-id="${p.id}" title="Uredi">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
          </button>
          <button class="icon-btn icon-btn--delete" data-delete-id="${p.id}" title="Obriši">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          </button>
        </div>
      </td>
    </tr>`).join("");

  // Add click handlers for edit/delete
  tbody.querySelectorAll("[data-edit-id]").forEach(btn => {
    btn.addEventListener("click", () => openEdit(btn.dataset.editId));
  });
  tbody.querySelectorAll("[data-delete-id]").forEach(btn => {
    btn.addEventListener("click", () => openDelete(btn.dataset.deleteId));
  });
}

// ===== IMAGE PICKER =====
function buildImagePicker(containerId, selectedList, onUpdate) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!manifestImages.length) {
    container.innerHTML = `<p style="color:var(--color-text-muted);font-size:0.84rem;padding:16px;background:var(--color-bg-soft);border-radius:var(--radius-md);">
      Nema slika u <code>./images-manifest.json</code>. Dodajte slike u <code>/public/images/</code> i ažurirajte manifest.
    </p>`;
    return;
  }

  container.innerHTML = manifestImages.map(path => {
    const isSelected = selectedList.includes(path);
    return `
      <div class="img-picker-item ${isSelected ? "selected" : ""}" data-path="${escapeHtml(path)}" title="${escapeHtml(path)}">
        <img src="${escapeHtml(path)}" alt="" loading="lazy" onerror="this.style.opacity='0.3'" />
        <div class="img-picker-check">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        </div>
        <div class="img-picker-label">${escapeHtml(path.split("/").pop())}</div>
      </div>`;
  }).join("");

  container.querySelectorAll(".img-picker-item").forEach(item => {
    item.addEventListener("click", () => {
      const path = item.dataset.path;
      const idx = selectedList.indexOf(path);
      if (idx > -1) {
        selectedList.splice(idx, 1);
        item.classList.remove("selected");
      } else {
        selectedList.push(path);
        item.classList.add("selected");
      }
      onUpdate();
    });
  });
}

function renderSelectedPreview(previewId, selectedList) {
  const el = document.getElementById(previewId);
  if (!el) return;
  if (!selectedList.length) {
    el.innerHTML = `<p style="font-size:0.8rem;color:var(--color-text-light);">Nema odabranih slika</p>`;
    return;
  }
  el.innerHTML = selectedList.map(path => `
    <div class="image-preview-item">
      <img src="${escapeHtml(path)}" alt="" onerror="this.style.opacity='0.3'" />
      <button class="remove-img" type="button" data-path="${escapeHtml(path)}">×</button>
    </div>`).join("");
  el.querySelectorAll(".remove-img").forEach(btn => {
    btn.addEventListener("click", () => {
      const path = btn.dataset.path;
      const idx = selectedList.indexOf(path);
      if (idx > -1) selectedList.splice(idx, 1);
      // Deselect in picker
      const pickerItem = document.querySelector(`[data-path="${CSS.escape(path)}"]`);
      pickerItem?.classList.remove("selected");
      renderSelectedPreview(previewId, selectedList);
    });
  });
}

// ===== ADD PRODUCT FORM =====
function resetAddForm() {
  document.getElementById("p-name").value = "";
  document.getElementById("p-price").value = "";
  document.getElementById("p-desc").value = "";
  document.getElementById("p-ml").value = "";
  document.getElementById("p-stock").value = "";
  document.getElementById("p-category").value = "";
  addSelectedImages.length = 0;
  buildImagePicker("add-img-picker", addSelectedImages, () => renderSelectedPreview("add-img-preview", addSelectedImages));
  renderSelectedPreview("add-img-preview", addSelectedImages);
}

document.getElementById("save-product-btn").addEventListener("click", async () => {
  const name = document.getElementById("p-name").value.trim();
  const price = parseFloat(document.getElementById("p-price").value);
  const desc = document.getElementById("p-desc").value.trim();
  const ml = parseInt(document.getElementById("p-ml").value) || null;
  const stock = parseInt(document.getElementById("p-stock").value) || 0;
  const category = document.getElementById("p-category").value.trim();

  if (!name || isNaN(price) || !desc) {
    showToast("Popunite obavezna polja: naziv, cijena i opis.", "error");
    return;
  }

  const btn = document.getElementById("save-product-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Čuvanje...`;

  try {
    const productData = {
      name,
      description: desc,
      price,
      stock,
      category,
      images: [...addSelectedImages],
      createdAt: serverTimestamp()
    };
    if (ml) productData.ml = ml;

    await addDoc(collection(db, "products"), productData);
    showToast("Proizvod uspješno dodan!");
    resetAddForm();
    await loadProducts();
    renderDashboardStats();
    switchTab("products");
  } catch (err) {
    console.error(err);
    showToast("Greška pri dodavanju proizvoda.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:15px;height:15px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Dodaj proizvod`;
  }
});

// ===== EDIT MODAL =====
function openEdit(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  document.getElementById("modal-product-id").value = id;
  document.getElementById("modal-name").value = p.name || "";
  document.getElementById("modal-price").value = p.price ?? "";
  document.getElementById("modal-desc").value = p.description || "";
  document.getElementById("modal-ml").value = p.ml || "";
  document.getElementById("modal-stock").value = p.stock ?? 0;
  document.getElementById("modal-category").value = p.category || "";

  // Populate editSelectedImages with current product images
  editSelectedImages.length = 0;
  (p.images || []).forEach(img => editSelectedImages.push(img));

  buildImagePicker("edit-img-picker", editSelectedImages, () => renderSelectedPreview("edit-img-preview", editSelectedImages));
  renderSelectedPreview("edit-img-preview", editSelectedImages);

  document.getElementById("save-edit-btn").onclick = async () => {
    const name = document.getElementById("modal-name").value.trim();
    const price = parseFloat(document.getElementById("modal-price").value);
    const desc = document.getElementById("modal-desc").value.trim();
    const ml = parseInt(document.getElementById("modal-ml").value) || null;
    const stock = parseInt(document.getElementById("modal-stock").value) || 0;
    const category = document.getElementById("modal-category").value.trim();
    if (!name || isNaN(price)) { showToast("Naziv i cijena su obavezni.", "error"); return; }

    const btn = document.getElementById("save-edit-btn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;

    try {
      const updateData = {
        name,
        description: desc,
        price,
        stock,
        category,
        images: [...editSelectedImages]
      };
      if (ml) updateData.ml = ml;

      await updateDoc(doc(db, "products", id), updateData);
      showToast("Proizvod uspješno ažuriran!");
      closeModal("edit-modal");
      await loadProducts();
      renderDashboardStats();
    } catch (err) {
      console.error(err);
      showToast("Greška pri ažuriranju.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Spremi promjene";
    }
  };

  openModal("edit-modal");
}

// ===== DELETE MODAL =====
function openDelete(id) {
  document.getElementById("delete-product-id").value = id;
  openModal("delete-modal");
}

document.getElementById("confirm-delete-btn").addEventListener("click", async () => {
  const id = document.getElementById("delete-product-id").value;
  const btn = document.getElementById("confirm-delete-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;
  try {
    await deleteDoc(doc(db, "products", id));
    showToast("Proizvod obrisan.");
    closeModal("delete-modal");
    await loadProducts();
    renderDashboardStats();
  } catch (err) {
    console.error(err);
    showToast("Greška pri brisanju.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Obriši";
  }
});

// ===== MODAL HELPERS =====
function openModal(id) { document.getElementById(id).classList.add("open"); document.body.style.overflow = "hidden"; }
function closeModal(id) { document.getElementById(id).classList.remove("open"); document.body.style.overflow = ""; }

["close-edit-modal", "close-edit-modal-2"].forEach(id =>
  document.getElementById(id)?.addEventListener("click", () => closeModal("edit-modal"))
);
["close-delete-modal", "cancel-delete-btn"].forEach(id =>
  document.getElementById(id)?.addEventListener("click", () => closeModal("delete-modal"))
);
document.querySelectorAll(".modal-overlay").forEach(o =>
  o.addEventListener("click", e => { if (e.target === o) closeModal(o.id); })
);
