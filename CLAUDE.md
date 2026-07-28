# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Backend** (from `backend/`):
- `npm run dev` — starts Express server with nodemon on port 5000
- `npm start` — production start
- `npm run init-db` — initialize database via `scripts/init-db.js`

**Frontend** (from `frontend/`):
- `npm start` or `npm run dev` — starts Create React App dev server on port 3000
- `npm run build` — production build
- `npm test` — runs react-scripts test (interactive watch mode)

**Environment variables:**
- Backend `.env`: `PORT`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`
- Frontend `.env`: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, `REACT_APP_API_URL`
- Frontend also supports Vite-style env vars (`VITE_SUPABASE_URL`, etc.) via `supabaseClient.js` fallback

## Architecture

### Monorepo Layout
- `backend/` — Express API server, also deployable as a single Vercel serverless function via `api/index.js`
- `frontend/` — React 18 SPA (Create React App, not Vite despite README mention)
- `database/` — SQL schema files for manual Supabase setup (not auto-migrated)

### Backend (`backend/server.js`)
Single-file Express server. All routes are defined in `server.js` — there is no router/controller separation. The Vercel entry point `api/index.js` is a copy of the same logic for serverless deployment.

**Auth pattern:** `getUserId(req)` extracts user ID from `x-user-id` header, query param, or body field, falling back to a hardcoded demo UUID. `getAuthenticatedSupabase(req)` returns the admin Supabase client (service role key) if available, otherwise creates a JWT-scoped client from the Authorization header.

**AI providers:** Groq (Llama 3.3 70B) is primary for text coaching; Gemini is fallback. For vision (InBody scan extraction), Groq Vision (Llama 4 Scout) is primary; Gemini 1.5 Flash is fallback. Both use a cascade pattern: try primary, catch error, fall through to next.

**Key Supabase tables:** `weight_logs`, `meals`, `workout_plans`, `workout_logs`, `water_logs`, `personal_records`, `inbody_scans`, `community_programs`, `profiles`

### Frontend
**Routing:** Manual page-switching via `activePage` state in `App.jsx` — no React Router. Pages are mapped in the `PAGES` object. Navigation is done via `onNavigate` prop callback.

**State management:** React Context for auth (`AuthContext`) and profile display name (`ProfileContext`). No Redux or other state library. Each page manages its own data fetching.

**API layer:** `frontend/src/utils/api.js` — Axios instance with interceptors that automatically attach Supabase JWT and `x-user-id` header. Exports domain-specific API objects (`weightAPI`, `mealsAPI`, `inbodyAPI`, etc.).

**Supabase client:** `frontend/src/utils/supabaseClient.js` — used directly for auth (login/signup/session), not for data queries (those go through the backend API).

**Theming:** CSS-based multi-theme system (`stone`, `ocean`, `purple`). Theme class set on `document.body` and persisted in localStorage under `gym-theme`.

**Shared component:** `DeleteButton.jsx` provides standardized delete UX with confirmation across all modules.

### Deployment
Optimized for Vercel. Backend uses `vercel.json` with a rewrite rule routing all `/api/*` requests to `api/index.js`. When updating backend routes in `server.js`, the `api/index.js` serverless entry point must be kept in sync.

### Database
SQL files in `database/` are applied manually to Supabase. All tables use row-level security (RLS) with `user_id` scoping. The `inbody_scans` table stores segmental muscle/fat data in a `segment_data` JSONB column.
