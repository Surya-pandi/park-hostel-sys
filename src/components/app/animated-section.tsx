"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

type AnimatedSectionProps = HTMLMotionProps<"div"> & {
  delay?: number;
};

export function AnimatedSection({ className, delay = 0, ...props }: AnimatedSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      className={cn(className)}
      {...props}
    />
  );
}
