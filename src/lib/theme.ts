export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "todo-openspec:theme";
const ATTRIBUTE = "data-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): Theme {
  return typeof matchMedia === "function" && matchMedia(DARK_QUERY).matches
    ? "dark"
    : "light";
}

/** The stored choice if valid, otherwise the system preference. */
export function resolveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

/** Applies a theme to the page without remembering it. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute(ATTRIBUTE, theme);
}

/** Applies a theme and remembers it for later visits. */
export function setTheme(theme: Theme): void {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked or full: the theme still applies for this visit.
  }
}

export function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: [ATTRIBUTE] });
  return () => observer.disconnect();
}

export function getSnapshot(): Theme | null {
  const value = document.documentElement.getAttribute(ATTRIBUTE);
  return isTheme(value) ? value : null;
}

/** The theme is unknown during server rendering. */
export function getServerSnapshot(): Theme | null {
  return null;
}

/**
 * Runs in <head> before first paint, mirroring resolveTheme(). Storage errors
 * fall back to the system preference; any other failure leaves the attribute
 * unset so the CSS prefers-color-scheme fallback applies.
 */
export const themeInitScript = `(function(){try{var t=null;try{t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})}catch(e){}if(t!=="light"&&t!=="dark"){t=matchMedia(${JSON.stringify(
  DARK_QUERY,
)}).matches?"dark":"light"}document.documentElement.setAttribute(${JSON.stringify(
  ATTRIBUTE,
)},t)}catch(e){}})()`;
