/**
 * Light / dark theme. The choice lives on <html data-theme> — set before first
 * paint by THEME_SCRIPT (no flash) and changed by the header toggle. Without a
 * saved choice the site follows the visitor's system setting, live.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "gilvero-admin-theme";

/** Inlined in <head>; must stay dependency-free. */
export const THEME_SCRIPT = `(function(){try{var d=document.documentElement,t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";d.dataset.theme=t}catch(e){}})()`;

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/** Explicit choice from the toggle; remembered for next visits. */
export function setTheme(theme: Theme) {
  apply(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode / blocked storage: the choice just lasts for this page.
  }
}

/** useSyncExternalStore subscription: fires on toggles and on system changes (when no saved choice). */
export function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const media = matchMedia("(prefers-color-scheme: light)");
  const onSystem = () => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {}
    if (saved !== "light" && saved !== "dark") apply(media.matches ? "light" : "dark");
  };
  media.addEventListener("change", onSystem);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onSystem);
  };
}
