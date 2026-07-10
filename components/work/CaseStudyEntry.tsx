export function CaseStudyEntry({
  id,
  label,
  children,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="scroll-mt-20 grid grid-cols-1 gap-2 border-t border-line py-7 first:border-t-0 first:pt-0 sm:grid-cols-[160px_1fr] sm:gap-8"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </p>
      <div className="max-w-2xl text-base leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}
