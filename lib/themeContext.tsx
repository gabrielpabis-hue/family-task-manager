"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "light" | "dark" | "auto";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "auto",
  setTheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("auto");
  const [isDark, setIsDark] = useState(false);

  // Read saved theme from localStorage on mount
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) ?? "auto";
    setThemeState(saved);
  }, []);

  // Apply dark class to <html> whenever theme changes
  useEffect(() => {
    function applyDark(dark: boolean) {
      document.documentElement.classList.toggle("dark", dark);
      setIsDark(dark);
    }

    if (theme === "dark") {
      applyDark(true);
      return;
    }
    if (theme === "light") {
      applyDark(false);
      return;
    }
    // auto – follow system
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    applyDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => applyDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("theme", t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
