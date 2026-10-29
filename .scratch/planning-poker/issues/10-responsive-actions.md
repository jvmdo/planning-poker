# 10: Responsive actions

**What to build:** Every action waits about 230 ms for the server's snapshot before anything changes on screen, so clicks feel sluggish. Actions that affect only the person clicking (playing a Card, switching between Voter and Observer) show their result immediately. Actions that change everyone's screen (Reveal, New Round) give instant feedback while waiting, but still show only what the server confirms. A switch on the server adds artificial latency in development, so the difference can be seen locally.

**Blocked by:** none

**Status:** ready-for-agent

| Action | Approach | Why |
|---|---|---|
| Play a Card | Optimistic | Only you see your Vote before the Reveal. The one realistic refusal (`round-revealed`) already shows a notice. |
| Voter / Observer switch | Optimistic | It changes only you and is never refused while you're in the Room. |
| Reveal | Instant feedback | The Votes and the Result exist only on the server. |
| New Round | Instant feedback | Clearing the board locally would put your screen ahead of the team's. |
| Hand over, Become Facilitator | Wait for the server | Becoming Facilitator is a race the first click wins; hand over already sits behind a confirm dialog. |

- [x] Clicking a Card highlights it at once, and your own ✓ and the progress bar update with it.
- [x] A snapshot caused by someone else's action, arriving before the server has handled your Vote, never flashes your Card back to the previous one.
- [x] If the Vote is refused, the Card goes back to what the server says and the existing notice shows.
- [x] A pending Vote is dropped when its Round ends, by the Reveal or by a New Round, even if the New Round's snapshot looks like "no Vote yet". Snapshots carry a Round number so the client can tell.
- [x] Switching between Voter and Observer shows the new role at once, with the same rules: kept until the server confirms it, dropped if refused.
- [x] Reveal and New Round show they were clicked within a frame (pressed and disabled, with a spinner if the server takes longer than ~150 ms) until the next snapshot arrives.
- [x] `SIMULATED_LATENCY_MS` makes the server wait that long before handling each command, in development only, and `npm run dev:slow` starts the app with it set to 250.

## Comments

**Why snapshots need a Round number.** A New Round's snapshot shows `myVote: null`, and so does a snapshot sent before the server has handled your Vote. Without something that identifies the Round, the client can't tell "my Vote hasn't arrived yet" from "the Round I voted in is over", and a pending Vote could stay on screen while the server holds none.

**Implemented (2026-10-29).** All criteria are met. Notes:

- **Where it lives:** `src/client/pending.ts` holds the rules: settle each pending thing against a snapshot, and lay the pending Vote and role over the server's snapshot for display. `use-room.ts` keeps the state and settles it on every snapshot, refusal and disconnect. Snapshots carry `round`, which goes up whenever a Round's Votes are discarded.
- **While disconnected:** Card, role, Reveal and New Round clicks are ignored rather than sent. Socket.IO would deliver them before the browser rejoins, and the server drops commands from a socket that hasn't joined without replying, so they'd stay pending forever. Everything pending is also dropped on disconnect; the snapshot after rejoining tells the truth.
- **Latency switch:** `SIMULATED_LATENCY_MS` delays each incoming command unless `NODE_ENV` is `production`, which `render.yaml` now sets.
- **Known limitation:** clicking A, then B, then back to A within one round trip can briefly show B. A snapshot that predates your clicks already holds A and settles the pending A early, then the server's answer to B arrives. Telling them apart would need the server to acknowledge each command. Not worth it for a flicker of under 250 ms in an unusual click pattern.
- **Checked** in a browser with 250 ms of delay: the Card highlights within ~25 ms; a snapshot from someone else's Vote doesn't flash your Card back; a Vote that loses the race against the Reveal reverts with its notice; the role switches at once; Reveal and New Round are busy until answered, with the spinner after 150 ms (seen at 1 s of delay). With the server stopped, clicks do nothing, and after it comes back Reveal works normally.
- **Review:** a standards review and a spec review ran on the change. Fixed from them: commands stuck pending when sent while disconnected, the latency switch working in production, a duplicated participant lookup and command type, and missing doc comments. Left as they are: a single reducer for the three pending states (not needed at this size), a "pressed" style beyond disabled-plus-spinner, and unit tests (not wanted for this ticket).
