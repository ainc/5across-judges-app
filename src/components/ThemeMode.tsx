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

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9.53 1.72a.75.75 0 0 1 .16.82A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.46-.69.75.75 0 0 1 .98.98 10.5 10.5 0 0 1-9.69 6.46c-5.8 0-10.5-4.7-10.5-10.5 0-4.37 2.67-8.11 6.46-9.7a.75.75 0 0 1 .82.17z"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.1 5.1l1.8 1.8M17.1 17.1l1.8 1.8M18.9 5.1l-1.8 1.8M6.9 17.1l-1.8 1.8" />
      </g>
    </svg>
  );
}

export function DarkModeButton() {
  const theme = useContext(ThemeModeContext);
  if (!theme) return null;

  const label = theme.dark ? "Light Mode" : "Dark Mode";

  return (
    <button
      type="button"
      onClick={theme.toggle}
      aria-pressed={theme.dark}
      aria-label={label}
      className="group relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground"
    >
      {theme.dark ? <SunIcon /> : <MoonIcon />}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-[#111827] px-2 py-1 text-xs font-normal text-white opacity-0 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}
