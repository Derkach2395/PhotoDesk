# Deployment checklist

The repository is structured for deployment, but it is not published automatically. Hosting accounts and environment values must be supplied by the project owner.

## Suggested setup
- Frontend: Vercel or Netlify, build command `npm run build`, output directory `dist`.
- Backend: Render, Railway, or another Python container host, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (adjust the Dockerfile/host settings for the provider).
- Database: managed PostgreSQL instance from the chosen host.

## Publish a portfolio demo with Vercel and Render

The GitHub repository is public, but GitHub does not run the application. To publish a browser-accessible demo:

1. Create a PostgreSQL database in Render and copy its **Internal Database URL**.
2. In Render, create a **Web Service** from `Derkach2395/PhotoDesk`, choose Docker, set the root directory to `backend`, and add `DATABASE_URL` with the database URL. The backend Dockerfile reads Render's `PORT` setting automatically.
3. In Vercel, import the same GitHub repository, set the root directory to `frontend`, build command to `npm run build`, and output directory to `dist`. Add `VITE_API_URL` with the Render API address followed by `/api`, for example `https://your-api.onrender.com/api`.
4. Copy the Vercel site origin (without a trailing slash) into the Render backend's `CORS_ORIGINS` setting, then redeploy the backend. Open the Vercel URL to use the demo.

The API needs a persistent managed database; its local SQLite fallback is only for development. Free Render Postgres databases expire after 30 days, and free web services can sleep while idle. Check the provider's current limits before choosing a plan.

The current MVP has no login or per-user data isolation. Keep it as a demo with sample data: anyone who can reach it can view and change the same records. Add authentication and authorization before entering real client information.

## Required before public use
1. Set `DATABASE_URL` to the managed PostgreSQL connection string.
2. Set `CORS_ORIGINS` to the exact deployed frontend origin(s).
3. Set `VITE_API_URL` to the deployed API base URL ending in `/api`, then rebuild the frontend.
4. Set database credentials through the hosting provider's secret environment variables. Never commit `.env` files or credentials.
5. Add authentication and per-account authorization before exposing real client data. The current MVP is a portfolio demo and does not yet implement login or user isolation.
6. Add Alembic migrations, database backups, and monitoring before production use.

Do not enter real personal/customer information into a public demo until authentication and access control are implemented.
