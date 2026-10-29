# Planning Poker

A real-time planning poker app for one team. Everyone joins a single Room with a display name, plays a Card in secret, and the Facilitator reveals every Vote at once along with the Result: the mean, in hours. The vocabulary is defined in [GLOSSARY.md](GLOSSARY.md).

One Node process serves the React build and a Socket.IO server, and the Room lives only in its memory ([ADR 0001](docs/adr/0001-memory-only-room-in-one-node-process.md)).

## Run it locally

Requires Node 24 or later.

```sh
npm install
npm run dev
```

Open http://localhost:5173. Vite serves the client with hot reload and proxies Socket.IO to the server on port 3000, which restarts on change. Open a second browser profile or a private window to join as another Participant.

Other scripts: `npm test`, `npm run typecheck`, `npm run lint`, `npm run format`.

## Run the production build

```sh
npm run build   # client into dist/client, server into dist/server
npm start       # serves both on $PORT (default 3000)
```

## Deploy to Render

The repo has a [Render Blueprint](render.yaml): one free web service, built with `npm run build` and started with `npm start` on the port Render provides.

1. In the Render dashboard, choose **New → Blueprint** and connect this GitHub repo.
2. Accept the `planning-poker` service it finds and click **Apply**.
3. Share the `https://planning-poker-….onrender.com` URL with the team.

Every push to `main` redeploys automatically.

Things to know:

- **Exactly one instance, always.** The Room is in-process memory, so a second instance would be a second, separate Room. The free plan can't scale out; on a paid plan, keep the instance count at 1.
- **It sleeps.** After about 15 minutes without traffic, the free service stops. The next visit waits about a minute while Render wakes it, showing Render's loading page, then the app's "Connecting…" message.
- **A redeploy wipes the Room.** Everyone's browser reconnects and rejoins on its own; the first one back becomes Facilitator. Avoid pushing to `main` during a meeting.

## Fallback: run it locally behind a tunnel

If Render is down, run the production build on your machine and expose it with a tunnel. Socket.IO works through both options below.

```sh
npm run build && npm start
```

Then, in another terminal, either:

- **Cloudflare Tunnel** (no account needed): `cloudflared tunnel --url http://localhost:3000`, and share the `https://….trycloudflare.com` URL it prints.
- **ngrok** (free account): `ngrok http 3000`, and share the `https://….ngrok-free.app` URL. Visitors click through ngrok's warning page once.

The Room lives on your machine, so it ends when you stop the server or your computer sleeps.
