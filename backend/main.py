
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import Base, engine, get_db
from models import Category, Expense

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"http://192\.168\.\d{1,3}\.\d{1,3}:3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ExpenseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    category_id: int = Field(gt=0)


@app.get("/")
def home():
    return {"message": "Expense Tracker API is running"}


@app.post("/categories")
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    name = data.name.strip()

    if not name:
        raise HTTPException(status_code=400, detail="Category name is required")

    existing = db.query(Category).filter(
        func.lower(Category.name) == name.lower()
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="Category already exists")

    category = Category(name=name)
    db.add(category)
    db.commit()
    db.refresh(category)

    return {"id": category.id, "name": category.name}


@app.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()

    return [
        {
            "id": category.id,
            "name": category.name,
            "total_expenses": len(category.expenses),
        }
        for category in categories
    ]


@app.post("/expenses")
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db)):
    title = data.title.strip()

    if not title:
        raise HTTPException(status_code=400, detail="Title is required")

    category = db.query(Category).filter(
        Category.id == data.category_id
    ).first()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    expense = Expense(
        title=title,
        amount=data.amount,
        category_id=data.category_id,
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return {
        "id": expense.id,
        "title": expense.title,
        "amount": expense.amount,
        "category_id": expense.category_id,
        "created_at": expense.created_at.isoformat(),
    }


@app.get("/expenses")
def list_expenses(db: Session = Depends(get_db)):
    expenses = db.query(Expense).order_by(
        Expense.created_at.desc()
    ).all()

    return [
        {
            "id": expense.id,
            "title": expense.title,
            "amount": expense.amount,
            "category": expense.category.name,
            "created_at": expense.created_at.isoformat(),
        }
        for expense in expenses
    ]


@app.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total, count = db.query(
        func.coalesce(func.sum(Expense.amount), 0),
        func.count(Expense.id),
    ).one()

    return {
        "total": float(total),
        "count": count,
        "average": round(float(total) / count, 2) if count else 0,
    }
