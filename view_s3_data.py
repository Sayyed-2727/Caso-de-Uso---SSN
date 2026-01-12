import boto3
import os
import json
from dotenv import load_dotenv

load_dotenv()

bucket = os.getenv("S3_BUCKET_NAME")
key = "database.json"

s3 = boto3.client(
    's3',
    region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    aws_session_token=os.getenv("AWS_SESSION_TOKEN")
)

print(f"--- LEYENDO DATOS REALES DE S3 ({bucket}) ---")
try:
    response = s3.get_object(Bucket=bucket, Key=key)
    content = response['Body'].read().decode('utf-8')
    data = json.loads(content)
    print(json.dumps(data, indent=2))
    print("---------------------------------------------")
    print("✅ Datos leidos de S3")
except Exception as e:
    print(f"❌ Error leyendo S3: {e}")
