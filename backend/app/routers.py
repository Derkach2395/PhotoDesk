from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from .database import get_db
from . import models, schemas

api = APIRouter(prefix="/api")

@api.get("/health")
def health():
    return {"status": "ok", "service": "PhotoDesk API"}

@api.get("/clients", response_model=list[schemas.ClientRead])
def list_clients(q: str | None = Query(default=None, max_length=100), db: Session = Depends(get_db)):
    stmt = select(models.Client).order_by(models.Client.name)
    if q:
        stmt = stmt.where(models.Client.name.ilike(f"%{q}%") | models.Client.email.ilike(f"%{q}%"))
    return db.scalars(stmt).all()

@api.post("/clients", response_model=schemas.ClientRead, status_code=201)
def create_client(payload: schemas.ClientCreate, db: Session = Depends(get_db)):
    client = models.Client(**payload.model_dump())
    db.add(client); db.commit(); db.refresh(client)
    return client

@api.get("/clients/{client_id}", response_model=schemas.ClientRead)
def get_client(client_id: int, db: Session = Depends(get_db)):
    client = db.get(models.Client, client_id)
    if not client: raise HTTPException(404, "Клієнта не знайдено")
    return client

@api.patch("/clients/{client_id}", response_model=schemas.ClientRead)
def update_client(client_id: int, payload: schemas.ClientCreate, db: Session = Depends(get_db)):
    client = db.get(models.Client, client_id)
    if not client: raise HTTPException(404, "Клієнта не знайдено")
    for key, value in payload.model_dump().items(): setattr(client, key, value)
    db.commit(); db.refresh(client)
    return client

@api.delete("/clients/{client_id}", status_code=204)
def delete_client(client_id: int, db: Session = Depends(get_db)):
    client = db.get(models.Client, client_id)
    if not client: raise HTTPException(404, "Клієнта не знайдено")
    db.delete(client); db.commit(); return Response(status_code=204)

@api.get("/bookings", response_model=list[schemas.BookingRead])
def list_bookings(status: str | None = None, db: Session = Depends(get_db)):
    stmt = select(models.Booking).order_by(models.Booking.starts_at)
    if status: stmt = stmt.where(models.Booking.status == status)
    rows = db.scalars(stmt).all()
    return [{**schemas.BookingRead.model_validate(row).model_dump(), "client_name": row.client.name} for row in rows]

@api.post("/bookings", response_model=schemas.BookingRead, status_code=201)
def create_booking(payload: schemas.BookingCreate, db: Session = Depends(get_db)):
    if not db.get(models.Client, payload.client_id): raise HTTPException(404, "Клієнта не знайдено")
    if payload.deposit > payload.price: raise HTTPException(400, "Передоплата не може перевищувати вартість зйомки")
    booking = models.Booking(**payload.model_dump())
    db.add(booking); db.commit(); db.refresh(booking)
    return {**schemas.BookingRead.model_validate(booking).model_dump(), "client_name": booking.client.name}

@api.patch("/bookings/{booking_id}", response_model=schemas.BookingRead)
def update_booking(booking_id: int, payload: schemas.BookingUpdate, db: Session = Depends(get_db)):
    booking = db.get(models.Booking, booking_id)
    if not booking: raise HTTPException(404, "Бронювання не знайдено")
    data = payload.model_dump(exclude_unset=True)
    if "client_id" in data and not db.get(models.Client, data["client_id"]): raise HTTPException(404, "Клієнта не знайдено")
    proposed_price = data.get("price", float(booking.price))
    proposed_deposit = data.get("deposit", float(booking.deposit))
    if proposed_deposit > proposed_price: raise HTTPException(400, "Передоплата не може перевищувати вартість зйомки")
    for key, value in data.items(): setattr(booking, key, value)
    db.commit(); db.refresh(booking)
    return {**schemas.BookingRead.model_validate(booking).model_dump(), "client_name": booking.client.name}

@api.delete("/bookings/{booking_id}", status_code=204)
def delete_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.get(models.Booking, booking_id)
    if not booking: raise HTTPException(404, "Бронювання не знайдено")
    db.delete(booking); db.commit(); return Response(status_code=204)

@api.get("/bookings/{booking_id}/payments", response_model=list[schemas.PaymentRead])
def list_payments(booking_id: int, db: Session = Depends(get_db)):
    if not db.get(models.Booking, booking_id): raise HTTPException(404, "Бронювання не знайдено")
    return db.scalars(select(models.Payment).where(models.Payment.booking_id == booking_id).order_by(models.Payment.paid_at.desc())).all()

@api.post("/bookings/{booking_id}/payments", response_model=schemas.PaymentRead, status_code=201)
def create_payment(booking_id: int, payload: schemas.PaymentCreate, db: Session = Depends(get_db)):
    booking = db.get(models.Booking, booking_id)
    if not booking: raise HTTPException(404, "Бронювання не знайдено")
    paid = db.scalar(select(func.coalesce(func.sum(models.Payment.amount), 0)).where(models.Payment.booking_id == booking_id)) or 0
    if float(paid) + payload.amount > float(booking.price): raise HTTPException(400, "Сума платежів перевищить вартість зйомки")
    payment = models.Payment(**payload.model_dump(), booking_id=booking_id)
    db.add(payment); db.commit(); db.refresh(payment)
    return payment

@api.get("/dashboard", response_model=schemas.DashboardRead)
def dashboard(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    clients_count = db.scalar(select(func.count(models.Client.id))) or 0
    bookings_count = db.scalar(select(func.count(models.Booking.id))) or 0
    upcoming_count = db.scalar(select(func.count(models.Booking.id)).where(models.Booking.starts_at >= now, models.Booking.status != "Скасовано")) or 0
    revenue = db.scalar(select(func.coalesce(func.sum(models.Payment.amount), 0))) or 0
    monthly_revenue = [0.0] * 12
    for payment in db.scalars(select(models.Payment).where(models.Payment.paid_at >= year_start)):
        monthly_revenue[payment.paid_at.month - 1] += float(payment.amount)
    booking_rows = db.scalars(select(models.Booking).where(models.Booking.status != "Скасовано")).all()
    outstanding = sum(max(0, float(b.price) - float(b.deposit)) for b in booking_rows)
    return {"clients_count": clients_count, "bookings_count": bookings_count, "upcoming_count": upcoming_count, "revenue": float(revenue), "outstanding": outstanding, "monthly_revenue": [{"month": month, "amount": amount} for month, amount in enumerate(monthly_revenue, 1)]}
