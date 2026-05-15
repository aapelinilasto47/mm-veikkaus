from playwright.sync_api import sync_playwright
import time
from datetime import datetime
import json
import hashlib


def scrape_fixtures():
    with sync_playwright() as p:

        fixtures = []
        
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("https://www.flashscore.fi/jaakiekko/maailma/mm-kisat/otteluohjelma/")
        
        # Odota ottelurivejä
        page.wait_for_selector(".event__match", timeout=10000)  # Odota enintään 10 sekuntia
        
        matches = page.query_selector_all(".event__match")
        match_count = 0

        def generate_id(home, away, date_obj):
            date_only = date_obj.split("T")[0]  # Ota vain päivämääräosa
            unique_string = f"{home}_{away}_{date_only}"
            return hashlib.md5(unique_string.encode()).hexdigest()  # Luo MD5-hash uniikista merkkijonosta

        
        for match in matches:
            time.sleep(0.1)  # Pieni viive, jotta kaikki elementit latautuvat kunnolla
            home = match.query_selector(".event__homeParticipant").inner_text()
            away = match.query_selector(".event__awayParticipant").inner_text()
            time_raw = match.query_selector(".event__time").inner_text()
            

            # Muutetaan muotoon 2026-05-07
            clean_time = datetime.strptime(f"{time_raw} {datetime.now().year}", "%d.%m. %H:%M %Y")
            match_id = generate_id(home, away, clean_time.isoformat())

            home_score = match.query_selector(".event__score--home")
            away_score = match.query_selector(".event__score--away")

            if ":" not in time_raw:
                continue  # Skip if time format is unexpected

            def clean_score(score_element):
                if score_element:
                    score_text = score_element.inner_text().strip()
                    return int(score_text) if score_text.isdigit() else None
                return None

            home_score = clean_score(home_score)
            away_score = clean_score(away_score)
            
            # Korjattu isPlayoff-tarkistus
            playoff_start = "2026-05-27T00:00:00" # MM-kisojen puolivälierät alkavat yleensä aiemmin
            iso_time = clean_time.isoformat() + "+03:00"  # Oletetaan Suomen aika (UTC+3)

            fixtures.append({
                "id": match_id,
                "home": home,
                "homeScore": home_score,
                "away": away,
                "awayScore": away_score,
                "startTime": iso_time,
                "isPlayoff": iso_time >= playoff_start
            })
            match_count += 1

            print(f"Scraped match: {home} vs {away} at {clean_time.isoformat()} (ID: {match_id})")

        print(f"Found {match_count} matches.")
        browser.close()
        return fixtures
    
def scrape_results():
    with sync_playwright() as p:
        results = []
        
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("https://www.flashscore.fi/jaakiekko/maailma/mm-kisat/tulokset/")
        
        # Odota ottelurivejä
        try:
            page.wait_for_selector(".event__match", timeout=5000)  # Odota enintään 5 sekuntia
        except:
            print("No matches found on results page.")
            browser.close()
            return results
        
        matches = page.query_selector_all(".event__match")
        match_count = 0

        def generate_id(home, away, date_obj):
            date_only = date_obj.split("T")[0]  # Ota vain päivämääräosa
            unique_string = f"{home}_{away}_{date_only}"
            return hashlib.md5(unique_string.encode()).hexdigest()  # Luo MD5-hash uniikista merkkijonosta

        for match in matches:
            time.sleep(0.1)  # Pieni viive, jotta kaikki elementit latautuvat kunnolla
            home = match.query_selector(".event__homeParticipant").inner_text()
            away = match.query_selector(".event__awayParticipant").inner_text()
            date_raw = match.query_selector(".event__time").inner_text()

            try:
                overtime = match.query_selector(".event__stage--block")
            except:
                overtime = None

            home_score = match.query_selector(".event__score--home")
            away_score = match.query_selector(".event__score--away")

           # PARSITAAN PÄIVÄ ID:TÄ VARTEN
            # Otetaan vain alkupää "05.05."
            day_part = date_raw.split(" ")[0] 
            clean_date = datetime.strptime(f"{day_part} {datetime.now().year}", "%d.%m. %Y")
            iso_date_for_search = clean_date.strftime("%Y-%m-%d") + "T00:00:00"
            
            
            # LUODAAN IDENTTINEN ID
            match_id = generate_id(home, away, clean_date.strftime("%Y-%m-%d"))

            def clean_score(score_element):
                if score_element:
                    score_text = score_element.inner_text().strip()
                    return int(score_text) if score_text.isdigit() else None
                return None

            home_score = clean_score(home_score)
            away_score = clean_score(away_score)

            if overtime:
                if "vl" in overtime.inner_text().lower() or "ja" in overtime.inner_text().lower():
                    if home_score > away_score:
                        home_score -= 1  # Oletetaan, että jatkoerä ratkaisi pelin
                    elif away_score > home_score:
                        away_score -= 1
            
            
            results.append({
                "id": match_id,
                "home": home,
                "homeScore": home_score,
                "away": away,
                "awayScore": away_score,
                "startTime": iso_date_for_search,

            })
            match_count += 1

            print(f"Scraped result: {home} vs {away} at {day_part} (Home Score: {home_score}, Away Score: {away_score})")

        print(f"Found {match_count} results.")
        browser.close()
        return results

def save_fixtures_to_json(fixtures, results, filename="fixtures.json"):
    data = {
        "fixtures": fixtures,
        "results": results
    }
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Saved fixtures and results to {filename}.")

if __name__ == "__main__":
    fixtures = scrape_fixtures()
    results = scrape_results()

    save_fixtures_to_json(fixtures, results)

