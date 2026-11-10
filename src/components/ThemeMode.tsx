"use client";

import { createContext, useContext, useLayoutEffect, useState } from "react";

const STORAGE_KEY = "theme";

type ThemeModeValue = {
  dark: boolean;
  toggle: () => void;
};

const ThemeModeContext = createContext<ThemeModeValue | null>(null);

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
}

export function ThemeMode({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useLayoutEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) === "dark";
    document.documentElement.classList.toggle("dark", stored);
    setDark(stored);
  }, []);

  function toggle() {
    setDark((current) => {
      const next = !current;
      applyTheme(next);
      return next;
    });
  }

  return <ThemeModeContext.Provider value={{ dark, toggle }}>{children}</ThemeModeContext.Provider>;
}

export function DarkModeButton() {
  const theme = useContext(ThemeModeContext);
  if (!theme) return null;

  return (
    <button
      type="button"
      onClick={theme.toggle}
      aria-pressed={theme.dark}
      className="white-button shrink-0 rounded border border-border bg-surface px-3 py-1 text-xs text-foreground"
    >
      {theme.dark ? "Dark Mode On" : "Dark Mode"}
    </button>
  );
}
