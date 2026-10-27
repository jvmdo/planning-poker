# 08: Deploy to Render

**What to build:** The app runs at a public URL on Render's free tier, so the team can use it in a real meeting and every later ticket ships to it. One Node process serves the production client build and Socket.IO on the port Render provides, as a single instance, per ADR 0001. A short README explains how to deploy, how to run it locally, and how to expose a local run through a tunnel (ngrok or Cloudflare Tunnel) as a fallback.

**Blocked by:** 01 (Walking skeleton: join the Room and see who's here)

**Status:** ready-for-agent

- [ ] One build command produces the production client and server. One start command runs the single Node process that serves both on the port from the environment.
- [ ] A Render config deploys it as a free web service with exactly one instance, and notes why the instance count must never rise (ADR 0001).
- [ ] The deployed app works end to end: two people on different networks can join and see each other live.
- [ ] While Render wakes the service (~1 minute), the browser shows Render's loading page or the app's connecting state, never a broken page.
- [ ] The README covers local development, deploying to Render, and running locally behind a tunnel.
