# 01: Walking skeleton: join the Room and see who's here

**What to build:** A team member opens the app, types a display name, and lands in the Room, where they see a live list of every Participant currently present. A second person joining in another browser appears for everyone immediately. The first Participant to join an empty Room is the Facilitator and is marked with a badge. Reloading the page brings you back as the same Participant without retyping your name. Trying to join with a name already in use is refused with a clear message.

This ticket lays down the whole stack that later tickets build on. See the spec (`.scratch/planning-poker/spec.md`), `GLOSSARY.md` and ADR 0001:
- a single TypeScript package with client, server and shared areas
- a Vite + React single-page app with shadcn/ui + Tailwind
- one Node process serving the client and Socket.IO
- the Room module as a pure domain module with no socket code
- typed Socket.IO events and the snapshot type in the shared area
- a thin socket adapter that sends each socket its own snapshot after every change
- Vitest, and ESLint/Prettier

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] One command starts the app locally with hot reload for the client and server.
- [ ] Joining with a display name adds the Participant to the Room, and every connected browser sees the updated list without refreshing.
- [ ] The client generates a stable Participant ID and keeps it with the display name in browser storage. A reload rejoins as the same Participant, with the name pre-filled.
- [ ] A name already used by a present Participant (compared ignoring case and surrounding spaces) is rejected with a visible error. The same Participant ID rejoining with its own name is accepted.
- [ ] The first Participant to join an empty Room is the Facilitator, and everyone sees a Facilitator badge next to them.
- [ ] Every Participant joins as a Voter.
- [ ] The Room module exposes commands, a per-Participant snapshot query and a change subscription. It has no socket, HTTP or React code.
- [ ] Rejected commands return a reason and leave the Room unchanged.
- [ ] The socket adapter holds no rules. It translates events into Room commands, sends rejections only to the sender, and sends each socket its own snapshot on every change.
- [ ] Vitest tests drive the Room only through commands and assert on snapshots and rejections. They cover joining, the Participant list, the first joiner becoming Facilitator, and rejected duplicate names.
- [ ] The join screen and Participant list are usable on a phone-width screen. The UI is in English.
- [ ] Lint, format check, type check and tests all pass with one command each.
