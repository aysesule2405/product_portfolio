const EXTENSION_COLOR: Record<string, string> = {
  tsx: "#3b82c4",
  ts: "#3b82c4",
  md: "#9a8bce",
  ico: "#c4a13b",
};

export function getExtension(label: string): string {
  return label.split(".").pop() ?? "";
}

export function FileTypeIcon({ label, className }: { label: string; className?: string }) {
  const ext = getExtension(label);
  const color = EXTENSION_COLOR[ext] ?? "var(--ink-faint)";
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={className} aria-hidden style={{ color }}>
      <path
        d="M3.5 1.5h5L12.5 5.5V14a.5.5 0 0 1-.5.5H3.5a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path d="M8.5 1.5V5a.5.5 0 0 0 .5.5h3.5" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

export function FolderIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      {open ? (
        <path
          d="M1.5 4.5A1 1 0 0 1 2.5 3.5h3l1 1.2H13a1 1 0 0 1 .98 1.2l-.8 5.6a1 1 0 0 1-.99.85H2.8a1 1 0 0 1-1-.9l-.3-6.95Z"
          fill="currentColor"
          opacity="0.85"
        />
      ) : (
        <path
          d="M1.5 4.2a1 1 0 0 1 1-1h2.9l1.1 1.3h6a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V4.2Z"
          fill="currentColor"
          opacity="0.85"
        />
      )}
    </svg>
  );
}

export function Chevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className={className}
      style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}
    >
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
