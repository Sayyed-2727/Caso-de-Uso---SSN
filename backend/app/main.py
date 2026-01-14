from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import boto3
import uuid
from .services.amadeus_client import AmadeusService
from fastapi.middleware.cors import CORSMiddleware
from decimal import Decimal
import os


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

amadeus_service = AmadeusService()
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('TravelAlerts')

class Subscription(BaseModel):
    email: str
    origin: str
    destination: str
    date: str
    current_price: float

@app.get("/search")
async def search(origin: str, dest: str, date: str):
    flights = amadeus_service.search_flights(origin, dest, date)
    return {"flights": flights}

sns_client = boto3.client('sns', region_name='us-east-1')
SNS_TOPIC_ARN = os.getenv("SNS_TOPIC_ARN")

@app.post("/subscribe")
async def subscribe(sub: Subscription):

    try:
        item = {k: (Decimal(str(v)) if isinstance(v, float) else v) 
                for k, v in sub.dict().items()}
        item['alert_id'] = str(uuid.uuid4())
        item['active'] = True
        
        table.put_item(Item=item)
        sns_client.subscribe(
            TopicArn=SNS_TOPIC_ARN,
            Protocol='email',
            Endpoint=sub.email
        )
        return {"status": "success", "message": "Revisa tu email para confirmar la suscripción"}
    except Exception as e:
        print(f"ERROR SUSCRIBIENDO: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))