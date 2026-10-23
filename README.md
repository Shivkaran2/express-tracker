# Expense Tracker

A full-stack expense tracker built with **Next.js**, **FastAPI**, and **SQLite**. Create spending categories, record expenses, and view category counts and spending summaries.

## Features

- Create categories and prevent duplicate names.
- Add expenses linked to an existing category.
- View expenses with their category and date.
- View the number of expenses in each category.
- View total spending, expense count, and average expense amount.
- Validate category names, expense titles, and positive amounts.
- Store data in a local SQLite database.

## Tech stack

- Frontend: Next.js, React, TypeScript
- Backend: FastAPI, SQLAlchemy
- Database: SQLite

## Project structure

```text
expense-tracker/
├── backend/
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   └── expenses.db
└── frontend/
    └── app/
```

## Requirements

- Python 3.12
- Node.js and npm

## Run locally

Start the backend and frontend in **separate terminals**.

### 1. Start the backend

From the project root:

```bash
cd backend
./venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at <http://localhost:8000>. Interactive API documentation is at <http://localhost:8000/docs>.

### 2. Start the frontend

In a second terminal, from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000> in your browser.

To use the app from another device on the same network, open the frontend using your computer’s LAN IP address, for example `http://192.168.1.71:3000`. The backend must also be running, and your firewall must allow access to port `8000`.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/categories` | Create a category |
| `GET` | `/categories` | List categories and their expense counts |
| `POST` | `/expenses` | Create an expense |
| `GET` | `/expenses` | List expenses with category names |
| `GET` | `/summary` | Return total spending, count, and average |

### Example: create a category

```json
{
  "name": "Food"
}
```

### Example: create an expense

```json
{
  "title": "Lunch",
  "amount": 250.5,
  "category_id": 1
}
```

## Database

SQLite data is stored in `backend/expenses.db`. The backend uses this project-relative database path regardless of the directory from which it is started.

## Validation

- Category names must not be blank or duplicated.
- Expense titles must not be blank.
- Expense amounts must be greater than zero.
- An expense must reference an existing category.
