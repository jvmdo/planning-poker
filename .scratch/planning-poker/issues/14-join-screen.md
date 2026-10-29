# 14: Join screen

**What to build:** Replace the plain join form with a full page in the Playful style. The left half explains the app: the logo, "Planning Poker", and how a Round works in three illustrated steps. The right half holds the name form as a big tilted Card, with the Deck in a row underneath to play with while the server wakes up. A small note says the app runs on Render's free plan and may sleep or be down.

**Blocked by:** none

**Status:** ready-for-agent

- [x] Left: the logo and title, the three steps (pick in secret, reveal at once, the Result is the mean), and at the bottom a note: "Hosted on the Render free plan", linking to Render's free-plan page, explaining the sleep and possible downtime.
- [x] Right: the name form as a big tilted Card ("Take a seat"), level with the left content, with the connecting banner and notices above it and the name-taken message inside it.
- [x] While joining, the button reads "Joining…" and is disabled.
- [x] Along the bottom, "Warm up while you wait: play a Card." and the real Deck: clicking a Card colours and flicks it, as in the Room. Nothing is sent to the server.
- [x] The light/dark/system switch in the top corner.
- [x] The Room's Card is a reusable `PlayingCard`; the warm-up Deck uses it without the "hours" label.

## Comments

**Prototype (2026-10-29).** Four designs were compared: a centred hero, a split page with "how a Round works", the form as a Card in front of the fanned Deck, and D, which combined the split page with the form Card and a playable Deck row. D won after adjustments: the form centred level with the left content, the Deck straight along the bottom with smaller Cards showing just their numbers, and the hosting note. The prototype is kept on the local `prototype/join-screen` branch (`src/client/prototype-join-screen/`); run it with `npm run dev` and open `/?variant=D&preview`.

**Implemented (2026-10-29).** All criteria are met. Notes:

- **Files:** `join-screen.tsx` is the whole page (about panel, name Card, warm-up Deck). `playing-card.tsx` is the Card button, now shared by the Room's hand and the warm-up Deck; `showUnit={false}` drops "hours". `lib/use-card-flair.ts` holds the random colour and flick on each play, in its own file so fast refresh keeps working.
- **Joining:** the old screen hid the form while rejoining; now the form stays, with the button disabled and reading "Joining…".
- **Checked** in a browser on a production build, light and dark: the link opens Render's free-plan docs in a new tab; a warm-up Card can be played; joining lands in the Room, where the hand still plays with its "hours" label; a taken name shows the refusal inside the form Card, and another name then joins.
