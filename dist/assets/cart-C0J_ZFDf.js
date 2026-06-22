import{i as p,u as v,g,e as r,f as i,a as h,b as o,r as b}from"./utils-Dixr07uC.js";p();v();function n(){const c=g(),l=document.getElementById("cart-content"),d=document.getElementById("cart-empty"),m=document.getElementById("cart-items");if(!c.length){l.style.display="none",d.style.display="block";return}l.style.display="grid",d.style.display="none",m.innerHTML=c.map(t=>`
    <div class="cart-item" data-id="${t.id}">
      <img class="cart-item__image"
        src="${r((t.image||"").replace(/^\/images\//,"./images/"))}"
        alt="${r(t.name)}"
        onerror="this.style.background='var(--color-bg-muted)';this.style.objectFit='contain'" />
      <div class="cart-item__info">
        <a href="/hiwebshom/product.html?id=${t.id}" class="cart-item__name">${r(t.name)}</a>
        <div class="cart-item__price">${i(t.price)} / kom.</div>
        <div class="quantity-control" style="margin-top:8px;width:fit-content;">
          <button class="qty-btn qty-minus" style="width:32px;height:34px;">−</button>
          <input type="number" class="qty-input" value="${t.quantity}" min="1" max="${t.stock}" style="width:42px;height:34px;" />
          <button class="qty-btn qty-plus" style="width:32px;height:34px;">+</button>
        </div>
      </div>
      <div class="cart-item__actions">
        <span class="cart-item__total">${i(t.price*t.quantity)}</span>
        <button class="cart-item__remove remove-btn" aria-label="Ukloni">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
        </button>
      </div>
    </div>
  `).join("");const u=h();document.getElementById("summary-subtotal").textContent=i(u),document.getElementById("summary-total").textContent=i(u),m.querySelectorAll(".cart-item").forEach(t=>{const a=t.dataset.id,y=c.find(e=>e.id===a),s=t.querySelector(".qty-input");t.querySelector(".qty-minus").addEventListener("click",()=>{const e=parseInt(s.value);e>1&&(o(a,e-1),n())}),t.querySelector(".qty-plus").addEventListener("click",()=>{const e=parseInt(s.value);e<y.stock&&(o(a,e+1),n())}),s.addEventListener("change",()=>{const e=Math.max(1,Math.min(parseInt(s.value)||1,y.stock));o(a,e),n()}),t.querySelector(".remove-btn").addEventListener("click",()=>{b(a),n()})})}n();
