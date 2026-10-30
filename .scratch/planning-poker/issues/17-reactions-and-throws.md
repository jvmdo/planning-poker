# 17: Reactions and Throws

**What to build:** Let people have fun at the table. Hovering or clicking your own Card opens a deck of Reactions that float up from it; hovering or clicking another Voter's Card opens a deck of things to Throw at it, which fly across the table and make their Card wobble. Everyone in the Room sees them. They change nothing about the Round. User stories 49–53; Room commands, rejections and tests are in the spec under the Room module.

**Blocked by:** 16

**Status:** ready-for-agent

- [ ] **Room:** `react(id, reaction)` and `throwAt(by, to, item)` follow the spec: Reactions only from Voters; Throws from anyone, only at another present Voter; only items from the shared lists; the burst limit, shared between the two: up to 3 in a row, then one more each second, never more than 3 saved up. A rejected one returns a reason and nothing is sent. An accepted one leaves every snapshot as it was and reaches a separate subscriber once.
- [ ] **Shared contract:** the Reactions list (🎉 😱 🤔 🔥 ☕ 👍) and the Throws list (paper ball 📄, rock 🪨, tomato 🍅, egg 🥚, fish 🐟, flowers 💐), the two client-to-server events, and one server-to-client event carrying who, to whom (for a Throw) and what.
- [ ] **Socket adapter:** translates the two events into Room commands and broadcasts accepted ones to every socket. Rejections go back to the sender only, as with other commands.
- [ ] **Your own seat:** hovering or clicking your Card opens a small deck of the Reactions next to it, opening upwards for seats in the bottom half and downwards otherwise. Picking one floats a few copies up from your Card, on every screen.
- [ ] **Anyone else's seat:** hovering or clicking opens a deck of the Throws. Picking one makes it arc and spin from your Card to theirs, on every screen; their Card wobbles when it lands.
- [ ] **Observers** have no seat: their Throws start from the "Watching: …" line. They can't send Reactions, and no deck opens at an Observer.
- [ ] A click keeps a deck open until you click elsewhere, so it works by touch. Hovering another seat closes the open deck, so only one shows at a time. The decks can be reached and used from the keyboard, and every item has a label ("Throw a tomato at Diego", "React 🎉").
- [ ] Once your burst is used up, clicking shakes the deck instead of sending, until another becomes available. The server's rejection is the real limit; the client's count only saves a round trip.
- [ ] Reactions and Throws work while voting and after the Reveal, and never change what Cards show. If the sender's or target's seat is gone when one arrives (they left), it's skipped.
- [ ] With "reduce motion" on, the item appears briefly at its target instead of flying, and nothing wobbles.
- [ ] Room tests cover each rejection, the event reaching the subscriber once, and the burst limit with fake timers (3 accepted, 4th rejected; 999 ms rejected, 1000 ms accepted; never more than 3 saved up).

## Comments

**Prototype (2026-10-30).** Built local-only as part of variant C on the `prototype/wide-layout` branch (`src/client/prototype-wide-layout/variant-c.tsx`, functions `burst` and `fly`); run it with `npm run dev` and open `/?variant=C&fake`. Decisions taken there: hover or click opens the decks; they work at any time; only Voters can be targets; a burst of up to 3, then one per second (decided after the prototype, which only allowed one per second); the item flies from the thrower's seat to the target's Card, which wobbles; the Throws list includes flowers as the nice option.
