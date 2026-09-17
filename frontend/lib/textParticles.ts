"use client";

/**
 * Rasterize display text and sample its glyphs into a cloud of 3D points.
 * Used to build the AVENGERS / DOOMSDAY title *out of particles* — the same
 * cloud assembles into the words and later shatters apart on scroll.
 */

export interface TextSample {
  /** x,y,z triplets (z=0), centered on the origin, in world units. */
  positions: Float32Array;
  /** 0..1 brightness jitter per point. */
  brightness: Float32Array;
  count: number;
  worldWidth: number;
  worldHeight: number;
}

/** Resolve the generated family name behind a CSS custom property. */
function resolveFontFamily(cssVar: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;left:-9999px;font:1px ${cssVar}`;
  document.body.appendChild(probe);
  const fam = getComputedStyle(probe).fontFamily || fallback;
  probe.remove();
  return fam;
}

export interface SampleOptions {
  lines: string[];
  targetWorldWidth: number;
  fontCssVar?: string; // defaults to the display face
  fontFallback?: string;
  weight?: number | string;
  fontSize?: number; // px in the raster space
  lineGap?: number; // fraction of fontSize between lines
  letterSpacing?: number; // px
  step?: number; // sampling grid in px
  maxPoints?: number;
}

/** Wait until webfonts are ready so the raster matches the on-screen face. */
export async function fontsReady() {
  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await (document as Document).fonts.ready;
    } catch {
      /* noop */
    }
  }
}

export function sampleText(opts: SampleOptions): TextSample {
  const {
    lines,
    targetWorldWidth,
    fontCssVar = "var(--font-display)",
    fontFallback = '"Arial Narrow", sans-serif',
    weight = 400,
    fontSize = 190,
    lineGap = 0.02,
    letterSpacing = 6,
    step = 4,
    maxPoints = 16000,
  } = opts;

  const family = resolveFontFamily(fontCssVar, fontFallback);
  const font = `${weight} ${fontSize}px ${family}`;

  // Measure with a scratch context first.
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = font;
  const spacedWidth = (text: string) =>
    [...text].reduce((w, ch) => w + measure.measureText(ch).width + letterSpacing, 0) -
    letterSpacing;

  const lineWidths = lines.map(spacedWidth);
  const maxLineW = Math.max(1, ...lineWidths);
  const lineH = fontSize * (1 + lineGap);

  const pad = Math.ceil(fontSize * 0.4);
  const cw = Math.ceil(maxLineW + pad * 2);
  const ch = Math.ceil(lineH * lines.length + pad * 2);

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = font;

  // Draw each line centered, letter-spaced by hand for consistency.
  lines.forEach((text, i) => {
    const y = pad + lineH * (i + 0.5);
    let x = (cw - lineWidths[i]) / 2;
    for (const chr of text) {
      ctx.fillText(chr, x, y);
      x += ctx.measureText(chr).width + letterSpacing;
    }
  });

  const data = ctx.getImageData(0, 0, cw, ch).data;
  const scale = targetWorldWidth / cw;

  // Collect glyph pixels on a jittered grid.
  const xs: number[] = [];
  const ys: number[] = [];
  const br: number[] = [];
  for (let py = 0; py < ch; py += step) {
    for (let px = 0; px < cw; px += step) {
      const a = data[(py * cw + px) * 4 + 3];
      if (a > 130) {
        const jx = px + (Math.random() - 0.5) * step;
        const jy = py + (Math.random() - 0.5) * step;
        xs.push((jx - cw / 2) * scale);
        ys.push((ch / 2 - jy) * scale);
        br.push(0.55 + Math.random() * 0.45);
      }
    }
  }

  let count = xs.length;
  let idx = xs.map((_, i) => i);
  if (count > maxPoints) {
    // Random thinning to hold the point budget.
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    idx = idx.slice(0, maxPoints);
    count = maxPoints;
  }

  const positions = new Float32Array(count * 3);
  const brightness = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const s = idx[i];
    positions[i * 3] = xs[s];
    positions[i * 3 + 1] = ys[s];
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.06; // faint depth
    brightness[i] = br[s];
  }

  return {
    positions,
    brightness,
    count,
    worldWidth: cw * scale,
    worldHeight: ch * scale,
  };
}
