import { ProblemCategory } from "@/lib/types";
import { categoryStyle } from "@/lib/category-color";

/** A single guiding question, called out as its own structural beat in the
 * narrative — the thing every decision in the case study was measured
 * against. Reuses the sparkle motif from the Field Map so "north star"
 * reads as a literal star, not just a figure of speech. */
export function NorthStar({
  id,
  question,
  category,
}: {
  id?: string;
  question: string;
  category: ProblemCategory;
}) {
  return (
    <div
      id={id}
      className="cat-tint-bg cat-tint-border scroll-mt-20 my-7 rounded-xl border px-5 py-5 sm:px-6"
      style={categoryStyle(category)}
    >
      <p className="cat-tint-text flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden className="shrink-0">
          <path d="M8,1 C8.6,4.4 9.6,5.4 13,6 C9.6,6.6 8.6,7.6 8,11 C7.4,7.6 6.4,6.6 3,6 C6.4,5.4 7.4,4.4 8,1 Z" />
        </svg>
        North star
      </p>
      <p className="mt-2 max-w-2xl font-serif text-lg italic leading-snug text-ink sm:text-xl">
        {question}
      </p>
    </div>
  );
}
