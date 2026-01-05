from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from amadeus import Client, ResponseError
from dotenv import load_dotenv
import os
from .storage import S3DatabaseService

load_dotenv()

app = FastAPI(title="Flight Price Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes para desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

amadeus = Client(
    client_id=os.getenv("AMADEUS_KEY"),
    client_secret=os.getenv("AMADEUS_SECRET")
)

db_service = S3DatabaseService()

class AlertRequest(BaseModel):
    origin: str
    destination: str
    date: str
    target_price: float
    email: str

@app.on_event("startup")
def startup_event():
    db_service.create_table_if_not_exists()

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
        db_service.save_search(origin, destination, date, response.data)
        return response.data
    except ResponseError as error:
        print(f"DEBUG: Amadeus Error: {error}")
        if error.response:
            print(f"DEBUG: Body: {error.response.body}")
            return {"error": f"{error} \nDetalle: {error.response.body}"}
        return {"error": str(error)}

@app.post("/create-alert")
def create_alert(alert: AlertRequest):
    alert_id = db_service.create_alert(
        origin=alert.origin,
        destination=alert.destination,
        date=alert.date,
        target_price=alert.target_price,
        email=alert.email
    )
    if alert_id:
        return {"message": "Alerta creada exitosamente", "alert_id": alert_id}
    else:
        raise HTTPException(status_code=500, detail="Error creando la alerta")
print("AMADEUS_CLIENT_ID:", os.getenv("AMADEUS_CLIENT_ID"))
