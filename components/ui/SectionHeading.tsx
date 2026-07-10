import { ReactNode } from "react";
import { FieldLabel } from "@/components/ui/FieldLabel";
import clsx from "clsx";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      <FieldLabel className={align === "center" ? "justify-center" : undefined}>
        {eyebrow}
      </FieldLabel>
      <h2 className="mt-4 font-sans font-semibold text-3xl leading-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          {description}
        </p>
      ) : null}
    </div>
  );
}
