# 11: Move the Render service to Virginia

**What to build:** The service runs in Render's default region, Oregon, so every action from Brazil takes about 230–280 ms to reach the server and come back (measured 2026-10-29: ~25 ms to Cloudflare's edge in São Paulo, the rest to Oregon). Virginia is Render's closest region to Brazil and should cut roughly 60–100 ms from every action, for everyone. Ticket 10 hides the delay only for your own Card and role; this shortens it for everything the team sees.

**Blocked by:** none

**Status:** ready-for-human

- [ ] `render.yaml` sets `region: virginia`.
- [ ] A new service is created from the Blueprint in Virginia, and the Oregon service is deleted. Render can't move an existing service, so the URL changes.
- [ ] The README and ticket 08 point at the new URL, and the team has it.
- [ ] A measured round trip from Brazil is shorter than before.
