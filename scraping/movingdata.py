import os
from pymongo import MongoClient
from dotenv import load_dotenv
# Tuodaan funktiot getdata.py-tiedostosta
from getdata import scrape_fixtures, scrape_results

# Ladataan ympäristömuuttujat (.env tai GitHub Secrets)
load_dotenv()

def get_database():
    connection_string = os.getenv("MONGODB_URI")
    if not connection_string:
        raise ValueError("MONGODB_URI puuttuu ympäristömuuttujista!")
    
    client = MongoClient(connection_string)
    # Varmista, että tietokannan nimi on täsmälleen oikein (aiemmin käytit mm-veikkaus)
    return client["mm-veikkaus"]

def update_database():
    db = get_database()
    matches_collection = db["matches"]

    # 1. Haetaan tuore data suoraan Flashscoresta
    print("Aloitetaan haku Flashscoresta...")
    fixtures_list = scrape_fixtures()
    results_list = scrape_results()

    # 2. Päivitetään otteluohjelma (Fixtures)
    fixtures_count = 0
    for fixture in fixtures_list:
        try:
            # Käytetään id:tä MongoDB:n _id-kenttänä
            fixture_id = fixture.pop('id')
            fixture['_id'] = fixture_id 

            matches_collection.update_one(
                {"_id": fixture_id},
                {"$set": fixture},
                upsert=True # Luo pelin, jos sitä ei vielä ole
            )
            fixtures_count += 1
        except Exception as e:
            print(f"Virhe ottelun {fixture_id} kohdalla: {e}")

    # 3. Päivitetään tulokset (Results)
    results_count = 0
    for result in results_list:
        try:
            result_id = result.get('id')
            
            # Päivitetään vain maalitiedot
            update_data = {
                "homeScore": result.get("homeScore"),
                "awayScore": result.get("awayScore")
            }

            matches_collection.update_one(
                {"_id": result_id},
                {"$set": update_data},
                upsert=False # Älä luo uutta, jos peliä ei löydy
            )
            results_count += 1
        except Exception as e:
            print(f"Virhe tuloksen {result_id} kohdalla: {e}")

    print(f"Päivitys valmis! Lisätty/Päivitetty {fixtures_count} peliä ja {results_count} tulosta.")

if __name__ == "__main__":
    update_database()