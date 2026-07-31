"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { projects } from "@/lib/data/projects";
import { visualWork } from "@/lib/data/visual-work";
import { hiringLenses } from "@/lib/data/hiring";

interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  href?: string;
  action?: "motion-lab";
}

function buildCommands(): Command[] {
  const nav: Command[] = [
    { id: "home", group: "Navigate", label: "Home", href: "/" },
    { id: "work", group: "Navigate", label: "All work", href: "/work" },
    { id: "field-map", group: "Navigate", label: "Field map", href: "/#field-map" },
    { id: "practice", group: "Navigate", label: "Visual Practice", href: "/visual-practice" },
    { id: "community", group: "Navigate", label: "Community", href: "/about#community" },
    { id: "about", group: "Navigate", label: "About", href: "/about" },
    { id: "contact", group: "Navigate", label: "Contact", href: "/#contact" },
    {
      id: "motion-lab",
      group: "Craft",
      label: "Motion Lab",
      hint: "Duration tokens, easing, springs, shared elements, reduced motion",
      action: "motion-lab",
    },
  ];

  const hiring: Command[] = hiringLenses.map((lens) => ({
    id: `hiring-${lens.id}`,
    group: "What are you hiring for?",
    label: lens.label,
    hint: lens.description,
    href: `/?hiring=${lens.id}#field-map`,
  }));

  const work: Command[] = projects.map((project) => ({
    id: `project-${project.slug}`,
    group: "Work",
    label: project.shortName,
    hint: project.oneLiner,
    href: `/work/${project.slug}`,
  }));

  const practice: Command[] = visualWork.map((w) => ({
    id: `visual-${w.id}`,
    group: "Visual Practice",
    label: w.medium,
    hint: w.principle,
    href: `/visual-practice#${w.id}`,
  }));

  return [...nav, ...hiring, ...work, ...practice];
}

export function CommandPalette({ onClose, onOpenMotionLab }: { onClose: () => void; onOpenMotionLab: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const commands = useMemo(() => buildCommands(), []);
  const shouldReduceMotion = useReducedMotion();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();
    return () => previousFocus?.focus();
  }, []);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function updateQuery(value: string) {
    setQuery(value);
    setActiveIndex(0);
  }

  function select(command: Command) {
    if (command.action === "motion-lab") {
      onOpenMotionLab();
      return;
    }
    if (command.href) router.push(command.href);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filtered.length === 0) return;
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filtered.length === 0) return;
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const command = filtered[activeIndex];
      if (command) select(command);
    }
  }

  function trapFocus(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key !== "Tab") return;
    const focusable = [...e.currentTarget.querySelectorAll<HTMLElement>(
      'input, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    )];
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  let lastGroup = "";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <button type="button" aria-label="Close command palette" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={trapFocus}
        className="relative flex max-h-[65vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-line bg-bg shadow-2xl"
        initial={shouldReduceMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.985 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-ink-faint">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Jump to a project, section, or hiring lens…"
            role="combobox"
            aria-controls="command-palette-list"
            aria-expanded="true"
            aria-activedescendant={filtered[activeIndex] ? `command-${filtered[activeIndex].id}` : undefined}
            className="min-w-0 w-full bg-transparent font-mono text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            aria-label="Search"
          />
          <kbd className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">esc</kbd>
        </div>

        <div id="command-palette-list" role="listbox" className="overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-faint">No matches.</p>
          ) : (
            filtered.map((command, index) => {
              const showGroup = command.group !== lastGroup;
              lastGroup = command.group;
              return (
                <div key={command.id}>
                  {showGroup ? (
                    <p className="px-4 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint first:pt-1">
                      {command.group}
                    </p>
                  ) : null}
                  <button
                    ref={(element) => {
                      itemRefs.current[index] = element;
                    }}
                    id={`command-${command.id}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    type="button"
                    onClick={() => select(command)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={clsx(
                      "motion-press flex w-full flex-col gap-0.5 px-4 py-2 text-left",
                      index === activeIndex ? "bg-bg-inset" : ""
                    )}
                  >
                    <span className="font-mono text-[13px] text-ink">{command.label}</span>
                    {command.hint ? (
                      <span className="truncate text-xs text-ink-soft">{command.hint}</span>
                    ) : null}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
