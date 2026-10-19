import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "smartserve-theme";

/**
 * Reads the theme that is already applied to <html>.
 *
 * The inline script in index.html sets data-theme before React mounts,
 * so this never has to guess — it just reports what is already on the
 * page, which is what keeps the first paint from flashing.
 */
function readInitialTheme() {
  if (typeof document === "undefined") return "light";

  const applied = document.documentElement.getAttribute("data-theme");
  if (applied === "light" || applied === "dark") return applied;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Private browsing / storage disabled — fall through to the system value.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function useTheme() {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Nothing to do — the theme still applies for this session.
    }
  }, [theme]);

  // Follow the OS only while the visitor hasn't made a choice of their own.
  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setTheme(e.matches ? "dark" : "light");

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme, setTheme };
}