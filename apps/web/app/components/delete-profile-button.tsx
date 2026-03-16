"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "./ui/button";

type DeleteProfileButtonProps = {
  profileId: string;
  profileName: string;
  redirectTo?: Route;
  className?: string;
  variant?: "primary" | "ghost";
};

export function DeleteProfileButton({
  profileId,
  profileName,
  redirectTo,
  className,
  variant = "ghost",
}: DeleteProfileButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(`Delete ${profileName} and its saved chat history? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch(`/api/v1/profiles/${profileId}`, {
          method: "DELETE",
        });

        const payload = (await response.json().catch(() => ({}))) as {
          error?: { message?: string };
        };

        if (!response.ok) {
          throw new Error(payload.error?.message ?? "Unable to delete profile.");
        }

        if (redirectTo) {
          router.replace(redirectTo);
          return;
        }

        router.refresh();
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : "Unable to delete profile.");
      }
    });
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={isPending}
        onClick={handleDelete}
      >
        {isPending ? "Deleting..." : "Delete"}
      </Button>
      {error ? <p className="m-0 text-sm text-[#b22222]">{error}</p> : null}
    </div>
  );
}
