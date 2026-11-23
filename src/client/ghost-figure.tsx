import { useId, type ReactNode } from "react";
import type { Fabric, Skin } from "../shared/ghost";

/** Each fabric's pattern: one tile of it, and how to lay the tiles. */
const FABRIC_PATTERNS: Record<
  Fabric,
  { width: number; height: number; transform?: string; tiles: ReactNode }
> = {
  "coral-stripes": {
    width: 7,
    height: 7,
    transform: "rotate(45)",
    tiles: (
      <>
        <rect width="7" height="7" style={{ fill: "var(--pop-1)" }} />
        <rect width="2.6" height="7" style={{ fill: "var(--cream)" }} />
      </>
    ),
  },
};

/**
 * A Ghost, drawn facing right: a white dome with a face, wearing a Card as a long dress with a
 * wavy hem in its fabric, and a short wisp of a tail peeking out underneath. It fills its box,
 * which should keep the drawing's 64:70 shape.
 */
export function GhostFigure({
  skin,
  className,
}: {
  skin: Skin;
  className?: string;
}) {
  // Every Ghost on the page has its own pattern, so their ids must differ.
  const patternId = `fabric-${useId().replace(/[^\w-]/g, "")}`;
  const pattern = FABRIC_PATTERNS[skin.fabric];

  return (
    <svg
      viewBox="0 0 64 70"
      aria-hidden
      className={className}
      overflow="visible"
    >
      <defs>
        <pattern
          id={patternId}
          width={pattern.width}
          height={pattern.height}
          patternUnits="userSpaceOnUse"
          patternTransform={pattern.transform}
        >
          {pattern.tiles}
        </pattern>
      </defs>
      {/* The tail, peeking out under the hem. */}
      <path
        d="M34 52 H23 C22.5 56.5 21.5 59 19 59.8 C17.5 60.3 16 59.4 15.5 58 C15 62 18 65.5 22.5 65 C28.5 64.5 32.5 60 34 52 Z"
        style={{ fill: "var(--ghost)", stroke: "var(--ink)" }}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* The dome, and a highlight on its shoulder. */}
      <path
        d="M14 36 C14 18 22 8 32 8 C42 8 50 18 50 36 Z"
        style={{ fill: "var(--ghost)", stroke: "var(--ink)" }}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M44 15 C47 19 48 24 48 29"
        fill="none"
        style={{ stroke: "var(--ghost-shade)" }}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* The Card it wears as a dress, with the Card's inner border. */}
      <path
        d="M12.5 33 Q12.5 29 16.5 29 H47.5 Q51.5 29 51.5 33 V56 Q48 62 44 56 Q40 50 36 56 Q32 62 28 56 Q24 50 20 56 Q16 62 12.5 56 Z"
        fill={`url(#${patternId})`}
        style={{ stroke: "var(--ink)" }}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect
        x="16"
        y="32.5"
        width="32"
        height="17.5"
        rx="2.4"
        fill="none"
        style={{ stroke: "var(--cream)" }}
        strokeWidth="1.6"
      />
      {/* The face, a little toward the side it faces. */}
      <g
        transform="translate(2.5 0)"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <ellipse
          cx="21"
          cy="25"
          rx="2.8"
          ry="1.6"
          style={{ fill: "var(--pop-1)" }}
          opacity="0.45"
        />
        <ellipse
          cx="43"
          cy="25"
          rx="2.8"
          ry="1.6"
          style={{ fill: "var(--pop-1)" }}
          opacity="0.45"
        />
        <path
          d="M29.5 24.8 Q32 27.2 34.5 24.8"
          fill="none"
          style={{ stroke: "var(--ink)" }}
          strokeWidth="2"
        />
        <ellipse
          cx="26"
          cy="19.5"
          rx="2.7"
          ry="3.6"
          style={{ fill: "var(--ink)" }}
        />
        <ellipse
          cx="38"
          cy="19.5"
          rx="2.7"
          ry="3.6"
          style={{ fill: "var(--ink)" }}
        />
        <circle cx="27" cy="18.1" r="1" fill="#fff" />
        <circle cx="39" cy="18.1" r="1" fill="#fff" />
      </g>
    </svg>
  );
}
