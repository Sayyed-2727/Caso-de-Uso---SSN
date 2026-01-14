import boto3
import time
import os
from decimal import Decimal
from amadeus_client import AmadeusService
from dotenv import load_dotenv

load_dotenv()

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('TravelAlerts')
sns_client = boto3.client('sns', region_name='us-east-1')

amadeus_service = AmadeusService()

def check_prices():
    print("Iniciando revisión de precios REAL...")
    try:
        response = table.scan()
        items = response.get('Items', [])
        print(f"Alertas encontradas: {len(items)}")

        for alert in items:
            origin = alert.get('origin')
            destination = alert.get('destination')
            date = alert.get('date') 
            
            if not (origin and destination and date):
                print(f"Alerta incompleta, saltando: {alert}")
                continue

            precio_actual = amadeus_service.get_price(origin, destination, date)
            
            if precio_actual is None:
                print(f"No se pudo obtener precio para {origin}-{destination}")
                continue
            
            print(f"Precio actual para {origin}-{destination}: {precio_actual}")
            
            precio_guardado = float(alert['current_price'])

            if precio_actual < precio_guardado:
                print(f"¡BAJADA DE PRECIO detectada para {alert.get('email', 'Usuario')}!")
                
                message = (
                    f"¡Buenas noticias!\n\n"
                    f"El precio de tu vuelo {origin} -> {destination} para el {date} ha bajado.\n"
                    f"Precio anterior: {precio_guardado} EUR\n"
                    f"Precio actual: {precio_actual} EUR\n\n"
                    f"¡Corre a comprarlo!"
                )
                
                sns_client.publish(
                    TopicArn=os.getenv('SNS_TOPIC_ARN'),
                    Message=message,
                    Subject=f"¡Bajada de precio: {origin}-{destination}!"
                )
            else:
                print(f"Precio ({precio_actual}) no es menor que el objetivo ({precio_guardado}).")
                
    except Exception as e:
        print(f"Error en ciclo del worker: {e}")

if __name__ == "__main__":
    print("Worker iniciado. Ejecutando ciclo cada 1 hora...")
    while True:
        check_prices()
        time.sleep(3600) 