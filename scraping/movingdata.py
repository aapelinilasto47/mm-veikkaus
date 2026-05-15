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
        existing_fix = matches_collection.find_one({"id": fixture["id"]})

    if existing_fix:
        # PÄIVITETÄÄN VAIN KELLONAIKA (jos se on muuttunut oikeasti)
        # Emme koske home/away kenttiin enää luonnin jälkeen!
        if existing_fix.get('startTime') != fixture['startTime']:
            updates_to_run.append({
                "id": existing_fix["_id"], 
                "data": {"startTime": fixture['startTime']}, # Päivitä vain aika
                "type": "UPDATE_MATCH_TIME",
                "desc": f"KELLOAIKA PÄIVITETTY: {existing_fix['home']} - {existing_fix['away']}"
            })
    else:
        # Vasta jos peliä ei ole lainkaan, lisätään se kokonaan
        updates_to_run.append({
            "data": fixture, 
            "type": "INSERT_MATCH",
            "desc": f"UUSI OTTELU LISÄTTY: {fixture['home']} - {fixture['away']}"
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
        # --- ÄLYKÄS MAALIEN KOHDISTUS ---
        # Katsotaan kumpi on kotijoukkue tietokannassa ja valitaan maalit sen mukaan
            if existing_res['home'] == result['home']:
                # Järjestys on sama: Home=Home, Away=Away
                new_home_score = result['homeScore']
                new_away_score = result['awayScore']
            else:
                # Järjestys on kääntynyt: Tietokannan Home onkin skraappauksen Away
                new_home_score = result['awayScore']
                new_away_score = result['homeScore']
                print(f"🔄 Järjestys kääntynyt ottelussa {existing_res['home']}-{existing_res['away']}. Korjataan maalit oikein päin.")

            # Verrataan nyt näitä korjattuja maaleja tietokannan nykyisiin
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
        else:
            print(f"HUOM: Ottelua ei löydy kannasta: {result['home']} vs {result['away']} ({result['homeScore']}-{result['awayScore']})")

    # --- HUMAN-IN-THE-LOOP & SUORITUS ---
    if not updates_to_run:
        print("\nKaikki tiedot ovat jo ajan tasalla. ✅")
        return

    is_ci = os.getenv("GITHUB_ACTIONS") == "true"

    print("\n" + "="*50)
    print("SUUNNITELTUJEN MUUTOSTEN YHTEENVETO:")
    for up in updates_to_run:
        print(f"[{up['type']}] {up['desc']}")
    print("="*50)

    if is_ci:
        print("\nCI-ympäristössä, joten hyväksytään kaikki muutokset automaattisesti.")
        varmistus = 'k'
    # Varmistus on paras vakuutus tässä vaiheessa
    else:
        varmistus = input(f"\nHyväksytäänkö nämä {len(updates_to_run)} muutosta? (k/e): ").lower()

    if varmistus == 'k':
        for update in updates_to_run:
            if update['type'] == "INSERT":
                matches_collection.insert_one(update['data'])
            else:
                matches_collection.update_one({"_id": update['id']}, {"$set": update['data']})
            print(f"DONE: {update['desc']}")
        print("\nTietokanta päivitetty onnistuneesti!")
    else:
        print("\nToiminto peruutettu.")


if __name__ == "__main__":    update_database()