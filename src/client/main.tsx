import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { pageRoom } from "./lib/page-room";
import { NotARoom } from "./not-a-room";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {pageRoom.valid ? <App roomId={pageRoom.roomId} /> : <NotARoom />}
  </StrictMode>,
);
