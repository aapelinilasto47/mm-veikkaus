## 🏒 IIHF World Championship Prediction Platform 2026

Vie MM-kisaelämys uudelle tasolle kisaamalla kavereita vastaan ilmaisessa lätkäveikkauksessa!
Tämä on täyden pinon (Full-stack) verkkosovellus vuoden 2026 jääkiekon MM-kisoja varten. Sovelluksen avulla lätkäfanit voivat kisata keskenään veikkaamalla otteluiden lopputuloksia.

## 🛠 Tekninen arkkitehtuuri

Sovellus on rakennettu modernilla Next.js 14+ -kehityskehyksellä, ja se hyödyntää Server Components -rakennetta tehokkaaseen datan käsittelyyn.

Frontend: React & Tailwind CSS – Responsiivinen käyttöliittymä on optimoitu mobiiliin, jotta veikkaukset voi jättää vaivatta vaikkapa hallin katsomosta.

Backend: Next.js API Routes (Serverless) – Hoitaa veikkausten tallennuksen ja validointiin liittyvän logiikan.

Tietokanta: MongoDB Atlas – Skaalautuva pilvitietokanta ottelu- ja käyttäjädatan säilytykseen.

Autentikaatio: NextAuth.js (Google OAuth 2.0) – Turvallinen ja nopea kirjautuminen ilman erillisten salasanojen hallintaa.

## 📊 Datan hallinta ja automatisointi

Turnausdatan hallinta on ratkaistu erillisellä Python-pohjaisella data-pipelinellä, joka varmistaa, että sovelluksen tiedot pysyvät ajan tasalla ilman manuaalista työtä.

Batch Processing: Otteluohjelma ja tulokset synkronoidaan kerran vuorokaudessa eräajona. Tämä takaa datan eheyden ja vähentää turhaa palvelinkuormaa.

Idempotentti päivitys: Ottelut tunnistetaan uniikeilla hash-tunnisteilla (joukkueet + päivämäärä). Tämä estää duplikaatit, vaikka synkronointi ajettaisiin useasti.

Scraping-logiikka: Python-skriptit (Playwright/BeautifulSoup) hakevat viralliset tulokset ja päivittävät vain tarvittavat kentät ($set), jolloin otteluiden metadata, kuten alkamisajat, säilyy muuttumattomana.

## 🏆 Kisamekaniikka ja säännöt

Pistelaskenta noudattaa "reilun pelin" henkeä ja palkitsee erityisesti tarkkuudesta:

10 pistettä: Täysosuma (Jackpot 🎯) – Maalit täsmälleen oikein.

5 pistettä: Oikea voittaja ja oikea maaliero.

3 pistettä: Oikea voittaja (1X2-tulos).

Tasapelisääntö: Jos pisteet ovat tasan, "täysosumien" (Jackpot) määrä ratkaisee sijoituksen leaderboardilla.

Pudotuspelit: Pudotuspeleissä pisteet tuplataan! Esim. Täysosuma - 20 pistettä.

## 🔒 Turvallisuus: "Pelit alkavat ajallaan"

Sovelluksessa on sisäänrakennettu aikatarkistus:

Veikkaaminen sulkeutuu automaattisesti kunkin ottelun virallisella alkamishetkellä.

Validointi tapahtuu palvelintasolla (startTime-tarkistus), mikä estää veikkausten muokkaamisen pelin jo alettua.

## 🚀 Käyttöönotto kehittäjille

npm install – Asenna riippuvuudet.

Määritä .env.local – Syötä MongoDB-osoite ja Google API-avaimet.

npm run build – Käännä tuotantoversio.

python getdata.py - Hae ottelut ja tulokset.

python movingdata.py – Päivitä ottelut ja tulokset.

Kehittäjä: Aapeli Nilasto – IT-tradenomi ja lätkäfani, joka haluaa ratkaista monimutkaiset data-haasteet siistillä koodilla ja hyvällä UX-suunnittelulla.
