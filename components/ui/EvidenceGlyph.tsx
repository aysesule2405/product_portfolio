import clsx from "clsx";
import { ProblemCategory, EvidenceGlyph as EvidenceGlyphType } from "@/lib/types";
import { categoryStyle } from "@/lib/category-color";

function RetrievalNodes() {
  return (
    <svg viewBox="0 0 120 90" className="h-full w-full" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M60 45 L20 20" strokeDasharray="3 3" opacity="0.5" />
        <path d="M60 45 L100 18" strokeDasharray="3 3" opacity="0.5" />
        <path d="M60 45 L18 62" strokeDasharray="3 3" opacity="0.5" />
        <path d="M60 45 L96 66" opacity="0.9" />
        <path d="M60 45 L64 78" strokeDasharray="3 3" opacity="0.5" />
      </g>
      <circle cx="60" cy="45" r="7" fill="currentColor" />
      <circle cx="20" cy="20" r="3.5" fill="currentColor" opacity="0.45" />
      <circle cx="100" cy="18" r="3.5" fill="currentColor" opacity="0.45" />
      <circle cx="18" cy="62" r="3.5" fill="currentColor" opacity="0.45" />
      <circle cx="96" cy="66" r="4.5" fill="currentColor" />
      <circle cx="64" cy="78" r="3.5" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

function WaveformNotes() {
  const heights = [14, 26, 18, 34, 22, 40, 16, 30, 20, 12, 28, 36, 18, 24];
  return (
    <svg viewBox="0 0 120 90" className="h-full w-full" aria-hidden>
      <g>
        {heights.map((h, i) => (
          <rect
            key={i}
            x={6 + i * 8}
            y={45 - h / 2}
            width="4"
            height={h}
            rx="1.5"
            fill="currentColor"
            opacity={i === 5 ? 1 : 0.4}
          />
        ))}
      </g>
      <line x1="46" y1="10" x2="46" y2="80" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
      <circle cx="46" cy="10" r="2.5" fill="currentColor" />
    </svg>
  );
}

function NavGrid() {
  return (
    <svg viewBox="0 0 120 90" className="h-full w-full" aria-hidden>
      {Array.from({ length: 4 }).map((_, row) =>
        Array.from({ length: 6 }).map((_, col) => {
          const highlighted = row === 1;
          return (
            <rect
              key={`${row}-${col}`}
              x={6 + col * 18}
              y={10 + row * 18}
              width="13"
              height="13"
              rx="2"
              fill={highlighted ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1"
              opacity={highlighted ? 0.9 : 0.35}
            />
          );
        })
      )}
    </svg>
  );
}

function DiagnosticScatter() {
  const points = [
    [15, 20], [22, 30], [30, 18], [40, 60], [46, 66], [52, 58], [60, 70],
    [70, 25], [78, 35], [85, 22], [95, 40], [50, 40], [64, 20], [34, 74],
  ];
  return (
    <svg viewBox="0 0 120 90" className="h-full w-full" aria-hidden>
      <ellipse cx="50" cy="63" rx="20" ry="14" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 3.5 : 2.5} fill="currentColor" opacity={x > 34 && x < 66 && y > 45 ? 0.9 : 0.4} />
      ))}
    </svg>
  );
}

function MoodAtmosphere() {
  return (
    <svg viewBox="0 0 120 90" className="h-full w-full" aria-hidden>
      <circle cx="60" cy="45" r="34" fill="currentColor" opacity="0.12" />
      <circle cx="60" cy="45" r="24" fill="currentColor" opacity="0.18" />
      <circle cx="60" cy="45" r="14" fill="currentColor" opacity="0.3" />
      <circle cx="60" cy="45" r="5" fill="currentColor" />
    </svg>
  );
}

function WorldConstellation() {
  const nodes = [
    [60, 45], [24, 30], [96, 24], [30, 68], [92, 66],
  ];
  return (
    <svg viewBox="0 0 120 90" className="h-full w-full" aria-hidden>
      <g stroke="currentColor" strokeWidth="1" opacity="0.5">
        <path d="M60 45 L24 30" />
        <path d="M60 45 L96 24" />
        <path d="M60 45 L30 68" />
        <path d="M60 45 L92 66" />
      </g>
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 0 ? 6 : 4} fill="currentColor" opacity={i === 0 ? 1 : 0.55} />
      ))}
    </svg>
  );
}

function SafetySignal() {
  return (
    <svg viewBox="0 0 120 90" className="h-full w-full" aria-hidden>
      <path
        d="M60 14 L94 26 V50 C94 68 79 78 60 84 C41 78 26 68 26 50 V26 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.55"
      />
      <path d="M46 48 L56 58 L76 36" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="60" cy="14" r="3" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

const glyphMap: Record<EvidenceGlyphType, () => React.ReactElement> = {
  "retrieval-nodes": RetrievalNodes,
  "waveform-notes": WaveformNotes,
  "nav-grid": NavGrid,
  "diagnostic-scatter": DiagnosticScatter,
  "mood-atmosphere": MoodAtmosphere,
  "world-constellation": WorldConstellation,
  "safety-signal": SafetySignal,
};

export function EvidenceGlyph({
  glyph,
  category,
  className,
}: {
  glyph: EvidenceGlyphType;
  category: ProblemCategory;
  className?: string;
}) {
  const Glyph = glyphMap[glyph];
  return (
    <div className={clsx("cat-tint-text", className)} style={categoryStyle(category)}>
      <Glyph />
    </div>
  );
}
