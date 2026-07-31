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

function BriefFact({
  label,
  children,
  accent = false,
}: {
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-bg-inset/55 p-4 sm:p-5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{label}</dt>
      <dd className={`mt-2 text-sm leading-relaxed ${accent ? "cat-tint-text font-medium" : "text-ink"}`}>
        {children}
      </dd>
    </div>
  );
}

/**
 * The case study's opening beat: a recruiter-friendly problem / ownership / decision /
 * proof summary, followed by the supporting project facts and substantiated metrics.
 */
export function CaseStudySnapshot({
  id,
  data,
  stats,
  category,
  challenge,
  ownership,
  decision,
}: {
  id?: string;
  data: EvidenceRailData;
  stats: ProjectStat[];
  category: ProblemCategory;
  challenge: string;
  ownership: string;
  decision: string;
}) {
  return (
    <div id={id} className="scroll-mt-20 rounded-2xl border border-line bg-bg-raised p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <FieldLabel>60-second brief</FieldLabel>
          <h2 className="mt-3 font-sans text-2xl font-semibold text-ink">The project at a glance.</h2>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
          Problem → ownership → decision → proof
        </p>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <BriefFact label="Problem / response">{challenge}</BriefFact>
        <BriefFact label="What I owned">{ownership}</BriefFact>
        <BriefFact label="Defining decision">{decision}</BriefFact>
        <BriefFact label="Proof / result" accent>
          {data.outcome}
        </BriefFact>
      </dl>

      <p className="mt-7 border-t border-line pt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        Project facts
      </p>
      <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 min-[380px]:grid-cols-2 sm:grid-cols-3">
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

      {stats.length > 0 ? (
        <div className="mt-6">
          <CaseStudyStats stats={stats} category={category} />
        </div>
      ) : null}
    </div>
  );
}
