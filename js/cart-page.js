import { getCart, removeFromCart, updateCartQuantity, getCartTotal, updateCartBadge } from "./cart.js";
import { formatPrice, escapeHtml, initScrollHeader } from "./utils.js";

initScrollHeader();
updateCartBadge();

function render() {
  const cart = getCart();
  const cartContent = document.getElementById("cart-content");
  const cartEmpty = document.getElementById("cart-empty");
  const itemsEl = document.getElementById("cart-items");

  if (!cart.length) {
    cartContent.style.display = "none";
    cartEmpty.style.display = "block";
    return;
  }

  cartContent.style.display = "grid";
  cartEmpty.style.display = "none";

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img class="cart-item__image"
        src="${escapeHtml((item.image || "").replace(/^\/images\//, "./images/"))}"
        alt="${escapeHtml(item.name)}"
        onerror="this.style.background='var(--color-bg-muted)';this.style.objectFit='contain'" />
      <div class="cart-item__info">
        <a href="./product.html?id=${item.id}" class="cart-item__name">${escapeHtml(item.name)}</a>
        <div class="cart-item__price">${formatPrice(item.price)} / kom.</div>
        <div class="quantity-control" style="margin-top:8px;width:fit-content;">
          <button class="qty-btn qty-minus" style="width:32px;height:34px;">−</button>
          <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${item.stock}" style="width:42px;height:34px;" />
          <button class="qty-btn qty-plus" style="width:32px;height:34px;">+</button>
        </div>
      </div>
      <div class="cart-item__actions">
        <span class="cart-item__total">${formatPrice(item.price * item.quantity)}</span>
        <button class="cart-item__remove remove-btn" aria-label="Ukloni">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
        </button>
      </div>
    </div>
  `).join("");

  const total = getCartTotal();
  document.getElementById("summary-subtotal").textContent = formatPrice(total);
  document.getElementById("summary-total").textContent = formatPrice(total);

  itemsEl.querySelectorAll(".cart-item").forEach(row => {
    const id = row.dataset.id;
    const item = cart.find(i => i.id === id);
    const qi = row.querySelector(".qty-input");

    row.querySelector(".qty-minus").addEventListener("click", () => {
      const v = parseInt(qi.value);
      if (v > 1) { updateCartQuantity(id, v - 1); render(); }
    });
    row.querySelector(".qty-plus").addEventListener("click", () => {
      const v = parseInt(qi.value);
      if (v < item.stock) { updateCartQuantity(id, v + 1); render(); }
    });
    qi.addEventListener("change", () => {
      const v = Math.max(1, Math.min(parseInt(qi.value) || 1, item.stock));
      updateCartQuantity(id, v); render();
    });
    row.querySelector(".remove-btn").addEventListener("click", () => {
      removeFromCart(id); render();
    });
  });
}

render();
