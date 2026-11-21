"use client";

import * as React from "react";

export interface GlyphCurtainDestination {
  name: string;
  word: string;
  gloss: string;
  headline: string;
  caption: string;
  glyphs: string;
  glyphFont: string;
  roof: { src: string; width: number; height: number; scale: number; eave: number; span: number };
}

export interface GlyphCurtainHeroProps {
  destinations?: GlyphCurtainDestination[];
  initialIndex?: number;
  cta?: string;
  onCta?: () => void;
  onChange?: (index: number) => void;
  height?: string;
  fontHref?: string | null;
  className?: string;
}

const FONT_HREF = "https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=IBM+Plex+Mono:wght@400;500&family=Noto+Serif+SC:wght@600&family=Noto+Serif+JP:wght@600&display=swap";
const IMG = "https://kedhar-components.pages.dev/glyph-curtain-hero/";
const CJK_SC = "'Noto Serif SC', 'Songti SC', 'SimSun', serif";
const CJK_JP = "'Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', serif";
const MONO = "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace";

export const DEFAULT_DESTINATIONS: GlyphCurtainDestination[] = [
  {
    name: "Vietnam", word: "Quê nhà", gloss: "(kweh nyah) The place that raised you",
    headline: "lantern rivers, rice terraces, and roofs shaped like boats",
    caption: "Drift past lantern-lit shophouses, climb green terraces, and eat where the market wakes up.",
    glyphs: "dòng sông xanh chảy qua cánh đồng lúa chín, đèn lồng đỏ treo trên phố cổ, mưa chiều rơi trên mái ngói, con đò nhỏ chờ ở bến, tiếng chuông chùa vọng xa, chợ sớm thơm mùi cà phê và bánh mì nóng ",
    glyphFont: MONO, roof: { src: IMG + "vietnam.webp", width: 1280, height: 314, scale: 0.92, eave: 0.97, span: 0.8 }
  },
  {
    name: "China", word: "知音", gloss: "(Zhīyīn) A friend who hears your music",
    headline: "vermilion halls, tea-steam mornings, roofs that curl at the sky",
    caption: "Walk palace courtyards at dawn, sip from the hill farms, and read a thousand years of ink.",
    glyphs: "山高水长春风化雨静水流深千里之行始于足下知音难觅高山流水一叶知秋落花流水青山绿水日出而作日落而息云开月明海阔天空风和日丽鸟语花香细水长流一路平安",
    glyphFont: CJK_SC, roof: { src: IMG + "china.webp", width: 1280, height: 531, scale: 1, eave: 0.985, span: 0.74 }
  },
  {
    name: "Japan", word: "木漏れ日", gloss: "(Komorebi) Sunlight through leaves",
    headline: "cedar shrines, quiet lanterns, and a craft for every season",
    caption: "Cross mossy stones to the temple bell, and stay where the bath is hot and the hour is slow.",
    glyphs: "木漏れ日の中を歩くと静かな寺の鐘が遠くで鳴る苔むした石段を上り朱色の門をくぐる湯気の向こうに山が見え季節ごとに手仕事が生まれる一期一会の旅心に残る風景をゆっくりと",
    glyphFont: CJK_JP, roof: { src: IMG + "japan.webp", width: 1280, height: 363, scale: 0.78, eave: 0.98, span: 0.86 }
  },
  {
    name: "Kazakhstan", word: "Жайлау", gloss: "(Jailau) The summer pasture",
    headline: "open steppe, felt walls, and a sky that keeps going",
    caption: "Ride out past the last road, sleep under a crown of poles, and wake to horses at the door.",
    glyphs: "ұлы дала кең жайлау жел соғады киіз үйдің шаңырағынан көк аспан көрінеді жылқылар таңертең келеді жолың болсын қош келдіңіз ",
    glyphFont: MONO, roof: { src: IMG + "kazakhstan.webp", width: 1280, height: 534, scale: 0.68, eave: 0.97, span: 0.9 }
  },
  {
    name: "Russia", word: "Тоска", gloss: "(Toska) A longing with no name",
    headline: "carved timber, birch light, and winters that tell stories",
    caption: "Take the slow train north to painted wooden houses, river ice and a samovar always on.",
    glyphs: "берёзы у реки резной деревянный дом долгая снежная зима тёплый чай из самовара тихая река подо льдом поезд идёт на север дорога домой ",
    glyphFont: MONO, roof: { src: IMG + "russia.webp", width: 1280, height: 815, scale: 0.6, eave: 0.98, span: 0.74 }
  }
];

type Strand = { ax: number; ay: number; u: Float32Array; v: Float32Array; chars: string[]; phase: number };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function GlyphCurtainHero({
  destinations = DEFAULT_DESTINATIONS,
  initialIndex = 2,
  cta = "Explore KarkiVerse",
  onCta,
  onChange,
  height,
  fontHref = FONT_HREF,
  className
}: GlyphCurtainHeroProps) {
  const [index, setIndex] = React.useState(() => clamp(initialIndex, 0, destinations.length - 1));
  const [changing, setChanging] = React.useState(false);
  const rootRef = React.useRef<HTMLElement | null>(null);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const roofRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const strandsRef = React.useRef<Strand[]>([]);
  const roofOriginRef = React.useRef(0);
  const roofDeltaRef = React.useRef(0);
  const pointerRef = React.useRef({ x: 0, y: 0, on: false });
  const busyRef = React.useRef(false);
  const timerRef = React.useRef<number[]>([]);
  const indexRef = React.useRef(index);
  indexRef.current = index;

  const dest = destinations[index];
  const prev = destinations[(index - 1 + destinations.length) % destinations.length];
  const next = destinations[(index + 1) % destinations.length];

  React.useEffect(() => {
    if (!fontHref) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontHref;
    document.head.appendChild(link);
    return () => { if (link.parentNode) link.parentNode.removeChild(link); };
  }, [fontHref]);

  const rebuild = React.useCallback(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const roof = roofRef.current;
    if (!root || !stage || !roof) return;
    const rootRect = root.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const roofRect = roof.getBoundingClientRect();
    const data = destinations[indexRef.current];
    const fontSize = Math.max(9, Math.min(12, Math.round(stageRect.width / 52)));
    const span = roofRect.width * data.roof.span;
    const columns = clamp(Math.round(span / (fontSize * 1.18)), 8, 58);
    const segment = fontSize * 1.12;
    const top = roofRect.top - rootRect.top + roofRect.height * data.roof.eave;
    const bottom = rootRect.height - (window.matchMedia("(max-width:820px)").matches ? 172 : 188);
    const rows = clamp(Math.floor((bottom - top) / segment), 7, 44);
    const chars = Array.from(data.glyphs);
    const left = roofRect.left - rootRect.left + (roofRect.width - span) / 2;
    roofOriginRef.current = roofRect.left - rootRect.left;
    roofDeltaRef.current = 0;
    const strands: Strand[] = [];

    for (let column = 0; column < columns; column++) {
      const anchor = left + (columns === 1 ? span / 2 : (span * column) / (columns - 1));
      const u = new Float32Array(rows);
      const v = new Float32Array(rows);
      const columnChars: string[] = [];
      for (let row = 0; row < rows; row++) columnChars.push(chars[(row * columns + column) % chars.length] || "");
      strands.push({ ax: anchor, ay: top, u, v, chars: columnChars, phase: column * 1.37 });
    }
    strandsRef.current = strands;
  }, [destinations]);

  React.useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!root || !stage || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 1;
    let heightPx = 1;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let elapsed = 0;
    let visible = !document.hidden;

    const resize = () => {
      const rect = root.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      width = rect.width;
      heightPx = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(heightPx * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    };

    const draw = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      elapsed += dt;
      ctx.clearRect(0, 0, width, heightPx);
      const pointer = pointerRef.current;
      const fontSize = Math.max(9, Math.min(12, Math.round((stage.getBoundingClientRect().width || width) / 52)));
      ctx.font = "500 " + fontSize + "px " + destinations[indexRef.current].glyphFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(43,38,32,.78)";
      const roof = roofRef.current;
      const rootRect = root.getBoundingClientRect();
      const roofRect = roof?.getBoundingClientRect();
      const roofDelta = roofRect ? roofRect.left - rootRect.left - roofOriginRef.current : roofDeltaRef.current;
      const roofStep = roofDelta - roofDeltaRef.current;
      roofDeltaRef.current = roofDelta;

      for (const strand of strandsRef.current) {
        if (Math.abs(roofStep) > 0.001) {
          for (let row = 1; row < strand.u.length; row++) {
            strand.u[row] -= roofStep * 0.08 * (row / strand.u.length);
          }
        }
        const count = strand.u.length;
        const xPositions = new Float32Array(count);
        let previousX = strand.ax + roofDelta;

        for (let row = 1; row < count; row++) {
          const below = row === count - 1 ? strand.u[row] : strand.u[row + 1];
          const tension = 0.16 + 0.3 * (1 - row / count);
          const breeze = reduced ? 0 : 0.025 * Math.sin(elapsed * 0.85 + strand.phase + row * 0.08) * (row / count);
          const acceleration = tension * (strand.u[row - 1] + below - 2 * strand.u[row]) - 0.0035 * strand.u[row] + breeze;
          strand.v[row] = reduced ? 0 : (strand.v[row] + acceleration) * 0.90;
        }
        for (let row = 1; row < count; row++) strand.u[row] += strand.v[row];

        for (let row = 0; row < count; row++) {
          const baseY = strand.ay + row * fontSize * 1.12;
          let x = strand.ax + roofDelta + strand.u[row];

          if (!reduced && pointer.on) {
            const dx = x - pointer.x;
            const dy = baseY - pointer.y;
            const radius = 34;
            if (Math.abs(dy) < radius && Math.abs(dx) < Math.sqrt(Math.max(0, radius * radius - dy * dy))) {
              const side = dx >= 0 ? 1 : -1;
              const edge = Math.sqrt(Math.max(0, radius * radius - dy * dy));
              const target = pointer.x + side * edge;
              strand.u[row] += (target - x) * 0.16;
              strand.v[row] *= 0.5;
              x = strand.ax + roofDelta + strand.u[row];
            }
          }

          const before = row ? strand.ax + roofDelta + strand.u[row - 1] : strand.ax + roofDelta;
          const after = row < count - 1 ? strand.ax + roofDelta + strand.u[row + 1] : x;
          const angle = -Math.atan2(after - before, fontSize * 2.1);
          const y = baseY + (row ? Math.abs(x - previousX) * 0.12 : 0);
          xPositions[row] = x;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.globalAlpha = 0.82;
          const glyph = strand.chars[row];
          if (glyph && glyph !== " ") ctx.fillText(glyph, 0, 0);
          ctx.restore();
          previousX = x;
        }
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    };

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pointerRef.current.x = event.clientX - rect.left;
      pointerRef.current.y = event.clientY - rect.top;
      pointerRef.current.on = event.pointerType !== "touch" || event.buttons > 0;
    };
    const onLeave = () => { pointerRef.current.on = false; };
    const onVisibility = () => {
      visible = !document.hidden;
      if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
      else if (!reduced && !raf) { last = 0; raf = requestAnimationFrame(draw); }
    };

    const observer = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    if (observer) observer.observe(root);
    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    resize();

    if (reduced) draw(0);
    else raf = requestAnimationFrame(draw);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (observer) observer.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [rebuild, destinations]);

  React.useEffect(() => {
    const id = requestAnimationFrame(() => rebuild());
    return () => cancelAnimationFrame(id);
  }, [index, rebuild]);

  React.useEffect(() => () => timerRef.current.forEach(clearTimeout), []);

  const go = (direction: number) => {
    if (busyRef.current || destinations.length < 2) return;
    const root = rootRef.current;
    const roof = roofRef.current;
    if (!root || !roof) return;
    const nextIndex = (indexRef.current + direction + destinations.length) % destinations.length;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    busyRef.current = true;
    setChanging(true);

    if (reduced) {
      setIndex(nextIndex);
      onChange?.(nextIndex);
      setChanging(false);
      busyRef.current = false;
      return;
    }

    const distance = root.getBoundingClientRect().width + roof.getBoundingClientRect().width;
    const shift = direction > 0 ? -distance : distance;
    roof.style.transition = "transform 420ms cubic-bezier(.65,0,.35,1)";
    roof.style.transform = "translate3d(calc(-50% + " + shift + "px),0,0)";

    timerRef.current.push(window.setTimeout(() => {
      setIndex(nextIndex);
      onChange?.(nextIndex);
      requestAnimationFrame(() => {
        roof.style.transition = "none";
        roof.style.transform = "translate3d(calc(-50% + " + (-shift) + "px),0,0)";
        void roof.offsetWidth;
        requestAnimationFrame(() => {
          roof.style.transition = "transform 560ms cubic-bezier(.22,1,.36,1)";
          roof.style.transform = "translate3d(-50%,0,0)";
          setChanging(false);
          timerRef.current.push(window.setTimeout(() => { busyRef.current = false; }, 580));
        });
      });
    }, 430));
  };

  const words = dest.headline.split(" ");
  const handleKey = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
  };

  return (
    <section
      ref={rootRef}
      className={"gch-root" + (className ? " " + className : "")}
      style={height ? { minHeight: height } : undefined}
      data-changing={changing ? "true" : "false"}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Travel destinations"
      onKeyDown={handleKey}
    >
      <canvas ref={canvasRef} className="gch-canvas" aria-hidden="true" />
      <div className="gch-head">
        <span>DESTINATIONS / 2026</span>
        <span>PLACES, LANGUAGE &amp; LIVING CULTURE</span>
      </div>
      <div className="gch-main">
        <button type="button" className="gch-card gch-prev" onClick={() => go(-1)} aria-label={"Previous: " + prev.name}>
          <img src={prev.roof.src} alt="" width={54} height={30} />
          <span>{prev.name}</span>
        </button>
        <div ref={stageRef} className="gch-stage">
          <div
            ref={roofRef}
            className="gch-roof"
            style={{ width: "min(100%, " + Math.round(680 * dest.roof.scale) + "px)" }}
          >
            <img
              key={dest.name}
              src={dest.roof.src}
              alt={dest.name + " roof illustration"}
              width={dest.roof.width}
              height={dest.roof.height}
              draggable={false}
              onLoad={() => rebuild()}
            />
          </div>
        </div>
        <button type="button" className="gch-card gch-next" onClick={() => go(1)} aria-label={"Next: " + next.name}>
          <img src={next.roof.src} alt="" width={54} height={30} />
          <span>{next.name}</span>
        </button>
        <div className="gch-copy" aria-live="polite">
          <p className="gch-eyebrow"><strong>{dest.word}</strong> &nbsp;{dest.gloss}</p>
          <h1 className="gch-title"><span>{dest.name}</span> <span className="gch-rule" /> {words.map((word, i) => <React.Fragment key={dest.name + "-" + i}>{word}{i < words.length - 1 ? " " : ""}</React.Fragment>)}</h1>
        </div>
        <p className="gch-caption">{dest.caption}</p>
      </div>
      <div className="gch-bottom">
        <span>MOVE THROUGH THE CURTAIN · USE ← → TO EXPLORE</span>
        <button className="gch-cta" type="button" onClick={onCta}>{cta}</button>
      </div>
    </section>
  );
}
