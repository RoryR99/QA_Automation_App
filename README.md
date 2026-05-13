# QA Auto Project MVP

This app helps a quality assurance team record production checks during a beverage packaging run. The frontend is a Vite/React app, and the backend is now a set of Vercel-compatible `/api` routes backed by Supabase.

## Current stack

- `React` + `TypeScript` + `Vite` for the UI
- `@tanstack/react-query` for frontend data fetching
- `Jotai` for lightweight client state
- `Tailwind CSS` for styling
- `@supabase/supabase-js` for database access
- Vercel-style serverless API handlers in [`api/`](</C:/Users/rory.rampersad/Downloads/QA AUTO PROJECT/api>)

## Project structure

```text
src/
  app/                 Frontend layout, providers, router
  components/          Reusable UI pieces
  data/                Fallback seed data
  hooks/               React Query hooks
  lib/                 Shared utilities and Supabase client
  pages/               Main app screens
  services/            Frontend API calls
  types/               Shared TypeScript types

api/
  _lib/                Shared serverless helpers
  *.ts                 Vercel API route handlers
```

## Environment variables

Copy the values from [`.env.example`](</C:/Users/rory.rampersad/Downloads/QA AUTO PROJECT/.env.example>) into your Vercel project or local environment.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (optional, recommended when writes are protected by RLS)
- `VITE_API_BASE_URL` (optional override for local development)

Create the required Supabase tables with [supabase/schema.sql](</C:/Users/rory.rampersad/Downloads/QA AUTO PROJECT/supabase/schema.sql>).

## API routes

- `GET /api/user`
- `GET /api/production-runs`
- `POST /api/production-runs`
- `GET /api/beverage-quality-measurements`
- `GET /api/inspections`
- `POST /api/inspections`

## Local development

Install dependencies:

```powershell
npm.cmd install
```

Run the frontend:

```powershell
npm.cmd run dev
```

Build for production:

```powershell
npm.cmd run build
```

For full-stack local testing, run the app with a serverless-compatible dev environment such as `vercel dev`, or set `VITE_API_BASE_URL` to a deployed API base URL.
