import os
from pymongo import MongoClient
from dotenv import load_dotenv
from getdata import scrape_fixtures, scrape_results

load_dotenv()

def get_database():
    connection_string = os.getenv("MONGODB_URI")
    client = MongoClient(connection_string)
    return client["mm-veikkaus"]

def update_database():
    db = get_database()
    matches_collection = db["matches"]

    print("--- Päivitys alkanut ---")
    try:
        fixtures_list = scrape_fixtures()
    except Exception as e:
        print(f"Virhe haettaessa fixtures: {e}")
        fixtures_list = []
        
    try:
        results_list = scrape_results()
    except Exception as e:
        print(f"Virhe haettaessa results: {e}")
        results_list = []

    updates_to_run = []
    processed_ids = set()

    print(f"\nHaettu {len(fixtures_list)} uutta peliä ja {len(results_list)} tulosta.")

    # 1. FIXTURES: Uudet pelit ja aikataulut
    for fixture in fixtures_list:
        if fixture["id"] in processed_ids: continue
        
        fixture_date = fixture['startTime'].split("T")[0]
        
        # NIMIPOHJAINEN HAKU: Estää duplikaatit jos järjestys vaihtuu
        existing_fix = matches_collection.find_one({
            "tournament": "futis_2026",
            "$or": [
                {"_id": fixture["id"]}, # Haku suoralla ID:llä
                {
                    "home": {"$in": [fixture['home'], fixture['away']]},
                    "away": {"$in": [fixture['home'], fixture['away']]},
                    "startTime": {"$regex": f"^{fixture_date}"}
                }
            ]
        })

        if existing_fix:
            processed_ids.add(existing_fix["_id"])
            # Päivitetään vain kellonaika jos se on eri (varmistetaan "naive" muoto)
            clean_time = fixture['startTime'].split("+")[0].split("Z")[0]
            if existing_fix.get('startTime') != clean_time:
                updates_to_run.append({
                    "id": existing_fix["_id"], 
                    "data": {"startTime": clean_time},
                    "type": "UPDATE",
                    "desc": f"KELLO: {existing_fix['home']} - {existing_fix['away']}"
                })
        else:
            # Uusi peli (esim. Playoffit)
            new_match = fixture.copy()
            new_match["_id"] = new_match.pop("id")
            processed_ids.add(new_match["_id"])
            updates_to_run.append({
                "data": new_match, 
                "type": "INSERT",
                "desc": f"UUSI: {new_match['home']} - {new_match['away']}"
            })

    # 2. RESULTS: Tulosten päivitys
    for result in results_list:
        # Lasketaan tulokselle ID täsmälleen samalla logiikalla kuin fixtureille
        # getdata-tiedostosta tuodun generate_id-funktion avulla
        from getdata import generate_id
        
        match_id = generate_id(result['home'], result['away'], result['startTime'])
        
        # Haetaan suoraan pomminvarmalla ID-haulla!
        existing_res = matches_collection.find_one({
            "_id": match_id,
            "tournament": "futis_2026",
            
        })
        

        if existing_res:
            # Kohdistetaan maalit oikein päin
            if existing_res['home'] == result['home']:
                h, a = result['homeScore'], result['awayScore']
            else:
                h, a = result['awayScore'], result['homeScore']

            # Päivitetään jos kanta on tyhjä (None) tai maalit ovat muuttuneet
            if (existing_res.get('homeScore') is None or existing_res.get('awayScore') is None or 
                existing_res.get('homeScore') != h or existing_res.get('awayScore') != a):
                
                updates_to_run.append({
                    "id": existing_res["_id"], 
                    "data": {"homeScore": h, "awayScore": a}, 
                    "type": "UPDATE",
                    "desc": f"TULOS: {existing_res['home']} {h}-{a} {existing_res['away']}"
                })

    if not updates_to_run:
        print("Kaikki ajan tasalla. ✅")
        return
    print(f"\n[DRY RUN] Havaittu {len(updates_to_run)} muutosta, mutta mitään ei kirjoitettu kantaan.")
    print("="*50)
    for up in updates_to_run:
        print(f"SUUNNITELTU: [{up['type']}] {up['desc']}")
        # Jos haluat nähdä tarkat tiedot mitä tallennettaisiin:
        # print(f"DATA: {up['data']}") 
    print("="*50)
    print("\nTarkista yllä olevat muutokset. Jos ne näyttävät oikeilta (ID:t, kellonajat), poista TURVAMOODI.")

    # KOMMENTOI VARSINAINEN TALLENNUS TOISTAISEKSI POIS:
    
    is_ci = os.getenv("GITHUB_ACTIONS") == "true"
    if is_ci or input(f"Hyväksytäänkö muutokset? (k/e): ").lower() == 'k':
        for up in updates_to_run:
            if up['type'] == 'INSERT':
                matches_collection.insert_one(up['data'])
            else:
                matches_collection.update_one({"_id": up['id']}, {"$set": up['data']})
            print(f"VALMIS: {up['desc']}")
        
if __name__ == "__main__":
    update_database()