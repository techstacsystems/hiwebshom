import { db } from "./firebase-config.js";
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getCart, clearCart, getCartTotal, updateCartBadge } from "./cart.js";
import { formatPrice, generateOrderNumber, escapeHtml, initScrollHeader } from "./utils.js";

initScrollHeader();
updateCartBadge();

const cart = getCart();
if (!cart.length) { window.location.href = "/cart.html"; }

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

// Submit
document.getElementById("checkout-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const firstName = f.firstName.value.trim();
  const lastName = f.lastName.value.trim();
  const phone = f.phone.value.trim();
  const address = f.address.value.trim();
  const city = f.city.value.trim();
  const note = f.note.value.trim();

  if (!firstName || !lastName || !phone || !address || !city) {
    ["firstName","lastName","phone","address","city"].forEach(n => {
      if (!f[n].value.trim()) {
        f[n].classList.add("error");
        f[n].addEventListener("input", () => f[n].classList.remove("error"), { once: true });
      }
    });
    return;
  }

  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Šaljem narudžbu...`;

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
    document.getElementById("success-order-num").textContent = `Broj narudžbe: ${orderNum}`;
    updateCartBadge();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.innerHTML = `Potvrdi narudžbu`;
    // Show specific error message for stock issues
    const errorMsg = err.message || "Greška pri slanju narudžbe. Pokušajte ponovo.";
    alert(errorMsg);
  }
});
