import clsx from "clsx";

/** The traffic-light-dot + filename title bar used everywhere a card or
 * panel is styled as an open editor window (hero, project cards, visual
 * work cards) — one shared component so the metaphor stays pixel-identical
 * across the site instead of drifting between hand-copied instances.
 *
 * Colors read as real close/minimize/expand buttons, pulled from the
 * shared star-temperature palette instead of one-off hex values. */
export function WindowChrome({
  filename,
  right,
  className,
  compact = false,
}: {
  filename: string;
  right?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const dot = compact ? "h-2 w-2" : "h-2.5 w-2.5";
  return (
    <div
      className={clsx(
        "flex items-center gap-2 border-b border-line px-4",
        compact ? "py-1.5" : "py-2.5",
        className
      )}
    >
      <span
        aria-hidden
        title="Blue star"
        className={clsx("shrink-0 rounded-full transition-transform group-hover:scale-110", dot)}
        style={{ background: "var(--star-blue)" }}
      />
      <span
        aria-hidden
        title="Gold star"
        className={clsx("shrink-0 rounded-full transition-transform group-hover:scale-110", dot)}
        style={{ background: "var(--star-yellow)" }}
      />
      <span
        aria-hidden
        title="Red star"
        className={clsx("shrink-0 rounded-full transition-transform group-hover:scale-110", dot)}
        style={{ background: "var(--star-red)" }}
      />
      <span className="ml-2 truncate font-mono text-[11px] text-ink-faint">{filename}</span>
      {right ? <span className="ml-auto shrink-0">{right}</span> : null}
    </div>
  );
}
