# 08: Deploy to Render

**What to build:** The app runs at a public URL on Render's free tier, so the team can use it in a real meeting and every later ticket ships to it. One Node process serves the production client build and Socket.IO on the port Render provides, as a single instance, per ADR 0001. A short README explains how to deploy, how to run it locally, and how to expose a local run through a tunnel (ngrok or Cloudflare Tunnel) as a fallback.

**Blocked by:** 01 (Walking skeleton: join the Room and see who's here)

**Status:** ready-for-agent

- [x] One build command produces the production client and server. One start command runs the single Node process that serves both on the port from the environment.
- [x] A Render config deploys it as a free web service with exactly one instance, and notes why the instance count must never rise (ADR 0001).
- [x] The deployed app works end to end: two people on different networks can join and see each other live.
- [x] While Render wakes the service (~1 minute), the browser shows Render's loading page or the app's connecting state, never a broken page.
- [x] The README covers local development, deploying to Render, and running locally behind a tunnel.

## Comments

**Deployed (2026-10-29)** at https://planning-poker-vyuq.onrender.com, from the `render.yaml` Blueprint, redeploying on every push to `main`. Notes:

- **Build:** `npm run build` runs `vite build`, then `tsc -p tsconfig.build.json` compiles the server and shared code into `dist/`. `npm start` runs `node dist/server/main.js`. The Blueprint installs dev dependencies explicitly, because Vite and TypeScript are dev dependencies.
- **Checked:** locally, the production build on port 3100 with two browsers voting live. On Render, the page, the client bundle and the Socket.IO handshake answer (`upgrades: ["websocket"]`). A scripted browser run against Render wasn't possible from the corporate network, which re-signs TLS with its own certificate (Cato Networks).
- **Manual checks (2026-10-29):** two people on different networks joined, saw each other live, voted and revealed. A wake-up from sleep showed the loading or connecting state, never a broken page.
