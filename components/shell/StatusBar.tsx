import { socialLinks, resumeHref } from "@/lib/data/nav";
import { positioning } from "@/lib/data/positioning";

export function StatusBar() {
  return (
    <footer className="sticky bottom-0 z-20 flex min-h-10 items-center gap-3 border-t border-line bg-bg-raised px-3 font-mono text-[10px] text-ink-soft sm:h-8 sm:min-h-8 sm:gap-4 sm:text-[11px]">
      <span className="shrink-0 text-accent">●</span>
      <span className="shrink-0">Ayse Sule Ekiz</span>
      <span className="hidden shrink-0 sm:inline">·</span>
      <span className="hidden shrink-0 sm:inline">{positioning.role}</span>
      <span className="hidden shrink-0 sm:inline">·</span>
      <span className="hidden shrink-0 sm:inline">Graduating {positioning.graduation}</span>
      <span className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
        {socialLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={link.label === "Email" ? "flex min-h-10 items-center hover:text-ink sm:min-h-0" : "hidden hover:text-ink sm:inline"}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noreferrer" : undefined}
          >
            {link.label}
          </a>
        ))}
        <a href={resumeHref} target="_blank" rel="noreferrer" className="flex min-h-10 items-center hover:text-ink sm:min-h-0">
          Resume
        </a>
      </span>
    </footer>
  );
}
