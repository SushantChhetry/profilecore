# ProfileCore

ProfileCore is an open-source engine for turning professional profile documents into structured, AI-interactable profiles.

It is designed for cases where identity data lives inside resumes, LinkedIn exports, founder bios, speaker profiles, and similar documents that are easy for humans to read but difficult for software to use reliably.

## What It Does

- Parses profile documents into structured data
- Stores profile objects in a consistent schema
- Supports AI chat and downstream workflows on top of those profiles
- Provides a web app and a parser service inside one monorepo

## Repository Layout

- `apps/web`: Next.js app for uploads, profile views, and chat
- `apps/parser`: FastAPI-based parser service
- `packages/profile-schema`: shared profile schema package
- `supabase`: database migration and storage setup
- `docs`: setup notes and product documentation

## Current Status

The project is under active development. The current stack combines:

- Next.js and TypeScript for the product UI
- Python and FastAPI for document parsing
- Supabase for database and storage
- Anthropic-backed extraction and chat, with mock mode for local development

For product direction, see [docs/product-vision.mdx](docs/product-vision.mdx).

## Quick Start

### Prerequisites

- `Node.js` 23+
- `pnpm` 10+
- `Python` 3.12+
- `uv`
- A hosted Supabase project

### 1. Install dependencies

```bash
pnpm install
uv sync --project apps/parser --extra dev
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and set the values you need.

Common variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_CHAT_MODEL`
- `ANTHROPIC_EXTRACTION_MODEL`
- `PROFILECORE_MOCK_LLM=true` for deterministic local development

### 3. Apply the database migration

Apply [supabase/migrations/20260316110000_init_profilecore.sql](supabase/migrations/20260316110000_init_profilecore.sql) to your Supabase project.

### 4. Run the app

Start the web app:

```bash
pnpm --filter @profilecore/web dev
```

Start the parser service:

```bash
uv run --project apps/parser uvicorn profilecore_parser.main:app --reload
```

## Useful Commands

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

## Documentation

- New contributor guide: [docs/contributor-guide.mdx](docs/contributor-guide.mdx)
- Architecture overview: [docs/architecture.mdx](docs/architecture.mdx)
- Setup: [docs/setup.mdx](docs/setup.mdx)
- Troubleshooting: [docs/troubleshooting.mdx](docs/troubleshooting.mdx)
- Product vision: [docs/product-vision.mdx](docs/product-vision.mdx)

## Contributing

Contributions are welcome. Start with [docs/contributor-guide.mdx](docs/contributor-guide.mdx), then read [CONTRIBUTING.md](CONTRIBUTING.md) for workflow and pull request expectations.

By participating in this project, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

ProfileCore is available under the [MIT License](LICENSE).
