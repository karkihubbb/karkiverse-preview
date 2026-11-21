import React from "react";
import { createRoot } from "react-dom/client";
import GlyphCurtainHero from "./components/glyph-curtain-hero";

const mount = document.getElementById("glyph-curtain-mount");
if (mount) {
  createRoot(mount).render(
    React.createElement(GlyphCurtainHero, {
      initialIndex: 2,
      cta: "Explore KarkiVerse",
      onCta: () => document.getElementById("world")?.scrollIntoView({ behavior: "smooth" })
    })
  );
}
