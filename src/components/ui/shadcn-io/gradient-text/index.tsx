"use client";

import * as React from "react";
import { motion, type Transition } from "motion/react";

import { cn } from "@/lib/utils";

type GradientTextProps = React.ComponentProps<"span"> & {
  text: string;
  gradient?: string;
  neon?: boolean;
  transition?: Transition;
};

function GradientText({
  text,
  className,
  gradient = "linear-gradient(90deg, #3b82f6 0%, #a855f7 20%, #ec4899 50%, #a855f7 80%, #3b82f6 100%)",
  neon = false,
  transition = { duration: 3, repeat: Infinity, ease: "linear" },
  ...props
}: GradientTextProps) {
  const baseStyle: React.CSSProperties = {
    backgroundImage: gradient,
  };

  return (
    <span
      data-slot="gradient-text"
      className={cn("relative inline-block", className)}
      {...props}
    >
      <motion.span
        className="tw:m-0 tw:text-transparent tw:bg-clip-text tw:bg-[length:200%_100%]"
        style={baseStyle}
        animate={{ backgroundPositionX: ["0%", "200%"] }}
        transition={transition}
      >
        {text}
      </motion.span>

      {neon && (
        <motion.span
          className="tw:m-0 tw:absolute tw:top-0 left-0 tw:text-transparent tw:bg-clip-text blur-[8px] tw:mix-blend-plus-lighter bg-[length:200%_100%]"
          style={baseStyle}
          animate={{ backgroundPositionX: ["0%", "200%"] }}
          transition={transition}
        >
          {text}
        </motion.span>
      )}
    </span>
  );
}

export { GradientText, type GradientTextProps };
