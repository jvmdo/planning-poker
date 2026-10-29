import { useId } from "react";

const BLUE = "#16b3eb";
const LIGHT_BLUE = "#bcedff";

/**
 * The Planning Poker logo, drawn inline so its clock face follows the theme's secondary colour. A
 * face-down Card carries the team's four Jira ticket types (Bug, História, Melhoria, Tarefa) along
 * its top edge; the revealed 8 has a clock as its corner index. Same drawing as public/logo.svg.
 */
export function Logo({ className }: { className?: string }) {
  // Several logos can be on a page; each needs its own ids for the pattern and glyphs. React's ids
  // contain characters that break url(#…) references, so keep only the safe ones.
  const id = `logo${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ref = (name: string) => `${id}-${name}`;

  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      <defs>
        <pattern
          id={ref("back")}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="5" height="5" fill={BLUE} />
          <rect width="2" height="5" fill={LIGHT_BLUE} />
        </pattern>
        {/* Glyphs drawn at full size around their centre; each <use> shows them at half size. */}
        <g id={ref("bug")}>
          <path
            d="M-2.5 -1.4 L-1.1 -0.6 M2.5 -1.4 L1.1 -0.6 M-2.7 0.8 H-1.3 M2.7 0.8 H1.3 M-2.5 3 L-1.1 2.3 M2.5 3 L1.1 2.3"
            fill="none"
            stroke="#f76046"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <ellipse cx="0" cy="0.8" rx="1.9" ry="2.6" fill="#f76046" />
          <circle cx="0" cy="-2.7" r="1.3" fill="#f76046" />
        </g>
        <path
          id={ref("story")}
          d="M-2.7 0.6 l1.9 1.9 l3.5 -4"
          fill="none"
          stroke={BLUE}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          id={ref("improvement")}
          d="M0 -2.9 V2.9 M-2.9 0 H2.9"
          fill="none"
          stroke="#2fb36d"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <g id={ref("task")} fill="none" stroke="#7b6cf0" strokeLinecap="round">
          <path
            d="M-0.8 -2.3 H2.8 M-0.8 0 H2.8 M-0.8 2.3 H2.8"
            strokeWidth="1.5"
          />
          <path
            d="M-2.9 -2.3 h0.1 M-2.9 0 h0.1 M-2.9 2.3 h0.1"
            strokeWidth="1.9"
          />
        </g>
        <g id={ref("clock")}>
          <circle
            r="3"
            fill="var(--secondary)"
            stroke="var(--ink)"
            strokeWidth="1.4"
          />
          <path
            d="M0 0 V-1.9 M0 0 L1.4 0.8"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </g>
      </defs>
      <g stroke="var(--ink)" strokeLinejoin="round" strokeLinecap="round">
        <g transform="translate(23 35) rotate(-14)">
          <rect
            x="-11.5"
            y="-17.5"
            width="28"
            height="40"
            rx="5"
            fill="var(--ink)"
            stroke="none"
          />
          <rect
            x="-14"
            y="-20"
            width="28"
            height="40"
            rx="5"
            fill={BLUE}
            strokeWidth="3"
          />
          <rect
            x="-9"
            y="-15"
            width="18"
            height="30"
            rx="2.5"
            fill={`url(#${ref("back")})`}
            strokeWidth="2"
          />
        </g>
        <g transform="translate(40 31) rotate(10)">
          <rect
            x="-11.5"
            y="-17.5"
            width="28"
            height="40"
            rx="5"
            fill="var(--ink)"
            stroke="none"
          />
          <rect
            x="-14"
            y="-20"
            width="28"
            height="40"
            rx="5"
            fill="#ffffff"
            strokeWidth="3"
          />
          <circle cx="0" cy="-6" r="4.6" fill="none" strokeWidth="3.6" />
          <circle cx="0" cy="5.6" r="6" fill="none" strokeWidth="3.6" />
          <use
            href={`#${ref("clock")}`}
            transform="translate(-9.4 -15.2) scale(0.5)"
          />
          <use
            href={`#${ref("clock")}`}
            transform="translate(9.4 15.2) rotate(180) scale(0.5)"
          />
        </g>
      </g>
      <g transform="translate(23 35) rotate(-14)">
        <use
          href={`#${ref("bug")}`}
          transform="translate(-10 -24.5) scale(0.5)"
        />
        <use
          href={`#${ref("story")}`}
          transform="translate(-4 -24.5) scale(0.5)"
        />
        <use
          href={`#${ref("improvement")}`}
          transform="translate(2 -24.5) scale(0.5)"
        />
        <use
          href={`#${ref("task")}`}
          transform="translate(8 -24.5) scale(0.5)"
        />
      </g>
    </svg>
  );
}
