# 12: Playful style and dark theme

**What to build:** Give the whole app the Playful look chosen from the visual-style prototype, in light and dark: warm cream (light) or deep indigo (dark), Fredoka for headings and numbers, Nunito for text, thick ink outlines with hard offset shadows, each Card picked in its own bright colour, and bouncy motion. Everyone can choose light, dark or the system setting, remembered in their browser.

**Blocked by:** none

**Status:** ready-for-agent

- [x] The colour tokens in `index.css` are the Playful palette, in light and dark, so every screen (join, Room, notices) takes the style without per-component colours.
- [x] Buttons, inputs and panels are pills or rounded boxes with an ink outline and a hard shadow; buttons press in when clicked.
- [x] Cards in the hand have thick ink outlines and hard shadows, tilt on hover, and press in on click. The picked Card fills with its own colour (five colours cycling through the Deck) and pops.
- [x] After the Reveal, the Result sits on a yellow panel and pops in; each bar in "How the team voted" grows in with a bounce, in its own colour; each Vote in the sidebar is a yellow pill.
- [x] The Voter/Observer switch is a pill with the chosen role in solid ink (cream on indigo when dark), with matching inner and outer rounding.
- [x] The sidebar title and the status bar are the same height, and the lines under them are the same thickness (4 px of ink), with the progress fill running along the status bar's line.
- [x] A light / dark / system switch in the sidebar header. The choice is remembered per browser; "system" follows the operating system and changes with it. The page never flashes the wrong theme while loading.

## Comments

**Prototype (2026-10-29).** Seven looks were compared over three rounds: a felt card table, a calm Linear-like tool, MS Paint, Sketchy (pencil and chalk), Sketchy bold, Solitaire and Playful. Playful (variant C) won, after two fixes made during the prototype: a role switch with better contrast and matching rounding, and sidebar and status-bar lines of equal height and thickness. The prototype is kept on the local `prototype/visual-style` branch (`src/client/prototype-visual-style/styles.css`, the `C` section); run it with `npm run dev` and open `/?variant=C&fake=11`.

**Implemented (2026-10-29).** All criteria are met. Notes:

- **Where it lives:** the palette, `--ink` and the five `--pop-*` colours are tokens in `index.css`, in `:root` and `.dark`, exposed to Tailwind as `ink`, `pop-1`…`pop-5`, `shadow-hard-sm/-/-lg`, `animate-pop` and `animate-grow`. The shadcn `Button`, `Input` and `Card` carry the ink outlines and hard shadows, so the join screen and the Become Facilitator card take the style too. `lib/pop.ts` picks a Card's or bar's colour by position.
- **Theme:** `lib/theme.ts` keeps the choice in `localStorage` under `theme` (nothing stored means "system") and follows the operating system while on "system". An inline script in `index.html` applies it before the first paint. The switch sits in the sidebar header.
- **Fonts:** Fredoka and Nunito load from Google Fonts.
- **Checked** in a browser on a production build with three Participants: light and dark during voting and after the Reveal; a browser whose system is dark starts dark; choosing Dark survives a reload with the class already set when the page loads; going back to System clears the saved choice.
