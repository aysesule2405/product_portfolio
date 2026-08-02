"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { SoundToggle } from "@/components/sound/SoundToggle";
import { getProjectBySlug } from "@/lib/data/projects";
import { useLocationHash } from "@/lib/use-location-hash";

interface Tab {
  label: string;
  href: string;
}

const baseTabs: Tab[] = [
  { label: "index.tsx", href: "/" },
  { label: "fieldmap.md", href: "/#field-map" },
  { label: "practice.md", href: "/visual-practice" },
  { label: "about.md", href: "/about" },
];

function useOpenTabs(): Tab[] {
  const pathname = usePathname();
  const tabs = [...baseTabs];

  if (pathname === "/work") {
    tabs.push({ label: "work.tsx", href: "/work" });
  }

  if (pathname?.startsWith("/work/")) {
    const slug = pathname.split("/")[2];
    const project = getProjectBySlug(slug);
    if (project) {
      tabs.push({
        label: `${project.shortName.replace(/[^a-zA-Z0-9]+/g, "")}.tsx`,
        href: `/work/${project.slug}`,
      });
    }
  }

  return tabs;
}

export function TopBar({
  onOpenSidebar,
  onOpenPalette,
}: {
  onOpenSidebar: () => void;
  onOpenPalette: () => void;
}) {
  const pathname = usePathname();
  const locationHash = useLocationHash();
  const tabs = useOpenTabs();

  return (
    <div className="sticky top-0 z-30 flex h-11 items-center gap-1 border-b border-line bg-bg-raised px-2">
      <button
        type="button"
        data-sound="navigation"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
        className="motion-press flex h-11 w-10 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-bg-inset hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path d="M2 5H16M2 9H16M2 13H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const [tabPath, fragment] = tab.href.split("#");
          const active = fragment
            ? pathname === tabPath && locationHash === `#${fragment}`
            : pathname === tabPath && (tabPath !== "/" || locationHash !== "#field-map");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "motion-press motion-tab h-11 shrink-0 items-center gap-2 border-b-2 px-3 font-mono text-[12.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
                active ? "flex" : "hidden sm:flex",
                active
                  ? "border-accent text-ink"
                  : "border-transparent text-ink-faint hover:text-ink-soft"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        data-sound="navigation"
        onClick={onOpenPalette}
        className="motion-press hidden h-11 shrink-0 items-center gap-2 rounded-md border border-line px-2.5 font-mono text-[11px] text-ink-faint hover:border-line-strong hover:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex lg:h-7"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <kbd>&#8984;K</kbd>
      </button>
      <button
        type="button"
        data-sound="navigation"
        onClick={onOpenPalette}
        aria-label="Open command palette"
        className="motion-press flex h-11 w-10 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-bg-inset hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:hidden"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <SoundToggle />
      <ThemeToggle />
    </div>
  );
}
