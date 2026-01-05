import json
import os
import boto3
from typing import List, Dict, Any
from decimal import Decimal
from datetime import datetime
from uuid import uuid4
from botocore.exceptions import ClientError

class S3DatabaseService:
    def __init__(self, table_name: str = "FlightData"):
        self.bucket = os.getenv("S3_BUCKET_NAME")
        if not self.bucket:
            print("⚠️ S3_BUCKET_NAME no configurado en entorno, usando bucket conocido por defecto.")
            self.bucket = "flight-app-storage-abc96cf5"
            
        self.key = "database.json"
        
        self.s3 = boto3.client(
            's3',
            region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            aws_session_token=os.getenv("AWS_SESSION_TOKEN")
        )
        self.data = []
        self._load_data()

    def _load_data(self):
        try:
            response = self.s3.get_object(Bucket=self.bucket, Key=self.key)
            content = response['Body'].read().decode('utf-8')
            self.data = json.loads(content)
            print(f"[S3 DB] Datos cargados desde {self.bucket}/{self.key}")
        except ClientError as ex:
            if ex.response['Error']['Code'] == 'NoSuchKey':
                print(f"[S3 DB] Archivo no encontrado, iniciando vacío.")
                self.data = []
                self._save_data()
            else:
                print(f"[S3 DB] Error cargando datos: {ex}")
                self.data = []

    def _save_data(self):
        def decimal_default(obj):
            if isinstance(obj, Decimal):
                return float(obj)
            raise TypeError
            
        try:
            self.s3.put_object(
                Bucket=self.bucket, 
                Key=self.key, 
                Body=json.dumps(self.data, default=decimal_default, indent=2)
            )
        except Exception as e:
            print(f"[S3 DB] Error guardando datos: {e}")

    def create_table_if_not_exists(self):
        self._load_data()

    def create_alert(self, origin: str, destination: str, date: str, target_price: float, email: str) -> str:
        alert_id = str(uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        item = {
            'PK': f"ALERT#{alert_id}",
            'SK': "METADATA",
            'alert_id': alert_id,
            'origin': origin,
            'destination': destination,
            'date': date,
            'target_price': float(target_price),
            'email': email,
            'created_at': timestamp,
            'is_active': True
        }
        
        self.data.append(item)
        self._save_data()
        print(f"[S3 DB] Alerta guardada: {alert_id}")
        return alert_id

    def get_active_alerts(self) -> List[Dict[str, Any]]:
        self._load_data()
        return [item for item in self.data if item.get('SK') == 'METADATA' and item.get('is_active')]

    def add_price_history(self, alert_id: str, price: float, currency: str = "EUR"):
        timestamp = datetime.utcnow().isoformat()
        item = {
            'PK': f"ALERT#{alert_id}",
            'SK': f"HISTORY#{timestamp}",
            'price': float(price),
            'currency': currency,
            'timestamp': timestamp
        }
        self.data.append(item)
        self._save_data()
        print(f"[S3 DB] Histórico guardado para {alert_id}")

    def save_search(self, origin: str, destination: str, date: str, results: Any) -> str:
        search_id = str(uuid4())
        item = {
            'PK': f"SEARCH#{search_id}",
            'SK': "METADATA",
            'origin': origin,
            'destination': destination,
            'date': date,
            'timestamp': datetime.utcnow().isoformat(),
            'results': results
        }
        self.data.append(item)
        self._save_data()
        return search_id
