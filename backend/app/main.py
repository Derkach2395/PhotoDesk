import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func
from .database import Base, engine, SessionLocal
from . import models
from .routers import api

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    # Seed sample records only when the database is empty.
    with SessionLocal() as db:
        if (db.scalar(select(func.count(models.Client.id))) or 0) == 0:
            clients = [
                models.Client(name="Анна Коваленко", email="anna@example.com", phone="+380 67 123 45 67", notes="Весільна зйомка"),
                models.Client(name="Олександр Мельник", email="oleksandr@example.com", phone="+380 93 234 56 78", notes="Портретна фотосесія"),
                models.Client(name="Марія Бондар", email="maria@example.com", phone="+380 50 345 67 89", notes="Сімейна зйомка"),
            ]
            db.add_all(clients); db.flush()
            now = datetime.now(timezone.utc)
            bookings = [
                models.Booking(title="Весільна історія", session_type="Весілля", location="Вінниця", starts_at=now + timedelta(days=2), duration_minutes=240, price=18000, deposit=5000, status="Підтверджено", client_id=clients[0].id),
                models.Booking(title="Портрет у студії", session_type="Портрет", location="PhotoDesk Studio", starts_at=now + timedelta(days=1), duration_minutes=90, price=3500, deposit=1000, status="Очікує передоплати", client_id=clients[1].id),
                models.Booking(title="Сімейний ранок", session_type="Сімейна", location="Міський парк", starts_at=now + timedelta(days=5), duration_minutes=60, price=2800, deposit=800, status="Підтверджено", client_id=clients[2].id),
            ]
            db.add_all(bookings); db.flush()
            db.add(models.Payment(amount=5000, method="Банківський переказ", booking_id=bookings[0].id))
            db.add(models.Payment(amount=1000, method="Картка", booking_id=bookings[1].id))
            db.commit()
    yield

app = FastAPI(title="PhotoDesk API", version="1.0.0", description="API для керування фотостудією", lifespan=lifespan)
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in origins], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(api)

@app.get("/")
def root():
    return {"name": "PhotoDesk API", "docs": "/docs", "status": "running"}
