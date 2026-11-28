import type { ParticipantId, ParticipantView } from "../../shared/protocol.js";

export interface Seat {
  participant: ParticipantView;
  /** Where the seat sits on the Table's box, 0 (left) to 1 (right). */
  x: number;
  /** Where the seat sits on the Table's box, 0 (top) to 1 (bottom). */
  y: number;
}

export interface SeatLayout {
  /** Every Voter's seat: yours first, then on clockwise round the Table. */
  seats: Seat[];
  /** How far your screen turns the Table, in radians: back one seat-step per seat before yours. */
  turn: number;
}

/**
 * Where each Voter's seat sits round the Table on your screen. Seats sit round the oval at even
 * angles in Room order, the first Voter at the bottom. A Voter's screen turns the Table so their
 * own seat is at the bottom; an Observer's isn't turned.
 */
export function seatLayout(
  participants: ParticipantView[],
  myId: ParticipantId,
): SeatLayout {
  const voters = participants.filter((p) => p.role === "voter");
  if (voters.length === 0) return { seats: [], turn: 0 };
  // An Observer has no seat, so their screen isn't turned.
  const mySeatIndex = Math.max(
    0,
    voters.findIndex((p) => p.id === myId),
  );
  const step = (2 * Math.PI) / voters.length;
  const turn = -mySeatIndex * step;
  const seats = voters.map((participant, i) => {
    // From the bottom (90°), clockwise round the ellipse.
    const angle = Math.PI / 2 + i * step + turn;
    return {
      participant,
      x: 0.5 + 0.5 * Math.cos(angle),
      y: 0.5 + 0.5 * Math.sin(angle),
    };
  });
  return {
    seats: [...seats.slice(mySeatIndex), ...seats.slice(0, mySeatIndex)],
    turn,
  };
}
