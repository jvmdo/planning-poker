import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server } from "socket.io";
import { createRooms } from "./rooms.js";
import { attachRooms, type RoomServer } from "./socket-adapter.js";

const port = Number(process.env.PORT ?? 8000);
const clientDir = fileURLToPath(new URL("../../dist/client", import.meta.url));

const app = express();
app.use(express.static(clientDir));
// Every other path without a dot is a Room's URL (or not a valid one, which the app says).
app.get(/^[^.]*$/, (_req, res) => {
  res.sendFile("index.html", { root: clientDir });
});

const httpServer = createServer(app);
const io: RoomServer = new Server(httpServer);

// Development only: delays every incoming command, to feel the deployed app's latency locally.
const simulatedLatencyMs = Number(process.env.SIMULATED_LATENCY_MS ?? 0);
if (simulatedLatencyMs > 0 && process.env.NODE_ENV !== "production") {
  io.on("connection", (socket) =>
    socket.use((_packet, next) => setTimeout(next, simulatedLatencyMs)),
  );
}
attachRooms(io, createRooms());

httpServer.listen(port, () => {
  console.log(`Planning Poker listening on http://localhost:${port}`);
});
