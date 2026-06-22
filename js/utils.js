import { updateCartBadge } from "./cart.js";
import { initNav } from "./nav.js";

export { initNav };

export function formatPrice(price) {
  return new Intl.NumberFormat("bs-BA", { style: "currency", currency: "BAM", minimumFractionDigits: 2 }).format(price);
}

export function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("toast--visible"));
  setTimeout(() => {
    toast.classList.remove("toast--visible");
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

export function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HI-${ts}-${rand}`;
}

export function escapeHtml(str) {
  if (!str) return "";
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// Legacy alias used by older pages
export function initScrollHeader() {
  initNav();
  updateCartBadge();
}
