import sys
import os
import json
from pprint import pprint
from dotenv import load_dotenv

load_dotenv()

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../Lambda')))

try:
    from app.storage import S3DatabaseService
    from Price_Checker import lambda_handler
except ImportError as e:
    print(f"Error de importación: {e}")
    sys.exit(1)

def test_full_flow():
    print("=== Iniciando test ===")
    
    db = S3DatabaseService()
    db.create_table_if_not_exists()
    alert_id = db.create_alert(
        origin="MAD",
        destination="LHR",
        date="2025-03-15",
        target_price=200.00,
        email="test@example.com"
    )
    
    if alert_id:
        print(f"✅ Alerta creada con ID: {alert_id}")
    else:
        print("❌ Fallo al crear alerta.")
        return

    print("\n3. Verificando alertas activas...")
    alerts = db.get_active_alerts()
    print(f"Alertas activas encontradas: {len(alerts)}")
    if len(alerts) > 0:
        print(f"Datos de alerta: {alerts[0]}")
    else:
        print("❌ No se encontraron alertas activas.")

    print("\n4. Ejecutando Lambda 'Price_Checker'...")
    
    os.environ["TABLE_NAME"] = "FlightDataTest"
    
    result = lambda_handler(event={}, context={})
    
    print("\nResultado de Lambda:")
    pprint(result)

    print("\n✅ Test completado.")

if __name__ == "__main__":
    test_full_flow()
