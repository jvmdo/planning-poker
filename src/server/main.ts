import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server } from "socket.io";
import { createRoom } from "./room.js";
import { attachRoom, type RoomServer } from "./socket-adapter.js";

const port = Number(process.env.PORT ?? 3000);
const clientDir = fileURLToPath(new URL("../../dist/client", import.meta.url));

const app = express();
app.use(express.static(clientDir));

const httpServer = createServer(app);
const io: RoomServer = new Server(httpServer);
attachRoom(io, createRoom());

httpServer.listen(port, () => {
  console.log(`Planning Poker listening on http://localhost:${port}`);
});
