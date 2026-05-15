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
    if not client:
        raise ConnectionError("MongoDB-yhteyden muodostaminen epäonnistui!")
    print("Yhdistetty MongoDB:hen onnistuneesti.")
    return client["mm-veikkaus"]

def is_different(existing, new):
    return (existing.get("homeScore") != new.get("homeScore") or 
            existing.get("awayScore") != new.get("awayScore") or 
            existing.get("startTime") != new.get("startTime"))

def update_database():
    db = get_database()
    matches_collection = db["matches"]

    print("--- Aloitetaan haku Flashscoresta ---")
    fixtures_list = scrape_fixtures()
    results_list = scrape_results()
    
    updates_to_run = []

    # 1. FIXTURES-SILMUKKA
    for fixture in fixtures_list:
        scraped_id = fixture.pop('id')
        date_only = fixture['startTime'].split("T")[0]

        existing_match = matches_collection.find_one({
            "$or": [
                {"home": fixture['home'], "away": fixture['away']},
                {"home": fixture['away'], "away": fixture['home']}
            ],
            "startTime": {"$regex": f"^{date_only}"}
        })

        if existing_match:
            if is_different(existing_match, fixture):
                updates_to_run.append({
                    "id": existing_match["_id"], "data": fixture, "type": "UPDATE",
                    "desc": f"OTTELU MUUTTUNUT: {existing_match['home']} - {existing_match['away']}"
                })
        else:
            fixture['_id'] = scraped_id
            updates_to_run.append({
                "id": scraped_id, "data": fixture, "type": "INSERT",
                "desc": f"UUSI OTTELU: {fixture['home']} - {fixture['away']}"
            })

    # 2. RESULTS-SILMUKKA
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
            # Päivitetään vain jos tulos on eri kuin kannassa
            if (existing_res.get('homeScore') != result['homeScore'] or 
                existing_res.get('awayScore') != result['awayScore']):
                
                updates_to_run.append({
                    "id": existing_res["_id"], 
                    "data": {"homeScore": result['homeScore'], "awayScore": result['awayScore']}, 
                    "type": "UPDATE_RESULT",
                    "desc": f"TULOS PÄIVITETTY: {existing_res['home']} {result['homeScore']}-{result['awayScore']} {existing_res['away']}"
                })

    # --- HUMAN-IN-THE-LOOP & SUORITUS ---
    if not updates_to_run:
        print("\nKaikki tiedot ovat jo ajan tasalla. ✅")
        return

    print("\n" + "="*50)
    print("SUUNNITELTUJEN MUUTOSTEN YHTEENVETO:")
    for up in updates_to_run:
        print(f"[{up['type']}] {up['desc']}")
    print("="*50)

    # Varmistus on paras vakuutus tässä vaiheessa
    varmistus = input(f"\nHyväksytäänkö nämä {len(updates_to_run)} muutosta? (k/e): ").lower()

    if varmistus == 'k':
        for update in updates_to_run:
            if update['type'] == "INSERT":
                matches_collection.insert_one(update['data'])
            else:
                matches_collection.update_one({"_id": update['id']}, {"$set": update['data']})
            print(f"DONE: {update['desc']}")
        print("\nTietokanta päivitetty onnistuneesti! 🏒")
    else:
        print("\nToiminto peruutettu.")

if __name__ == "__main__":
    update_database()