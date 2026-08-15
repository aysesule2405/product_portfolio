"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { revealVariants, softRevealVariants, useReducedMotion } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  as?: "div" | "section" | "article" | "li";
  className?: string;
  delay?: number;
  subtle?: boolean;
  once?: boolean;
};

export function Reveal({
  children,
  as = "div",
  className,
  delay = 0,
  subtle = false,
  once = true,
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as];
  const variants = subtle ? softRevealVariants : revealVariants;

  if (shouldReduceMotion) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-72px" }}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </Component>
  );
}
