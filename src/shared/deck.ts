/** One Card a Voter can play: an Estimate in hours, a whole number from MIN_CARD to MAX_CARD. */
export type Card = number;

/** The Cards a Voter chooses from, sorted ascending, with no duplicates. */
export type Deck = readonly Card[];

/** The Deck a new Room starts with. */
export const DEFAULT_DECK: Deck = [1, 2, 4, 6, 8, 10, 12, 16, 24, 32, 64];

export const MIN_DECK_SIZE = 2;
export const MAX_DECK_SIZE = 15;
export const MIN_CARD = 1;
export const MAX_CARD = 99;

/** Why a Deck isn't valid. */
export type InvalidDeckReason =
  "not-a-card" | "too-few-cards" | "too-many-cards";

export type DeckResult =
  { ok: true; deck: Deck } | { ok: false; reason: InvalidDeckReason };

export function inDeck(value: unknown, deck: Deck): value is Card {
  return typeof value === "number" && deck.includes(value);
}

/** A whole number of hours a Card may have, in any Deck. */
function isCardValue(value: unknown): value is Card {
  return (
    Number.isInteger(value) &&
    (value as number) >= MIN_CARD &&
    (value as number) <= MAX_CARD
  );
}

/**
 * Makes a Deck of untrusted values, dropping duplicates and sorting it, or says what's wrong with
 * them. The Room enforces this; the Facilitator's dialog runs the same rule through `parseDeck`.
 */
export function toDeck(values: readonly unknown[]): DeckResult {
  if (!values.every(isCardValue)) return { ok: false, reason: "not-a-card" };
  const deck = [...new Set(values)].sort((a, b) => a - b);
  if (deck.length < MIN_DECK_SIZE) {
    return { ok: false, reason: "too-few-cards" };
  }
  if (deck.length > MAX_DECK_SIZE) {
    return { ok: false, reason: "too-many-cards" };
  }
  return { ok: true, deck };
}

/**
 * Reads a Deck typed as text, its Cards separated by commas or spaces. `notCards` lists the words
 * that aren't Cards, so they can be pointed out.
 */
export function parseDeck(text: string): DeckResult & { notCards: string[] } {
  const words = text.split(/[\s,]+/).filter((word) => word !== "");
  const notCards = words.filter(
    (word) => !/^\d+$/.test(word) || !isCardValue(Number(word)),
  );
  if (notCards.length > 0) return { ok: false, reason: "not-a-card", notCards };
  return { ...toDeck(words.map(Number)), notCards };
}

export function sameDeck(a: Deck, b: Deck): boolean {
  return a.length === b.length && a.every((card, index) => card === b[index]);
}
