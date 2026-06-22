import{i as v,u as y,e as d,f as h,h as _,s as k}from"./utils-Dixr07uC.js";import{d as g}from"./firebase-config-B8-7fj8g.js";import{query as w,collection as x,orderBy as E,getDocs as j}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";import"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";import"https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";import"https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";v();y();const n=document.getElementById("products-grid"),p=document.getElementById("no-products"),c=document.getElementById("filters");let i=[],l="all";async function $(){if(P()){n.innerHTML="",f();return}const e=new Promise((t,o)=>setTimeout(()=>o(new Error("timeout")),8e3));try{const t=w(x(g,"products"),E("createdAt","desc"));i=(await Promise.race([j(t),e])).docs.map(r=>({id:r.id,...r.data()})),z(),b(i)}catch(t){console.error("Greška:",t),n.innerHTML="",t.message==="timeout"||t.code==="unavailable"||t.code==="permission-denied"?f():p.style.display="block"}}function P(){try{const e=g.app;return e.options.apiKey==="YOUR_API_KEY"||!e.options.projectId||e.options.projectId==="YOUR_PROJECT_ID"}catch{return!1}}function f(){n.innerHTML=`
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
  `}function z(){[...new Set(i.map(t=>t.category).filter(Boolean))].forEach(t=>{const o=document.createElement("button");o.className="filter-btn",o.dataset.filter=t,o.textContent=t,c.appendChild(o)}),c.addEventListener("click",t=>{const o=t.target.closest(".filter-btn");if(!o)return;c.querySelectorAll(".filter-btn").forEach(a=>a.classList.remove("active")),o.classList.add("active"),l=o.dataset.filter;const r=l==="all"?i:i.filter(a=>a.category===l);b(r)})}function b(e){if(n.innerHTML="",!e.length){p.style.display="block";return}p.style.display="none",e.forEach(t=>n.appendChild(C(t)))}function C(e){var m;const t=e.stock<=0,o=e.stock>0&&e.stock<=5,r=e.createdAt&&Date.now()-e.createdAt.toMillis()<7*24*60*60*1e3,a=e.ml?`<span style="font-size:0.72rem;color:var(--color-text-light);font-weight:400;margin-left:4px;">(${e.ml} ml)</span>`:"",s=document.createElement("div");return s.className="product-card",s.innerHTML=`
    <div class="product-card__image-wrap">
      ${t?'<span class="product-card__badge badge--out">Nema na zalihi</span>':o?'<span class="product-card__badge badge--low">Malo na zalihi</span>':r?'<span class="product-card__badge badge--new">Novo</span>':""}
      <img src="${d(((m=e.images)==null?void 0:m[0])||"")}" alt="${d(e.name)}" loading="lazy"
        onerror="this.style.display='none';this.parentElement.style.background='var(--color-bg-muted)'" />
    </div>
    <div class="product-card__body">
      <div class="product-card__name">${d(e.name)}${a}</div>
      <div class="product-card__desc">${d(e.description||"")}</div>
      <div class="product-card__footer">
        <span class="product-card__price">${h(e.price)}</span>
        <button class="product-card__add" data-id="${e.id}" aria-label="Dodaj u korpu" ${t?"disabled":""}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
      </div>
    </div>
  `,s.addEventListener("click",u=>{if(u.target.closest(".product-card__add")){u.stopPropagation(),t||(_(e,1),k(`${e.name} dodano u korpu`));return}window.location.href=`/product.html?id=${e.id}`}),s}$();
