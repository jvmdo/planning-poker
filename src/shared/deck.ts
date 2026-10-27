/** Every Card a Voter can play, each an Estimate in hours. */
export const DECK = [1, 2, 4, 6, 8, 10, 12, 16, 24, 32, 64] as const;

export type Card = (typeof DECK)[number];

export function isCard(value: unknown): value is Card {
  return DECK.includes(value as Card);
}
