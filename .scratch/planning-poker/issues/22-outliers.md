# 22: Outliers

**What to build:** After the Reveal, the breakdown says how the Votes came out and names only the Voters worth asking. Today it always names everyone on the lowest and highest Cards, so six Voters on 8h and one on 6h read "Ask {6h} and {all six 8h} why". The people who agree get asked, and a one-Card difference is treated like a real disagreement. The new rule reads the Votes against the Deck. It names the Outliers (the Voters far from a clear majority) and says when there's a Split or No consensus instead. Outliers are highlighted on the Table and in the sidebar.

**Blocked by:** none

**Status:** ready-for-agent

## The rule

"One step" is the next Card in the Room's current Deck, so 6h→8h is one step on the default Deck and 8h→16h is three.

1. **Fewer than 2 Votes:** nothing is said.
2. **Everyone agrees:** every Vote is the same Card.
3. **With a majority Card** (the one Card with the most Votes, holding at least half): every Voter two or more steps from it is an **Outlier**. If there are none, nearly everyone agrees.
4. **Without one:**
   - **Split:** two Cards at least two steps apart tie for the most Votes, and every Vote is within one step of one of them.
   - **Nearly everyone agrees:** every Vote is within one step of a Card someone played.
   - **No consensus:** anything else.

## Acceptance criteria

- [x] The breakdown says, by case: nothing; "Everyone agrees 🎯"; "Nearly everyone agrees"; "Ask {Outliers} why"; "Split between {low}h and {high}h"; "No consensus: {lowest}h to {highest}h. Talk it through and vote again."
- [x] Outliers are listed lowest Vote first, as "Ana", "Ana and Bruno" or "Ana, Bruno and Carla".
- [x] An Outlier also sees "You're an Outlier, tell the team why 🙋" under the message. Nobody else sees it.
- [x] On the Table, each Outlier's Card has a coloured ring and a "?" badge. For a Split, each camp's Cards get a ring in that camp's own colour. Nothing is highlighted in the other cases.
- [x] In the sidebar, expanded and collapsed, each Outlier's little Card has the same ring and "?" badge, and rows keep their order. Split camps get their colours there too.
- [x] Screen readers hear "Outlier" with the Outlier's Card. (Accessibility beyond this basic label isn't required for now; the Split camps aren't read out.)
- [x] The highlights appear at the Reveal and are gone when the next Round starts.
- [x] The message and highlights are read at the Reveal and don't change until the next Round, even if a Voter leaves or turns Observer.
- [x] The rule is a pure function, tested with the scenarios below.
- [x] GLOSSARY.md defines Outlier, Split and No consensus.

## Scenarios (default Deck: 1, 2, 4, 6, 8, 10, 12, 16, 24, 32, 64)

| # | Votes | Outcome | Message |
|---|---|---|---|
| 1 | 8 ×6 | Everyone agrees | Everyone agrees 🎯 |
| 2 | 8 ×6, 6 ×1 | Nearly | Nearly everyone agrees |
| 3 | 6 ×2, 8 ×2, 10 ×1 | Nearly (all within one step of 8) | Nearly everyone agrees |
| 4 | 6, 8 | Nearly | Nearly everyone agrees |
| 5 | 8 ×3, 16, 32 | Outliers | Ask {16} and {32} why |
| 6 | 8 ×3, 12 ×2, 1 | Outliers (3 of 6 is half) | Ask {1} and {both 12} why |
| 7 | 8 ×3, 6, 10, 24 | Outliers | Ask {24} why |
| 8 | 2 ×2, 8, 32 | Outliers (2 of 4 is half) | Ask {8} and {32} why |
| 9 | 4 ×3, 8 ×3 | Split | Split between 4h and 8h |
| 10 | 4 ×3, 6, 8 ×3 | Split (6 is close to both) | Split between 4h and 8h |
| 11 | 4 ×2, 16 ×2, 64 | No consensus (64 is far from both) | No consensus: 4h to 64h… |
| 12 | 8 ×2, 24, 32, 64 | No consensus (2 of 5 is under half) | No consensus: 8h to 64h… |
| 13 | 1, 4, 8, 16, 64 | No consensus | No consensus: 1h to 64h… |
| 14 | One Vote | — | Nothing |

## Out of scope

- A revote button: the Facilitator's new Round control is enough.
- Rewording the message for the Outlier ("Ask you and Bruno why"); they get the extra line instead.

## Comments

**Designed (2026-11-19)** in conversation with the user, from the six-on-8h, one-on-6h Round that named all six. Decisions: a one-step difference isn't worth asking about; a group can be Outliers however big it is, as long as the majority Card has half the Votes; with no clear majority, nobody is named; "No consensus" over "Everyone disagrees"; the Outlier's own line is kept only if it stays simple.

**Implemented (2026-11-19).** All criteria are met. Notes:

- **The rule was refined while testing**, and the order above is the result. As first written ("some Card has every Vote within one step", checked before the majority), it called 4h ×3 vs 8h ×3 "nearly agrees" around an unplayed 6h, and let 8h ×5 with one 12h off although 12h is two steps from the majority. The majority Card is now checked first, "nearly agrees" centres on a Card someone played, and a Split's camps must be two or more steps apart. All 14 scenarios above still come out as agreed.
- **Files:** `src/shared/agreement.ts` holds the pure rule (`agreementOf`), tested in `agreement.test.ts` with every scenario plus the two refinement cases, three tied Cards, and a custom Deck. `src/client/lib/vote-marks.ts` reads a snapshot into the outcome and the mark of each Card and Voter (`readRound`, called once in `App` and passed down), and holds the mark colours. `VoteCard` draws the mark (fill, ring and, for Outliers, a "?" badge); the Table, both sidebar views and the breakdown use it.
- **The breakdown's bars follow the marks.** They used to cycle the same palette as the marks, so the majority's bar could be the Outliers' orange. When any Card is marked, marked bars take its colour and the rest are plain; with no marks they cycle as before.
- **Screen readers** hear "Voted 32 hours, Outlier" on the Card, on the Table and in the sidebar. In the collapsed sidebar the hover title says "Eva, Outlier"; the hidden name doesn't, so it isn't read twice.
- **Checked** in headless Chromium on a production build at 1440×900 with 4–5 Voters: Outliers (8 ×3, 16, 32) seen by the Facilitator and by an Outlier, who alone got the extra line; a Split (4 ×2, 8 ×2); No consensus (1, 4, 8, 16, 64); Nearly (8 ×3, 6). The marks were on the Table and in the sidebar, expanded and collapsed, in light and dark, and were gone after a New Round.

**Review (2026-11-19, standards and spec).** No hard violations or blocking defects. Fixed: the outcome is read once in `App` instead of four times; marks are looked up by Card (`markOfCard`), so the breakdown no longer goes through a Card's first Voter; the ", Outlier" label is built in one place (`withMarkLabel`); `readVotes` became `agreementOf` and `step` became `indexInDeck`; the glossary's Outlier now names the majority Card exactly. Kept British spelling, which the rest of the code uses. Open, for the user: the outcome follows Voters who leave or turn Observer after the Reveal; the bar colours and the mark fills go beyond the criteria; Split Cards aren't read out with their camp.

**Follow-up (2026-11-19).** The user kept the extras (bar colours, filled marks) and asked for the outcome to freeze at the Reveal. `keepReading` (in `vote-marks.ts`, tested in `vote-marks.test.ts`) takes the reading, including the Outliers' names, when the Votes are revealed and keeps it until the Round number changes; `useRoundReading` holds it in `App`. Only the message and highlights are frozen: the Result and the bars still come from the server and change if a Voter leaves. A page opened after the Reveal reads the Votes still there. Checked in the browser: after Eva, an Outlier, left, the Facilitator still saw "Ask Davi and Eva why" with Davi marked.

**Scenarios in the browser (2026-11-19).** `scripts/scenarios.ts` plays the scenarios table in a real Room with bot Voters (dev only, outside the build). Open a Room, switch to Observer, run `npx tsx scripts/scenarios.ts <room>`, then Reveal and New Round through all 14. Checked on a separate server: every scenario showed its expected message, and Ctrl+C removed the bots.
