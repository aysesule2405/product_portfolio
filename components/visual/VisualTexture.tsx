import clsx from "clsx";
import { ProblemCategory } from "@/lib/types";
import { categoryStyle } from "@/lib/category-color";

function PaperTexture() {
  return (
    <svg viewBox="0 0 160 100" className="h-full w-full" aria-hidden>
      <line x1="20" y1="20" x2="140" y2="20" stroke="currentColor" strokeWidth="3" opacity="0.85" />
      <line x1="20" y1="34" x2="100" y2="34" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="20" y1="46" x2="120" y2="46" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <line x1="20" y1="66" x2="70" y2="66" stroke="currentColor" strokeWidth="6" opacity="0.9" />
      <line x1="20" y1="80" x2="90" y2="80" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

function ClayTexture() {
  return (
    <svg viewBox="0 0 160 100" className="h-full w-full" aria-hidden>
      {[38, 30, 22, 14, 6].map((r, i) => (
        <ellipse
          key={r}
          cx="80"
          cy="52"
          rx={r * 1.4}
          ry={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity={0.25 + i * 0.14}
        />
      ))}
    </svg>
  );
}

function CharcoalTexture() {
  return (
    <svg viewBox="0 0 160 100" className="h-full w-full" aria-hidden>
      <polygon points="20,80 70,20 130,35 140,80" fill="currentColor" opacity="0.15" />
      <polygon points="20,80 70,20 70,80" fill="currentColor" opacity="0.3" />
      <line x1="70" y1="20" x2="70" y2="80" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function PlaygroundTexture() {
  const dots = [
    [20, 20], [40, 30], [60, 18], [80, 34], [100, 20], [120, 30], [140, 22],
    [30, 55], [55, 70], [85, 58], [110, 72], [135, 55],
  ];
  return (
    <svg viewBox="0 0 160 100" className="h-full w-full" aria-hidden>
      <path d="M20 55 Q60 20 100 55 T160 45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 3.5 : 2.2} fill="currentColor" opacity={0.35 + (i % 4) * 0.15} />
      ))}
    </svg>
  );
}

const textureMap = {
  paper: PaperTexture,
  clay: ClayTexture,
  charcoal: CharcoalTexture,
  playground: PlaygroundTexture,
};

export function VisualTexture({
  texture,
  category,
  className,
}: {
  texture: keyof typeof textureMap;
  category: ProblemCategory;
  className?: string;
}) {
  const Texture = textureMap[texture];
  return (
    <div className={clsx("cat-tint-text texture-drift", className)} style={categoryStyle(category)}>
      <Texture />
    </div>
  );
}
