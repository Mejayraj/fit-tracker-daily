## Goal
Visual-only redesign to a mobile-first "liquid glass" look. No changes to Strava/Hevy sync, food logging, barcode scanner, exercise library, or any data logic.

## 1. Design tokens (`src/index.css`)
- Default (neon) theme: background pure black, subtle top-left radial `rgba(57,255,20,0.04)` glow only, remove the purple bottom-right glow.
- Set primary to neon green `#39FF14` (as HSL), accent aligned to the same green family.
- Add reusable utilities:
  - `.glass-card` — `background: rgba(255,255,255,0.04)`, `backdrop-filter: blur(16px)`, `1px solid rgba(255,255,255,0.08)`, radius 20px, padding 20px.
  - `.glass-nav` — `rgba(15,15,15,0.6)`, `blur(20px)`, radius 40px, `1px solid rgba(255,255,255,0.08)`, `0 8px 32px rgba(0,0,0,0.4)`.
- Light/dark/custom themes keep working (glass values derived from tokens so they don't look broken).

## 2. Layout (`src/components/AppLayout.tsx`)
- Delete the desktop sidebar, desktop top bar, and mobile top bar (logo removed everywhere in-app; login page logo stays).
- `main`: `padding-top: 60px`, `padding-bottom: 100px`, full-width with a `max-w-lg mx-auto` centering so it still reads well on desktop.
- New floating bottom nav component: fixed bottom, 16px margins all around, pill shape, glass styling, 6 items with icon + small label:
  Dashboard · Nutrition · Workouts · Exercise · Progress · Profile.
  Active item gets a neon-green tinted pill background behind icon+label. Labels shrink to ~10px so 6 fit on a 393px screen.

## 3. Page headers
Each page renders only its functional name, bold white ~28px, top-left:
Dashboard, Nutrition, Workouts, Exercise, Progress, Profile. Existing subtitles/date lines kept where they add value.

## 4. Dashboard (`src/pages/Dashboard.tsx`)
- Floating avatar top-right: 48×48 circle, 2px `#39FF14` ring, drop shadow, initials or profile picture. Tapping it opens the existing ProfileMenu dropdown (unchanged functionality).
- Header becomes "Dashboard" title with the "Hi, {name}" greeting as the subline.
- All cards (calorie ring, macros, meals, workouts) converted to `.glass-card`.

## 5. New Profile page (`/profile`)
- New route + page reusing everything already in `ProfileMenu`: account info, theme picker (dark / light / custom hue), Strava connect/disconnect, Hevy connect/sync, sign out — rendered as glass cards instead of dropdown items.
- `ProfileMenu` dropdown stays for the dashboard avatar; shared logic extracted so both stay in sync.

## 6. Other pages
Nutrition (Food), Workouts, Exercise, Progress: swap `Card` usages for glass styling, apply the new header, keep every tab/dialog/feature as is.

## Technical notes
- Nav item list lives in one place and is consumed by the bottom nav.
- Cards keep shadcn `Card` but with a `glass` class applied so existing markup and props stay intact.
- Backdrop-filter fallback: solid `rgba(15,15,15,0.9)` where blur is unsupported.
