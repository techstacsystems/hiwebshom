import { defineConfig } from "vite";

export default defineConfig({
  base: "/hiwebshom/",

  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        product: "product.html",
        cart: "cart.html",
        checkout: "checkout.html",
        admin: "admin.html",
        about: "about.html",
        contact: "contact.html"
      }
    }
  }
});