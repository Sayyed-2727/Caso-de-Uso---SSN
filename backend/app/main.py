from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from amadeus import Client, ResponseError
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Flight Price Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

amadeus = Client(
    client_id=os.getenv("AMADEUS_KEY"),
    client_secret=os.getenv("AMADEUS_SECRET")
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/search-flights")
def search_flights(
    origin: str = Query(..., example="MAD"),
    destination: str = Query(..., example="BCN"),
    date: str = Query(..., example="2025-02-10")
):
    try:
        response = amadeus.shopping.flight_offers_search.get(
            originLocationCode=origin,
            destinationLocationCode=destination,
            departureDate=date,
            adults=1
        )
        return response.data
    except ResponseError as error:
        return {"error": str(error)}
print("AMADEUS_CLIENT_ID:", os.getenv("AMADEUS_CLIENT_ID"))
