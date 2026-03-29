"""Import ACLED aggregated xlsx files into Supabase conflict_events table."""
import os
import sys
import math
import pandas as pd
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://douraoyjdmhscwqmxfrg.supabase.co")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]  # set via environment variable

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

FILES = [
    "Africa_aggregated_data_up_to_week_of-2026-03-14.xlsx",
    "Asia-Pacific_aggregated_data_up_to_week_of-2026-03-14.xlsx",
    "Middle-East_aggregated_data_up_to_week_of-2026-03-14.xlsx",
    "Latin-America-the-Caribbean_aggregated_data_up_to_week_of-2026-03-14.xlsx",
    "US-and-Canada_aggregated_data_up_to_week_of-2026-03-14.xlsx",
]

BASE_DIR = "/Users/dzhang/Code/yhack2026"

# Only import data from 2024 onwards
MIN_DATE = "2024-01-01"


def compute_severity(fatalities, event_type):
    score = min(10, 1 + math.log2(fatalities + 1) * 1.5)
    if event_type == "Violence against civilians":
        score = min(10, score + 1)
    if event_type == "Explosions/Remote violence":
        score = min(10, score + 0.5)
    return round(score, 1)


def process_file(filepath):
    print(f"\nReading {os.path.basename(filepath)}...")
    df = pd.read_excel(filepath, engine="openpyxl")
    print(f"  Total rows: {len(df)}")

    # Filter to recent data
    df["WEEK"] = pd.to_datetime(df["WEEK"])
    df = df[df["WEEK"] >= MIN_DATE]
    print(f"  After filtering >= {MIN_DATE}: {len(df)}")

    if len(df) == 0:
        return 0

    # Drop rows without coordinates
    df = df.dropna(subset=["CENTROID_LATITUDE", "CENTROID_LONGITUDE"])

    # Build rows for upsert
    inserted = 0
    batch = []

    for _, row in df.iterrows():
        fatalities = int(row["FATALITIES"]) if pd.notna(row["FATALITIES"]) else 0
        event_type = str(row["EVENT_TYPE"]) if pd.notna(row["EVENT_TYPE"]) else ""
        record = {
            "event_date": row["WEEK"].strftime("%Y-%m-%d"),
            "event_type": event_type,
            "sub_event_type": str(row["SUB_EVENT_TYPE"]) if pd.notna(row["SUB_EVENT_TYPE"]) else None,
            "actor1": None,
            "actor2": None,
            "country": str(row["COUNTRY"]) if pd.notna(row["COUNTRY"]) else "",
            "admin1": str(row["ADMIN1"]) if pd.notna(row["ADMIN1"]) else None,
            "admin2": None,
            "latitude": float(row["CENTROID_LATITUDE"]),
            "longitude": float(row["CENTROID_LONGITUDE"]),
            "fatalities": fatalities,
            "notes": f"{int(row['EVENTS'])} events this week" if pd.notna(row["EVENTS"]) else None,
            "source": "ACLED",
            "severity_score": compute_severity(fatalities, event_type),
        }
        batch.append(record)

        if len(batch) >= 500:
            try:
                supabase.table("conflict_events").insert(batch).execute()
                inserted += len(batch)
                print(f"  Inserted {inserted}...", end="\r")
            except Exception as e:
                print(f"  Error inserting batch: {e}")
            batch = []

    # Insert remaining
    if batch:
        try:
            supabase.table("conflict_events").insert(batch).execute()
            inserted += len(batch)
        except Exception as e:
            print(f"  Error inserting final batch: {e}")

    print(f"  Inserted {inserted} rows")
    return inserted


def main():
    # Clear old data and fix table schema
    print("Clearing old data and fixing schema...")
    try:
        supabase.table("conflict_events").delete().neq("country", "").execute()
    except Exception as e:
        print(f"  Clear failed: {e}")

    # Make id auto-generated if not already
    try:
        supabase.postgrest.rpc("", {}).execute()
    except:
        pass

    total = 0
    for f in FILES:
        path = os.path.join(BASE_DIR, f)
        if os.path.exists(path):
            total += process_file(path)
        else:
            print(f"  SKIP: {f} not found")

    print(f"\nDone! Total inserted: {total}")


if __name__ == "__main__":
    main()
