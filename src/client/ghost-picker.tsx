import { useEffect, useId, useRef, useState } from "react";
import { Ghost } from "lucide-react";
import {
  DISGUISES,
  FABRICS,
  randomSkin,
  type Disguise,
  type Fabric,
  type Skin,
} from "../shared/ghost";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FabricSwatch, GhostFigure } from "./ghost-figure";

/** A fabric or disguise to pick. Picked, it turns yellow, and its text stays dark in either theme. */
const OPTION =
  "border-ink focus-visible:ring-ring/50 cursor-pointer outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] aria-pressed:bg-pop-4 aria-pressed:text-[oklch(0.26_0.06_285)] aria-pressed:shadow-hard-sm";

/**
 * An Observer's Ghost button and the Skin picker it opens. Picking a fabric and a disguise only
 * tries them on, in the preview; "Bring out Ghost" or "Wear this" puts them on your Ghost and
 * closes the picker, as does "Vent", which puts it away. Closing it any other way drops what was tried on.
 * It opens on your Ghost's Skin, or the first time on a random one, so one click brings out a Ghost.
 */
export function GhostPicker({
  skin,
  disabled,
  onWear,
  onDismiss,
}: {
  /** Your Ghost's Skin while it's out, or null. */
  skin: Skin | null;
  disabled: boolean;
  /** Brings out your Ghost in this Skin, or re-dresses it. */
  onWear: (skin: Skin) => void;
  onDismiss: () => void;
}) {
  const [open, setOpen] = useState(false);
  /** The Skin last worn, which the picker opens on while no Ghost is out. */
  const [lastWorn, setLastWorn] = useState(randomSkin);
  /** What's being tried on. */
  const [shown, setShown] = useState(lastWorn);
  const wearing =
    skin?.fabric === shown.fabric && skin.disguise === shown.disguise;
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const ids = { panel: useId(), fabric: useId(), disguise: useId() };

  // A click or tap anywhere else closes it.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function toggle() {
    if (!open) setShown(skin ?? lastWorn);
    setOpen(!open);
  }

  function close() {
    setOpen(false);
    button.current?.focus();
  }

  function wear() {
    setLastWorn(shown);
    onWear(shown);
    close();
  }

  return (
    <div
      ref={root}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) close();
      }}
    >
      <Button
        ref={button}
        variant={skin ? "default" : "outline"}
        aria-pressed={skin !== null}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={ids.panel}
        title="Your Ghost"
        onClick={toggle}
        disabled={disabled}
      >
        <Ghost aria-hidden className="size-4" />
        {/* Only the icon on narrow screens, so the status bar still fits. */}
        <span className="max-md:sr-only">Ghost</span>
      </Button>
      {open && (
        <div
          id={ids.panel}
          role="dialog"
          aria-label="Your Ghost"
          className="bg-card text-card-foreground border-ink shadow-hard animate-pop z-50 max-md:fixed max-md:top-[5.25rem] max-md:right-4 md:absolute md:top-full md:right-0 md:mt-2 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 rounded-2xl border-[3px] p-4"
        >
          <div className="flex items-center gap-3">
            <GhostFigure skin={shown} className="h-[70px] w-16 shrink-0" />
            <p className="font-display text-lg leading-tight font-semibold">
              {FABRICS[shown.fabric].name}
              {shown.disguise !== "none" && (
                <span className="text-muted-foreground block text-sm">
                  {DISGUISES[shown.disguise].name}
                </span>
              )}
              <span className="text-muted-foreground block text-xs font-normal">
                {wearing ? "Your Ghost is wearing this" : "Trying on"}
              </span>
            </p>
            {skin && (
              <Button
                variant="outline"
                size="sm"
                aria-label="Vent: put your Ghost away"
                title="Hop in the vent: put your Ghost away"
                onClick={() => {
                  onDismiss();
                  close();
                }}
                className="ml-auto self-start"
              >
                <VentIcon className="size-4" />
                Vent
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <p id={ids.fabric} className="text-sm font-semibold">
              Fabric
            </p>
            <div
              role="group"
              aria-labelledby={ids.fabric}
              className="flex flex-wrap gap-2"
            >
              {(Object.keys(FABRICS) as Fabric[]).map((fabric) => (
                <button
                  key={fabric}
                  type="button"
                  aria-pressed={shown.fabric === fabric}
                  aria-label={FABRICS[fabric].name}
                  title={FABRICS[fabric].name}
                  onClick={() => setShown({ ...shown, fabric })}
                  className={cn(
                    OPTION,
                    "size-10 overflow-hidden rounded-xl border-2 aria-pressed:ring-[3px] aria-pressed:ring-pop-4 aria-pressed:ring-offset-2 aria-pressed:ring-offset-card",
                  )}
                >
                  <FabricSwatch fabric={fabric} className="size-full" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p id={ids.disguise} className="text-sm font-semibold">
              Disguise
            </p>
            <div
              role="group"
              aria-labelledby={ids.disguise}
              className="grid grid-cols-5 gap-1.5"
            >
              {(Object.keys(DISGUISES) as Disguise[]).map((disguise) => (
                <button
                  key={disguise}
                  type="button"
                  aria-pressed={shown.disguise === disguise}
                  onClick={() => setShown({ ...shown, disguise })}
                  className={cn(
                    OPTION,
                    "bg-card flex flex-col items-center min-w-0 rounded-xl border-2 px-0.5 tracking-tight pt-1.5 pb-0.5 text-[0.6rem] font-semibold",
                  )}
                >
                  <GhostFigure
                    skin={{ ...shown, disguise }}
                    className="h-[35px] w-8"
                  />
                  {DISGUISES[disguise].name}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={wear} disabled={wearing}>
            {skin ? "Wear this" : "Bring out Ghost"}
          </Button>
        </div>
      )}
    </div>
  );
}

/** A floor vent's grate, which a Ghost hops into to go away. */
function VentIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      className={className}
    >
      <rect x="1.5" y="3" width="13" height="10" rx="2" strokeWidth="1.6" />
      <path d="M4.5 6 H11.5 M4.5 8 H11.5 M4.5 10 H11.5" strokeWidth="1.3" />
    </svg>
  );
}
