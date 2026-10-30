import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The latest notice, floating over the table's top-right corner where the oval leaves room, so
 * the table never moves when one comes or goes. It covers the "Watching" line while it shows. On
 * small screens it wraps, and may touch the top-right seat's name; it ignores the pointer, so
 * clicks still reach the seats.
 *
 * The toast keeps the last notice's text while it slides out, so screen readers hear each notice
 * from a live region of its own instead.
 */
export function NoticeToast({ notice }: { notice: string | null }) {
  const [shown, setShown] = useState(notice);
  if (notice !== null && notice !== shown) setShown(notice);

  return (
    <>
      <p role="alert" className="sr-only">
        {notice}
      </p>
      <p
        aria-hidden
        className={cn(
          "bg-card text-card-foreground border-ink shadow-hard-sm pointer-events-none absolute top-2 right-5 z-10 max-w-[clamp(14rem,22vw,26rem)] rounded-lg border-[3px] px-3 py-2 text-sm leading-snug font-semibold text-balance transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-opacity",
          notice === null &&
            "translate-x-6 opacity-0 motion-reduce:translate-x-0",
        )}
      >
        {shown}
      </p>
    </>
  );
}
