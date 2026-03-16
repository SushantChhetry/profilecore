# ProfileCore

Turn professional profile documents into **structured, AI-queryable profiles**.

ProfileCore is an open-source engine that converts documents like:

* LinkedIn profile PDFs
* resumes
* founder bios
* speaker profiles
* CVs

into **structured profile objects** that software and AI systems can understand.

Instead of reading static documents, applications can interact with **AI-native professional profiles**.

---

## Why ProfileCore Exists

Professional identity information is usually trapped inside documents that are:

* easy for humans to read
* difficult for software to parse
* inconsistent across formats
* hard to integrate into workflows

ProfileCore solves this by converting documents into **structured, machine-readable profile objects**.

---

## How It Works

```
Upload Profile Document
        ↓
Text Extraction
        ↓
LLM Structured Parsing
        ↓
Profile Object
        ↓
AI Interaction
```

Example output:

```json
{
  "name": "Jane Smith",
  "headline": "Product Manager at Stripe",
  "location": "New York",
  "experience": [
    {
      "company": "Stripe",
      "role": "Product Manager",
      "start": "2022",
      "end": "Present"
    }
  ],
  "education": [
    {
      "school": "MIT",
      "degree": "Computer Science"
    }
  ]
}
```

This structured profile becomes the foundation for:

* AI chat
* recruiting workflows
* networking tools
* research pipelines
* CRM integrations

---

## Features

* Parse professional profile documents into structured JSON
* Standardized profile schema
* AI chat interface for interacting with profiles
* Monorepo containing web app + parser service
* Supabase-backed storage
* Mock mode for deterministic local development

---

## Repository Layout

```
profilecore
│
├ apps/
│  ├ web                # Next.js app for uploads, profile views, and chat
│  └ parser             # FastAPI document parsing service
│
├ packages/
│  └ profile-schema     # shared profile schema
│
├ supabase              # database migrations and storage
│
└ docs                  # architecture and contributor docs
```

---

## Current Status

ProfileCore is under **active development**.

Current stack:

* **Next.js + TypeScript** for the product UI
* **Python + FastAPI** for document parsing
* **Supabase** for database and storage
* **Anthropic models** for structured extraction and chat

For product direction see:

```
docs/product-vision.mdx
```

---

## Quick Start

### Prerequisites

* Node.js **23+**
* pnpm **10+**
* Python **3.12+**
* uv
* Supabase project

---

### Install dependencies

```
pnpm install
uv sync --project apps/parser --extra dev
```

---

### Configure environment variables

Copy:

```
.env.example → .env
```

Required variables:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
ANTHROPIC_CHAT_MODEL
ANTHROPIC_EXTRACTION_MODEL
```

Optional:

```
PROFILECORE_MOCK_LLM=true
```

This enables deterministic local development.

---

### Apply database migration

Apply:

```
supabase/migrations/20260316110000_init_profilecore.sql
```

to your Supabase project.

---

### Run the app

Start the web app:

```
pnpm --filter @profilecore/web dev
```

Start the parser service:

```
uv run --project apps/parser uvicorn profilecore_parser.main:app --reload
```

---

## Useful Commands

```
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

---

## Documentation

See the `docs` directory for deeper documentation.

* Contributor guide → `docs/contributor-guide.mdx`
* Architecture overview → `docs/architecture.mdx`
* Setup → `docs/setup.mdx`
* Troubleshooting → `docs/troubleshooting.mdx`
* Product vision → `docs/product-vision.mdx`

---

## Contributing

Contributions are welcome.

Start with:

```
docs/contributor-guide.mdx
```

Then read:

```
CONTRIBUTING.md
```

for pull request workflow and guidelines.

By participating in this project, you agree to follow the project's:

```
CODE_OF_CONDUCT.md
```

---

## License

ProfileCore is released under the **MIT License**.

See:

```
LICENSE
```

---

## Star the Project

If you find ProfileCore useful, please consider ⭐ starring the repository.

It helps the project reach more developers.

---

# What makes this README stronger

This version:

* has a **clear hook**
* shows **how the system works**
* includes a **visual pipeline**
* shows **example output**
* explains **why the project exists**
* looks like **serious infrastructure**

This style is used by successful repos like:

* Supabase
* LangChain
* Payload
* Vercel OSS
