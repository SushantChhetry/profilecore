"use client";

import * as Label from "@radix-ui/react-label";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "./ui/button";
import { Card } from "./ui/card";

type InitUploadResponse = {
  documentId: string;
  storagePath: string;
  upload: {
    mode: "server_proxy";
    url: string;
  };
};

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose a LinkedIn PDF before starting an extraction.");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const initResponse = await fetch("/api/v1/documents/init-upload", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || "application/pdf",
            byteSize: file.size,
          }),
        });

        const initPayload = (await initResponse.json()) as InitUploadResponse & {
          error?: { message: string };
        };

        if (!initResponse.ok) {
          throw new Error(initPayload.error?.message ?? "Unable to initialize upload.");
        }

        const uploadResponse = await fetch(initPayload.upload.url, {
          method: "PUT",
          headers: {
            "content-type": file.type || "application/pdf",
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          const uploadPayload = (await uploadResponse.json()) as { error?: { message: string } };
          throw new Error(uploadPayload.error?.message ?? "Unable to upload PDF to storage.");
        }

        const runResponse = await fetch(`/api/v1/documents/${initPayload.documentId}/start-extraction`, {
          method: "POST",
        });
        const runPayload = (await runResponse.json()) as {
          run?: { id: string };
          error?: { message: string };
        };

        if (!runResponse.ok || !runPayload.run) {
          throw new Error(runPayload.error?.message ?? "Unable to start extraction.");
        }

        router.push(`/runs/${runPayload.run.id}`);
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Upload failed.");
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <Label.Root className="grid gap-4" htmlFor="linkedin-pdf">
        <span className="inline-flex w-fit items-center rounded-full bg-[var(--accent-soft)] px-3 py-1.5 font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          LinkedIn PDF
        </span>
        <input
          id="linkedin-pdf"
          className="w-full rounded-2xl border border-[color:var(--line)] bg-white/80 px-4 py-4 text-sm text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:rgba(211,93,49,0.24)]"
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </Label.Root>
      <p className="m-0 max-w-[58ch] text-sm leading-7 text-[var(--muted)]">
        PDF only. When the upload finishes, the extraction run starts automatically.
      </p>
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Uploading..." : "Parse profile"}
          </Button>
          {file ? (
            <span className="inline-flex items-center rounded-full bg-[rgba(35,27,24,0.07)] px-3 py-1.5 font-mono text-[12px] text-[var(--muted)]">
              {Math.round(file.size / 1024)} KB
            </span>
          ) : null}
        </div>
      </Card>
      {error ? <p className="m-0 text-sm text-[#b22222]">{error}</p> : null}
    </form>
  );
}
