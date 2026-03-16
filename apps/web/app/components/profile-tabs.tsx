import type { Route } from "next";
import Link from "next/link";

import { cn } from "@/lib/utils";

type TabItem = {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
};

export function ProfileTabs({ profileId, defaultTab, items }: { profileId: string; defaultTab: string; items: TabItem[] }) {
  const activeItem = items.find((item) => item.id === defaultTab) ?? items[0];

  if (!activeItem) {
    return null;
  }

  return (
    <section className="grid gap-4">
      <div className="sticky top-4 z-20 overflow-x-auto rounded-[24px] border border-[color:var(--line)] bg-[rgba(255,248,239,0.78)] p-2 shadow-[0_16px_40px_rgba(87,48,24,0.06)] backdrop-blur-[18px]">
        <nav aria-label="Profile tabs" className="flex min-w-max gap-2.5">
          {items.map((item) => {
            const isActive = item.id === activeItem.id;

            return (
              <Link
                className={cn(
                  "inline-flex whitespace-nowrap rounded-full border px-4 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(211,93,49,0.24)]",
                  isActive
                    ? "border-transparent bg-[var(--accent)] text-white"
                    : "border-[color:var(--line)] bg-white/60 text-[var(--muted)]",
                )}
                href={buildProfileTabHref(profileId, item.id)}
                key={item.id}
                scroll={false}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div>{activeItem.content}</div>
    </section>
  );
}

function buildProfileTabHref(profileId: string, tab: string): Route {
  return `/profiles/${profileId}?tab=${encodeURIComponent(tab)}` as Route;
}
