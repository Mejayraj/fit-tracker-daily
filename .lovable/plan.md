## Goal
Remove the Dashboard's "Log Workout" / "Log Meal" header buttons and replace the wide quick-action bar with two small circular glass buttons floating above the bottom-right of the nav bar.

## 1. Dashboard (`src/pages/Dashboard.tsx`)
- Delete the header row containing the "Log Workout" and "Log Meal" buttons.
- Remove the now-unused `Button` import and any unused icon imports (`Plus`, etc.).

## 2. QuickActionBar (`src/components/QuickActionBar.tsx`)
- Replace the full-width pill bar with two circular buttons:
  - Size ~52×52px, `border-radius: 50%`.
  - Glass style: `rgba(255,255,255,0.06)` background, `blur(16px) saturate(180%)`, `1px solid rgba(255,255,255,0.10)`, subtle shadow.
  - Icons only, no labels: `UtensilsCrossed` (Log Meal) and `Dumbbell` (Log Workout) in neon green `#39FF14`.
- Position: fixed, `right: 16px`, `bottom: calc(90px + env(safe-area-inset-bottom))` so they sit just above the nav bar, roughly over the Train / Me tabs. 12px gap between the two buttons (stacked vertically or side-by-side row anchored right — side-by-side row to match reference).
- Keep existing behavior: Log Meal routes to /food and opens the add-food sheet; Log Workout opens `LogExerciseSheet`.
- Keep the mount spring-in animation already on the bar.

## 3. Cleanup
- Verify no other page still renders its own FAB (previously removed); nothing else changes.
