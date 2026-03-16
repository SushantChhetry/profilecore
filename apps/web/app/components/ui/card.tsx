import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-[color:var(--line)] bg-[var(--panel-strong)] p-[18px] shadow-[0_10px_30px_rgba(87,48,24,0.04)]",
        className,
      )}
      {...props}
    />
  );
}
