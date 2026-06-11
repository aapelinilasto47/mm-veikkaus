import re
import time
import hashlib
from datetime import datetime
from playwright.sync_api import sync_playwright

def generate_id(home, away, date_str):
    # Pidetään vanha ID-logiikka (ei aakkostusta), jotta veikkaukset säilyvät
    date_only = date_str.split("T")[0]
    unique_string = f"{home}_{away}_{date_only}"
    return hashlib.md5(unique_string.encode()).hexdigest()

def scrape_fixtures():
    with sync_playwright() as p:
        fixtures = []
        browser = p.chromium.launch()
        # PAKOTETAAN AIKAVYÖHYKE: Flashscore antaa Suomen ajat myös GitHubissa
        context = browser.new_context(timezone_id="Europe/Helsinki")
        page = context.new_page()
        page.goto("https://www.flashscore.fi/jalkapallo/maailma/mm-kisat/otteluohjelma/")
        
        try:
            page.wait_for_selector(".event__match", timeout=5000)
        except:
            print("Otteluohjelman elementtejä ei löytynyt. Tarkista sivun rakenne tai aikakatkaisu.")
            return []
        matches = page.query_selector_all(".event__match")
        
        for match in matches:
            home = match.query_selector(".event__homeParticipant").inner_text().strip()
            away = match.query_selector(".event__awayParticipant").inner_text().strip()
            time_raw = match.query_selector(".event__time").inner_text()
            
            if ":" not in time_raw: continue

            # Parsitaan aika ja tallennetaan se PUHTAANA tekstinä (naive)
            clean_time = datetime.strptime(f"{time_raw} {datetime.now().year}", "%d.%m. %H:%M %Y")
            iso_time = clean_time.strftime("%Y-%m-%dT%H:%M:%S") # Esim. 2026-05-15T21:20:00
            
            match_id = generate_id(home, away, iso_time)

            # Playoff-tunnistus (tarkista pvm kisoittain)
            is_playoff = iso_time >= "2026-06-29T00:00:00"

            fixtures.append({
                "id": match_id,
                "home": home,
                "homeScore": None,
                "away": away,
                "awayScore": None,
                "startTime": iso_time,
                "isPlayoff": is_playoff,
                "tournament": "futis_2026"
            })
        
        browser.close()
        return fixtures

def scrape_results():
    with sync_playwright() as p:
        results = []
        browser = p.chromium.launch()
        context = browser.new_context(timezone_id="Europe/Helsinki")
        page = context.new_page()
        page.goto("https://www.flashscore.fi/jalkapallo/maailma/mm-kisat/tulokset/")
        
        try: page.wait_for_selector(".event__match", timeout=5000)
        except:
            print("Tulosten elementtejä ei löytynyt. Tarkista sivun rakenne tai aikakatkaisu.")
            return []
        
        matches = page.query_selector_all(".event__match")
        
        for match in matches:
            home_raw = match.query_selector(".event__homeParticipant").inner_text().strip()
            away_raw = match.query_selector(".event__awayParticipant").inner_text().strip()

            home = re.sub(r'\s+\d+$', '', home_raw).strip()
            away = re.sub(r'\s+\d+$', '', away_raw).strip()

            date_raw = match.query_selector(".event__time").inner_text()
            
            day_part = date_raw.split(" ")[0]

            if len(day_part) > 6:
                
                continue # Vältetään "Tänään" yms. epäkelpo päivämäärät

            month_part = day_part.split(".")[1]
            if int(month_part) not in [5, 6, 7]:
                
                continue

            

            clean_date = datetime.strptime(f"{day_part} {datetime.now().year}", "%d.%m. %Y")
            iso_date = clean_date.strftime("%Y-%m-%dT00:00:00")

            h_score_el = match.query_selector(".event__score--home")
            a_score_el = match.query_selector(".event__score--away")
            
            if not h_score_el or not a_score_el: continue
            
            h_score = int(h_score_el.inner_text().strip())
            a_score = int(a_score_el.inner_text().strip())

            # JATKOAIKASÄÄNTÖ: Vähennetään maali voittajalta jos peli ratkesi JA/VL
            if date_raw.endswith("JA:n jälk.") or date_raw.endswith("RP:n jälk."):
                if h_score > a_score:
                    h_score -= 1
                elif a_score > h_score:
                    a_score -= 1

            
            results.append({
                "home": home,
                "away": away,
                "homeScore": h_score,
                "awayScore": a_score,
                "startTime": iso_date
            })

        browser.close()
        print(f"--- Tulokset haettu: {len(results)} ottelua ---")
        for res in results:
            print(f"{res['home']} {res['homeScore']} - {res['awayScore']} {res['away']} ({res['startTime']})")
        return results