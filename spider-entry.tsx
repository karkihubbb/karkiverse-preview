import React from "react";
import { createRoot } from "react-dom/client";
import SilkSpiderCursor from "./components/silk-spider-cursor";

const host = document.createElement("div");
host.id = "silk-spider-root";
host.setAttribute("aria-hidden", "true");
document.body.appendChild(host);

createRoot(host).render(
  React.createElement(SilkSpiderCursor, {
    anchorSelector: "a, h1, h2, h3, .world-row, .page-title, .photo, .game-panel, .voice-tool, .ai-feature, .section-label",
    silkColor: "#2b2620",
    bounceColor: "#e9e3d4",
    shadowColor: "#6f675b",
    size: window.matchMedia("(max-width: 760px)").matches ? 92 : 155,
    seedWebs: window.matchMedia("(max-width: 760px)").matches ? 0 : 12,
    maxThreads: window.matchMedia("(max-width: 760px)").matches ? 0 : 70,
    maxDpr: window.matchMedia("(max-width: 760px)").matches ? 1.5 : 2,
    zIndex: 20,
    fly: false,
    enter: !window.matchMedia("(max-width: 760px)").matches
  })
);
