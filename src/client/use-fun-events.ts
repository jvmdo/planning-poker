import { useEffect, useRef } from "react";
import type { FunEvent } from "../shared/fun";
import { socket } from "./lib/socket";

/** Calls `listener` with every Reaction and Throw in the Room, your own included. */
export function useFunEvents(listener: (event: FunEvent) => void) {
  const latest = useRef(listener);
  useEffect(() => {
    latest.current = listener;
  });
  useEffect(() => {
    const onFun = (event: FunEvent) => latest.current(event);
    socket.on("fun", onFun);
    return () => {
      socket.off("fun", onFun);
    };
  }, []);
}
