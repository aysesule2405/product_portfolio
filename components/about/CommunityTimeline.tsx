import { communityRoles, communityStat, workshopTopics } from "@/lib/data/community";
import { FieldLabel } from "@/components/ui/FieldLabel";

/** Community shown as evidence — a stat line plus one vertical timeline, replacing the
 *  old multi-card-plus-paragraph layout with a single scannable path. */
export function CommunityTimeline() {
  const sorted = [...communityRoles].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div id="community" className="scroll-mt-20 pt-2">
      <FieldLabel>Community</FieldLabel>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        <span className="font-semibold text-ink">{communityStat}</span> — leadership
        across {communityRoles.length} organizations, teaching {workshopTopics.length}{" "}
        topics from full-stack development to visual communication.
      </p>

      <ol className="mt-6 space-y-5 border-l border-line pl-5">
        {sorted.map((role) => (
          <li key={role.id} className="relative">
            <span aria-hidden className="absolute -left-[1.65rem] top-1.5 h-2 w-2 rounded-full bg-accent" />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-sans text-sm font-semibold text-ink">
                {role.org} <span className="font-normal text-ink-faint">— {role.role}</span>
              </p>
              <p className="font-mono text-[10px] text-ink-faint">{role.dates}</p>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{role.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
