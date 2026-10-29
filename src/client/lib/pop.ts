/** The bright colours Cards and Result bars cycle through, as Tailwind classes. */
const POP_BACKGROUNDS = [
  "bg-pop-1",
  "bg-pop-2",
  "bg-pop-3",
  "bg-pop-4",
  "bg-pop-5",
] as const;

export function popBackground(index: number) {
  return POP_BACKGROUNDS[index % POP_BACKGROUNDS.length];
}
