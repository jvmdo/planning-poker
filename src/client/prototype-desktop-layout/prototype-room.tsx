// PROTOTYPE, throw me away. Renders the chosen layout variant plus the floating switcher.
import type { ReactNode } from "react";
import {
  PrototypeSwitcher,
  useVariant,
  withFakes,
  type RoomViewProps,
} from "./shared";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

/** Hidden in production builds so a stray merge can't ship the prototype. */
export const PROTOTYPE_ENABLED = import.meta.env.DEV;

export function PrototypeRoom({
  current,
  ...props
}: RoomViewProps & {
  /** The existing layout, kept as a variant for comparison. */
  current: ReactNode;
}) {
  const [variant, select] = useVariant();
  const view = { ...props, snapshot: withFakes(props.snapshot) };
  return (
    <>
      {variant === "A" && <VariantA {...view} />}
      {variant === "B" && <VariantB {...view} />}
      {variant === "C" && <VariantC {...view} />}
      {variant === "current" && current}
      <PrototypeSwitcher variant={variant} onSelect={select} />
    </>
  );
}
