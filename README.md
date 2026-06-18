# Multi-Tournament Prediction Platform 2026

Vie urheiluelämys uudelle tasolle kisaamalla kavereita vastaan ilmaisessa urheilu- ja kisaveikkauksessa! Tämä on moderni täyden pinon (Full-stack) verkkosovellus, joka tukee dynaamisesti eri arvokisoja (kuten vuoden 2026 Jalkapallon ja Jääkiekon MM-kisoja). Sovelluksen avulla urheilufanit voivat kisata keskenään veikkaamalla otteluiden lopputuloksia.

Projekti syntyi aidosta tarpeesta: kun perinteisiä ilmaisia MM-kisaveikkauksia ei enää virallisesti järjestetty, päätin pelastaa kaveriporukkamme vuosien perinteen ja koodata meille oman, laajennettavan alustan. Sovellus pyörii tuotannossa aktiivisella testiporukalla ja vaihtaa turnausta lennosta URL-parametrin mukaan.

🔗 Live-versio: https://mm-veikkaus.vercel.app/

---

## Tekninen arkkitehtuuri

Sovellus on rakennettu modernilla Next.js 14+ -kehityskehyksellä (App Router) hyödyntäen TypeScriptiä ja tehokasta palvelinrakennetta (Server Components).

- **Frontend:** React, Tailwind CSS – Responsiivinen ja dynaaminen käyttöliittymä, joka on optimoitu täysin mobiiliin (veikkaukset voi jättää vaikkapa suoraan kisakatsomosta).
- **Backend:** Next.js API Routes (Serverless) & Server Actions – Hoitaa veikkausten tallennuksen, dynaamisen reitityksen, sessionhallinnan ja palvelintason validoinnit.
- **Tietokanta:** MongoDB Atlas – Pilvitietokanta ottelu-, veikkaus- ja käyttäjädatan säilytykseen. Yhteyskäytännöissä hyödynnetään globaalia välimuistia (connection pooling), mikä takaa skaalautuvuuden serverless-ympäristössä.
- **Autentikaatio:** NextAuth.js (Google OAuth 2.0) – Turvallinen ja nopea kirjautuminen suoraan Google-tunnuksilla.

---

## Automaatio ja datan hallinta (DevOps)

Turnausdatan hallinta ja tulosten päivitys on täysin automatisoitu, jotta sovellus pyörii itsenäisesti tuotannossa läpi kisojen:

- **CI/CD & Automaatio:** GitHub Actions ajaa tulosten päivitysrutiinit automaattisesti turnauksen otteluaikojen mukaan.
- **Scraping-logiikka:** Taustalla pyörivä Playwright-skripti hakee viralliset tulokset livenä, minkä jälkeen kantaan päivitetään vain muuttuneet kentät (`$set`).
- **Vikasietoisuus (Robustness):** Koska virallisen turnauskaavion muuttuessa pelkkä sokea ID-hashaus voi luoda duplikaatteja, backend-logiikka käyttää älykästä nimipohjaista varmistuskerrosta (`$or`-haut). Tämä suojaa olemassa olevaa dataa ja pelaajien veikkauksia kaikissa tilanteissa.

---

## 🧪 Automaattinen testaus

### TypeScript & Next.js (Pistelaskenta)

Pistelaskentalogiikka (`src/lib/scoreCalculator.ts`) on suojattu yksikkötesteillä Vitest-testauskehystä käyttäen. Testit ajetaan Node 20 -ympäristössä, ja ne kattavat standarditilanteiden lisäksi erikoistapaukset (Edge Caset):

- Täydelliset osumat (oikea maalimäärä ja merkki)
- Oikeat 1X2-merkit väärillä maalimäärillä
- Läheltä piti-tilanteet, eli 1 maalin päässä täysosumasta

---

## Tietoturva ja reilu peli

Sovelluksen arkkitehtuurissa on panostettu tiukasti tietoturvaan, fuskauksen estämiseen sekä GDPR-yksityisyyteen:

- **Palvelintason aikalukko:** Veikkaaminen sulkeutuu automaattisesti kunkin ottelun virallisella alkamishetkellä. Validointi tapahtuu tiukasti palvelimella (`startTime`-tarkistus), mikä estää pyyntöjen manipuloinnin (esim. Postmanilla tai selaimen dev-työkaluilla) pelin jo alettua.
- **Identiteetin varmistus:** API-reitit eivät luota selaimen lähettämään käyttäjä-ID:hen. Käyttäjän identiteetti varmistetaan palvelimella suoraan kryptografisesti allekirjoitetusta HttpOnly-istuntoevästeestä (`getServerSession`).
- **Anonymiteetti ja tietosuoja:** Käyttäjien sähköpostiosoitteita ei koskaan näytetä julkisesti muille pelaajille. Sovelluksessa on integroitu **nimimerkkijärjestelmä**, jonka avulla käyttäjä voi suoraan profiilinurkkauksestaan asettaa itselleen julkisen nimimerkin tulostaulukkoon. Syötteet sanitoidaan tiukasti (RegEx-suodatus NoSQL-injektioita ja XSS-hyökkäyksiä vastaan).

---

## Kisamekaniikka ja säännöt

Pistelaskenta mukautuu lennosta valitun turnauksen sääntöjen mukaan ja palkitsee tarkkuudesta:

### Jääkiekon MM-veikkaus

- **10 pistettä:** Täysosuma (Jackpot 🎯) – Maalit täsmälleen oikein.
- **5 pistettä:** Oikea voittaja ja Jackpot maalin päässä.
- **3 pistettä:** Oikea voittaja (1X2-tulos).
- **1 piste:** Jackpot maalin päässä, Väärä voittaja (1X2)

### Jalkapallon MM-veikkaus

- **6 pistettä:** Täysosuma (Jackpot 🎯) – Maalit täsmälleen oikein.
- **4 pistettä:** Oikea voittaja ja Jackpot maalin päässä.
- **3 pistettä:** Oikea voittaja (1X2-tulos).
- **1 piste:** Jackpot maalin päässä, Väärä voittaja (1X2)

- _Pudotuspelit:_ Panokset kovenevat ja pisteet tuplataan (esim. Täysosuma = 20 pistettä).
  **Tasapelisääntö:** Jos kokonaispisteet ovat tasan, "täysosumien" (Jackpot) määrä ratkaisee korkeamman sijoituksen leaderboardilla.

---

## Käyttöönotto kehittäjille

Asenna riippuvuudet:
npm install

Ympäristömuuttujat: Luo kansion juureen .env.local -tiedosto ja määritä seuraavat muuttujat:

MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000

Aja kehitysympäristö:
npm run dev

Käännä tuotantoversio:
npm run build

**Kehittäjä: Aapeli Nilasto – Business Information Technology (IT-tradenomi) -opiskelija Laurea-ammattikorkeakoulussa. Intohimona full-stack-kehitys, automaatio sekä ideoiden vieminen valmiiksi, tuotantovarmiksi tuotteiksi**
