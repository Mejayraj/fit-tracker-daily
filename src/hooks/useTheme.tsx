import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeName = "neon" | "dark" | "light" | "custom";

type Ctx = {
  theme: ThemeName;
  hue: number;
  setTheme: (t: ThemeName) => void;
  setHue: (h: number) => void;
};

const ThemeCtx = createContext<Ctx | null>(null);
const KEY_T = "fittrack.theme";
const KEY_H = "fittrack.hue";
const CLASSES = ["theme-neon", "theme-dark", "theme-light", "theme-custom"];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(
    () => (localStorage.getItem(KEY_T) as ThemeName) || "neon"
  );
  const [hue, setHueState] = useState<number>(
    () => Number(localStorage.getItem(KEY_H)) || 200
  );

  useEffect(() => {
    const body = document.body;
    CLASSES.forEach((c) => body.classList.remove(c));
    body.classList.add(`theme-${theme}`);
    body.style.setProperty("--custom-hue", String(hue));
    localStorage.setItem(KEY_T, theme);
    localStorage.setItem(KEY_H, String(hue));
  }, [theme, hue]);

  return (
    <ThemeCtx.Provider value={{ theme, hue, setTheme: setThemeState, setHue: setHueState }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}