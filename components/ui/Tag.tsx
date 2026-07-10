import clsx from "clsx";
import { ProblemCategory } from "@/lib/types";
import { categoryStyle } from "@/lib/category-color";

export function Tag({
  children,
  category = "ai-trust",
  className,
}: {
  children: React.ReactNode;
  category?: ProblemCategory;
  className?: string;
}) {
  return (
    <span
      style={categoryStyle(category)}
      className={clsx(
        "cat-tint-bg cat-tint-text inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1 text-xs font-medium",
        className
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--cat-color)" }} />
      {children}
    </span>
  );
}
