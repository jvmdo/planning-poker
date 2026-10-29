# 13: Logo and favicon

**What to build:** Give the app a logo and favicon in the Playful style: a face-down Card carrying the team's four Jira ticket types (Bug, História, Melhoria, Tarefa) along its top edge, and a revealed 8 with a clock as its corner index. The full logo appears wherever it's large; the browser tab gets a simplified version.

**Blocked by:** none

**Status:** ready-for-agent

- [x] The full logo sits beside "Planning Poker" in the sidebar header and on the join screen, drawn inline so its clock face follows the theme's secondary colour in light and dark.
- [x] The browser tab shows the simplified favicon: the two Cards and the 8, without the ticket icons and clocks. On dark browser tabs its outlines turn cream.
- [x] Browsers without SVG favicons get a 32 px PNG; phones get a 180 px home-screen icon of the full logo on cream.
- [x] The sidebar title fits on one line beside the logo.

## Comments

**Prototype (2026-10-29).** Eleven concepts were compared on a comparison page that showed each large, in the sidebar header, as light and dark tab icons and as a home-screen icon. Concept 11, drawn from the user's sketch, won, with its favicon cut (11b). The concepts and the page are kept on the local `prototype/logo` branch (`.scratch/planning-poker/logo-concepts/`).

**Implemented (2026-10-29).** All criteria are met. Notes:

- **Files:** `src/client/logo.tsx` draws the logo inline (ids made unique per instance with `useId`); `public/logo.svg` is the same drawing standalone; `public/favicon.svg` is the favicon cut, with a `prefers-color-scheme: dark` style; `public/favicon-32.png` and `public/apple-touch-icon.png` were rendered from those SVGs in a headless browser. Vite copies `public/` into the build, and the Node server serves them.
- **Theme switch moved:** the logo made the sidebar title wrap beside the light/dark/system switch from ticket 12, so the switch moved to the sidebar footer, next to the Voter/Observer switch.
- **Checked** in a browser on a production build: all four icon files are served with the right types and linked from the page; the logo shows on the join screen and in the sidebar; its clock face resolves to the theme's secondary colour in light and in dark.
