import { UploadForm } from "./components/upload-form";

export default function HomePage() {
  return (
    <main className="shell grid">
      <section className="hero">
        <span className="eyebrow">ProfileCore v1</span>
        <h1>Documents in. Structured profiles out.</h1>
        <p>
          Upload a LinkedIn PDF, persist a typed profile object in Postgres, and immediately use that profile as the
          context for outreach prompts, summaries, and research questions.
        </p>
        <div className="stat-strip">
          <div className="stat">
            <span className="value">PDF</span>
            <span className="muted">LinkedIn export only in V1.</span>
          </div>
          <div className="stat">
            <span className="value">JSON</span>
            <span className="muted">Canonical schema versioned at `1.0.0`.</span>
          </div>
          <div className="stat">
            <span className="value">Chat</span>
            <span className="muted">Single-profile conversations with no vector layer.</span>
          </div>
        </div>
      </section>

      <section className="grid two">
        <div className="panel stack">
          <div>
            <p className="eyebrow">Upload</p>
            <h2 className="page-title" style={{ fontSize: "2.4rem" }}>
              Start an extraction run
            </h2>
            <p className="muted">
              The app validates file type and size, stores the PDF in a private bucket, creates an extraction job, and
              lets the parser worker claim it asynchronously.
            </p>
          </div>
          <UploadForm />
        </div>

        <aside className="panel stack">
          <div className="card">
            <p className="eyebrow">Public API</p>
            <p className="route-link">POST /api/v1/documents/init-upload</p>
            <p className="route-link">POST /api/v1/documents/:id/start-extraction</p>
            <p className="route-link">GET /api/v1/extraction-runs/:runId</p>
            <p className="route-link">GET /api/v1/profiles/:profileId/export</p>
          </div>
          <div className="card">
            <p className="eyebrow">Default behavior</p>
            <ul className="list">
              <li>Private PDF storage via Supabase Storage.</li>
              <li>Structured profile validation via the shared JSON schema package.</li>
              <li>Chat answers grounded only in the saved profile JSON.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

