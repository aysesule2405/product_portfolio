import { EvidenceRailData, ProblemCategory } from "@/lib/types";
import { categoryStyle } from "@/lib/category-color";
import { FieldLabel } from "@/components/ui/FieldLabel";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-ink">{children}</dd>
    </div>
  );
}

export function EvidenceRail({
  data,
  category,
}: {
  data: EvidenceRailData;
  category: ProblemCategory;
}) {
  return (
    <aside className="rounded-2xl border border-line bg-bg-raised p-6 lg:sticky lg:top-24" style={categoryStyle(category)}>
      <FieldLabel>Evidence rail</FieldLabel>
      <dl className="mt-4">
        <Row label="Users">{data.users}</Row>
        <Row label="Role">{data.role}</Row>
        <Row label="Timeline">{data.timeline}</Row>
        <Row label="Constraints">{data.constraints}</Row>
        <Row label="Tools">
          <div className="flex flex-wrap gap-1.5">
            {data.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-line-strong px-2.5 py-1 text-xs text-ink-soft"
              >
                {tool}
              </span>
            ))}
          </div>
        </Row>
        <Row label="Outcome">
          <span className="cat-tint-text font-medium">{data.outcome}</span>
        </Row>
      </dl>
    </aside>
  );
}
