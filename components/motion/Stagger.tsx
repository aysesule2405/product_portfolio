"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { softRevealVariants, staggerContainerVariants, useReducedMotion } from "@/lib/motion";

type StaggerProps = {
  children: ReactNode;
  as?: "div" | "ul";
  className?: string;
  once?: boolean;
};

export function Stagger({ children, as = "div", className, once = true }: StaggerProps) {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as];

  if (shouldReduceMotion) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-72px" }}
      variants={staggerContainerVariants}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  as = "div",
  className,
}: {
  children: ReactNode;
  as?: "div" | "article" | "li";
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as];

  if (shouldReduceMotion) {
    return <Component className={className}>{children}</Component>;
  }

  return (
    <Component className={className} variants={softRevealVariants}>
      {children}
    </Component>
  );
}
