# Tabula Platform

Tabula is a debate tabulation and survey administration platform built with React, Vite, Express, and Supabase.

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and provide the values below.

3. Start the full application server:

   ```bash
   npm run dev
   ```

Open `http://localhost:3000`. The Express server owns `/api/*` and Vite serves the React application through the same process.

Useful checks:

```bash
npm run lint
npm run build
```

## Environment variables

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are browser-visible values and are safe only when protected by Supabase RLS.

`SUPABASE_URL` may be used by the server. `SUPABASE_SERVICE_ROLE_KEY` is server-only, bypasses RLS, and must never use a `VITE_` prefix or be committed to source control. Rotate it immediately if it has been exposed.

`OPEN_ROUTER_API_KEY` and `OPEN_ROUTER_MODEL` are server-only. The default model is `openai/gpt-4o-mini`; choose an OpenRouter-supported model appropriate for your account. `APP_URL` should contain the deployed application URL when password-reset links or callbacks depend on it.

## Authentication and authorization

- Supabase Auth authenticates users.
- `public.profiles.id` must equal `auth.users.id`.
- Profiles use the exact roles `Super Admin`, `Organization Admin`, `Organizer`, `Judge`, `Participant`, and `Viewer`.
- The client hides navigation that a role cannot use, but this is only a usability layer.
- `ProtectedRoute` silently redirects unauthorized routes to `/dashboard`; it does not reveal role names or permission rules.
- Express checks the active session role again for privileged writes and AI/survey operations.
- Super Admin is the only role allowed to provision accounts, assign Super Admin, view all profiles, view the role matrix, or view audit logs.
- Non-Super Admin profile reads are restricted to the authenticated profile.

## Supabase setup

Run `supabase_schema.sql` in the Supabase SQL Editor. Confirm that:

1. The Auth user exists.
2. A matching `profiles` row exists with the Auth UUID as `id`.
3. The profile has an organization and an allowed role.
4. Table grants and RLS policies from the schema have been applied.

Never solve a permission error by exposing the service-role key to the browser. Fix the database grants, RLS policies, or server-side access instead.

## Vercel deployment

This repository includes `api/index.ts` and `vercel.json` so Vercel can serve the Express API as a serverless function and the Vite output as static assets.

In Vercel project settings:

- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

Add the environment variables in Vercel for the Production, Preview, and Development environments as appropriate. Do not commit `.env`, Supabase service keys, or API keys.

After deployment, verify:

```text
GET /api/health
POST /api/auth/login
GET /api/organization without a token -> 401
GET /api/users as Judge -> only the authenticated profile
GET /api/admin/roles as Judge -> no page is disclosed; client redirects
```

Production API requests validate Supabase access tokens directly, so authentication does not depend on the process-local development session map. Keep the Supabase service-role key server-only.

## Security checklist before launch

- Rotate any Supabase service-role key or OpenRouter key that has appeared in logs, chat, screenshots, or a committed file.
- Confirm `.env` is ignored by Git.
- Test every protected route with each role and test the API directly, not only through the browser.
- Confirm all organization queries enforce organization ownership and do not return another organization’s records.
- Keep rate limiting and monitoring enabled at the deployment edge for login, password reset, and AI endpoints.
- Disable verbose authentication/database errors in production responses and keep details in server logs only.
- Review Supabase RLS policies after every schema change.
