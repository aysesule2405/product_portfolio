import clsx from "clsx";

export function FieldLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint",
        className
      )}
    >
      <span aria-hidden className="h-px w-4 bg-line-strong" />
      {children}
    </span>
  );
}
