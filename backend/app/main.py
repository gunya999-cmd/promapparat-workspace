from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import Field, Session, SQLModel, create_engine, select

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'promapparat_workspace.db')}")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)

app = FastAPI(title="PromApparat Workspace API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Work(SQLModel, table=True):
    __tablename__ = "works"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    code: str
    title: str
    source: str = "Тендер"
    customer: str
    object_name: Optional[str] = None
    manager_name: Optional[str] = "Менеджер"
    deadline: Optional[datetime] = None
    state: str = "Найдена"
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Supplier(SQLModel, table=True):
    __tablename__ = "suppliers"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    inn: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Position(SQLModel, table=True):
    __tablename__ = "positions"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    work_id: UUID
    row_no: int
    group_name: Optional[str] = None
    name: str
    qty: Decimal = Decimal("1")
    unit: str = "шт"
    tech_description: Optional[str] = None
    supplier_id: Optional[UUID] = None
    purchase_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    currency: str = "RUB"
    vat_rate: Optional[Decimal] = Decimal("20")
    production_days: Optional[int] = None
    delivery_days: Optional[int] = None
    planned_ready_date: Optional[datetime] = None
    actual_ready_date: Optional[datetime] = None
    shipment_place: Optional[str] = None
    status: str = "Не начато"
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Document(SQLModel, table=True):
    __tablename__ = "documents"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    work_id: Optional[UUID] = None
    position_id: Optional[UUID] = None
    type: str
    name: str
    file_path: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorkCreate(BaseModel):
    title: str
    source: str = "Тендер"
    customer: str
    object_name: str | None = None
    deadline: datetime | None = None
    comment: str | None = None

class WorkUpdate(BaseModel):
    title: str | None = None
    source: str | None = None
    customer: str | None = None
    object_name: str | None = None
    manager_name: str | None = None
    deadline: datetime | None = None
    state: str | None = None
    comment: str | None = None

class PositionCreate(BaseModel):
    group_name: str | None = None
    name: str
    qty: float = 1
    unit: str = "шт"
    supplier_id: UUID | None = None
    purchase_price: float | None = None
    sale_price: float | None = None
    production_days: int | None = None
    delivery_days: int | None = None
    shipment_place: str | None = None
    status: str = "Не начато"
    comment: str | None = None

class PositionUpdate(BaseModel):
    group_name: str | None = None
    name: str | None = None
    qty: float | None = None
    unit: str | None = None
    supplier_id: UUID | None = None
    purchase_price: float | None = None
    sale_price: float | None = None
    production_days: int | None = None
    delivery_days: int | None = None
    shipment_place: str | None = None
    status: str | None = None
    comment: str | None = None


def calc_position(p: Position, has_tkp: bool = False) -> dict:
    progress = 0
    if p.name: progress += 10
    if p.qty: progress += 10
    if p.supplier_id: progress += 15
    if has_tkp: progress += 15
    if p.purchase_price is not None: progress += 15
    if p.sale_price is not None: progress += 15
    if p.production_days is not None or p.delivery_days is not None: progress += 10
    if p.shipment_place: progress += 10

    purchase_total = float(p.purchase_price or 0) * float(p.qty or 0)
    sale_total = float(p.sale_price or 0) * float(p.qty or 0)
    profit = sale_total - purchase_total
    margin = (profit / sale_total * 100) if sale_total else None

    warnings: list[str] = []
    if not p.supplier_id: warnings.append("Нет поставщика")
    if p.purchase_price is None: warnings.append("Нет цены закупки")
    if p.sale_price is None: warnings.append("Нет цены продажи")
    if p.production_days is None and p.delivery_days is None: warnings.append("Нет срока")
    if not p.shipment_place: warnings.append("Нет места отгрузки")
    if margin is not None and margin < 15: warnings.append("Низкая маржа")
    if not has_tkp: warnings.append("Нет ТКП")

    return {
        "progress": min(progress, 100),
        "purchase_total": purchase_total,
        "sale_total": sale_total,
        "profit": profit,
        "margin": margin,
        "warnings": warnings,
    }


def next_action(work: Work, positions: list[Position], docs: list[Document]) -> str:
    if not docs:
        return "Загрузить документацию"
    if not positions:
        return "Создать позиции"
    if any(not p.supplier_id for p in positions):
        return "Назначить поставщиков"
    if any(p.purchase_price is None for p in positions):
        return "Получить ТКП и внести цены закупки"
    if any(p.sale_price is None for p in positions):
        return "Рассчитать цены продажи"
    if any((p.production_days is None and p.delivery_days is None) for p in positions):
        return "Проверить сроки изготовления и поставки"
    return "Сформировать КП"


def create_seed_data() -> None:
    with Session(engine) as session:
        if session.exec(select(Work)).first():
            return

        now = datetime.now(timezone.utc)
        s1 = Supplier(name="ООО Арматура-Сервис", contact_name="Алексей", phone="+7 900 111-22-33", email="sales@example.ru", city="Москва")
        s2 = Supplier(name="Завод ПромКлапан", contact_name="Ирина", phone="+7 900 222-33-44", email="tkp@example.ru", city="Санкт-Петербург")
        s3 = Supplier(name="ТД КИП Комплект", contact_name="Олег", phone="+7 900 333-44-55", email="info@example.ru", city="Екатеринбург")
        session.add_all([s1, s2, s3])
        session.commit()
        session.refresh(s1); session.refresh(s2); session.refresh(s3)

        w1 = Work(code="PA-2026-0001", title="Клапаны 46 шт", source="Тендер", customer="НкНПЗ", object_name="Клапаны и запорная арматура", deadline=now + timedelta(hours=20), state="Расчет")
        w2 = Work(code="PA-2026-0002", title="Расходомеры и КИП", source="Тендер", customer="СИБУР", object_name="Модернизация линии учета", deadline=now + timedelta(days=3), state="Ожидаем ТКП")
        w3 = Work(code="PA-2026-0003", title="Запрос с сайта: регулирующая арматура", source="Сайт", customer="ООО СеверХим", object_name="Производственный участок", deadline=now + timedelta(days=7), state="Новая")
        session.add_all([w1, w2, w3])
        session.commit()
        session.refresh(w1); session.refresh(w2); session.refresh(w3)

        positions = [
            Position(work_id=w1.id, row_no=1, group_name="Клапаны", name="Клапан запорный DN50 PN40", qty=8, unit="шт", supplier_id=s1.id, purchase_price=Decimal("18500"), sale_price=Decimal("24800"), production_days=15, delivery_days=3, shipment_place="Москва", status="Цена рассчитана"),
            Position(work_id=w1.id, row_no=2, group_name="Клапаны", name="Клапан обратный DN100 PN16", qty=12, unit="шт", supplier_id=s2.id, purchase_price=Decimal("31200"), sale_price=Decimal("36000"), production_days=25, delivery_days=5, shipment_place="Санкт-Петербург", status="ТКП получено"),
            Position(work_id=w1.id, row_no=3, group_name="Арматура", name="Задвижка клиновая DN150 PN16", qty=6, unit="шт", status="Нужен поставщик"),
            Position(work_id=w2.id, row_no=1, group_name="КИП", name="Расходомер электромагнитный DN80", qty=4, unit="шт", supplier_id=s3.id, purchase_price=Decimal("94000"), production_days=20, shipment_place="Екатеринбург", status="Ожидаем ТКП"),
            Position(work_id=w3.id, row_no=1, group_name="Регулирующая арматура", name="Клапан регулирующий DN25", qty=2, unit="шт", status="Не начато"),
        ]
        session.add_all(positions)
        session.add(Document(work_id=w1.id, type="ТЗ", name="Техническое задание НкНПЗ.pdf"))
        session.add(Document(work_id=w1.id, type="ТКП", name="ТКП Арматура-Сервис.pdf"))
        session.add(Document(work_id=w2.id, type="ТЗ", name="Ведомость КИП.xlsx"))
        session.commit()


@app.on_event("startup")
def on_startup() -> None:
    SQLModel.metadata.create_all(engine)
    create_seed_data()


@app.get("/health")
def health():
    return {"ok": True, "database": DATABASE_URL}


@app.get("/api/suppliers")
def get_suppliers():
    with Session(engine) as session:
        return session.exec(select(Supplier).order_by(Supplier.name)).all()


@app.get("/api/works")
def get_works(q: str | None = None, source: str | None = None, state: str | None = None, urgency: str | None = None):
    with Session(engine) as session:
        query = select(Work).order_by(Work.deadline)
        works = session.exec(query).all()
        if q:
            needle = q.strip().lower()
            works = [w for w in works if needle in (w.title or '').lower() or needle in (w.customer or '').lower() or needle in (w.code or '').lower() or needle in (w.object_name or '').lower()]
        if source and source != 'Все':
            works = [w for w in works if w.source == source]
        if state and state != 'Все':
            works = [w for w in works if w.state == state]
        if urgency and urgency != 'Все':
            now = datetime.now(timezone.utc)
            def hours_left(w: Work):
                if not w.deadline: return None
                d = w.deadline
                if d.tzinfo is None:
                    d = d.replace(tzinfo=timezone.utc)
                return (d - now).total_seconds() / 3600
            if urgency == 'Горит':
                works = [w for w in works if (hours_left(w) is not None and hours_left(w) <= 24)]
            elif urgency == 'Сегодня':
                works = [w for w in works if (hours_left(w) is not None and 0 <= hours_left(w) <= 24)]
            elif urgency == 'Просрочено':
                works = [w for w in works if (hours_left(w) is not None and hours_left(w) < 0)]
        result = []
        for w in works:
            positions = session.exec(select(Position).where(Position.work_id == w.id)).all()
            docs = session.exec(select(Document).where(Document.work_id == w.id)).all()
            has_tkp = any(d.type == "ТКП" for d in docs)
            enriched = [calc_position(p, has_tkp=has_tkp) for p in positions]
            progress = round(sum(x["progress"] for x in enriched) / len(enriched)) if enriched else (10 if docs else 0)
            sale_total = sum(x["sale_total"] for x in enriched)
            profit = sum(x["profit"] for x in enriched)
            warnings = sum(len(x["warnings"]) for x in enriched)
            result.append({**w.model_dump(), "progress": progress, "positions_count": len(positions), "sale_total": sale_total, "profit": profit, "warnings_count": warnings, "next_action": next_action(w, positions, docs)})
        return result


@app.post("/api/works")
def create_work(payload: WorkCreate):
    with Session(engine) as session:
        year = datetime.now().year
        count = len(session.exec(select(Work)).all()) + 1
        work = Work(code=f"PA-{year}-{count:04d}", title=payload.title, source=payload.source, customer=payload.customer, object_name=payload.object_name, deadline=payload.deadline, comment=payload.comment)
        session.add(work)
        session.commit()
        session.refresh(work)
        return work


@app.patch("/api/works/{work_id}")
def update_work(work_id: UUID, payload: WorkUpdate):
    with Session(engine) as session:
        work = session.get(Work, work_id)
        if not work:
            raise HTTPException(404, "Work not found")
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(work, key, value)
        work.updated_at = datetime.now(timezone.utc)
        session.add(work)
        session.commit()
        session.refresh(work)
        return work


@app.delete("/api/works/{work_id}")
def delete_work(work_id: UUID):
    with Session(engine) as session:
        work = session.get(Work, work_id)
        if not work:
            raise HTTPException(404, "Work not found")
        positions = session.exec(select(Position).where(Position.work_id == work_id)).all()
        docs = session.exec(select(Document).where(Document.work_id == work_id)).all()
        for item in positions + docs:
            session.delete(item)
        session.delete(work)
        session.commit()
        return {"ok": True}


@app.get("/api/works/{work_id}")
def get_work(work_id: UUID):
    with Session(engine) as session:
        work = session.get(Work, work_id)
        if not work:
            raise HTTPException(404, "Work not found")
        positions = session.exec(select(Position).where(Position.work_id == work_id).order_by(Position.row_no)).all()
        docs = session.exec(select(Document).where(Document.work_id == work_id)).all()
        has_tkp = any(d.type == "ТКП" for d in docs)
        enriched_positions = [{**p.model_dump(), **calc_position(p, has_tkp=has_tkp)} for p in positions]
        totals = {
            "purchase_total": sum(p["purchase_total"] for p in enriched_positions),
            "sale_total": sum(p["sale_total"] for p in enriched_positions),
            "profit": sum(p["profit"] for p in enriched_positions),
        }
        totals["margin"] = (totals["profit"] / totals["sale_total"] * 100) if totals["sale_total"] else None
        progress = round(sum(p["progress"] for p in enriched_positions) / len(enriched_positions)) if enriched_positions else (10 if docs else 0)
        risks = [warning for p in enriched_positions for warning in p["warnings"]]
        return {"work": work, "positions": enriched_positions, "documents": docs, "totals": totals, "progress": progress, "risks": risks, "next_action": next_action(work, positions, docs)}


@app.post("/api/works/{work_id}/positions")
def create_position(work_id: UUID, payload: PositionCreate):
    with Session(engine) as session:
        work = session.get(Work, work_id)
        if not work:
            raise HTTPException(404, "Work not found")
        max_row = session.exec(select(Position.row_no).where(Position.work_id == work_id).order_by(Position.row_no.desc())).first() or 0
        position = Position(
            work_id=work_id,
            row_no=max_row + 1,
            name=payload.name,
            group_name=payload.group_name,
            qty=Decimal(str(payload.qty)),
            unit=payload.unit,
            supplier_id=payload.supplier_id,
            purchase_price=Decimal(str(payload.purchase_price)) if payload.purchase_price is not None else None,
            sale_price=Decimal(str(payload.sale_price)) if payload.sale_price is not None else None,
            production_days=payload.production_days,
            delivery_days=payload.delivery_days,
            shipment_place=payload.shipment_place,
            status=payload.status,
            comment=payload.comment,
        )
        session.add(position)
        session.commit()
        session.refresh(position)
        return position


@app.patch("/api/positions/{position_id}")
def update_position(position_id: UUID, payload: PositionUpdate):
    with Session(engine) as session:
        position = session.get(Position, position_id)
        if not position:
            raise HTTPException(404, "Position not found")
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            if key in {"qty", "purchase_price", "sale_price"} and value is not None:
                value = Decimal(str(value))
            setattr(position, key, value)
        position.updated_at = datetime.now(timezone.utc)
        session.add(position)
        session.commit()
        session.refresh(position)
        return {**position.model_dump(), **calc_position(position)}
