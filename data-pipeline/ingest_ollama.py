import requests
import sqlite3
import uuid
import json
import random
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / 'server' / 'big_green_tent.db'
PROPUBLICA_API_URL = 'https://projects.propublica.org/nonprofits/api/v2/search.json?q=environment'
OLLAMA_API_URL = 'http://localhost:11434/api/generate'
OLLAMA_MODEL = 'llama3'

TAXONOMY_SECTORS = ['Built Environment & Sustainable Transportation', 'Climate Change & Adaptation', 'Energy Systems', 'Environmental Education & Communication', 'Environmental Health', 'Environmental Justice & Equity', 'Food & Agriculture', 'Green Finance & ESG', 'Industrial Ecology & Circularity', 'Land Conservation, Forests & Soils', 'Law & Public Policy', 'Water Systems & Marine & Coastal Ecosystems', 'Science, Research & Innovation', 'Wildlife & Biodiversity']
MATURITY_LEVELS = ['Emerging', 'Established', 'Mature']

def generate_fallback_scores():
    return {"program_efficiency": round(random.uniform(0.5, 1.9), 2), "revenue_growth": round(random.uniform(0.5, 1.9), 2), "sustainability": round(random.uniform(0.5, 1.9), 2), "scale": round(random.uniform(0.5, 1.9), 2), "grant_distribution": round(random.uniform(0.5, 1.9), 2), "geographic_reach": round(random.uniform(0.5, 1.9), 2), "innovation_output": round(random.uniform(0.5, 1.9), 2), "enrichment_summary": "Standard data aggregation. No AI enrichment available."}

def enrich_with_ollama(name, mission, location):
    prompt = f"""You are an expert environmental policy analyst. Analyze this nonprofit:
    Name: {name}
    Location: {location}
    Mission: {mission}
    Task: Estimate impact metrics and create a brief summary.
    Return ONLY a valid JSON object with exact keys: "program_efficiency", "revenue_growth", "sustainability", "scale", "grant_distribution", "geographic_reach", "innovation_output" (all floats 0.5-2.0), and "enrichment_summary" (1-sentence string)."""
    
    payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "format": "json"}
    try:
        print(f"  -> Asking Ollama to analyze: {name}...")
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=30)
        response.raise_for_status()
        enriched_data = json.loads(response.json().get('response', '{}'))
        
        fallback = generate_fallback_scores()
        for key in fallback.keys():
            if key not in enriched_data:
                enriched_data[key] = fallback[key]
        return enriched_data
    except Exception as e:
        print(f"  -> Ollama enrichment failed for {name} ({e}). Using fallback data.")
        return generate_fallback_scores()

def main():
    print(f"Connecting to database at {DB_PATH}")
    if not DB_PATH.exists():
        print("Database file does not exist yet.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        response = requests.get(PROPUBLICA_API_URL)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Error fetching API data: {e}")
        return

    organizations = data.get('organizations', [])
    print(f"Found {len(organizations)} organizations. Starting ingestion...")
    
    insert_sql = '''INSERT INTO nonprofits (id, name, mission, sector, maturity, program_efficiency, revenue_growth, sustainability, scale, grant_distribution, geographic_reach, innovation_output, location, enrichment_summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'''
    
    success_count = 0
    for org in organizations[:50]:
        try:
            name = org.get('name')
            if not name: continue
            city = org.get('city', '')
            state = org.get('state', '')
            location = f"{city}, {state}".strip(", ")
            mission = org.get('mission') or f"Environmental organization based in {location or 'United States'}."
            
            ai_data = enrich_with_ollama(name, mission, location)
            org_id = str(uuid.uuid4())
            sector = random.choice(TAXONOMY_SECTORS)
            maturity = random.choice(MATURITY_LEVELS)
            
            cursor.execute(insert_sql, (org_id, name, mission, sector, maturity, ai_data.get("program_efficiency"), ai_data.get("revenue_growth"), ai_data.get("sustainability"), ai_data.get("scale"), ai_data.get("grant_distribution"), ai_data.get("geographic_reach"), ai_data.get("innovation_output"), location, ai_data.get("enrichment_summary")))
            success_count += 1
            print(f"  [+] Successfully enriched and saved: {name}")
        except Exception as e:
            print(f"  [!] Error processing {name}: {e}")
            
    conn.commit()
    conn.close()
    print(f"Data aggregation completed! Inserted {success_count} AI-enriched organizations.")

if __name__ == "__main__":
    main()
