# Edit Goals section on Me page

## What to build

Add a compact, collapsible "Daily Goals" card on the Me page (`src/pages/Profile.tsx`), placed between the Hevy connection card and the Progress section.

## Behaviour

- Collapsed by default: a slim card showing the current calorie goal and macro goals (P / C / F) with a small "Edit" affordance.
- Tap to expand: reveals four numeric inputs — Daily calories, Protein (g), Carbs (g), Fat (g) — prefilled with the user's current goals, plus Save and Cancel buttons.
- Save validates (calories 500–10000, macros 0–1000), upserts to the `profiles` table (columns `calorie_goal`, `protein_goal`, `carb_goal`, `fat_goal` — all already exist with defaults), shows a success toast, and collapses back.
- The card springs open/closed smoothly and stays small so it uses minimal screen space.

## Impact on the rest of the app

- Verify the Home dashboard reads calorie/macro goals from `profiles`; if it caches them, trigger a refetch after saving (e.g. re-load on mount/focus) so the calorie ring and macro bars reflect the new goals immediately.

## Technical notes

- No database migration needed — the goal columns already exist on `profiles` with row-level security scoped to the owner.
- New code: a `GoalsCard` component (in Profile.tsx or `src/components/GoalsCard.tsx`) using existing Card/Input/Button UI, `supabase.from("profiles").update(...)`, and the existing toast + glass styling conventions.
