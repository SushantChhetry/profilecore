"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return <TabsPrimitive.List className={cn("flex min-w-max gap-2.5", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "cursor-pointer whitespace-nowrap rounded-full border border-[color:var(--line)] bg-white/60 px-4 py-2.5 text-sm text-[var(--muted)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(211,93,49,0.24)] data-[state=active]:border-transparent data-[state=active]:bg-[var(--accent)] data-[state=active]:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return <TabsPrimitive.Content className={cn("mt-0", className)} {...props} />;
}
