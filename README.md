## IIHF World Championship Prediction Platform 2026

Vie MM-kisaelämys uudelle tasolle kisaamalla kavereita vastaan ilmaisessa lätkäveikkauksessa!
Tämä on täyden pinon (Full-stack) verkkosovellus vuoden 2026 jääkiekon MM-kisoja varten. Sovelluksen avulla lätkäfanit voivat kisata keskenään veikkaamalla otteluiden lopputuloksia.

Projekti syntyi aidosta tarpeesta: kun perinteistä ilmaista MM-lätkäveikkausta ei tänä vuonna enää virallisesti järjestetty, päätin pelastaa kaveriporukkamme vuosien perinteen ja koodata meille oman alustan. Sovellus pyörii parhaillaan tuotannossa aktiivisella testiporukalla.

🔗 **Live-versio:** https://mm-veikkaus.vercel.app/

---

## Tekninen arkkitehtuuri

Sovellus on rakennettu modernilla Next.js 14+ -kehityskehyksellä hyödyntäen TypeScriptiä ja tehokasta palvelinrakennetta.

- **Frontend:** React, Tailwind CSS – Responsiivinen ja dynaaminen käyttöliittymä, joka on optimoitu täysin mobiiliin (veikkaukset voi jättää vaikkapa hallin katsomosta).
- **Backend:** Next.js API Routes (Serverless) – Hoitaa veikkausten tallennuksen, sessionhallinnan ja palvelintason validoinnit.
- **Tietokanta:** MongoDB Atlas – Pilvitietokanta ottelu- ja käyttäjädatan säilytykseen. Yhteyskäytännöissä hyödynnetään globaalia välimuistia (connection pooling), mikä takaa skaalautuvuuden serverless-ympäristössä.
- **Autentikaatio:** NextAuth.js (Google OAuth 2.0) – Turvallinen ja nopea kirjautuminen suoraan Google-tunnuksilla.

---

## Automaatio ja datan hallinta (DevOps)

Turnausdatan hallinta ja tulosten päivitys on täysin automatisoitu, jotta sovellus pyörii itsenäisesti tuotannossa läpi kisojen:

- **CI/CD & CI-automaatio:** GitHub Actions ajaa tulosten päivitysrutiinit automaattisesti kerran tunnissa.
- **Scraping-logiikka:** Taustalla pyörivä Playwright-skripti hakee viralliset tulokset livenä, minkä jälkeen kantaan päivitetään vain tarvittavat kentät (`$set`).
- **Vikasietoisuus (Robustness):** Koska virallisen turnauskaavion muuttuessa pelkkä sokea ID-hashaus voi luoda duplikaatteja, backend-logiikka käyttää älykästä nimipohjaista varmistuskerrosta ($or-haut). Tämä suojaa olemassa olevaa dataa ja pelaajien veikkauksia kaikissa tilanteissa.

---

## Tietoturva ja reilu peli

Sovelluksen arkkitehtuurissa on panostettu tiukasti tietoturvaan ja fuskauksen estämiseen:

- **Palvelintason aikalukko:** Veikkaaminen sulkeutuu automaattisesti kunkin ottelun virallisella alkamishetkellä. Validointi tapahtuu tiukasti palvelimella (`startTime`-tarkistus), mikä estää pyyntöjen manipuloinnin (esim. Postmanilla tai selaimen dev-työkaluilla) pelin jo alettua.
- **Identiteetin varmistus:** API-reitit eivät luota selaimen lähettämään käyttäjä-ID:hen. Käyttäjän identiteetti varmistetaan palvelimella suoraan kryptografisesti allekirjoitetusta HttpOnly-istuntoevästeestä (`getServerSession`).
- **Yksityisyys (GDPR):** Käyttäjien sähköpostiosoitteita tai herkkiä tietoja ei näytetä julkisesti. Tulostaulukko parsii ja anonymisoi sähköpostit automaattisesti siisteiksi etunimiksi (esim. `firstname.lastname@gmail.com` -> `Firstname`).

---

## Kisamekaniikka ja säännöt

Pistelaskenta palkitsee erityisesti tarkkuudesta:

- **10 pistettä:** Täysosuma (Jackpot 🎯) – Maalit täsmälleen oikein.
- **5 pistettä:** Oikea voittaja ja oikea maaliero.
- **3 pistettä:** Oikea voittaja (1X2-tulos).

_Tasapelisääntö:_ Jos pisteet ovat tasan, "täysosumien" (Jackpot) määrä ratkaisee sijoituksen leaderboardilla.
_Pudotuspelit:_ Pudotuspeleissä panokset kovenevat ja pisteet tuplataan (esim. Täysosuma = 20 pistettä).

---

## 🚀 Käyttöönotto kehittäjille

Asenna riippuvuudet:

Bash
npm install

Määritä ympäristömuuttujat luomalla kansion juureen .env.local (syötä MONGODB_URI, NEXTAUTH_SECRET sekä Googlen OAuth-avaimet).

Aja kehitysympäristö:

Bash
npm run dev

Käännä tuotantoversio:

Bash
npm run build

Kehittäjä: Aapeli Nilasto – IT-tradenomiopiskelija, joka innostuu hienojen ideoiden viemisestä valmiiksi, tuotantovarmiksi tuotteiksi saumattomalla UX-suunnittelulla.
