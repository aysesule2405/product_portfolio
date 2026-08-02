"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Image from "next/image";
import { rootFiles, fileTreeGroups } from "@/lib/data/file-tree";
import { FileTypeIcon, FolderIcon, Chevron } from "@/components/shell/FileTreeIcons";
import { useOutline } from "@/lib/outline-context";
import { useLocationHash } from "@/lib/use-location-hash";

function SidebarToggle({
  collapsed,
  onToggle,
  className,
}: {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-sound="navigation"
      onClick={onToggle}
      aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
      aria-pressed={collapsed}
      title={collapsed ? "Expand navigation (Cmd+B)" : "Collapse navigation (Cmd+B)"}
      className={clsx(
        "motion-press flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-bg-inset hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className
      )}
    >
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
        <rect x="2.25" y="3" width="13.5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <path d="M6.25 3V15" stroke="currentColor" strokeWidth="1.25" />
        <path
          d={collapsed ? "M10 6L12.75 9L10 12" : "M12.75 6L10 9L12.75 12"}
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function FileRow({
  label,
  href,
  active,
  onNavigate,
}: {
  label: string;
  href: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "motion-press flex min-h-11 items-center gap-2 rounded px-2 py-1 font-mono text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:min-h-0",
        active ? "bg-bg-inset text-accent" : "text-ink-soft hover:bg-bg-inset hover:text-ink"
      )}
    >
      <FileTypeIcon label={label} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function Sidebar({
  mobileOpen,
  collapsed,
  onCloseMobile,
  onToggleCollapsed,
}: {
  mobileOpen: boolean;
  collapsed: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const locationHash = useLocationHash();
  const [rootOpen, setRootOpen] = useState(true);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(fileTreeGroups.map((g) => [g.label, true]))
  );
  const { sections, activeId } = useOutline();
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = window.requestAnimationFrame(() => mobileCloseRef.current?.focus());

    function trapFocus(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const focusable = mobilePanelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", trapFocus);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", trapFocus);
      previousFocus?.focus();
    };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    const [linkPath, fragment] = href.split("#");
    if (fragment) return pathname === linkPath && locationHash === `#${fragment}`;
    return pathname === linkPath && locationHash === "";
  };

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function jumpToSection(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    onCloseMobile();
  }

  const railLinks = [
    ...rootFiles,
    ...fileTreeGroups.flatMap((group) => group.entries),
  ];

  const content = (
    <nav aria-label="Site navigation" className="flex h-full flex-col overflow-y-auto px-2 py-2 lg:py-4">
      <div className="flex items-center justify-between gap-2 px-2 pb-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
          Explorer
        </p>
        <SidebarToggle collapsed={collapsed} onToggle={onToggleCollapsed} className="hidden lg:flex" />
      </div>

      <button
        type="button"
        data-sound="navigation"
        onClick={() => setRootOpen((v) => !v)}
        className="motion-press flex min-h-11 items-center gap-1.5 rounded px-1 py-1 font-mono text-[12px] font-semibold uppercase tracking-[0.04em] text-ink hover:bg-bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:min-h-0"
      >
        <Chevron open={rootOpen} className="shrink-0 text-ink-faint" />
        <Image src="/images/logos/logo.png" alt="" width={16} height={16} className="shrink-0" aria-hidden />
        clarity-lab
      </button>

      {rootOpen ? (
        <div className="ml-[9.5px] mt-0.5 border-l border-line pl-2.5">
          <div className="flex flex-col gap-0.5">
            {rootFiles.map((file) => (
              <FileRow key={file.href} {...file} active={isActive(file.href)} onNavigate={onCloseMobile} />
            ))}
          </div>

          {fileTreeGroups.map((group) => {
            const isOpen = openGroups[group.label];
            return (
              <div key={group.label} className="mt-0.5 flex flex-col gap-0.5">
                <button
                  type="button"
                  data-sound="navigation"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={isOpen}
                  className="motion-press flex min-h-11 items-center gap-1.5 rounded px-1 py-1 font-mono text-[12px] text-ink-soft hover:bg-bg-inset hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:min-h-0"
                >
                  <Chevron open={isOpen} className="shrink-0 text-ink-faint" />
                  <FolderIcon open={isOpen} className="shrink-0 text-ink-faint" />
                  {group.label}
                </button>

                {isOpen ? (
                  <div className="ml-[9.5px] flex flex-col gap-0.5 border-l border-line pl-2.5">
                    {group.entries.map((entry) => (
                      <FileRow key={entry.href} {...entry} active={isActive(entry.href)} onNavigate={onCloseMobile} />
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {sections.length > 0 ? (
        <div className="mt-4 border-t border-line pt-3">
          <button
            type="button"
            data-sound="navigation"
            onClick={() => setOutlineOpen((v) => !v)}
            aria-expanded={outlineOpen}
            className="motion-press flex min-h-11 w-full items-center gap-1.5 rounded px-1 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint hover:bg-bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:min-h-0"
          >
            <Chevron open={outlineOpen} className="shrink-0" />
            Outline
          </button>

          {outlineOpen ? (
            <div className="ml-[9.5px] mt-0.5 flex flex-col gap-0.5 border-l border-line pl-2.5">
              {sections.map((section) => {
                const active = activeId === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    data-sound="navigation"
                    onClick={() => jumpToSection(section.id)}
                    aria-current={active ? "location" : undefined}
                    className={clsx(
                      "motion-press flex min-h-11 items-center gap-2 rounded px-2 py-1 text-left font-mono text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:min-h-0",
                      active ? "bg-bg-inset text-accent" : "text-ink-soft hover:bg-bg-inset hover:text-ink"
                    )}
                  >
                    <span
                      aria-hidden
                      className={clsx("h-1 w-1 shrink-0 rounded-full", active ? "bg-accent" : "bg-line-strong")}
                    />
                    <span className="truncate">{section.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </nav>
  );

  const collapsedContent = (
    <nav aria-label="Collapsed site navigation" className="flex h-full flex-col items-center gap-2 overflow-y-auto px-1.5 py-3">
      <SidebarToggle collapsed={collapsed} onToggle={onToggleCollapsed} />
      <div className="h-px w-7 bg-line" />
      <Image src="/images/logos/logo.png" alt="" width={22} height={22} className="my-1 shrink-0" aria-hidden />
      <div className="flex w-full flex-col items-center gap-1">
        {railLinks.map((file) => {
          const active = isActive(file.href);
          return (
            <Link
              key={file.href}
              href={file.href}
              aria-label={file.label}
              aria-current={active ? "page" : undefined}
              title={file.label}
              className={clsx(
                "motion-press flex h-8 w-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                active ? "bg-bg-inset text-accent" : "text-ink-soft hover:bg-bg-inset hover:text-ink"
              )}
            >
              <FileTypeIcon label={file.label} className="shrink-0" />
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      <aside
        className={clsx(
          "sticky top-0 hidden h-screen shrink-0 border-r border-line bg-bg-raised transition-[width] duration-200 lg:block",
          collapsed ? "w-12" : "w-64"
        )}
      >
        {collapsed ? collapsedContent : content}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            data-sound="navigation"
            aria-label="Close navigation"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-black/40"
          />
          <div
            ref={mobilePanelRef}
            className="absolute inset-y-0 left-0 flex h-dvh w-72 max-w-[86vw] flex-col border-r border-line bg-bg-raised shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-end px-2 pt-1">
              <button
                ref={mobileCloseRef}
                type="button"
                data-sound="navigation"
                autoFocus
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="motion-press flex h-11 w-11 items-center justify-center rounded-md text-ink-soft hover:bg-bg-inset hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M3 3L15 15M15 3L3 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1">{content}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
