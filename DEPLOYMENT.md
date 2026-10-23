# Deployment checklist

The repository is structured for deployment, but it is not published automatically. Hosting accounts and environment values must be supplied by the project owner.

## Suggested setup
- Frontend: Vercel or Netlify, build command `npm run build`, output directory `dist`.
- Backend: Render, Railway, or another Python container host, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (adjust the Dockerfile/host settings for the provider).
- Database: managed PostgreSQL instance from the chosen host.

## Required before public use
1. Set `DATABASE_URL` to the managed PostgreSQL connection string.
2. Set `CORS_ORIGINS` to the exact deployed frontend origin(s).
3. Set `VITE_API_URL` to the deployed API base URL ending in `/api`, then rebuild the frontend.
4. Replace development database credentials and never commit secrets.
5. Add authentication and per-account authorization before exposing real client data. The current MVP is a portfolio demo and does not yet implement login or user isolation.
6. Add Alembic migrations, database backups, and monitoring before production use.

Do not enter real personal/customer information into a public demo until authentication and access control are implemented.
