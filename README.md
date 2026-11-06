# Addis Journal

A full-stack blog application with a FastAPI backend and React/Vite frontend.

## Features

- User registration, login, logout, and JWT authentication
- Public and scheduled blog posts with search, categories, and tags
- Markdown post creation, editing, publishing, drafts, deletion, and image uploads
- Profile management, comments, and post likes
- User dashboards with publishing controls and administrator user management
- Local SQLite storage in development
- Automatic API documentation through FastAPI

## Requirements

- Python 3.11+
- Node.js 20+
- npm

## Project Structure

```text
backend/   FastAPI application, database, migrations, and tests
frontend/  React, TypeScript, and Vite application
docs/      Architecture documentation
```

## Backend Setup

From the repository root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend provides:

- API: `http://127.0.0.1:8000/api/v1`
- Health check: `http://127.0.0.1:8000/health`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

If the virtual environment already exists, activate it and run the migrations and server directly:

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## Frontend Setup

Open a second terminal from the repository root:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Vite normally opens the site at `http://localhost:5173`. If that port is occupied, Vite will use the next available port, such as `5174`.

The frontend API URL is configured in `frontend/.env`:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

## Local Development Configuration

The backend defaults to a local SQLite database at `backend/blog.db`.

Important backend settings can be placed in `backend/.env`:

```dotenv
APP_NAME=Addis Journal
ENVIRONMENT=development
DEBUG=true
DATABASE_URL=sqlite:///./blog.db
JWT_SECRET=replace-with-a-long-random-secret
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

`CORS_ORIGINS` is a comma-separated list. Development CORS is also configured to allow any localhost or 127.0.0.1 origin with an optional port, so Vite can run on ports other than 5173.

## Useful Commands

### Backend

```bash
cd backend
pytest -q
alembic upgrade head
alembic revision --autogenerate -m "describe change"
```

### Frontend

```bash
cd frontend
npm test
npm run build
npm run lint
npm run dev
```

## Troubleshooting

### Address already in use on port 8000

The backend is already running on `127.0.0.1:8000`. Check listening processes with:

```bash
ss -ltnp 'sport = :8000'
```

Reuse the running server instead of starting a second copy. To stop it, terminate the listed process by its PID.

### Frontend cannot call the backend

Confirm both services are running:

- Backend: `http://127.0.0.1:8000/health`
- Frontend: the URL printed by `npm run dev`

Check `frontend/.env` and make sure `VITE_API_URL` points to the backend. Restart Vite after changing `.env`.

### CORS error from a different Vite port

CORS permits local development origins by hostname and optional port. Restart the backend after CORS configuration changes. For browser requests, keep the API origin and protocol consistent with `VITE_API_URL`.

## Architecture

See [Phase 1 architecture](docs/PHASE1_ARCHITECTURE.md) for the system and API design.
