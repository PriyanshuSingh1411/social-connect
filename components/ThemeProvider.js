"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, isDark: theme === "dark" }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // ThemeProvider deliberately doesn't supply this context until
    // after mount (see the `mounted` check above) to avoid a
    // server/client hydration mismatch on the localStorage-derived
    // theme. That means any consumer — including Next.js's own
    // static-generation pass, and every real user's very first paint
    // before the effect fires — sees `context === undefined` for one
    // brief window. Failing soft with safe defaults here, rather than
    // throwing, means that window is invisible instead of a crash.
    return { theme: "light", toggleTheme: () => {}, isDark: false };
  }
  return context;
};
