# Room state lives in memory, in exactly one Node process

The app is one Node process that serves the React build and a Socket.IO server, hosted on Render's free tier. The Room lives only in that process's memory: no database, no Redis, no history. A Room that exists only for the length of a meeting has nothing worth persisting, and keeping it in memory removes every moving part except the process itself.

## Considered Options

- **Vercel Functions with WebSockets**: rejected. On Hobby, connections are cut after 300s at most, and clients can land on different instances, so Room state would need Redis.
- **Polling against Vercel plus Redis**: rejected because it needs an external store to work.
- **Firebase Realtime Database with security rules, no server**: workable, but it splits the Room rules between browser code and a rules file, and makes the Facilitator grace-period timers awkward.
- **Fly.io**: equivalent design, wakes in seconds instead of ~1 minute, but costs a little and defaults to two machines.

## Consequences

- **Never run more than one instance.** A second instance means a second, separate Room. Render's free tier can't scale past one instance. On any other host, pin the instance count to 1.
- A restart or redeploy wipes the Room. Clients reconnect and silently rejoin, and the first one back becomes Facilitator. This is accepted.
- The first visit after ~15 minutes of inactivity waits ~1 minute for Render to wake the service.
