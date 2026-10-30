import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

/**
 * A spinner for a button whose command is waiting on the server. Appears only if the server takes
 * noticeably long, so quick answers don't flicker.
 */
export function Waiting(): ReactNode {
  return (
    <LoaderCircle
      aria-hidden
      className="size-4 opacity-0 [animation:spin_1s_linear_infinite,appear_0s_150ms_forwards]"
    />
  );
}
