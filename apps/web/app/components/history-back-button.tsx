"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "./ui/button";

export function HistoryBackButton({
  fallbackHref = "/",
  label = "Back",
}: {
  fallbackHref?: Route;
  label?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const disableButton = !canGoBack && pathname === fallbackHref;

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  function handleClick() {
    if (disableButton) {
      return;
    }

    if (canGoBack) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <Button type="button" variant="ghost" disabled={disableButton} onClick={handleClick}>
      <span aria-hidden="true" className="mr-2 text-base leading-none">
        {"<"}
      </span>
      {label}
    </Button>
  );
}
