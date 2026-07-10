import { socialLinks, resumeHref } from "@/lib/data/nav";

export function StatusBar() {
  return (
    <footer className="sticky bottom-0 z-20 flex h-8 items-center gap-4 overflow-x-auto border-t border-line bg-bg-raised px-3 font-mono text-[11px] text-ink-soft">
      <span className="shrink-0 text-accent">●</span>
      <span className="shrink-0">Ayse Sule Ekiz</span>
      <span className="hidden shrink-0 sm:inline">·</span>
      <span className="hidden shrink-0 sm:inline">Product designer &amp; design-minded engineer</span>
      <span className="shrink-0">·</span>
      <span className="shrink-0">Houston, TX</span>
      <span className="ml-auto flex shrink-0 items-center gap-4">
        {socialLinks.map((link) => (
          <a key={link.label} href={link.href} className="hover:text-ink" target={link.href.startsWith("http") ? "_blank" : undefined} rel={link.href.startsWith("http") ? "noreferrer" : undefined}>
            {link.label}
          </a>
        ))}
        <a href={resumeHref} target="_blank" rel="noreferrer" className="hover:text-ink">
          Resume
        </a>
      </span>
    </footer>
  );
}
