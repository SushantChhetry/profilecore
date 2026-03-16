"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "ghost";
};

export function Button({ asChild = false, className, variant = "primary", ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-full border px-5 py-3 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(211,93,49,0.24)] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary"
          ? "border-transparent bg-[var(--accent)] text-white hover:-translate-y-0.5"
          : "border-[color:var(--line)] bg-white/70 text-[var(--ink)] hover:-translate-y-0.5",
        className,
      )}
      {...props}
    />
  );
}
