## Goal

Let you connect your Hevy Pro account in the app, pull your Hevy workouts into the Workouts page, and estimate calories burned from actual training data (kg lifted × reps, set volume, and session duration).

## How the Hevy connection works

Hevy's public API is Pro-only and uses a personal API key you generate at hevy.com/settings?developer. Each app user pastes their own key once; the app stores it server-side and never exposes it to the browser.

## What gets built

**1. Backend storage**
- New `hevy_connections` table: `user_id`, `api_key`, `username`, `last_synced_at`, timestamps. RLS so a user only sees their own row; the key column is only read by backend functions.
- New `hevy_workouts` table (cached sync): `user_id`, `hevy_id`, `title`, `start_time`, `end_time`, `duration_minutes`, `total_volume_kg`, `total_reps`, `total_sets`, `calories_estimate`, `exercises` (JSON). Unique on (`user_id`, `hevy_id`) so re-syncing updates instead of duplicating.

**2. Edge functions**
- `hevy-connect` — validates the pasted key against `GET /v1/user/info`, saves it, returns the Hevy username.
- `hevy-status` — returns whether connected + username + last sync.
- `hevy-disconnect` — deletes the stored key.
- `hevy-sync` — pages `GET /v1/workouts`, computes volume/reps/sets and the calorie estimate per workout, upserts into `hevy_workouts`.

**3. Calorie estimator (from real Hevy data)**

Per workout, using your profile body weight (falls back to 70 kg):

```text
duration_min   = end_time - start_time
volume_kg      = sum over sets of (weight_kg x reps)
metabolic_kcal = MET(strength=5.0) x 3.5 x bodyweight / 200 x duration_min
work_kcal      = volume_kg x 0.5 m x 9.81 / 4184 / 0.22 efficiency  (~0.0053 kcal per kg-rep)
bodyweight_reps (no external load) counted at 0.35 x bodyweight per rep
total_kcal     = metabolic_kcal + work_kcal
```

Cardio-style Hevy entries (duration/distance sets, no weight) use their own MET instead of the lifting bonus. Existing `src/lib/calories.ts` is extended with a `estimateCaloriesFromVolume()` helper so the same math is reusable and unit-testable.

**4. UI**
- Profile menu: a "Hevy" section next to Strava — Connect (dialog to paste the API key with a link to where to get it), shows connected username, Sync now, Disconnect.
- Workouts page: a "Hevy" source block styled like the existing Strava activities list — cards with title, date, duration, sets/reps, total volume in kg, and the estimated kcal. Today's Hevy workouts feed the Today section and the daily burn total, same as Strava does now; older ones show in history.
- Progress page burn/net-calorie charts include Hevy calories.

## Technical notes

- Hevy auth header is `api-key: <key>`; base URL `https://api.hevyapp.com`. All calls happen in edge functions (CORS-restricted and key never leaves the server).
- Sync is manual (button) plus automatic on Workouts page load if last sync is older than 15 minutes.
- The API key is stored per user in the database rather than as a project secret, so multiple users can each connect their own Hevy account.

## What I need from you

Your Hevy API key isn't needed by me to build this — you'll paste it in the app UI after it ships. If you'd rather it be a single hardcoded project-wide key instead of per-user, say so and I'll swap the storage for a secret.
