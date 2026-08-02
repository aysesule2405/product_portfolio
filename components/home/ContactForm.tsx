"use client";

import { useState, FormEvent } from "react";
import { useSound } from "@/components/sound/SoundProvider";

const WEB3FORMS_ACCESS_KEY = "7b268203-c0a5-47d9-acbe-7eb03d4af6a6";

export function ContactForm() {
  const { play } = useSound();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [messageLength, setMessageLength] = useState(0);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      setStatus(res.ok ? "success" : "error");
      if (res.ok) play("completion");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="motion-card rounded-xl border border-line bg-bg-inset/70 p-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-positive/15 text-positive">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M3 9.5 7 13.5 15 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="mt-3 font-sans text-base font-semibold text-ink">Message sent.</p>
        <p className="mt-1 text-sm text-ink-soft">
          Thanks for reaching out. Your note is in my inbox, and I&rsquo;ll reply as soon as I can.
        </p>
        <button
          type="button"
          data-sound="navigation"
          onClick={() => {
            setStatus("idle");
            setMessageLength(0);
          }}
          className="motion-press mt-4 inline-flex min-h-11 items-center text-sm font-medium text-ink underline decoration-line-strong decoration-2 underline-offset-4 hover:text-ink-soft"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="access_key" value={WEB3FORMS_ACCESS_KEY} />
      <input type="hidden" name="subject" value="New message from your portfolio website" />
      <input type="hidden" name="from_name" value="Portfolio Contact Form" />
      <input
        type="checkbox"
        name="botcheck"
        className="hidden"
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="motion-field">
          <label htmlFor="name" className="motion-field-label mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Your name"
            autoComplete="name"
            required
            className="motion-input min-h-11 w-full rounded-lg border border-line bg-bg-inset/70 px-3 py-2.5 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:text-sm"
          />
        </div>
        <div className="motion-field">
          <label htmlFor="email" className="motion-field-label mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="your@email.com"
            autoComplete="email"
            required
            className="motion-input min-h-11 w-full rounded-lg border border-line bg-bg-inset/70 px-3 py-2.5 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:text-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="motion-field">
          <label htmlFor="inquiry-type" className="motion-field-label mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            Reaching out about
          </label>
          <select
            id="inquiry-type"
            name="inquiry_type"
            required
            defaultValue=""
            className="motion-input min-h-11 w-full rounded-lg border border-line bg-bg-inset/70 px-3 py-2.5 text-base text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:text-sm"
          >
            <option value="" disabled>
              Choose a topic
            </option>
            <option value="Job opportunity">Job opportunity</option>
            <option value="Project collaboration">Project collaboration</option>
            <option value="Portfolio or project question">Portfolio or project question</option>
            <option value="Hello">Just saying hello</option>
          </select>
        </div>
        <div className="motion-field">
          <label htmlFor="organization" className="motion-field-label mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            Company or organization <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <input
            type="text"
            id="organization"
            name="organization"
            placeholder="Where you work"
            autoComplete="organization"
            className="motion-input min-h-11 w-full rounded-lg border border-line bg-bg-inset/70 px-3 py-2.5 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:text-sm"
          />
        </div>
      </div>

      <div className="motion-field">
        <div className="mb-1 flex items-center justify-between gap-3">
          <label htmlFor="message" className="motion-field-label block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            Message
          </label>
          <span className="font-mono text-[10px] text-ink-faint" aria-live="polite">
            {messageLength} / 500
          </span>
        </div>
        <textarea
          id="message"
          name="message"
          placeholder="Share a few details about the role, project, or idea—and what you’d like to discuss."
          rows={5}
          required
          maxLength={500}
          onChange={(event) => setMessageLength(event.currentTarget.value.length)}
          className="motion-input w-full resize-none rounded-lg border border-line bg-bg-inset/70 px-3 py-2.5 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:text-sm"
        />
      </div>

      {status === "error" ? (
        <p className="text-sm" style={{ color: "var(--star-red)" }} role="alert">
          Something went wrong. Try again, or{" "}
          <a className="font-medium underline underline-offset-2" href="mailto:ase2327ekiz@gmail.com">
            email me directly
          </a>
          .
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="motion-press inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-on hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Send Ayse a message"}
      </button>
    </form>
  );
}
