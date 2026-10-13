import { db } from "./firebase-config.js";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getCart, clearCart, getCartTotal, updateCartBadge } from "./cart.js";
import { formatPrice, generateOrderNumber, escapeHtml, initScrollHeader } from "./utils.js";

initScrollHeader();
updateCartBadge();

const cart = getCart();
if (!cart.length) { window.location.href = `${import.meta.env.BASE_URL}cart.html`; }

// Render order summary
document.getElementById("order-items").innerHTML = cart.map(item => `
  <div class="order-item">
    <img src="${escapeHtml(item.image || "")}" alt="${escapeHtml(item.name)}"
      onerror="this.style.background='var(--color-bg-muted)';this.style.objectFit='contain'" />
    <div class="order-item__info">
      <div class="order-item__name">${escapeHtml(item.name)}</div>
      <div class="order-item__qty">× ${item.quantity}</div>
    </div>
    <div class="order-item__price">${formatPrice(item.price * item.quantity)}</div>
  </div>
`).join("");

document.getElementById("order-total").textContent = formatPrice(getCartTotal());

// ===== MODE TOGGLE =====
let currentMode = "delivery";

const deliveryFormEl = document.getElementById("delivery-form");
const pickupFormEl = document.getElementById("pickup-form");
const submitText = document.getElementById("submit-text");
const summaryDeliveryRow = document.getElementById("summary-delivery-row");

function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll(".mode-toggle-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelector(`.mode-toggle-btn[data-mode="${mode}"]`).classList.add("active");

  if (mode === "delivery") {
    deliveryFormEl.style.display = "block";
    pickupFormEl.style.display = "none";
    submitText.textContent = "Potvrdi narudžbu";
    if (summaryDeliveryRow) summaryDeliveryRow.style.display = "";
  } else {
    deliveryFormEl.style.display = "none";
    pickupFormEl.style.display = "block";
    submitText.textContent = "Potvrdi rezervaciju";
    if (summaryDeliveryRow) summaryDeliveryRow.style.display = "none";
  }
}

document.querySelectorAll(".mode-toggle-btn").forEach(btn => {
  btn.addEventListener("click", () => switchMode(btn.dataset.mode));
});

// ===== SUBMIT =====
document.getElementById("checkout-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  let firstName, lastName, phone, address, city, note, orderType;

  if (currentMode === "pickup") {
    firstName = document.getElementById("pickupFirstName").value.trim();
    lastName = document.getElementById("pickupLastName").value.trim();
    phone = document.getElementById("pickupPhone").value.trim();
    note = document.getElementById("pickupNote").value.trim();
    address = "Preuzimanje lično";
    city = "Sarajevo";
    orderType = "pickup";

    if (!firstName || !lastName || !phone) {
      ["pickupFirstName", "pickupLastName", "pickupPhone"].forEach(id => {
        const el = document.getElementById(id);
        if (!el.value.trim()) {
          el.classList.add("error");
          el.addEventListener("input", () => el.classList.remove("error"), { once: true });
        }
      });
      return;
    }
  } else {
    const f = e.target;
    firstName = f.firstName.value.trim();
    lastName = f.lastName.value.trim();
    phone = f.phone.value.trim();
    address = f.address.value.trim();
    city = f.city.value.trim();
    note = f.note.value.trim();
    orderType = "delivery";

    if (!firstName || !lastName || !phone || !address || !city) {
      ["firstName","lastName","phone","address","city"].forEach(n => {
        if (!f[n].value.trim()) {
          f[n].classList.add("error");
          f[n].addEventListener("input", () => f[n].classList.remove("error"), { once: true });
        }
      });
      return;
    }
  }

  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> ${currentMode === "pickup" ? "Šaljem rezervaciju..." : "Šaljem narudžbu..."}`;

  try {
    const orderNum = generateOrderNumber();

    // Use transaction to ensure stock is updated atomically
    await runTransaction(db, async (transaction) => {
      // First verify and update stock for all products
      for (const item of cart) {
        const productRef = doc(db, "products", item.id);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw new Error(`Proizvod ${item.name} više ne postoji.`);
        }

        const currentStock = productDoc.data().stock || 0;
        if (currentStock < item.quantity) {
          throw new Error(`Nema dovoljno na zalihi za ${item.name}. Dostupno: ${currentStock}`);
        }

        // Update stock
        transaction.update(productRef, {
          stock: currentStock - item.quantity
        });
      }

      // Create the order after stock validation
      const orderRef = doc(collection(db, "orders"));
      transaction.set(orderRef, {
        orderNumber: orderNum,
        orderType,
        customer: { firstName, lastName, fullName: `${firstName} ${lastName}`, phone, address, city, note },
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, subtotal: i.price * i.quantity })),
        total: getCartTotal(),
        status: "new",
        createdAt: serverTimestamp()
      });
    });

    clearCart();
    document.getElementById("checkout-view").style.display = "none";
    const sv = document.getElementById("success-view");
    sv.style.display = "block";

    if (currentMode === "pickup") {
      sv.querySelector("h2").textContent = "Rezervacija uspješna!";
      sv.querySelector("p").textContent = "Hvala na rezervaciji. Vaši proizvodi su spremni za preuzimanje u SCC Sarajevo, II sprat.";
    } else {
      sv.querySelector("h2").textContent = "Narudžba uspješno posla!";
      sv.querySelector("p").textContent = "Hvala na narudžbi. Kontaktiraćemo vas uskoro na navedeni broj telefona radi potvrde isporuke.";
    }

    document.getElementById("success-order-num").textContent = `Broj narudžbe: ${orderNum}`;
    updateCartBadge();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.innerHTML = `<span id="submit-text">${currentMode === "pickup" ? "Potvrdi rezervaciju" : "Potvrdi narudžbu"}</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;
    const errorMsg = err.message || "Greška pri slanju narudžbe. Pokušajte ponovo.";
    alert(errorMsg);
  }
});
