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
        page.goto("https://www.flashscore.fi/jaakiekko/maailma/mm-kisat/otteluohjelma/")
        
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
            is_playoff = iso_time >= "2026-05-27T00:00:00"

            fixtures.append({
                "id": match_id,
                "home": home,
                "homeScore": None,
                "away": away,
                "awayScore": None,
                "startTime": iso_time,
                "isPlayoff": is_playoff
            })
        
        browser.close()
        return fixtures

def scrape_results():
    with sync_playwright() as p:
        results = []
        browser = p.chromium.launch()
        context = browser.new_context(timezone_id="Europe/Helsinki")
        page = context.new_page()
        page.goto("https://www.flashscore.fi/jaakiekko/maailma/mm-kisat/tulokset/")
        
        try: page.wait_for_selector(".event__match", timeout=5000)
        except:
            print("Tulosten elementtejä ei löytynyt. Tarkista sivun rakenne tai aikakatkaisu.")
            return []
        
        matches = page.query_selector_all(".event__match")
        
        for match in matches:
            home = match.query_selector(".event__homeParticipant").inner_text().strip()
            away = match.query_selector(".event__awayParticipant").inner_text().strip()
            date_raw = match.query_selector(".event__time").inner_text()
            
            day_part = date_raw.split(" ")[0]
            clean_date = datetime.strptime(f"{day_part} {datetime.now().year}", "%d.%m. %Y")
            iso_date = clean_date.strftime("%Y-%m-%dT00:00:00")

            h_score_el = match.query_selector(".event__score--home")
            a_score_el = match.query_selector(".event__score--away")
            
            if not h_score_el or not a_score_el: continue
            
            h_score = int(h_score_el.inner_text().strip())
            a_score = int(a_score_el.inner_text().strip())

            # JATKOAIKASÄÄNTÖ: Vähennetään maali voittajalta jos peli ratkesi JA/VL
            overtime = match.query_selector(".event__stage--block")
            if overtime:
                ot_text = overtime.inner_text().lower()
                if "ja" in ot_text or "vl" in ot_text:
                    if h_score > a_score: h_score -= 1
                    else: a_score -= 1
            
            results.append({
                "home": home,
                "away": away,
                "homeScore": h_score,
                "awayScore": a_score,
                "startTime": iso_date
            })

        browser.close()
        return results