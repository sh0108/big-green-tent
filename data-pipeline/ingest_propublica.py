import requests
import sqlite3
import random
import uuid
import os
from pathlib import Path

# Paths
DB_PATH = Path(__file__).parent.parent / 'server' / 'big_green_tent.db'
API_URL = 'https://projects.propublica.org/nonprofits/api/v2/search.json?q=environment'

# Taxonomies
TAXONOMY_SECTORS = [
    'Built Environment & Sustainable Transportation',
    'Climate Change & Adaptation',
    'Energy Systems',
    'Environmental Education & Communication',
    'Environmental Health',
    'Environmental Justice & Equity',
    'Food & Agriculture',
    'Green Finance & ESG',
    'Industrial Ecology & Circularity',
    'Land Conservation, Forests & Soils',
    'Law & Public Policy',
    'Water Systems & Marine & Coastal Ecosystems',
    'Science, Research & Innovation',
    'Wildlife & Biodiversity'
]

MATURITY_LEVELS = ['Emerging', 'Established', 'Mature']

def generate_random_score():
    """Generates a random reasonable score between 0.5 and 1.9"""
    return round(random.uniform(0.5, 1.9), 2)

def main():
    print(f"Connecting to database at {DB_PATH}")
    
    if not DB_PATH.exists():
        print("Database file does not exist yet. Ensure the server ran at least once to create the schema.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print(f"Fetching data from {API_URL} ...")
    try:
        response = requests.get(API_URL)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Error fetching API data: {e}")
        return

    organizations = data.get('organizations', [])
    if not organizations:
        print("No organizations found in the API response.")
        return

    print(f"Found {len(organizations)} organizations. Starting ingestion...")
    
    insert_sql = '''
        INSERT INTO nonprofits (
            id, name, mission, sector, maturity, 
            program_efficiency, revenue_growth, sustainability, scale, 
            grant_distribution, geographic_reach, innovation_output, location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    '''

    success_count = 0

    for org in organizations:
        try:
            name = org.get('name')
            if not name:
                continue
                
            city = org.get('city', '')
            state = org.get('state', '')
            location = f"{city}, {state}".strip(", ")
            
            # API might not always return a clean mission for every search, so we mock it if empty
            mission = org.get('mission')
            if not mission:
                mission = f"Environmental conservation organization based in {location if location else 'United States'}."

            # Generate random synthetic data to simulate Phase 2 LLM Enrichment
            org_id = str(uuid.uuid4())
            sector = random.choice(TAXONOMY_SECTORS)
            maturity = random.choice(MATURITY_LEVELS)

            efficiency = generate_random_score()
            growth = generate_random_score()
            sustainability = generate_random_score()
            scale = generate_random_score()
            grant_dist = generate_random_score()
            geo_reach = generate_random_score()
            innovation = generate_random_score()

            cursor.execute(insert_sql, (
                org_id, 
                name, 
                mission, 
                sector, 
                maturity,
                efficiency, 
                growth, 
                sustainability, 
                scale,
                grant_dist, 
                geo_reach, 
                innovation, 
                location
            ))
            
            success_count += 1
            
        except sqlite3.IntegrityError as e:
            print(f"Skipping {name} - Integrity error (duplicate or missing constraint): {e}")
        except Exception as e:
            print(f"Error processing organization {name}: {e}")

    conn.commit()
    conn.close()

    print(f"Data aggregation completed successfully. Inserted {success_count} organizations into the database.")

if __name__ == "__main__":
    main()
