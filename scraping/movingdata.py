import os
from pymongo import MongoClient
from dotenv import load_dotenv
from getdata import scrape_fixtures, scrape_results

load_dotenv()

def get_database():
    connection_string = os.getenv("MONGODB_URI")
    if not connection_string:
        raise ValueError("MONGODB_URI puuttuu!")
    client = MongoClient(connection_string)
    print("Yhdistetty MongoDB:hen onnistuneesti.")
    return client["mm-veikkaus"]

def update_database():
    db = get_database()
    matches_collection = db["matches"]

    print("--- Aloitetaan haku Flashscoresta ---")
    fixtures_list = scrape_fixtures()
    results_list = scrape_results()
    
    updates_to_run = []

    # movingdata.py

    for fixture in fixtures_list:
        # 1. ÄLYKÄS HAKU: Etsitään peliä nimillä molemmin päin ja päivämäärällä
        fixture_date = fixture['startTime'].split("T")[0]
        existing_fix = matches_collection.find_one({
            "$or": [
                {"home": fixture['home'], "away": fixture['away']},
                {"home": fixture['away'], "away": fixture['home']}
            ],
            "startTime": {"$regex": f"^{fixture_date}"}
        })

        if existing_fix:
            # PELI LÖYTYI! Emme koske ID:hen, jotta veikkaukset säilyvät.
            # Päivitetään vain kellonaika, jos se on muuttunut (esim. se 3h korjaus)
            if existing_fix.get('startTime') != fixture['startTime']:
                updates_to_run.append({
                    "id": existing_fix["_id"], 
                    "data": {"startTime": fixture['startTime']},
                    "type": "UPDATE_MATCH_TIME",
                    "desc": f"KELLO KORJATTU: {existing_fix['home']} - {existing_fix['away']}"
                })
    else:
        # Vasta jos nimilläkään ei löydy mitään, lisätään uusi peli
        new_match = fixture.copy()
        new_match["_id"] = new_match.pop("id")
        updates_to_run.append({
            "data": new_match, 
            "type": "INSERT_MATCH",
            "desc": f"TÄYSIN UUSI OTTELU: {new_match['home']} - {new_match['away']}"
        })

    # 2. RESULTS-SILMUKKA (Pidetään ennallaan, tämä on jo hyvä)
    for result in results_list:
        res_date = result['startTime'].split("T")[0]
        existing_res = matches_collection.find_one({
            "$or": [
                {"home": result['home'], "away": result['away']},
                {"home": result['away'], "away": result['home']}
            ],
            "startTime": {"$regex": f"^{res_date}"}
        })

        if existing_res:
            if existing_res['home'] == result['home']:
                new_home_score = result['homeScore']
                new_away_score = result['awayScore']
            else:
                new_home_score = result['awayScore']
                new_away_score = result['homeScore']

            if (existing_res.get('homeScore') != new_home_score or 
                existing_res.get('awayScore') != new_away_score):
                
                updates_to_run.append({
                    "id": existing_res["_id"], 
                    "data": {
                        "homeScore": new_home_score, 
                        "awayScore": new_away_score
                    }, 
                    "type": "UPDATE_RESULT",
                    "desc": f"TULOS PÄIVITETTY: {existing_res['home']} {new_home_score}-{new_away_score} {existing_res['away']}"
                })

    # --- SUORITUS ---
    if not updates_to_run:
        print("\nKaikki tiedot ovat jo ajan tasalla. ✅")
        return

    is_ci = os.getenv("GITHUB_ACTIONS") == "true"
    print("\n" + "="*50)
    print("SUUNNITELTUJEN MUUTOSTEN YHTEENVETO:")
    for up in updates_to_run:
        print(f"[{up['type']}] {up['desc']}")
    print("="*50)

    varmistus = 'k' if is_ci else input(f"\nHyväksytäänkö nämä {len(updates_to_run)} muutosta? (k/e): ").lower()

    if varmistus == 'k':
        for update in updates_to_run:
            if update['type'] == 'INSERT_MATCH':
                matches_collection.insert_one(update['data'])
            elif update['type'] in ['UPDATE_MATCH_TIME', 'UPDATE_RESULT']:
                matches_collection.update_one(
                    {"_id": update['id']}, 
                    {"$set": update['data']}
                )
            print(f"DONE: {update['desc']}")
        print("\nTietokanta päivitetty onnistuneesti! 🚀")
    else:
        print("\nToiminto peruutettu.")

if __name__ == "__main__":
    update_database()