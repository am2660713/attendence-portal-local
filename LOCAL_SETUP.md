# Attendance App Local Setup

This copy is configured for local development.

## Folder
- Frontend: http://localhost:3001
- Backend API: http://localhost:4000/api
- Local database: attendance_app_local
- Allowed local origins: http://localhost:3001, http://localhost:3000

## 1. Install PostgreSQL
Create or use a local PostgreSQL server with these defaults:
- Host: localhost
- Port: 5432
- User: postgres
- Password: postgres

Copy `backend/.env.example` to `backend/.env`. If your local PostgreSQL uses different values, update `backend/.env`.

## 2. Install dependencies
From this folder run:
- `npm install`
- `npm install --prefix backend`
- `npm install --prefix frontend`

## 3. Create the local database
Run:
- `npm run db:create-local --prefix backend`

## 4. Create tables and seed sample employees
Run:
- `npm run seed --prefix backend`

## 5. Start the app
Run:
- `npm run dev`

This starts the backend and frontend together in one terminal; output is prefixed `[backend]` / `[frontend]`. The backend listens on `BACKEND_PORT` (4000), so a `PORT` set in your shell only affects the frontend.

## Cloudflare tunnel
For mobile testing without deployment, you only need one tunnel for the frontend because `/api` is proxied to the local backend.

1. Start the app:
- `npm run dev`

2. Start Cloudflare tunnel:
- `cloudflared tunnel --url http://localhost:3001`

3. Open the generated `https://...trycloudflare.com` URL on mobile.

## Notes
- This local copy does not call Render or Vercel.
- The original folder remains unchanged.
