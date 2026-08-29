import React, { useState } from "react";
import { Asset, EventTheme } from "../types";
import {
  ShieldAlert,
  CheckCircle2,
  Globe,
  UtensilsCrossed,
  Smartphone,
  Filter,
  RefreshCw,
  Loader2,
  Wand2,
} from "lucide-react";

interface AssetGridProps {
  assets: Asset[];
  showAssets: boolean;
  assetQuotes?: Record<number, string>;
  onInspectHeldAsset?: () => void;
  eventTheme?: EventTheme;
  // When set, each card gets a "Regenerate" control (optionally steered by a
  // brand-manager-typed direction) that re-writes just that card's copy —
  // eventContext is passed to the AI as background on what's being promoted.
  editable?: boolean;
  eventContext?: string;
  onAssetsChange?: (updated: Asset[]) => void;
}

// One real, copyright-free (Wikimedia Commons, CC/public-domain licensed)
// landmark photo per WiMI cluster — see licence/attribution notes in
// src/assets/landmarks/README.md. Keyed by cluster code so any layout can
// look up a card's photo by `a.c`. Falls back to the vector LandmarkIcon
// silhouette below for any cluster that doesn't have a photo yet.
const landmarkPhotoModules = import.meta.glob("../assets/landmarks/*.jpg", {
  eager: true,
  import: "default",
}) as Record<string, string>;
const LANDMARK_PHOTOS: Record<string, string> = {};
for (const path in landmarkPhotoModules) {
  const match = path.match(/([A-Za-z]{2,3})\.jpg$/);
  if (match) LANDMARK_PHOTOS[match[1].toUpperCase()] = landmarkPhotoModules[path];
}
// Live-generated (non-preset) assets don't always come back with the cluster
// code cased exactly as given in the prompt — normalize before lookup so a
// stray lowercase "dl" doesn't silently lose its photo to the flat fallback.
const getLandmarkPhoto = (code: string | undefined | null): string | undefined =>
  LANDMARK_PHOTOS[(code || "").trim().toUpperCase()];

// Shared festival pool (Diwali/Navratri/Holi/etc.) — used whenever a card's
// event theme is "festival", regardless of cluster, since these scenes read
// as pan-Indian rather than tied to one specific region.
const festivalPhotoModules = import.meta.glob("../assets/festivals/*.jpg", {
  eager: true,
  import: "default",
}) as Record<string, string>;
const FESTIVAL_PHOTOS: string[] = Object.values(festivalPhotoModules);

// Shared soup pool — this app only ever advertises Knorr soup, so every
// non-landmark food photo is a bowl of soup, never any other snack or dish
// (an earlier region-specific "local cuisine" pool was removed for the same
// reason — it showed real regional dishes like biryani or dhokla as card
// backgrounds, which is off-brand for a soup-only product).
const soupPhotoModules = import.meta.glob("../assets/soups/*.jpg", {
  eager: true,
  import: "default",
}) as Record<string, string>;
const SOUP_PHOTOS: string[] = Object.values(soupPhotoModules);

// Picks the photo for a card: festival scenes for festival-themed triggers
// (rotating on `seed` for variety on regenerate), otherwise rotating between
// that region's own landmark and the shared soup pool. Never returns nothing
// if ANY pool has content for this card.
const getCardPhoto = (clusterCode: string | undefined | null, theme: EventTheme, seed: number): string | undefined => {
  if (theme === "festival" && FESTIVAL_PHOTOS.length > 0) {
    return FESTIVAL_PHOTOS[seed % FESTIVAL_PHOTOS.length];
  }
  const code = (clusterCode || "").trim().toUpperCase();
  const pool = [getLandmarkPhoto(code), ...SOUP_PHOTOS].filter((p): p is string => !!p);
  if (pool.length === 0) return undefined;
  return pool[seed % pool.length];
};

// Curated gradient pairs per event theme — real hex values (not Tailwind class
// names, which don't work as raw SVG stopColor) so live-generated cards always
// render an on-brand, harmonious gradient regardless of what the AI returns.
const PALETTES: Record<EventTheme, [string, string][]> = {
  cold: [["#0c4a6e", "#38bdf8"], ["#1e3a5f", "#60a5fa"], ["#0f2942", "#7dd3fc"]],
  rain: [["#1e293b", "#64748b"], ["#0f172a", "#475569"], ["#164e63", "#22d3ee"]],
  festival: [["#7c2d12", "#f59e0b"], ["#78350f", "#fbbf24"], ["#831843", "#f472b6"]],
  sport: [["#14532d", "#22c55e"], ["#052e16", "#4ade80"], ["#7c2d12", "#fb923c"]],
  default: [["#7c2d12", "#f97316"], ["#78350f", "#f59e0b"], ["#9a3412", "#fdba74"]],
};

const getPalette = (theme: EventTheme, idx: number): [string, string] => {
  const set = PALETTES[theme] || PALETTES.default;
  return set[idx % set.length];
};

// Subtle tiled background texture per theme, drawn under the headline for depth
// beyond a flat gradient — kept low-opacity so it never competes with the copy.
const BackgroundPattern: React.FC<{ theme: EventTheme; patternId: string }> = ({ theme, patternId }) => {
  const tiles: Record<EventTheme, React.ReactNode> = {
    cold: (
      <path d="M6 0v12M0 6h12" stroke="#fff" strokeWidth="1" opacity="0.5" />
    ),
    rain: <line x1="0" y1="16" x2="8" y2="0" stroke="#fff" strokeWidth="1.2" opacity="0.5" />,
    festival: <circle cx="6" cy="6" r="1.5" fill="#fff" opacity="0.6" />,
    sport: <path d="M0 12 L6 0 L12 12" stroke="#fff" strokeWidth="1" fill="none" opacity="0.5" />,
    default: <circle cx="4" cy="4" r="1.1" fill="#fff" opacity="0.5" />,
  };

  return (
    <>
      <defs>
        <pattern id={patternId} width="16" height="16" patternUnits="userSpaceOnUse">
          {tiles[theme] || tiles.default}
        </pattern>
      </defs>
      <rect width="280" height="160" fill={`url(#${patternId})`} opacity="0.16" />
    </>
  );
};

// Small recurring sachet/pack silhouette watermark so every card reads as a
// real product ad rather than an abstract gradient card.
const ProductPackMark: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`} opacity="0.14" fill="#fff">
    <path d="M0 0 L3 -5 L6 0 L9 -5 L12 0 L12 24 Q12 29 6 29 Q0 29 0 24 Z" />
  </g>
);

// Small theme-appropriate decorative motif, drawn centered at (cx, cy).
const ThemeIcon: React.FC<{ theme: EventTheme; cx: number; cy: number; scale?: number }> = ({
  theme,
  cx,
  cy,
  scale = 1,
}) => {
  switch (theme) {
    case "cold":
      return (
        <g transform={`translate(${cx} ${cy}) scale(${scale})`} stroke="#fff" strokeWidth="2" opacity="0.55" strokeLinecap="round">
          {[0, 60, 120].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={-14 * Math.cos(rad)}
                y1={-14 * Math.sin(rad)}
                x2={14 * Math.cos(rad)}
                y2={14 * Math.sin(rad)}
              />
            );
          })}
        </g>
      );
    case "rain":
      return (
        <g transform={`translate(${cx} ${cy}) scale(${scale})`} fill="#fff" opacity="0.55">
          <path d="M0 -14 C6 -4 8 3 0 11 C-8 3 -6 -4 0 -14 Z" />
          <path d="M17 -3 C21 3 22 7 17 12 C12 7 13 3 17 -3 Z" opacity="0.75" transform="scale(0.65)" />
          <path d="M-17 -3 C-13 3 -12 7 -17 12 C-22 7 -21 3 -17 -3 Z" opacity="0.75" transform="scale(0.65)" />
        </g>
      );
    case "festival":
      return (
        <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
          <ellipse cx="0" cy="11" rx="17" ry="6" fill="#fff" opacity="0.45" />
          <path d="M0 -11 C4.5 -2 4.5 4.5 0 9 C-4.5 4.5 -4.5 -2 0 -11 Z" fill="#fde68a" opacity="0.95" />
        </g>
      );
    case "sport":
      return (
        <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
          <circle cx="9" cy="-9" r="7" fill="#fff" opacity="0.6" />
          <rect x="-17" y="-4" width="27" height="8" rx="3" fill="#fff" opacity="0.5" transform="rotate(-25)" />
        </g>
      );
    default:
      return (
        <g opacity="0.9" transform={`translate(${cx - 35} ${cy - 25})`}>
          <ellipse cx="35" cy="0" rx="35" ry="10" fill="#fff" opacity="0.85" />
          <path d="M0 0 Q35 45 70 0 Z" fill="#fff" opacity="0.45" />
          <path d="M20 -23 q6 -9 0 -17" stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.6" />
          <path d="M35 -27 q6 -10 0 -19" stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.6" />
          <path d="M50 -23 q6 -9 0 -17" stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.6" />
        </g>
      );
  }
};

// One recognizable landmark silhouette per WiMI cluster — drawn in a local
// coordinate space with the ground line at y=0, so every shape can be dropped
// into a card at any position/scale via the wrapping transform below. Kept
// simple (a handful of primitives each) since these render small, as a
// low-opacity backdrop rather than a detailed illustration.
const LANDMARK_SHAPES: Record<string, React.ReactNode> = {
  // Delhi NCR — India Gate: an arch monument topped with a flat slab.
  DL: (
    <>
      <path
        d="M-16 0 L-16 -20 Q-16 -36 0 -36 Q16 -36 16 -20 L16 0 L9 0 L9 -20 Q9 -29 0 -29 Q-9 -29 -9 -20 L-9 0 Z"
        fill="#fff"
      />
      <rect x="-19" y="-40" width="38" height="4" fill="#fff" />
    </>
  ),
  // Maharashtra — Gateway of India: a taller arch with an onion-domed crown.
  MH: (
    <>
      <path
        d="M-15 0 L-15 -22 Q-15 -38 0 -38 Q15 -38 15 -22 L15 0 L8 0 L8 -22 Q8 -31 0 -31 Q-8 -31 -8 -22 L-8 0 Z"
        fill="#fff"
      />
      <path d="M-6 -38 Q0 -48 6 -38 Z" fill="#fff" />
      <rect x="-18" y="-42" width="36" height="3.5" fill="#fff" />
    </>
  ),
  // Karnataka — domed palace / Vidhana Soudha silhouette.
  KA: (
    <>
      <rect x="-22" y="-14" width="44" height="14" fill="#fff" />
      <ellipse cx="0" cy="-14" rx="12" ry="12" fill="#fff" />
      <ellipse cx="-18" cy="-14" rx="5" ry="5" fill="#fff" />
      <ellipse cx="18" cy="-14" rx="5" ry="5" fill="#fff" />
    </>
  ),
  // Tamil Nadu — Meenakshi Temple gopuram: a tapering stepped tower.
  TN: (
    <>
      <path d="M-16 0 L16 0 L12 -14 L-12 -14 Z" fill="#fff" />
      <path d="M-12 -14 L12 -14 L9 -26 L-9 -26 Z" fill="#fff" />
      <path d="M-9 -26 L9 -26 L6 -36 L-6 -36 Z" fill="#fff" />
      <path d="M-6 -36 L6 -36 L0 -44 Z" fill="#fff" />
    </>
  ),
  // West Bengal — Howrah Bridge: a flattened truss span over the water line.
  WB: (
    <>
      <path d="M-24 -2 Q0 -22 24 -2" stroke="#fff" strokeWidth="3" fill="none" />
      <path d="M-24 4 Q0 -14 24 4" stroke="#fff" strokeWidth="3" fill="none" />
      <line x1="-18" y1="-1" x2="-18" y2="3" stroke="#fff" strokeWidth="2" />
      <line x1="-6" y1="-9" x2="-6" y2="1" stroke="#fff" strokeWidth="2" />
      <line x1="6" y1="-9" x2="6" y2="1" stroke="#fff" strokeWidth="2" />
      <line x1="18" y1="-1" x2="18" y2="3" stroke="#fff" strokeWidth="2" />
    </>
  ),
  // Gujarat — Statue of Unity: a tall commemorative statue on a plinth.
  GJ: (
    <>
      <rect x="-14" y="-6" width="28" height="6" fill="#fff" />
      <path d="M-6 -6 L-8 -30 Q-8 -40 0 -40 Q8 -40 8 -30 L6 -6 Z" fill="#fff" />
      <circle cx="0" cy="-43" r="4.5" fill="#fff" />
    </>
  ),
  // Uttar Pradesh — Taj Mahal: central dome, base, and two flanking minarets.
  UP: (
    <>
      <rect x="-20" y="-2" width="40" height="2" fill="#fff" />
      <rect x="-3" y="-16" width="6" height="16" fill="#fff" />
      <ellipse cx="0" cy="-16" rx="11" ry="11" fill="#fff" />
      <rect x="-1.2" y="-28" width="2.4" height="6" fill="#fff" />
      {[-18, 18].map((x) => (
        <g key={x}>
          <rect x={x - 1.6} y="-20" width="3.2" height="20" fill="#fff" />
          <circle cx={x} cy="-21" r="2.6" fill="#fff" />
        </g>
      ))}
    </>
  ),
  // Andhra Pradesh — Amaravati Stupa: a low dome ringed by a carved railing (vedika).
  AP: (
    <>
      <ellipse cx="0" cy="-2" rx="24" ry="5" fill="none" stroke="#fff" strokeWidth="2" opacity="0.9" />
      <path d="M-18 -3 A18 15 0 0 1 18 -3 Z" fill="#fff" />
      <rect x="-3" y="-30" width="6" height="12" fill="#fff" />
      <circle cx="0" cy="-32" r="3" fill="#fff" />
    </>
  ),
  // Telangana — Charminar: four minarets around a central arch.
  TG: (
    <>
      <path
        d="M-11 0 L-11 -12 Q-11 -20 0 -20 Q11 -20 11 -12 L11 0 L6 0 L6 -12 Q6 -15 0 -15 Q-6 -15 -6 -12 L-6 0 Z"
        fill="#fff"
      />
      {[-16, 16].map((x) => (
        <g key={x}>
          <rect x={x - 1.8} y="-24" width="3.6" height="24" fill="#fff" />
          <circle cx={x} cy="-25" r="3" fill="#fff" />
        </g>
      ))}
    </>
  ),
  // Kerala — a traditional houseboat (kettuvallam) with an arched canopy.
  KL: (
    <>
      <path d="M-22 0 Q-22 6 -14 6 L14 6 Q22 6 22 0 L18 -3 L-18 -3 Z" fill="#fff" />
      <path d="M-14 -3 Q-14 -16 0 -16 Q14 -16 14 -3 Z" fill="#fff" opacity="0.85" />
    </>
  ),
  // Punjab — Golden Temple: a single dome over water.
  PB: (
    <>
      <rect x="-14" y="-10" width="28" height="10" fill="#fff" />
      <path d="M-9 -10 Q0 -24 9 -10 Z" fill="#fff" />
      <circle cx="0" cy="-25" r="1.6" fill="#fff" />
      <line x1="-20" y1="4" x2="20" y2="4" stroke="#fff" strokeWidth="1.5" opacity="0.5" />
    </>
  ),
  // Rajasthan — Hawa Mahal: a wide honeycomb facade.
  RJ: (
    <>
      <path d="M-22 0 L-22 -20 L0 -28 L22 -20 L22 0 Z" fill="#fff" />
      {[-15, -6, 3, 12].map((x) => (
        <rect key={x} x={x} y={-16} width="4.5" height="6" rx="2" fill="#0a0a0a" opacity="0.35" />
      ))}
    </>
  ),
  // Madhya Pradesh — Sanchi Stupa: a hemisphere dome with a crowning umbrella.
  MP: (
    <>
      <rect x="-16" y="-4" width="32" height="4" fill="#fff" />
      <path d="M-14 -4 A14 14 0 0 1 14 -4 Z" fill="#fff" />
      <line x1="0" y1="-18" x2="0" y2="-26" stroke="#fff" strokeWidth="2" />
      <ellipse cx="0" cy="-27" rx="5" ry="1.6" fill="#fff" />
    </>
  ),
  // Bihar & Jharkhand — Mahabodhi Temple: a tall narrow stepped spire.
  BR: (
    <>
      <path d="M-10 0 L10 0 L8 -20 L-8 -20 Z" fill="#fff" />
      <path d="M-8 -20 L8 -20 L5 -34 L-5 -34 Z" fill="#fff" />
      <path d="M-5 -34 L5 -34 L0 -46 Z" fill="#fff" />
    </>
  ),
  // Assam & North-East — Kamakhya Temple: a cluster of beehive-shaped domes.
  AS: (
    <>
      {[
        [-14, 0],
        [14, 0],
        [0, -4],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect x="-7" y="-4" width="14" height="4" fill="#fff" />
          <path d="M-7 -4 Q0 -18 7 -4 Z" fill="#fff" />
        </g>
      ))}
    </>
  ),
};

const LandmarkIcon: React.FC<{ clusterCode: string; x: number; y: number; scale?: number; opacity?: number }> = ({
  clusterCode,
  x,
  y,
  scale = 1,
  opacity = 0.22,
}) => {
  const shape = LANDMARK_SHAPES[(clusterCode || "").trim().toUpperCase()];
  if (!shape) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      {shape}
    </g>
  );
};

// Real photo (landmark, regional food, or festival scene — resolved by the
// caller via getCardPhoto), cropped to fill the given rect, with a
// theme-colored gradient tint on top — the tint keeps the card on-brand and
// gives the same photo a different mood per trigger theme.
const CardPhoto: React.FC<{
  photo: string | undefined;
  x: number;
  y: number;
  width: number;
  height: number;
  gradId: string;
  palette: [string, string];
  tintOpacity?: number;
}> = ({ photo, x, y, width, height, gradId, palette, tintOpacity = 0.6 }) => {
  if (!photo) return null;
  const tintId = `${gradId}-tint`;
  const clipId = `${gradId}-clip`;
  return (
    <>
      <defs>
        <linearGradient id={tintId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette[0]} />
          <stop offset="100%" stopColor={palette[1]} />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <image href={photo} x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid slice" />
        <rect x={x} y={y} width={width} height={height} fill={`url(#${tintId})`} opacity={tintOpacity} />
      </g>
    </>
  );
};

// Dark gradient scrim behind the lower portion of a photo card so headline/sub
// text stays legible over a busy real photo rather than a smooth gradient.
const BottomScrim: React.FC<{ id: string; y: number; height: number; opacity?: number }> = ({
  id,
  y,
  height,
  opacity = 0.55,
}) => (
  <>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#000000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000000" stopOpacity={opacity} />
      </linearGradient>
    </defs>
    <rect x="0" y={y} width="280" height={height} fill={`url(#${id})`} />
  </>
);

// Greedy word-wrap so long generated headlines never run off the card edge.
function wrapText(text: string, maxChars: number, maxLines = 2): string[] {
  const words = (text || "").split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const next = (current + " " + w).trim();
    if (next.length > maxChars && current) {
      lines.push(current);
      current = w;
    } else {
      current = next;
    }
    if (lines.length === maxLines - 1 && current.length > maxChars) break;
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

interface WrappedTextProps {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  maxChars: number;
  maxLines?: number;
  lineHeight?: number;
  weight?: number;
  opacity?: number;
  anchor?: "start" | "middle" | "end";
}

const WrappedText: React.FC<WrappedTextProps> = ({
  text,
  x,
  y,
  fontSize,
  maxChars,
  maxLines = 2,
  lineHeight = fontSize + 4,
  weight = 800,
  opacity = 1,
  anchor = "start",
}) => {
  const lines = wrapText(text, maxChars, maxLines);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  return (
    <text
      fontSize={fontSize}
      fontWeight={weight}
      fill="#ffffff"
      stroke="rgba(0,0,0,0.35)"
      strokeWidth={fontSize * 0.12}
      paintOrder="stroke fill"
      opacity={opacity}
      textAnchor={anchor}
      fontFamily="system-ui, sans-serif"
    >
      {lines.map((line, i) => (
        <tspan key={i} x={x} y={startY + i * lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

interface LayoutProps {
  a: Asset;
  palette: [string, string];
  theme: EventTheme;
  gradId: string;
  patternId: string;
  seed: number;
}

// Layout 1: today's composition, refined — full-bleed photo (or gradient
// fallback), headline bottom-left.
const BoldHeadlineArt: React.FC<LayoutProps> = ({ a, palette, theme, gradId, patternId, seed }) => {
  const photo = getCardPhoto(a.c, theme, seed);
  const hasPhoto = !!photo;
  return (
    <>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette[0]} />
          <stop offset="100%" stopColor={palette[1]} />
        </linearGradient>
      </defs>
      {hasPhoto ? (
        <CardPhoto photo={photo} x={0} y={0} width={280} height={160} gradId={gradId} palette={palette} />
      ) : (
        <rect width="280" height="160" fill={`url(#${gradId})`} />
      )}
      <BackgroundPattern theme={theme} patternId={patternId} />
      {hasPhoto ? (
        <BottomScrim id={`${gradId}-scrim`} y={70} height={90} />
      ) : (
        <LandmarkIcon clusterCode={a.c} x={195} y={112} scale={2.2} />
      )}
      <ProductPackMark x={244} y={118} />
      <ThemeIcon theme={theme} cx={225} cy={40} />
      <WrappedText text={a.head} x={16} y={98} fontSize={16} maxChars={20} lineHeight={19} />
      <text x="16" y="130" fontSize="9.5" fontWeight="500" fill="#ffffff" opacity="0.92">
        {(a.sub || "").slice(0, 46)}
      </text>
      <text x="264" y="150" fontSize="6.5" fill="#ffffff" opacity="0.8" textAnchor="end">
        {a.badge}
      </text>
    </>
  );
};

// Layout 2: photo (or gradient) art band on top, headline in a flat color
// band below — text never sits over the photo, so no scrim needed here.
const SplitVisualArt: React.FC<LayoutProps> = ({ a, palette, theme, gradId, patternId, seed }) => {
  const photo = getCardPhoto(a.c, theme, seed);
  const hasPhoto = !!photo;
  return (
    <>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={palette[1]} />
          <stop offset="100%" stopColor={palette[0]} />
        </linearGradient>
      </defs>
      {hasPhoto ? (
        <CardPhoto photo={photo} x={0} y={0} width={280} height={92} gradId={gradId} palette={palette} tintOpacity={0.55} />
      ) : (
        <rect width="280" height="92" fill={`url(#${gradId})`} />
      )}
      <BackgroundPattern theme={theme} patternId={patternId} />
      {!hasPhoto && <LandmarkIcon clusterCode={a.c} x={155} y={86} scale={1.6} />}
      <rect y="92" width="280" height="68" fill={palette[0]} />
      <ProductPackMark x={16} y={40} scale={0.9} />
      <ThemeIcon theme={theme} cx={236} cy={44} scale={1.15} />
      <WrappedText text={a.head} x={16} y={122} fontSize={14} maxChars={24} lineHeight={16} anchor="start" />
      <text x="16" y="148" fontSize="9" fontWeight="500" fill="#ffffff" opacity="0.85">
        {(a.sub || "").slice(0, 42)}
      </text>
    </>
  );
};

// Layout 3: full photo (or flat color) card, icon medallion top-center, headline centered, format as a corner ribbon.
const MinimalBadgeArt: React.FC<LayoutProps> = ({ a, palette, theme, gradId, patternId, seed }) => {
  const photo = getCardPhoto(a.c, theme, seed);
  const hasPhoto = !!photo;
  return (
  <>
    {hasPhoto ? (
      <CardPhoto photo={photo} x={0} y={0} width={280} height={160} gradId={gradId} palette={palette} tintOpacity={0.68} />
    ) : (
      <rect width="280" height="160" fill={palette[0]} />
    )}
    <BackgroundPattern theme={theme} patternId={patternId} />
    {hasPhoto ? (
      <BottomScrim id={`${gradId}-scrim`} y={70} height={90} opacity={0.5} />
    ) : (
      <LandmarkIcon clusterCode={a.c} x={140} y={155} scale={2.4} opacity={0.16} />
    )}
    <ProductPackMark x={20} y={130} scale={0.85} />
    <circle cx="140" cy="44" r="27" fill={palette[1]} opacity="0.22" />
    <circle cx="140" cy="44" r="18" fill={palette[1]} opacity="0.92" />
    <ThemeIcon theme={theme} cx={140} cy={44} scale={0.85} />
    <WrappedText
      text={a.head}
      x={140}
      y={96}
      fontSize={13.5}
      maxChars={22}
      lineHeight={16}
      anchor="middle"
    />
    <text x="140" y="126" fontSize="8.5" fontWeight="500" fill="#ffffff" opacity="0.8" textAnchor="middle">
      {(a.sub || "").slice(0, 40)}
    </text>
    <g>
      <path d="M222 0 L280 0 L280 22 L238 22 Z" fill={palette[1]} opacity="0.9" />
      <text x="272" y="15" fontSize="6.5" fill="#0a0a0a" fontWeight="800" textAnchor="end">
        {a.fmt}
      </text>
    </g>
  </>
  );
};

const LAYOUTS = [BoldHeadlineArt, SplitVisualArt, MinimalBadgeArt];

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  showAssets,
  assetQuotes = {},
  onInspectHeldAsset,
  eventTheme = "default" as EventTheme,
  editable = false,
  eventContext,
  onAssetsChange,
}) => {
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>("all");
  // Bumped per cluster on each regenerate so the layout/palette visibly
  // changes too, not just the copy — the closest honest stand-in for "a
  // different image" since each cluster only has one real landmark photo.
  const [variantSeed, setVariantSeed] = useState<Record<string, number>>({});
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({});
  const [guidanceOpenFor, setGuidanceOpenFor] = useState<string | null>(null);
  const [guidanceText, setGuidanceText] = useState<Record<string, string>>({});

  const handleRegenerate = async (asset: Asset) => {
    if (regenerating[asset.c]) return;
    setRegenerating((p) => ({ ...p, [asset.c]: true }));
    try {
      const res = await fetch("/api/asset/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: asset.city,
          lang: asset.lang,
          clusterCode: asset.c,
          tasteNote: asset.tasteNote,
          eventContext,
          guidance: guidanceText[asset.c]?.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.asset) {
        const updated = assets.map((a) =>
          a.c === asset.c
            ? {
                ...a,
                head: data.asset.head || a.head,
                sub: data.asset.sub || a.sub,
                englishMeaning: data.asset.englishMeaning || a.englishMeaning,
                tasteNote: data.asset.tasteNote || a.tasteNote,
                badge: data.asset.badge || a.badge,
              }
            : a
        );
        onAssetsChange?.(updated);
        setVariantSeed((p) => ({ ...p, [asset.c]: (p[asset.c] || 0) + 1 }));
      }
    } catch (err) {
      console.warn("Failed to regenerate asset", err);
    } finally {
      setRegenerating((p) => ({ ...p, [asset.c]: false }));
      setGuidanceOpenFor(null);
    }
  };

  const regionMap: Record<string, string[]> = {
    all: [],
    north: ["DL", "PB", "UP", "RJ"],
    west: ["MH", "GJ", "MP"],
    south: ["TN", "KA", "AP", "TG", "KL"],
    east: ["WB", "BR", "AS"],
  };

  const filteredAssets = selectedRegionFilter === "all"
    ? assets
    : assets.filter((a) => regionMap[selectedRegionFilter]?.includes(a.c));

  return (
    <div id="regional-campaigns-section" className="mt-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
              {assets.length} Regional Campaign Version{assets.length === 1 ? "" : "s"} Generated
            </h3>
          </div>
          <p className="text-xs md:text-sm text-slate-300 mt-0.5">
            Crafted for the affected Indian taste clusters in authentic regional languages — 100% brand & food-law compliant.
          </p>
        </div>

        {/* Region Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          {[
            { id: "all", label: `All Clusters (${assets.length})` },
            { id: "north", label: "North" },
            { id: "west", label: "West" },
            { id: "south", label: "South" },
            { id: "east", label: "East" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRegionFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors border ${
                selectedRegionFilter === tab.id
                  ? "bg-orange-500 text-slate-950 border-orange-400 shadow-sm"
                  : "bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Regional Assets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAssets.map((a, idx) => {
          const isHeld = !!a.held;
          const displayPrice = assetQuotes[idx] || a.q || "₹ 55";
          const seed = idx + (variantSeed[a.c] || 0);
          const palette = getPalette(eventTheme, seed);
          const Layout = LAYOUTS[seed % LAYOUTS.length];
          const gradId = `bg-${a.c}-${idx}-${variantSeed[a.c] || 0}`;
          const patternId = `pat-${a.c}-${idx}-${variantSeed[a.c] || 0}`;
          const isRegenerating = !!regenerating[a.c];

          return (
            <div
              key={a.c + idx}
              id={`campaign-card-${a.c}`}
              className={`rounded-3xl border overflow-hidden bg-slate-900/70 transition-all duration-300 flex flex-col justify-between shadow-xl ${
                isHeld
                  ? "border-amber-500/70 shadow-amber-500/10 hover:border-amber-400"
                  : "border-slate-800/90 hover:border-slate-700 hover:shadow-2xl"
              } ${showAssets ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            >
              {/* Card Top Meta */}
              <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-xs">{a.city}</span>
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-mono px-1.5 py-0.5 rounded">
                    {a.c}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-orange-400 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  {a.fmt}
                </span>
              </div>

              {/* Visual Pack Creative Art */}
              <div className="p-3 bg-slate-950/40">
                <div className="relative rounded-2xl overflow-hidden shadow-inner aspect-[16/10]">
                  <svg viewBox="0 0 280 160" className="w-full h-full block">
                    <Layout a={a} palette={palette} theme={eventTheme} gradId={gradId} patternId={patternId} seed={seed} />
                  </svg>

                  {/* Status Overlay Badge */}
                  <div className="absolute top-2 left-2">
                    {isHeld ? (
                      <span className="bg-amber-500 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                        <ShieldAlert className="w-3 h-3" />
                        HELD · FSSAI Review
                      </span>
                    ) : (
                      <span className="bg-emerald-500/90 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                        <CheckCircle2 className="w-3 h-3" />
                        Live & Approved
                      </span>
                    )}
                  </div>

                  {isRegenerating && (
                    <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center gap-2 text-xs font-bold text-white">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Regenerating...
                    </div>
                  )}
                </div>
              </div>

              {/* Plain English Translation & Taste Note */}
              <div className="px-4 py-3 space-y-2 text-xs flex-1">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-orange-400" />
                    English Translation
                  </div>
                  <p className="text-slate-200 text-xs mt-0.5 font-medium leading-snug">
                    {a.englishMeaning || `"${a.head} — ${a.sub}"`}
                  </p>
                </div>

                {a.tasteNote && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <UtensilsCrossed className="w-3 h-3 text-emerald-400" />
                      Taste Adaptation
                    </div>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-snug">
                      {a.tasteNote}
                    </p>
                  </div>
                )}

                {editable && (
                  <div className="pt-1 border-t border-slate-800/60">
                    {guidanceOpenFor === a.c ? (
                      <div className="flex flex-col gap-1.5 pt-2">
                        <input
                          type="text"
                          autoFocus
                          value={guidanceText[a.c] || ""}
                          onChange={(e) => setGuidanceText((p) => ({ ...p, [a.c]: e.target.value }))}
                          placeholder="e.g. Lead with the price, not the weather"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-orange-500"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleRegenerate(a)}
                            disabled={isRegenerating}
                            className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Wand2 className="w-3 h-3" />
                            Generate
                          </button>
                          <button
                            onClick={() => setGuidanceOpenFor(null)}
                            className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-[10px] font-bold uppercase cursor-pointer hover:text-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleRegenerate(a)}
                          disabled={isRegenerating}
                          className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Try another version
                        </button>
                        <button
                          onClick={() => setGuidanceOpenFor(a.c)}
                          disabled={isRegenerating}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Wand2 className="w-3 h-3" />
                          Give it a direction
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">{a.lang}</span>

                {isHeld ? (
                  <button
                    onClick={onInspectHeldAsset}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer underline underline-offset-2"
                  >
                    Review Claim →
                  </button>
                ) : (
                  <span className="font-extrabold text-emerald-400 text-xs">
                    {displayPrice} · Instant
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
