# scraping/migrate.py
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

def migrate_old_matches():
    connection_string = os.getenv("MONGODB_URI")
    client = MongoClient(connection_string)
    db = client["mm-veikkaus"]
    matches_collection = db["matches"]

    print("--- Aloitetaan vanhan datan päivitys ---")

    # Esitään kaikki ottelut, joilta PUUTTUU 'tournament'-kenttä
    # ja asetetaan niille arvoksi 'lätkä_2026'
    result = matches_collection.update_many(
        {"tournament": {"$exists": False}}, 
        {"$set": {"tournament": "lätkä_2026"}}
    )

    print(f"Päivitys valmis! Päivitettiin {result.modified_count} vanhaa ottelua.")

if __name__ == "__main__":
    migrate_old_matches()