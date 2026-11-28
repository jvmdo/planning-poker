---
name: browser-check
description: "Scripted browser checks of the running app with Playwright: several Participants, phone widths, dark mode, reduced motion, screenshots. Use when a ticket's box says 'checked in a browser', or to see a UI change working."
---

Check the app the way a person uses it, from a throwaway script in your scratchpad, against an isolated server.

1. Start the server: `scripts/browser-check/server.sh start <scratchpad>/server.log`. It builds the client and serves it on port 3100, apart from the dev server the user keeps open.
2. Write `<scratchpad>/check.mts` (`.mts`, so top-level `await` works outside the repo), importing the helpers by absolute path from `scripts/browser-check/browser.ts`:
   - `launch()` opens Chromium;
   - `join(browser, room, name, { viewport, colorScheme, reducedMotion })` opens one Participant in its own context and joins through the join screen;
   - `becomeObserver(page)` clicks the role toggle;
   - `bot(room, name, role)` adds a socket-only Participant, cheap for filling a Room or walking a bot Ghost (`bot.socket.emit("moveGhost", …)`).

   Use a fresh Room name per run. Drive every action with real input: `page.mouse.click`, `locator.click()`, `page.keyboard.press`. Real input is the check: a script that calls `focus()` or dispatches events itself reaches states a person never can. (Ticket 03's arrow keys passed that way while doing nothing for a real user.)

3. Run it from the repo root: `npx tsx <scratchpad>/check.mts`. Save screenshots to the scratchpad and Read them; look at every one you take.
4. Stop: `scripts/browser-check/server.sh stop` stops the server and deletes `dist/`.

The check is done when every case the ticket names ran with real input and you looked at its screenshot.

## Reference

- **Turned screens:** each Voter's screen turns the Table so their own seat is at the bottom. Check a position-dependent change from at least two Voters' screens.
- **Disconnects:** `context.setOffline(true)` leaves the Socket.IO WebSocket open. To drop every connection, run `server.sh restart`. It also empties every Room, so the first browser back becomes Facilitator.
- **Live site:** headless Chromium rejects public HTTPS on this network (TLS interception). Check the Render deploy with `curl` and leave its browser checks to the user.
- **Scenario bots:** `scripts/scenarios.ts` plays the Outlier scenarios with bot Voters and wandering bot Ghosts. Point it at this server with `SERVER_URL=http://localhost:3100`.
