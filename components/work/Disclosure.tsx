/** A styled native <details> for "secondary details can expand on demand" — full-context
 *  prose that doesn't need to compete with the scannable six-section case-study template. */
export function Disclosure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group mt-5 rounded-xl border border-line">
      <summary
        data-sound="shell-flip"
        className="motion-press flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-medium text-ink-soft [&::-webkit-details-marker]:hidden hover:text-ink"
      >
        {label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden
          className="shrink-0 transition-transform duration-200 group-open:rotate-180"
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="space-y-4 border-t border-line px-5 py-4 text-sm leading-relaxed text-ink-soft">
        {children}
      </div>
    </details>
  );
}
