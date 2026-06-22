[README.md](https://github.com/user-attachments/files/29216965/README.md)
# Hareem Istanbul Webshop

Kompletan webshop za Hareem Istanbul – luxury parfemi & home scents.

## Setup Firebase

1. Idi na [console.firebase.google.com](https://console.firebase.google.com)
2. Kreiraj novi projekt
3. Dodaj **Web app** i kopiraj config
4. Otvori `js/firebase-config.js` i zamijeniti placeholder vrijednosti pravim Firebase configom
5. U Firebase Console:
   - **Authentication** → Sign-in method → Email/Password → Enable
   - Dodaj admin korisnika (Users → Add user)
   - **Firestore Database** → Create database (production mode)
   - **Storage** → Get started
6. Postavi Security Rules iz `firestore.rules` i `storage.rules`

## Razvoj

```bash
npm install
npm run dev
```

## Produkcija (GitHub Pages)

```bash
npm run build
# dist/ folder uploadati na GitHub Pages
```

## Stranice

| URL | Opis |
|-----|------|
| `/` | Početna – svi proizvodi |
| `/${import.meta.env.BASE_URL}${import.meta.env.BASE_URL}product.html?id=...` | Detalji proizvoda |
| `/cart.html` | Korpa |
| `/checkout.html` | Narudžba |
| `/admin.html` | Admin panel (zahtijeva login) |
