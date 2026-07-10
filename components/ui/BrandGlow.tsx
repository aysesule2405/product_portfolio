import Image from "next/image";
import clsx from "clsx";

/** A soft, oversized, blurred crop of the wordmark's own curve — used as an
 * ambient background accent so the brand's one distinctive shape recurs
 * quietly across key pages instead of sitting only in the sidebar. Purely
 * decorative: hidden from assistive tech, never competes with content. */
export function BrandGlow({ className }: { className?: string }) {
  return (
    <div aria-hidden className={clsx("pointer-events-none absolute select-none", className)}>
      <Image
        src="/images/logos/logo.png"
        alt=""
        width={900}
        height={900}
        className="h-full w-full object-contain opacity-[0.16] blur-2xl dark:opacity-[0.22]"
        priority={false}
      />
    </div>
  );
}
