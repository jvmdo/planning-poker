import { useEffect, useState } from "react";

/** "system" follows the operating system's light or dark setting, and changes with it. */
export type ThemeChoice = "light" | "dark" | "system";

/** Must match the key the inline script in index.html reads before the first paint. */
const STORAGE_KEY = "theme";
const darkQuery = matchMedia("(prefers-color-scheme: dark)");

function loadChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function saveChoice(choice: ThemeChoice) {
  try {
    if (choice === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Private windows can refuse storage; the choice then lasts until reload.
  }
}

function apply(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && darkQuery.matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function useTheme() {
  const [choice, setChoice] = useState(loadChoice);

  useEffect(() => {
    apply(choice);
    if (choice !== "system") return;
    const onChange = () => apply("system");
    darkQuery.addEventListener("change", onChange);
    return () => darkQuery.removeEventListener("change", onChange);
  }, [choice]);

  function choose(next: ThemeChoice) {
    saveChoice(next);
    setChoice(next);
  }

  return [choice, choose] as const;
}
