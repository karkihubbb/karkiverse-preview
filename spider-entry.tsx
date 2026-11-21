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
    silkColor: "#f2eee8",
    bounceColor: "#0b0b0c",
    shadowColor: "#000000",
    size: window.matchMedia("(max-width: 760px)").matches ? 105 : 175,
    seedWebs: window.matchMedia("(max-width: 760px)").matches ? 7 : 12,
    maxThreads: window.matchMedia("(max-width: 760px)").matches ? 48 : 85,
    maxDpr: window.matchMedia("(max-width: 760px)").matches ? 1.5 : 2,
    zIndex: 20,
    fly: true,
    enter: true
  })
);
