"use client";

import { motion } from "framer-motion";
import { ProblemCategory, ProjectStat } from "@/lib/types";

/** Pulls the handful of already-substantiated facts out of the case study
 * prose (a real count, a real placement, a real award) and gives them the
 * big-serif-number treatment, so the reader gets the headline before the
 * paragraphs — never a metric invented for the sake of having one. */
export function CaseStudyStats({
  stats,
}: {
  stats: ProjectStat[];
  category: ProblemCategory;
}) {
  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
          className="cat-tint-border rounded-2xl border bg-bg-raised px-6 py-5"
        >
          <p className="cat-tint-text font-serif text-4xl font-semibold leading-none sm:text-5xl">
            {stat.value}
          </p>
          <p className="mt-2 text-sm leading-snug text-ink-soft">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
