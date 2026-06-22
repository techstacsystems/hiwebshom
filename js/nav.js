export function initNav() {
  // Scroll header shadow
  const header = document.getElementById("site-header");
  if (header) {
    window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 10), { passive: true });
  }

  // Burger menu
  const burger = document.getElementById("nav-burger");
  const mobileMenu = document.getElementById("mobile-menu");
  const mobileClose = document.getElementById("mobile-close");

  if (burger && mobileMenu) {
    burger.addEventListener("click", () => {
      mobileMenu.classList.add("open");
      document.body.style.overflow = "hidden";
    });
    const close = () => { mobileMenu.classList.remove("open"); document.body.style.overflow = ""; };
    mobileClose?.addEventListener("click", close);
    mobileMenu.addEventListener("click", e => { if (e.target === mobileMenu) close(); });
  }

  // Active link highlight
  const path = window.location.pathname.split("/").pop() || "index.html";
  const normalized = path === "" ? "index.html" : path;
  document.querySelectorAll(".nav__links a, .mobile-menu__nav a").forEach(a => {
    const href = (a.getAttribute("href") || "").split("/").pop() || "index.html";
    if (href === normalized || (normalized === "index.html" && href === "/")) {
      a.classList.add("active");
    }
  });
}
