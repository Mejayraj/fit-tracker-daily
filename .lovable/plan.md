
# Connect Strava to Get Fit

Strava isn't a built-in Lovable connector, and each user needs to link **their own** Strava account (not the developer's). This requires a standard per-user OAuth 2.0 flow with Strava.

## What the user will see

In the profile dropdown (top-right avatar), a new **"Strava"** section:
- If not connected: a **"Connect Strava"** button with the orange Strava branding.
- If connected: shows the linked Strava athlete name + a **"Disconnect"** button.
- Connection status persists across sessions and devices.

## What you (the user) need to do once

Strava requires you to register an API application to get a Client ID and Client Secret:
1. Go to https://www.strava.com/settings/api and create an app.
2. Set **Authorization Callback Domain** to your app domain (e.g. `getfitwithmj.lovable.app`).
3. Copy the **Client ID** and **Client Secret** — I'll request them as secrets when we implement.

## Technical plan

### 1. Database
New table `strava_connections` (one row per user) with RLS so each user only sees their own:
- `user_id`, `athlete_id`, `athlete_firstname`, `athlete_lastname`
- `access_token`, `refresh_token`, `expires_at`, `scope`
- timestamps

Tokens stored server-side only; never exposed to the browser.

### 2. Secrets
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`

### 3. Edge functions
- `strava-oauth-start` — builds Strava authorize URL with state, returns it to the client.
- `strava-oauth-callback` — exchanges `code` for tokens, fetches athlete profile, upserts row, redirects user back to `/?strava=connected`.
- `strava-disconnect` — deletes the row and calls Strava's deauthorize endpoint.
- `strava-status` — returns whether the current user is connected and their Strava name.

(Optional later: `strava-sync-activities` to pull workouts into the `workouts` table.)

### 4. Frontend
- Extend `ProfileMenu.tsx` with a Strava section that calls `strava-status` on open and shows connect/disconnect UI.
- Handle the `?strava=connected` query param after redirect to show a success toast.

## Scope

This plan covers **only connecting the account** (OAuth + status + disconnect). Importing Strava activities into workouts/progress is a natural follow-up but not included here — let me know if you want it bundled in.
