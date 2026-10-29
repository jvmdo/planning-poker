import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeChoice } from "./lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { choice: ThemeChoice; label: string; Icon: typeof Sun }[] = [
  { choice: "light", label: "Light theme", Icon: Sun },
  { choice: "dark", label: "Dark theme", Icon: Moon },
  { choice: "system", label: "Use the system theme", Icon: Monitor },
];

export function ThemeSwitch() {
  const [theme, setTheme] = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme"
      className="bg-card border-ink inline-flex rounded-full border-2 p-0.5"
    >
      {OPTIONS.map(({ choice, label, Icon }) => (
        <button
          key={choice}
          aria-label={label}
          title={label}
          aria-pressed={theme === choice}
          onClick={() => setTheme(choice)}
          className={cn(
            "rounded-full p-1",
            theme === choice
              ? "bg-foreground text-background"
              : "text-foreground hover:bg-muted",
          )}
        >
          <Icon aria-hidden className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
