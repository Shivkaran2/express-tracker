
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)

    expenses = relationship("Expense", back_populates="category")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False
    )
    created_at = Column(DateTime, default=datetime.now, nullable=False)

    category = relationship("Category", back_populates="expenses")
