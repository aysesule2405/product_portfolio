import { EvidenceRailData, ProblemCategory, ProjectStat } from "@/lib/types";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { CaseStudyStats } from "@/components/work/CaseStudyStats";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{label}</dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-ink">{children}</dd>
    </div>
  );
}

/**
 * The case study's opening beat: role, timeline, team, users, constraints, tools, and
 * outcome, plus the two metrics worth leading with — everything a recruiter needs before
 * reading a single paragraph. Replaces the old sticky evidence-rail sidebar, which
 * duplicated this same information further down the page.
 */
export function CaseStudySnapshot({
  id,
  data,
  stats,
  category,
}: {
  id?: string;
  data: EvidenceRailData;
  stats: ProjectStat[];
  category: ProblemCategory;
}) {
  return (
    <div id={id} className="scroll-mt-20 rounded-2xl border border-line bg-bg-raised p-6 sm:p-8">
      <FieldLabel>Snapshot</FieldLabel>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <Fact label="Role">{data.role}</Fact>
        <Fact label="Timeline">{data.timeline}</Fact>
        <Fact label="Team">{data.team}</Fact>
        <Fact label="Users">{data.users}</Fact>
      </dl>

      <dl className="mt-5 grid grid-cols-1 gap-5 border-t border-line pt-5 sm:grid-cols-2">
        <Fact label="Constraints">{data.constraints}</Fact>
        <Fact label="Tools">
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
        </Fact>
      </dl>

      <div className="mt-5 border-t border-line pt-5">
        <Fact label="Outcome">
          <span className="cat-tint-text font-medium">{data.outcome}</span>
        </Fact>
      </div>

      {stats.length > 0 ? (
        <div className="mt-6">
          <CaseStudyStats stats={stats} category={category} />
        </div>
      ) : null}
    </div>
  );
}
