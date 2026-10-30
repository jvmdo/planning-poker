# 19: Notices as a toast

**What to build:** The short notices stop appearing in the strip between the status bar and the table, where each one pushes the table down and back up again. Instead they float as a toast over the top-right corner of the table area, under the status bar, where the oval leaves room and no seat is covered. The table never changes size or position when one appears or goes. This is the first of three tickets that empty the strip; ticket 21 deletes it.

The notices are the ones the Room shows today: "The Facilitator changed the Deck.", "That Participant has just left the Room.", "The Votes were revealed before your Card arrived.", "There are no Votes to reveal any more." and "Someone else became the Facilitator first."

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] Each notice shows as a toast over the top-right corner of the table area, overlapping the table rather than taking room from it. It doesn't cover a seat, the hand or the status bar's controls.
- [x] Behaviour is as today: one notice at a time, a newer one replaces the one showing, and each disappears after 4 seconds. The existing notice state and timer are reused; no toast library is added.
- [x] Screen readers still announce each notice when it appears.
- [x] It slides or fades in and out; with "reduce motion" on, it only fades.
- [x] It reads well in the light and dark themes, in the app's playful style (ink border, hard shadow).
- [x] Clicks on the table around the toast still reach seats, so Reactions and Throws work next to it.
- [x] The connection message and the "Become Facilitator" banner stay in the strip for now (tickets 20 and 21).
- [x] Checked in a browser at 1024×720 and 1920×1080: the table's box is identical before, during and after a notice.

**Built (2026-10-30).** `NoticeToast` (`notice-toast.tsx`) floats over the table area's top-right corner, in a `relative` wrapper round `RoomTable` in `app.tsx`; the notice state and 4-second timer in `use-room.ts` are unchanged. The toast stays mounted and changes classes, so it slides in and out (only fades with reduced motion) and keeps the last notice's text while it leaves. Screen readers hear each notice from an always-present `role="alert"` paragraph; the visible toast is `aria-hidden` and `pointer-events-none`.

- **Agreed deviation: it can touch a seat at 1024×720.** Measured there, the corner has only about 150×36px that no seat can reach (seats sit half outside the oval, with names up to 112px wide), against about 300px for the longest notice on one line. The user chose a narrow toast that wraps (`clamp(14rem, 22vw, 26rem)` wide) over moving it into the oval or truncating. With many Voters or long names it may partly cover the top-right seat's name for its 4 seconds; clicks still reach the seat. Clear of every seat position from 1366×768 up.
- **It covers the "Watching" line** while it shows, since that line holds the same corner.
- **The join screen no longer shows notices.** Only joined Participants get them, and its `alerts` now carry just the connection message.
- **Same as before:** a repeat of the same notice text within 4 seconds doesn't restart the timer or announce again, because the state is a plain string.
- **Checked** in headless Chromium on a production build at 1024×720 and 1920×1080, light and dark, with 7 Voters and an Observer: the table section's and the oval's boxes are identical before, during and after a notice; the toast misses the status bar and the seats; the alert empties after 4 seconds; with reduced motion only opacity transitions; a click on the top-right seat while the toast shows opens its Throw deck.
- **Review (standards and spec):** no breaches. `last` renamed `shown`. Kept: the `alerts` name for the join screen's connection message (ticket 20 moves it), and the toast's offsets living outside `RoomTable`.
