"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
    <form className="form" onSubmit={handleSubmit}>
      <label className="stack">
        <span className="pill">LinkedIn PDF</span>
        <input
          className="file-input"
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <div className="card">
        <p className="muted">
          Uploads go through the app server, land in a private storage bucket, and are then converted into queued
          extraction runs for the parser worker.
        </p>
      </div>
      <div className="button-row">
        <button className="button" type="submit" disabled={isPending}>
          {isPending ? "Uploading..." : "Parse profile"}
        </button>
        {file ? <span className="pill">{Math.round(file.size / 1024)} KB</span> : null}
      </div>
      {error ? <p style={{ color: "#b22222", margin: 0 }}>{error}</p> : null}
    </form>
  );
}

