import { DecisionLogEntry, ProblemCategory } from "@/lib/types";
import { FieldLabel } from "@/components/ui/FieldLabel";

export function DecisionLog({
  entries,
}: {
  entries: DecisionLogEntry[];
  category: ProblemCategory;
}) {
  return (
    <div className="rounded-2xl border border-line bg-bg-raised p-6 sm:p-8">
      <FieldLabel>Decision log</FieldLabel>
      <p className="mt-3 text-sm text-ink-soft">
        The product decisions that shaped this project, and what each one cost.
      </p>

      <ol className="mt-7 space-y-8">
        {entries.map((entry, i) => (
          <li key={i} className="relative border-t border-line pt-6 first:border-t-0 first:pt-0">
            <div className="flex items-baseline gap-3">
              <span className="cat-tint-text font-mono text-xs font-medium">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="font-sans text-lg font-semibold leading-snug text-ink">{entry.decision}</p>
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  Why it mattered
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-ink-soft">{entry.why}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  Tradeoff
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-ink-soft">{entry.tradeoff}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  Result
                </dt>
                <dd className="cat-tint-text mt-1.5 text-sm leading-relaxed">{entry.result}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    </div>
  );
}
