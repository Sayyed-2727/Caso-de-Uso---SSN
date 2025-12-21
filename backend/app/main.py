from fastapi import FastAPI

app = FastAPI(title="Flight Price Tracker")

@app.get("/health")
def health():
    return {"status": "ok"}
