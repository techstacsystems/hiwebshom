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

## aditional info
Pošto si tek napravio Firebase account, idi ovim redom:
1. Kreiraj projekat
Uđi na Firebase Console
Create project
Naziv npr. webshop-hi
Disable Google Analytics (ne treba)
2. Dodaj Web App
U projektu klikni </> (Web)
Naziv npr. webshop
Nemoj uključivati Hosting
Klikni Register App
Dobit ćeš nešto ovako:
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
3. Zamijeni config
Otvori:
js/firebase-config.js
i zamijeni sve YOUR_API_KEY itd. sa ovim vrijednostima.
4. Authentication
Authentication
Get Started
Sign-in method
Email/Password
Enable
Onda:
Authentication
Users
Add user
Stavi svoj email i password.
To će biti admin login za /admin.
5. Firestore
Firestore Database
Create Database
Start in Production Mode
Region: Europe (najbliže)
6. Storage
Storage
Get Started
Region ista kao Firestore
7. Firestore Rules
Otvori:
firestore.rules
Kopiraj sadržaj.
Firebase:
Firestore Database
Rules
Obriši postojeće i zalijepi svoje.
Klikni Publish.
8. Storage Rules
Otvori:
storage.rules
Firebase:
Storage
Rules
Obriši postojeće i zalijepi svoje.
Klikni Publish.
9. Test lokalno
U folderu:
npm install
npm run dev
Otvori:
http://localhost:5173
10. Deploy na GitHub Pages
Ako repo već postoji:
git add .
git commit -m "webshop"
git push origin main
Zatim na GitHub:
Settings
Pages
Source → GitHub Actions
 umjesto storage koristit cemo local storage znaci prvo upload slike na github i biramo u konzoli poslije tjt. nema firebase storage