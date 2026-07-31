"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import clsx from "clsx";

type GameId = "shells" | "stars" | "pixels";

const GAMES: { id: GameId; label: string; eyebrow: string }[] = [
  { id: "shells", label: "Tidepool Pair", eyebrow: "Memory game" },
  { id: "stars", label: "Star Stitch", eyebrow: "Constellation game" },
  { id: "pixels", label: "Moonlit Pixels", eyebrow: "Painting toy" },
];

const SHELLS = [
  { id: "conch", name: "Conch shell", src: "/images/sea_shells/sea-shell-1.png" },
  { id: "scallop", name: "Scallop shell", src: "/images/sea_shells/sea-shell-2.png" },
  { id: "spiral", name: "Spiral shell", src: "/images/sea_shells/sea-shell-3.png" },
  { id: "pearl", name: "Pearl shell", src: "/images/sea_shells/sea-shell-4.png" },
] as const;

const SHELL_PAIRS = [0, 0, 1, 1, 2, 2, 3, 3] as const;

const STAR_PATHS = [
  {
    name: "The Shorebird",
    points: [
      { x: 12, y: 68 },
      { x: 25, y: 47 },
      { x: 39, y: 61 },
      { x: 51, y: 34 },
      { x: 63, y: 50 },
      { x: 77, y: 27 },
      { x: 88, y: 45 },
    ],
  },
  {
    name: "The Moonwake",
    points: [
      { x: 15, y: 29 },
      { x: 28, y: 53 },
      { x: 42, y: 37 },
      { x: 54, y: 66 },
      { x: 67, y: 46 },
      { x: 80, y: 67 },
      { x: 90, y: 35 },
    ],
  },
  {
    name: "The Spiral Shell",
    points: [
      { x: 16, y: 64 },
      { x: 25, y: 38 },
      { x: 45, y: 25 },
      { x: 67, y: 36 },
      { x: 77, y: 59 },
      { x: 60, y: 76 },
      { x: 38, y: 67 },
    ],
  },
  {
    name: "The Tidal Crown",
    points: [
      { x: 11, y: 54 },
      { x: 24, y: 28 },
      { x: 38, y: 57 },
      { x: 51, y: 22 },
      { x: 64, y: 58 },
      { x: 78, y: 29 },
      { x: 90, y: 55 },
    ],
  },
  {
    name: "The Sea Horse",
    points: [
      { x: 20, y: 25 },
      { x: 43, y: 31 },
      { x: 57, y: 49 },
      { x: 45, y: 68 },
      { x: 63, y: 77 },
      { x: 79, y: 62 },
      { x: 86, y: 38 },
    ],
  },
] as const;

const PIXEL_COLS = 16;
const PIXEL_ROWS = 10;
const PIXEL_SKY = "#07101f";
const PIXEL_PALETTE = [
  { name: "Midnight", color: PIXEL_SKY },
  { name: "Deep sea", color: "#163c67" },
  { name: "Moon blue", color: "#66aaff" },
  { name: "Foam", color: "#fff8e8" },
  { name: "Moon gold", color: "#f0c75a" },
  { name: "Coral", color: "#f08a42" },
  { name: "Shell pink", color: "#efb2a8" },
] as const;

function randomSeed() {
  return Math.floor(Math.random() * 0x100000000);
}

const CLIENT_SHELL_SEED = randomSeed();

function subscribeNoop() {
  return () => {};
}

/** A seeded Fisher-Yates shuffle keeps the server snapshot deterministic for
 * hydration, then swaps in a genuinely random client seed for each visit. */
function shuffledShellPairs(seed: number) {
  const order = [...SHELL_PAIRS];
  let state = seed || 0x9e3779b9;

  for (let i = order.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }

  return order;
}

function moonlitPixels(): string[] {
  return Array.from({ length: PIXEL_COLS * PIXEL_ROWS }, (_, index) => {
    const x = index % PIXEL_COLS;
    const y = Math.floor(index / PIXEL_COLS);
    const moon = (x - 11) ** 2 + (y - 2) ** 2 <= 3;
    const moonCutout = (x - 10) ** 2 + (y - 1) ** 2 <= 2;

    if (moon && !moonCutout) return "#f0c75a";
    if (y === 7) return x % 3 === 0 ? "#66aaff" : "#163c67";
    if (y === 8) return x % 4 === 1 ? "#fff8e8" : "#163c67";
    if (y === 9) return x % 3 === 2 ? "#f08a42" : "#163c67";
    return PIXEL_SKY;
  });
}

function ShellMemoryGame() {
  const initialSeed = useSyncExternalStore(subscribeNoop, () => CLIENT_SHELL_SEED, () => 0);
  const [shuffleSeed, setShuffleSeed] = useState<number | null>(null);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deckSeed = shuffleSeed ?? initialSeed;

  const deck = useMemo(
    () =>
      shuffledShellPairs(deckSeed).map((shellIndex, index) => ({
        uid: index,
        shell: SHELLS[shellIndex],
      })),
    [deckSeed]
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const complete = matched.length === SHELLS.length;

  function chooseCard(index: number) {
    const card = deck[index];
    if (locked || open.includes(index) || matched.includes(card.shell.id)) return;

    if (open.length === 0) {
      setOpen([index]);
      return;
    }

    const first = deck[open[0]];
    const isMatch = first.shell.id === card.shell.id;
    setOpen([open[0], index]);
    setMoves((value) => value + 1);
    setLocked(true);

    timerRef.current = setTimeout(() => {
      if (isMatch) setMatched((value) => [...value, card.shell.id]);
      setOpen([]);
      setLocked(false);
    }, isMatch ? 380 : 720);
  }

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShuffleSeed(randomSeed());
    setOpen([]);
    setMatched([]);
    setMoves(0);
    setLocked(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="rounded-2xl border border-line bg-bg-inset/70 p-3 sm:p-5">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {deck.map((card, index) => {
            const revealed = open.includes(index) || matched.includes(card.shell.id);
            const found = matched.includes(card.shell.id);
            return (
              <button
                key={`${deckSeed}-${card.uid}`}
                type="button"
                onClick={() => chooseCard(index)}
                disabled={locked || found}
                aria-label={revealed ? card.shell.name : "Hidden tidepool card"}
                className={clsx(
                  "motion-press relative aspect-square overflow-hidden rounded-xl border transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  revealed
                    ? "border-line-strong bg-bg-raised"
                    : "border-line bg-bg hover:border-line-strong hover:bg-bg-raised",
                  found && "opacity-70"
                )}
              >
                <span
                  className={clsx(
                    "absolute inset-0 flex items-center justify-center transition duration-300",
                    revealed ? "scale-100 opacity-100" : "scale-75 opacity-0"
                  )}
                >
                  <Image
                    src={card.shell.src}
                    alt=""
                    width={104}
                    height={104}
                    className="h-[72%] w-[72%] object-contain drop-shadow-[0_8px_10px_rgba(7,16,31,0.25)]"
                  />
                </span>
                <span
                  className={clsx(
                    "absolute inset-0 transition duration-300",
                    revealed ? "scale-125 opacity-0" : "scale-100 opacity-100"
                  )}
                >
                  <Image
                    src="/images/sea_shells/sea-shell-card.png"
                    alt=""
                    aria-hidden
                    fill
                    sizes="(min-width: 1024px) 9rem, 22vw"
                    className="object-cover"
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            Low tide challenge
          </p>
          <h3 className="mt-2 font-sans text-2xl font-semibold text-ink">Find every shell pair.</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Turn over two tidepool tiles at a time. Match all four pairs before the tide
            changes.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-bg-inset/70 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              Moves
            </span>
            <span className="font-mono text-2xl text-accent">{moves}</span>
          </div>
          <p aria-live="polite" className="mt-2 min-h-5 text-xs text-ink-soft">
            {complete ? `Tidepool cleared in ${moves} moves.` : `${matched.length} of 4 pairs found`}
          </p>
        </div>

        <button
          type="button"
          onClick={reset}
          className="motion-press min-h-11 rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Shuffle tidepool
        </button>
      </div>
    </div>
  );
}

function StarStitchGame() {
  const [pathIndex, setPathIndex] = useState(0);
  const [nextStar, setNextStar] = useState(0);
  const [misses, setMisses] = useState(0);

  const constellation = STAR_PATHS[pathIndex % STAR_PATHS.length];
  const starPoints = constellation.points;
  const complete = nextStar === starPoints.length;

  function chooseStar(index: number) {
    if (index === nextStar) {
      setNextStar((value) => value + 1);
    } else if (index > nextStar) {
      setMisses((value) => value + 1);
    }
  }

  function reset() {
    setPathIndex((value) => value + 1);
    setNextStar(0);
    setMisses(0);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="relative min-h-[21rem] overflow-hidden rounded-2xl border border-[#66aaff]/20 bg-[#050b17] shadow-inner">
        <div
          aria-hidden
          className="absolute inset-0 opacity-55"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 20%, rgba(102,170,255,.6) 0 1px, transparent 2px), radial-gradient(circle at 72% 15%, rgba(255,248,232,.7) 0 1px, transparent 2px), radial-gradient(circle at 82% 76%, rgba(240,199,90,.6) 0 1px, transparent 2px), radial-gradient(circle at 45% 82%, rgba(185,217,255,.5) 0 1px, transparent 2px)",
            backgroundSize: "83px 79px, 117px 103px, 139px 113px, 97px 131px",
          }}
        />

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {starPoints.slice(1, nextStar).map((point, index) => {
            const from = starPoints[index];
            return (
              <line
                key={`${pathIndex}-${from.x}-${point.x}`}
                x1={from.x}
                y1={from.y}
                x2={point.x}
                y2={point.y}
                vectorEffect="non-scaling-stroke"
                stroke="#f0c75a"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.72"
              />
            );
          })}
        </svg>

        {starPoints.map((point, index) => {
          const connected = index < nextStar;
          const active = index === nextStar;
          return (
            <button
              key={`${pathIndex}-${point.x}-${point.y}`}
              type="button"
              onClick={() => chooseStar(index)}
              aria-label={
                connected
                  ? `Star ${index + 1}, connected`
                  : active
                    ? `Connect star ${index + 1}`
                    : `Star ${index + 1}, sleeping`
              }
              className={clsx(
                "absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c75a]",
                active && "cursor-pointer",
                !active && !connected && "cursor-default"
              )}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              {active ? (
                <span className="absolute h-9 w-9 animate-ping rounded-full border border-[#79a9e8]/50 motion-reduce:animate-none" />
              ) : null}
              <span
                className={clsx(
                  "relative block rotate-45 border transition duration-300",
                  connected
                    ? "h-4 w-4 border-[#f0c75a] bg-[#fff8e8] shadow-[0_0_16px_#f0c75a]"
                    : active
                      ? "h-3.5 w-3.5 border-[#b9d9ff] bg-[#66aaff] shadow-[0_0_18px_#66aaff]"
                      : "h-2.5 w-2.5 border-[#79a9e8]/40 bg-[#b9d9ff]/45"
                )}
              />
            </button>
          );
        })}

        {complete ? (
          <div className="absolute inset-x-4 bottom-4 rounded-xl border border-[#f0c75a]/30 bg-[#07101f]/90 px-4 py-3 text-center backdrop-blur-sm">
            <p className="font-sans text-lg font-semibold text-[#fff8e8]">{constellation.name}</p>
            <p className="text-xs text-[#c7bdab]">A new constellation, stitched from sea to sky.</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col justify-between gap-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            Night navigation
          </p>
          <h3 className="mt-2 font-sans text-2xl font-semibold text-ink">Follow the waking star.</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Find the star with the blue pulse and stitch the constellation one point at a
            time. Each clear reveals a different path.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-bg-inset/70 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              Connected
            </span>
            <span className="font-mono text-2xl text-accent">
              {nextStar}/{starPoints.length}
            </span>
          </div>
          <p aria-live="polite" className="mt-2 min-h-5 text-xs text-ink-soft">
            {complete
              ? misses === 0
                ? "Perfect navigation."
                : `Constellation found with ${misses} wrong turn${misses === 1 ? "" : "s"}.`
              : misses === 0
                ? "The next star is pulsing."
                : `${misses} wrong turn${misses === 1 ? "" : "s"} — keep looking.`}
          </p>
        </div>

        <button
          type="button"
          onClick={reset}
          className="motion-press min-h-11 rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Clear &amp; redraw
        </button>
      </div>
    </div>
  );
}

function PixelPaintingGame() {
  const [pixels, setPixels] = useState<string[]>(moonlitPixels);
  const [color, setColor] = useState<string>("#f0c75a");
  const paintingRef = useRef(false);

  function paint(index: number) {
    setPixels((value) => {
      if (value[index] === color) return value;
      const next = [...value];
      next[index] = color;
      return next;
    });
  }

  function download() {
    const scale = 32;
    const canvas = document.createElement("canvas");
    canvas.width = PIXEL_COLS * scale;
    canvas.height = PIXEL_ROWS * scale;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.imageSmoothingEnabled = false;
    pixels.forEach((pixel, index) => {
      context.fillStyle = pixel;
      context.fillRect((index % PIXEL_COLS) * scale, Math.floor(index / PIXEL_COLS) * scale, scale, scale);
    });

    const link = document.createElement("a");
    link.download = "moonlit-pixel-painting.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div>
        <div
          className="grid touch-none overflow-hidden rounded-xl border border-[#66aaff]/25 bg-[#07101f] shadow-[0_18px_50px_rgba(0,0,0,.24)]"
          style={{ gridTemplateColumns: `repeat(${PIXEL_COLS}, minmax(0, 1fr))` }}
          onPointerLeave={() => {
            paintingRef.current = false;
          }}
          onPointerUp={() => {
            paintingRef.current = false;
          }}
        >
          {pixels.map((pixel, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Paint pixel ${index + 1}`}
              className="aspect-square border-[0.5px] border-white/[0.035] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-white"
              style={{ backgroundColor: pixel }}
              onPointerDown={(event) => {
                event.preventDefault();
                paintingRef.current = true;
                paint(index);
              }}
              onPointerEnter={() => {
                if (paintingRef.current) paint(index);
              }}
              onClick={() => paint(index)}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-faint">
            Palette
          </span>
          {PIXEL_PALETTE.map((swatch) => (
            <button
              key={swatch.color}
              type="button"
              onClick={() => setColor(swatch.color)}
              aria-label={`Use ${swatch.name}`}
              aria-pressed={color === swatch.color}
              title={swatch.name}
              className={clsx(
                "motion-press h-11 w-11 rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                color === swatch.color ? "scale-110 border-white" : "border-white/20"
              )}
              style={{ backgroundColor: swatch.color }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-between gap-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            16 × 10 pixel canvas
          </p>
          <h3 className="mt-2 font-sans text-2xl font-semibold text-ink">Paint after moonrise.</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Tap a color, then click or drag across the canvas. Keep the moonlit cove or
            paint over every pixel.
          </p>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => setPixels(moonlitPixels())}
            className="motion-press min-h-11 rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Restore moonlit cove
          </button>
          <button
            type="button"
            onClick={() => setPixels(Array(PIXEL_COLS * PIXEL_ROWS).fill(PIXEL_SKY))}
            className="motion-press min-h-11 rounded-full border border-line px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Blank canvas
          </button>
          <button
            type="button"
            onClick={download}
            className="motion-press min-h-11 rounded-full bg-ink px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-bg hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-raised"
          >
            Save my painting ↓
          </button>
        </div>
      </div>
    </div>
  );
}

export function PortfolioPlayground() {
  const [activeGame, setActiveGame] = useState<GameId>("shells");

  function moveGameTab(currentId: GameId, key: string) {
    const currentIndex = GAMES.findIndex((game) => game.id === currentId);
    let nextIndex: number | null = null;

    if (key === "ArrowRight") nextIndex = (currentIndex + 1) % GAMES.length;
    if (key === "ArrowLeft") nextIndex = (currentIndex - 1 + GAMES.length) % GAMES.length;
    if (key === "Home") nextIndex = 0;
    if (key === "End") nextIndex = GAMES.length - 1;
    if (nextIndex === null) return;

    const nextGame = GAMES[nextIndex];
    setActiveGame(nextGame.id);
    window.requestAnimationFrame(() => document.getElementById(`game-tab-${nextGame.id}`)?.focus());
  }

  return (
    <article
      id="playground"
      className="motion-card motion-card-static scroll-mt-24 overflow-hidden rounded-2xl border border-line bg-bg-raised"
    >
      <div className="border-b border-line bg-bg-inset/55 px-3 pt-4 sm:px-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="px-2 pb-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">
              Choose a tiny world
            </p>
            <p className="mt-1 font-sans text-lg font-semibold text-ink">The Moon & Tide Arcade</p>
          </div>

          <div
            className="grid w-full grid-cols-3 items-end gap-1 px-1 pt-3 lg:w-auto"
            role="tablist"
            aria-label="Playable experiments"
          >
            {GAMES.map((game) => {
              const active = game.id === activeGame;
              return (
                <button
                  key={game.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`game-panel-${game.id}`}
                  id={`game-tab-${game.id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setActiveGame(game.id)}
                  onKeyDown={(event) => {
                    if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
                      event.preventDefault();
                      moveGameTab(game.id, event.key);
                    }
                  }}
                  className={clsx(
                    "relative min-h-14 min-w-0 rounded-t-xl border border-b-0 px-2 pb-3 pt-2 text-left transition focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-w-36 sm:px-3",
                    active
                      ? "z-10 translate-y-px border-line-strong bg-bg-raised text-ink shadow-sm"
                      : "border-line bg-bg-inset text-ink-soft hover:border-line-strong hover:bg-bg-raised hover:text-ink"
                  )}
                >
                  <span
                    aria-hidden
                    className={clsx(
                      "absolute -top-2 left-3 h-2 w-12 rounded-t-md border border-b-0 transition-colors sm:w-16",
                      active ? "border-line-strong bg-bg-raised" : "border-line bg-bg-inset"
                    )}
                  />
                  <span className="hidden font-mono text-[8px] uppercase tracking-[0.12em] opacity-65 sm:block">
                    {game.eyebrow}
                  </span>
                  <span className="block truncate text-[11px] font-semibold sm:mt-0.5 sm:text-sm">{game.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        id={`game-panel-${activeGame}`}
        role="tabpanel"
        aria-labelledby={`game-tab-${activeGame}`}
        className="p-4 sm:p-6 lg:p-8"
      >
        {activeGame === "shells" ? <ShellMemoryGame /> : null}
        {activeGame === "stars" ? <StarStitchGame /> : null}
        {activeGame === "pixels" ? <PixelPaintingGame /> : null}
      </div>
    </article>
  );
}
