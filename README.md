# PhotoDesk

PhotoDesk is a photography studio workspace for managing clients, photo sessions, bookings, and payments. It includes a responsive React dashboard and a FastAPI service backed by PostgreSQL.

> Portfolio demo: the app is an MVP with sample data. It does not include authentication or access controls, so do not enter real client information.

## Features

- Studio dashboard with client, booking, revenue, and outstanding balance summaries
- Client directory with search and create-client flow
- Booking list with status updates and deletion
- Payment tracking endpoints and a finance overview
- Responsive interface in Ukrainian
- FastAPI interactive API documentation at `/docs`
- PostgreSQL database with Docker Compose

## Run locally

### Requirements

- Docker Desktop with Docker Compose
- Node.js 20 or later and npm

### Start the API and database

From the project root, create your local environment file and set a unique database password before the first start:

```bash
cp .env.example .env
docker compose up --build
```

In PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Docker Compose reads `.env` automatically. The `.env` file is ignored by Git; keep real credentials there and never commit it. Use a URL-safe password (letters, numbers, `_` or `-`) for the local Compose database URL.

The API runs at <http://localhost:8000>. Open <http://localhost:8000/docs> for the interactive API documentation. On first start, the app creates its tables and adds sample records.

### Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

To point the frontend at another API, copy `frontend/.env.example` to `frontend/.env.local` and set `VITE_API_URL` to the API URL ending in `/api`.

## Run backend tests

With Python 3.11 or later:

```bash
cd backend
python -m venv .venv
```

Activate the environment (`.venv\\Scripts\\Activate.ps1` in PowerShell, or `source .venv/bin/activate` on macOS/Linux), then run:

```bash
pip install -r requirements.txt
pytest
```

## Project structure

```text
backend/    FastAPI application, SQLAlchemy models, and API tests
frontend/   React + TypeScript application built with Vite
docker-compose.yml
```

## Configuration and deployment

Local environment examples are in `.env.example` and `frontend/.env.example`. Docker Compose reads database credentials and CORS origins from the ignored local `.env` file. See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting configuration and the production readiness checklist.

## Tech stack

React · TypeScript · Vite · FastAPI · SQLAlchemy · PostgreSQL · Docker Compose
