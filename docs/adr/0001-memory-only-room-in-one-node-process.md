# Room state lives in memory, in exactly one Node process

The app is one Node process that serves the React build and a Socket.IO server, hosted on Render's free tier. Every Room lives only in that process's memory: no database, no Redis, no history. A Room that exists only for the length of a meeting has nothing worth persisting, and keeping it in memory removes every moving part except the process itself.

## Considered Options

- **Vercel Functions with WebSockets**: rejected. On Hobby, connections are cut after 300s at most, and clients can land on different instances, so Room state would need Redis.
- **Polling against Vercel plus Redis**: rejected because it needs an external store to work.
- **Firebase Realtime Database with security rules, no server**: workable, but it splits the Room rules between browser code and a rules file, and makes the Facilitator grace-period timers awkward.
- **Fly.io**: equivalent design, wakes in seconds instead of ~1 minute, but costs a little and defaults to two machines.

## Consequences

- **Never run more than one instance.** A second instance means a second, separate set of Rooms: two people at the same Room ID could land in different Rooms. Render's free tier can't scale past one instance. On any other host, pin the instance count to 1.
- A restart or redeploy wipes every Room. Clients reconnect and silently rejoin the Room in their URL, and in each Room the first one back becomes Facilitator. This is accepted.
- A Render pull request preview is a separate app with its own process and its own Rooms, so it doesn't break the one-instance rule.
- The first visit after ~15 minutes of inactivity waits ~1 minute for Render to wake the service.
