from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class ClientBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str | None = None
    phone: str | None = None
    notes: str | None = None

class ClientCreate(ClientBase):
    pass

class ClientRead(ClientBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

class BookingBase(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    session_type: str = "Портретна зйомка"
    location: str | None = None
    starts_at: datetime
    duration_minutes: int = Field(default=60, ge=15, le=720)
    price: float = Field(default=0, ge=0)
    deposit: float = Field(default=0, ge=0)
    status: str = "Підтверджено"
    notes: str | None = None
    client_id: int

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    title: str | None = None
    session_type: str | None = None
    location: str | None = None
    starts_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, ge=15, le=720)
    price: float | None = Field(default=None, ge=0)
    deposit: float | None = Field(default=None, ge=0)
    status: str | None = None
    notes: str | None = None
    client_id: int | None = None

class BookingRead(BookingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    client_name: str | None = None

class PaymentCreate(BaseModel):
    amount: float = Field(gt=0)
    method: str = "Готівка"

class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    amount: float
    method: str
    paid_at: datetime
    booking_id: int

class DashboardRead(BaseModel):
    clients_count: int
    bookings_count: int
    upcoming_count: int
    revenue: float
    outstanding: float
    monthly_revenue: list[dict[str, float | int]]
