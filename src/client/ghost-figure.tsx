import { useId, type CSSProperties, type ReactNode } from "react";
import type { Disguise, Fabric, Skin } from "../shared/ghost";
import { cn } from "@/lib/utils";

/** Each fabric's pattern (one tile, and how to lay the tiles) and the colours its disguises take. */
const FABRIC_LOOKS: Record<
  Fabric,
  {
    width: number;
    height: number;
    transform?: string;
    tiles: ReactNode;
    main: string;
    dark: string;
    light: string;
    /** The Rogue's glowing eyes. */
    glow: string;
  }
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
    main: "var(--pop-1)",
    dark: "oklch(0.45 0.13 32)",
    light: "var(--cream)",
    glow: "oklch(0.8 0.17 50)",
  },
  "berry-gingham": {
    width: 8,
    height: 8,
    tiles: (
      <>
        <rect width="8" height="8" style={{ fill: "var(--cream)" }} />
        <rect width="4" height="8" style={{ fill: "var(--pop-5-light)" }} />
        <rect width="8" height="4" style={{ fill: "var(--pop-5-light)" }} />
        <rect width="4" height="4" style={{ fill: "var(--pop-5)" }} />
      </>
    ),
    main: "var(--pop-5)",
    dark: "oklch(0.42 0.13 330)",
    light: "var(--pop-5-light)",
    glow: "oklch(0.75 0.2 330)",
  },
  "sunny-suits": {
    width: 12,
    height: 12,
    tiles: (
      <>
        <rect width="12" height="12" style={{ fill: "var(--pop-4)" }} />
        <text
          x="3"
          y="5.2"
          fontSize="5"
          textAnchor="middle"
          fontFamily="serif"
          // Dark on the yellow in either theme.
          style={{ fill: "oklch(0.26 0.06 285)" }}
        >
          ♠
        </text>
        <text
          x="9"
          y="11.2"
          fontSize="5"
          textAnchor="middle"
          fontFamily="serif"
          style={{ fill: "var(--pop-1)" }}
        >
          ♥
        </text>
      </>
    ),
    main: "var(--pop-4)",
    dark: "oklch(0.5 0.1 80)",
    light: "var(--cream)",
    glow: "oklch(0.9 0.17 95)",
  },
  "mint-dots": {
    width: 7,
    height: 7,
    tiles: (
      <>
        <rect width="7" height="7" style={{ fill: "var(--pop-3)" }} />
        <circle cx="1.75" cy="1.75" r="1.2" style={{ fill: "var(--cream)" }} />
        <circle cx="5.25" cy="5.25" r="1.2" style={{ fill: "var(--cream)" }} />
      </>
    ),
    main: "var(--pop-3)",
    dark: "oklch(0.42 0.1 150)",
    light: "var(--cream)",
    glow: "oklch(0.85 0.2 145)",
  },
  "lilac-zigzag": {
    width: 8,
    height: 6,
    tiles: (
      <>
        <rect width="8" height="6" style={{ fill: "var(--lilac)" }} />
        <path
          d="M0 4 L2 2 L4 4 L6 2 L8 4"
          fill="none"
          style={{ stroke: "var(--cream)" }}
          strokeWidth="1.2"
        />
      </>
    ),
    main: "var(--lilac)",
    dark: "oklch(0.42 0.1 300)",
    light: "var(--cream)",
    glow: "oklch(0.72 0.22 305)",
  },
  "night-stars": {
    width: 11,
    height: 11,
    tiles: (
      <>
        <rect width="11" height="11" style={{ fill: "var(--night)" }} />
        <path
          d="M3 1.2 L3.6 2.6 L5 3 L3.6 3.4 L3 4.8 L2.4 3.4 L1 3 L2.4 2.6 Z"
          style={{ fill: "var(--pop-4)" }}
        />
        <circle cx="8.5" cy="8" r="0.8" style={{ fill: "var(--cream)" }} />
      </>
    ),
    main: "var(--night)",
    dark: "oklch(0.2 0.05 285)",
    light: "var(--pop-4)",
    glow: "oklch(0.88 0.17 95)",
  },
};

/** Ids unique to this drawing, since every Ghost on the page has its own pattern and glow. */
function useDrawingId(prefix: string) {
  return `${prefix}-${useId().replace(/[^\w-]/g, "")}`;
}

/** A fabric's pattern, for `fill="url(#id)"`. */
function FabricPattern({ id, fabric }: { id: string; fabric: Fabric }) {
  const look = FABRIC_LOOKS[fabric];
  return (
    <pattern
      id={id}
      width={look.width}
      height={look.height}
      patternUnits="userSpaceOnUse"
      patternTransform={look.transform}
    >
      {look.tiles}
    </pattern>
  );
}

/** A disguise's colours come from the fabric, through these variables. */
function fabricColours(fabric: Fabric): CSSProperties {
  const look = FABRIC_LOOKS[fabric];
  return {
    "--f-main": look.main,
    "--f-dark": look.dark,
    "--f-light": look.light,
    "--f-glow": look.glow,
  } as CSSProperties;
}

const INK = { stroke: "var(--ink)" };

/** The soap bubbles a walking Ghost's bow blows, in the drawing's units. */
const BUBBLES = [
  { cx: 8, cy: 31, r: 2.2 },
  { cx: 5.5, cy: 36.5, r: 1.6 },
  { cx: 9.5, cy: 40, r: 1.3 },
];

/**
 * What each disguise wears, in four layers: on its back (behind everything, on the side away from
 * the face), over the dome but under the face, on the face itself (moving with it), and over
 * everything. Its colours come from the fabric.
 */
const DISGUISE_LAYERS: Record<
  Disguise,
  {
    back: ReactNode;
    underFace?: ReactNode;
    /** Takes the id of the drawing's glow filter. */
    onFace?: (glowId: string) => ReactNode;
    overAll?: ReactNode;
  }
> = {
  // A bow tied on the dress, whose loops flap and blow soap bubbles while walking.
  none: {
    back: (
      <g strokeLinejoin="round" strokeLinecap="round">
        {BUBBLES.map(({ cx, cy, r }) => (
          <g key={cx} className="ghost-trail ghost-bubble">
            <circle
              cx={cx}
              cy={cy}
              r={r}
              style={{ fill: "var(--glass)", ...INK }}
              strokeWidth="0.7"
            />
            <path
              d={`M${cx - r * 0.55} ${cy - r * 0.1} A${r * 0.6} ${r * 0.6} 0 0 1 ${cx - r * 0.1} ${cy - r * 0.55}`}
              fill="none"
              stroke="#fff"
              strokeWidth="0.6"
            />
          </g>
        ))}
        <path
          className="ghost-bow-top"
          d="M14.5 35 Q5.5 29 6.5 35.5 Q7.5 40 14.5 36.5 Z"
          style={{ fill: "var(--f-main)", ...INK }}
          strokeWidth="2"
        />
        <path
          className="ghost-bow-low"
          d="M14.5 36.5 Q8 42.5 10.5 45 Q13.5 45.5 15 38 Z"
          style={{ fill: "var(--f-main)", ...INK }}
          strokeWidth="2"
        />
        <circle
          cx="14.2"
          cy="35.8"
          r="2"
          style={{ fill: "var(--f-dark)", ...INK }}
          strokeWidth="1.8"
        />
      </g>
    ),
  },
  // A face wrap, and a headband with its tails flying behind.
  ninja: {
    // A sword slung across the back, its wrapped hilt over the shoulder. It rattles while walking,
    // and its hilt twinkles.
    back: (
      <g className="ghost-sword" strokeLinecap="round" fill="none">
        <path d="M8.5 53 L21 12" style={INK} strokeWidth="5.4" />
        <path
          d="M8.5 53 L21 12"
          style={{ stroke: "var(--f-dark)" }}
          strokeWidth="3"
        />
        <path d="M21.2 11.5 L24.2 2.5" style={INK} strokeWidth="4.4" />
        <path
          d="M21.2 11.5 L24.2 2.5"
          style={{ stroke: "var(--f-main)" }}
          strokeWidth="2.2"
          strokeDasharray="1.6 1.2"
        />
        <ellipse
          cx="21.2"
          cy="11.8"
          rx="3.6"
          ry="1.5"
          transform="rotate(-17 21.2 11.8)"
          style={{ fill: "var(--f-light)", ...INK }}
          strokeWidth="1.6"
        />
        <path
          className="ghost-trail ghost-glint"
          d="M26 -1.5 l1.2 -3 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 Z"
          fill="#fff"
          style={INK}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </g>
    ),
    overAll: (
      <g strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M14.6 22.5 Q32 25.5 49.4 22.5 L50 31 L14 31 Z"
          style={{ fill: "var(--f-dark)", ...INK }}
          strokeWidth="2.4"
        />
        <path
          d="M24 27 Q29 25.8 34 27.4"
          fill="none"
          style={{ stroke: "var(--f-main)" }}
          strokeWidth="1.4"
        />
        <path
          d="M18.5 13.4 Q12 9.5 7 12.5 Q11.5 13.5 14.5 15.5 Z M18.5 14.6 Q12 16 9 21 Q13.5 19.5 17 17 Z"
          style={{ fill: "var(--f-main)", ...INK }}
          strokeWidth="2"
        />
        <path
          d="M19 12.5 Q32 7.5 45 12.5 L45.8 15.5 Q32 10.8 18.2 15.5 Z"
          style={{ fill: "var(--f-main)", ...INK }}
          strokeWidth="2"
        />
      </g>
    ),
  },
  // A domino mask, with the eyes looking out of it, and a beanie with a bobble.
  thief: {
    // A loot sack over the shoulder, with a patch. It swings while walking, and drops coins.
    back: (
      <g strokeLinejoin="round" strokeLinecap="round">
        {[
          [6, 46],
          [9, 48],
        ].map(([cx, cy]) => (
          <circle
            key={cx}
            className="ghost-trail ghost-coin"
            cx={cx}
            cy={cy}
            r="2"
            style={{ fill: "var(--pop-4)", ...INK }}
            strokeWidth="1"
          />
        ))}
        <g className="ghost-sack">
          <path
            d="M15 31 C4 30 1.5 44 5.5 48.5 C9 52.5 15 50.5 15 50.5 Z"
            style={{ fill: "var(--f-light)", ...INK }}
            strokeWidth="2.2"
          />
          <path
            d="M13.5 31 L9.5 26 M13.5 31 L15.5 25.5"
            fill="none"
            style={INK}
            strokeWidth="2"
          />
          <rect
            x="6.5"
            y="38"
            width="5"
            height="5"
            rx="1"
            style={{ fill: "var(--f-main)", ...INK }}
            strokeWidth="1.4"
          />
        </g>
      </g>
    ),
    onFace: () => (
      <g>
        <path
          d="M16.5 18 Q24 14 32 17.6 Q40 14 47.5 18 Q47.5 24.5 40 24 Q35 23.5 32 21.4 Q29 23.5 24 24 Q16.5 24.5 16.5 18 Z"
          style={{ fill: "var(--f-dark)", ...INK }}
          strokeWidth="2"
        />
        <ellipse
          cx="26"
          cy="19.6"
          rx="3.3"
          ry="2.7"
          style={{ fill: "var(--ghost)" }}
        />
        <ellipse
          cx="38"
          cy="19.6"
          rx="3.3"
          ry="2.7"
          style={{ fill: "var(--ghost)" }}
        />
        <circle cx="27" cy="19.8" r="1.7" style={{ fill: "var(--ink)" }} />
        <circle cx="39" cy="19.8" r="1.7" style={{ fill: "var(--ink)" }} />
      </g>
    ),
    overAll: (
      <g strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M17 13 C19 4.5 25.5 1.5 32 1.5 C38.5 1.5 45 4.5 47 13 Z"
          style={{ fill: "var(--f-main)", ...INK }}
          strokeWidth="2.4"
        />
        <path
          d="M19.2 8.6 Q32 5.4 44.8 8.6 L45.6 10.8 Q32 7.6 18.4 10.8 Z"
          style={{ fill: "var(--f-dark)" }}
        />
        <circle
          cx="32"
          cy="1.5"
          r="2.6"
          style={{ fill: "var(--f-light)", ...INK }}
          strokeWidth="2"
        />
        <path
          d="M15.5 13.5 Q32 9.5 48.5 13.5 L48 16.5 Q32 12.5 16 16.5 Z"
          style={{ fill: "var(--f-dark)", ...INK }}
          strokeWidth="2.2"
        />
      </g>
    ),
  },
  // A bubble helmet with an antenna, on a collar ring.
  astronaut: {
    // A small jetpack, whose flame shows while walking.
    back: (
      <g strokeLinejoin="round" strokeLinecap="round">
        <path
          className="ghost-flame"
          d="M7.5 51 Q8.8 57 10.3 51 Z"
          style={{ fill: "var(--pop-4)", stroke: "var(--pop-1)" }}
          strokeWidth="1.2"
        />
        <path
          d="M7 47 L6.6 51 H11.2 L10.8 47 Z"
          style={{ fill: "var(--ink)" }}
        />
        <rect
          x="4.5"
          y="29.5"
          width="11"
          height="18"
          rx="3.5"
          style={{ fill: "var(--f-main)", ...INK }}
          strokeWidth="2.2"
        />
        <path
          d="M7.5 33 V44"
          fill="none"
          style={{ stroke: "var(--f-light)" }}
          strokeWidth="1.6"
          opacity="0.8"
        />
      </g>
    ),
    overAll: (
      <g strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M17.6 31 A17.5 17.5 0 1 1 46.4 31 Z"
          style={{ fill: "var(--glass)", ...INK }}
          strokeWidth="2.6"
        />
        <path
          d="M21 16 A13 13 0 0 1 29 7.6"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          opacity="0.85"
        />
        <circle cx="20.6" cy="20.5" r="1.2" fill="#fff" opacity="0.85" />
        <path
          d="M30 3.5 Q29 -1 32 -3.5"
          fill="none"
          style={INK}
          strokeWidth="2.2"
        />
        <circle
          cx="32.5"
          cy="-4.5"
          r="2.6"
          style={{ fill: "var(--f-main)", ...INK }}
          strokeWidth="2"
        />
        <rect
          x="15.5"
          y="29"
          width="33"
          height="5.5"
          rx="2.75"
          style={{ fill: "var(--f-main)", ...INK }}
          strokeWidth="2.4"
        />
        <circle cx="21" cy="31.75" r="0.9" style={{ fill: "var(--ink)" }} />
        <circle cx="43" cy="31.75" r="0.9" style={{ fill: "var(--ink)" }} />
      </g>
    ),
  },
  // A narrow hood flaring over the shoulders with its edge trimmed, and a pale mask with glowing eyes
  // that pulse red while walking.
  rogue: {
    // A quiver of arrows, which rattle while walking, and a feather drifts off.
    back: (
      <g className="ghost-quiver" strokeLinecap="round" strokeLinejoin="round">
        <path
          className="ghost-trail ghost-feather"
          d="M14 6 q-3 3 -2 7 q3 -3 2 -7 Z"
          style={{ fill: "var(--f-main)", ...INK }}
          strokeWidth="0.8"
        />
        <g className="ghost-arrows">
          <path
            d="M15 13 L13.5 5 M17.5 13.5 L18 5.5 M19.5 15 L22 8"
            fill="none"
            style={INK}
            strokeWidth="1.6"
          />
          <path
            d="M13.5 5 l-2 -2.5 l3.2 0.6 Z M18 5.5 l-1 -3 l2.6 1.2 Z M22 8 l0.2 -3.2 l1.8 2.4 Z"
            style={{ fill: "var(--f-main)", ...INK }}
            strokeWidth="1"
          />
        </g>
        <path d="M7.5 47 L16.5 14" fill="none" style={INK} strokeWidth="7.4" />
        <path
          d="M7.5 47 L16.5 14"
          fill="none"
          style={{ stroke: "var(--f-dark)" }}
          strokeWidth="5"
        />
      </g>
    ),
    underFace: (
      <g>
        <path
          fillRule="evenodd"
          d="M11 37 Q13.6 33.5 13.8 27 C14 15 21.5 3.5 32 3.5 C42.5 3.5 50 15 50.2 27 Q50.4 33.5 53 37 Z M18 21.5 A14 12.5 0 1 0 46 21.5 A14 12.5 0 1 0 18 21.5 Z"
          style={{ fill: "var(--f-dark)", ...INK }}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path
          d="M18 21.5 A14 12.5 0 1 0 46 21.5 A14 12.5 0 1 0 18 21.5 Z"
          style={{ fill: "var(--ink)" }}
          opacity="0.55"
        />
      </g>
    ),
    onFace: (glowId) => (
      <g>
        <path
          d="M21.5 13.5 Q32 9 42.5 13.5 L42 23 Q38.5 30 32 31 Q25.5 30 22 23 Z"
          style={{ fill: "var(--plate)", ...INK }}
          strokeWidth="2"
        />
        <path
          d="M32 11 V30"
          fill="none"
          style={INK}
          strokeWidth="1.2"
          opacity="0.35"
        />
        {/* Glowing in the fabric's colour, and pulsing red while walking. */}
        <g filter={`url(#${glowId})`}>
          <path
            className="ghost-rogue-eye"
            d="M23.5 17.5 L30 19.8 L29 22.2 L23.5 20.3 Z"
            style={{ fill: "var(--f-glow)" }}
          />
          <path
            className="ghost-rogue-eye"
            d="M40.5 17.5 L34 19.8 L35 22.2 L40.5 20.3 Z"
            style={{ fill: "var(--f-glow)" }}
          />
        </g>
        <path
          d="M28.6 25.8 H35.4 M29.3 27.8 H34.7"
          fill="none"
          style={INK}
          strokeWidth="1.3"
          opacity="0.6"
        />
      </g>
    ),
    overAll: (
      <path
        d="M15.5 31 Q17.5 34 21.5 35 M48.5 31 Q46.5 34 42.5 35"
        fill="none"
        style={{ stroke: "var(--f-main)" }}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ),
  },
};

/**
 * A Ghost, drawn facing right: a white dome with a face, wearing a Card as a long dress with a
 * wavy hem in its fabric, a short wisp of a tail peeking out underneath, and what its disguise
 * carries on its back. Its disguise takes its colours from the fabric. It fills its box, which
 * should keep the drawing's 64:70 shape.
 *
 * It's posed from an ancestor (see `.ghost-lean` in index.css): `data-facing="left"` turns it,
 * `data-walking` makes it walk, and `--lean` and `--look-x`/`--look-y` lean it and point its face.
 */
export function GhostFigure({
  skin,
  className,
}: {
  skin: Skin;
  className?: string;
}) {
  const patternId = useDrawingId("fabric");
  const glowId = useDrawingId("glow");
  const disguise = DISGUISE_LAYERS[skin.disguise];

  return (
    <svg
      viewBox="0 0 64 70"
      aria-hidden
      className={className}
      overflow="visible"
      style={fabricColours(skin.fabric)}
    >
      <defs>
        <FabricPattern id={patternId} fabric={skin.fabric} />
        <filter id={glowId} x="-1" y="-1" width="3" height="3">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g className="ghost-lean">
        <g className="ghost-turn">
          {/* Its back is on the left, away from the face. */}
          {disguise.back}
          {/* The tail, peeking out under the hem. */}
          <path
            className="ghost-tail"
            d="M34 52 H23 C22.5 56.5 21.5 59 19 59.8 C17.5 60.3 16 59.4 15.5 58 C15 62 18 65.5 22.5 65 C28.5 64.5 32.5 60 34 52 Z"
            style={{ fill: "var(--ghost)", ...INK }}
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          {/* The dome, and a highlight on its shoulder. */}
          <path
            d="M14 36 C14 18 22 8 32 8 C42 8 50 18 50 36 Z"
            style={{ fill: "var(--ghost)", ...INK }}
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
          <g className="ghost-hem">
            <path
              d="M12.5 33 Q12.5 29 16.5 29 H47.5 Q51.5 29 51.5 33 V56 Q48 62 44 56 Q40 50 36 56 Q32 62 28 56 Q24 50 20 56 Q16 62 12.5 56 Z"
              fill={`url(#${patternId})`}
              style={INK}
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
          </g>
          {disguise.underFace}
          {/* The face, a little toward the side it faces, and looking where it's going. */}
          <g
            className="ghost-face"
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
              style={INK}
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
            {disguise.onFace?.(glowId)}
          </g>
          {disguise.overAll}
        </g>
      </g>
    </svg>
  );
}

/** A square of a fabric, for picking it. */
export function FabricSwatch({
  fabric,
  className,
}: {
  fabric: Fabric;
  className?: string;
}) {
  const patternId = useDrawingId("swatch");
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("block", className)}>
      <defs>
        <FabricPattern id={patternId} fabric={fabric} />
      </defs>
      <rect width="24" height="24" fill={`url(#${patternId})`} />
    </svg>
  );
}
