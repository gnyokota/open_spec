"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

import {
  applyTheme,
  getServerSnapshot,
  getSnapshot,
  resolveTheme,
  setTheme,
  subscribe,
} from "@/lib/theme";

import styles from "./ThemeToggle.module.css";

const labels = {
  light: "Switch to dark theme",
  dark: "Switch to light theme",
} as const;

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // In development, Strict Mode's remount can clear the attribute the init
  // script set on <html>; re-apply it. A no-op in production.
  useLayoutEffect(() => {
    if (getSnapshot() === null) applyTheme(resolveTheme());
  }, []);

  function toggle() {
    const current = getSnapshot() ?? resolveTheme();
    setTheme(current === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-label={theme ? labels[theme] : "Toggle theme"}
      onClick={toggle}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
