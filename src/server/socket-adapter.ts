import type { Server } from "socket.io";
import type {
  ClientToServerEvents,
  CommandResult,
  ParticipantId,
  Rejection,
  RoomId,
  ServerToClientEvents,
} from "../shared/protocol.js";
import { parseRoomId } from "../shared/room-id.js";
import type { Room } from "./room.js";
import type { Rooms } from "./rooms.js";

interface SocketData {
  /** The Room this connection is for, sent in its handshake. */
  roomId: RoomId;
  participantId?: ParticipantId;
}

export type RoomServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

/**
 * The Socket.IO room holding a Room's sockets. Prefixed, because Socket.IO also puts each socket in
 * a room named after its socket ID, which a Room ID could otherwise match.
 */
function channelOf(roomId: RoomId): string {
  return `room:${roomId}`;
}

/**
 * Translates socket events into Room commands and sends each socket its own snapshot after every
 * change. Holds no rules. A socket that joins is put in the Socket.IO room named after its Room ID,
 * and a Room's updates go only to that Socket.IO room, never to every socket on the server. Never
 * broadcast a snapshot to a whole Room, because what a Participant may see depends on who they
 * are. Reactions, Throws, Nudges, Deck changes, Auto Reveal changes and Ghost moves hold no
 * Votes, so they are broadcast within the Room.
 */
export function attachRooms(io: RoomServer, rooms: Rooms): void {
  /** The sockets that have joined this Room as a Participant. */
  function socketsIn(roomId: RoomId) {
    const ids =
      io.sockets.adapter.rooms.get(channelOf(roomId)) ?? new Set<string>();
    return [...ids].flatMap((id) => {
      const socket = io.sockets.sockets.get(id);
      return socket ? [socket] : [];
    });
  }

  rooms.subscribeToNewRooms((roomId, room) => {
    room.subscribe(() => {
      for (const socket of socketsIn(roomId)) {
        const { participantId } = socket.data;
        if (participantId)
          socket.emit("snapshot", room.snapshotFor(participantId));
      }
    });
    room.subscribeToFun((event) => io.to(channelOf(roomId)).emit("fun", event));
    room.subscribeToDeckChanges((by) =>
      io.to(channelOf(roomId)).emit("deckChanged", by),
    );
    room.subscribeToAutoRevealChanges((by, on) =>
      io.to(channelOf(roomId)).emit("autoRevealChanged", by, on),
    );
    room.subscribeToGhosts((move) =>
      io.to(channelOf(roomId)).emit("ghostMoved", move),
    );
  });

  io.on("connection", (socket) => {
    const roomId = parseRoomId(socket.handshake.query.room);
    if (roomId === null) {
      socket.disconnect(true);
      return;
    }
    socket.data.roomId = roomId;
    /** This socket's Room, from its first accepted join on. */
    let room: Room | undefined;

    socket.on("join", (id, name, role) => {
      if (typeof id !== "string" || typeof name !== "string") return;
      // Each socket is one connection, so a repeated join from it mustn't be counted twice.
      if (room && socket.data.participantId === id) {
        socket.emit("snapshot", room.snapshotFor(id));
        return;
      }

      const result = rooms.join(roomId, id, name, role);
      if (!result.ok) {
        socket.emit("rejected", { command: "join", reason: result.reason });
        return;
      }
      // This socket no longer speaks for any Participant it joined as before.
      if (room && socket.data.participantId)
        room.disconnect(socket.data.participantId);
      room = result.room;
      // The change notification fired before this socket was tied to the Participant.
      socket.data.participantId = id;
      void socket.join(channelOf(roomId));
      socket.emit("snapshot", room.snapshotFor(id));
    });

    socket.on("disconnect", () => {
      const { participantId } = socket.data;
      if (room && participantId) room.disconnect(participantId);
    });

    /** Runs a command as this socket's Participant and tells only this socket if it's refused. */
    function act<Command extends Rejection["command"]>(
      command: Command,
      run: (
        room: Room,
        id: ParticipantId,
      ) => CommandResult<Extract<Rejection, { command: Command }>["reason"]>,
    ) {
      const { participantId } = socket.data;
      if (!room || !participantId) return;

      const result = run(room, participantId);
      if (!result.ok) {
        socket.emit("rejected", {
          command,
          reason: result.reason,
        } as Rejection);
      }
    }

    socket.on("vote", (card) => act("vote", (room, id) => room.vote(id, card)));
    socket.on("reveal", () => act("reveal", (room, id) => room.reveal(id)));
    socket.on("newRound", () =>
      act("newRound", (room, id) => room.newRound(id)),
    );
    socket.on("setDeck", (cards) => {
      if (!Array.isArray(cards)) return;
      act("setDeck", (room, id) => room.setDeck(id, cards));
    });
    socket.on("setAutoReveal", (on) => {
      if (typeof on !== "boolean") return;
      act("setAutoReveal", (room, id) => room.setAutoReveal(id, on));
    });
    socket.on("becomeVoter", () =>
      act("becomeVoter", (room, id) => room.becomeVoter(id)),
    );
    socket.on("becomeObserver", () =>
      act("becomeObserver", (room, id) => room.becomeObserver(id)),
    );
    socket.on("handOver", (to) => {
      if (typeof to !== "string") return;
      act("handOver", (room, id) => room.handOver(id, to));
    });
    socket.on("claimFacilitator", () =>
      act("claimFacilitator", (room, id) => room.claimFacilitator(id)),
    );
    socket.on("react", (reaction) => {
      if (typeof reaction !== "string") return;
      act("react", (room, id) => room.react(id, reaction));
    });
    socket.on("throwAt", (to, item) => {
      if (typeof to !== "string" || typeof item !== "string") return;
      act("throwAt", (room, id) => room.throwAt(id, to, item));
    });
    socket.on("nudge", (to) => {
      if (typeof to !== "string") return;
      act("nudge", (room, id) => room.nudge(id, to));
    });
    socket.on("summonGhost", (skin, roll) =>
      act("summonGhost", (room, id) => room.summonGhost(id, skin, roll)),
    );
    socket.on("dressGhost", (skin) =>
      act("dressGhost", (room, id) => room.dressGhost(id, skin)),
    );
    socket.on("dismissGhost", () =>
      act("dismissGhost", (room, id) => room.dismissGhost(id)),
    );
    socket.on("moveGhost", (to) =>
      act("moveGhost", (room, id) => room.moveGhost(id, to)),
    );
    socket.on("leave", () => {
      const { participantId } = socket.data;
      if (!room || !participantId) return;
      // Every tab of this browser in this Room is the same Participant, so they all leave together.
      const tabs = socketsIn(roomId).filter(
        (s) => s.data.participantId === participantId,
      );
      for (const tab of tabs) {
        tab.data.participantId = undefined;
        void tab.leave(channelOf(roomId));
      }
      room.leave(participantId);
      for (const tab of tabs) tab.emit("left");
    });
  });
}
