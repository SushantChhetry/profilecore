# Contributing to ProfileCore

Thanks for contributing. The fastest way to help is to reproduce an issue, open a focused pull request, and include the checks needed to prove the change works.

## Start Here

Use these docs in this order:

1. [docs/contributor-guide.mdx](docs/contributor-guide.mdx)
2. [docs/setup.mdx](docs/setup.mdx)
3. [docs/architecture.mdx](docs/architecture.mdx)
4. [docs/troubleshooting.mdx](docs/troubleshooting.mdx)

## Before You Start

- Search existing issues and pull requests before starting duplicate work
- Open an issue or discussion before making large changes to product direction, architecture, or APIs
- Keep pull requests small enough to review quickly

## Local Setup

For the fastest end-to-end setup, follow [docs/setup.mdx](docs/setup.mdx). The summary below is here for convenience.

### Prerequisites

- `Node.js` 23+
- `pnpm` 10+
- `Python` 3.12+
- `uv`
- A hosted Supabase project

### Install dependencies

```bash
pnpm install
uv sync --project apps/parser --extra dev
```

### Configure environment variables

Copy `.env.example` to `.env`.

At minimum, set the Supabase values. For real model calls, add Anthropic credentials. For deterministic local work, set:

```bash
PROFILECORE_MOCK_LLM=true
```

### Apply the database migration

Apply `supabase/migrations/20260316110000_init_profilecore.sql` to your Supabase project before testing upload and parsing flows.

## Running the Project

If you are not sure which part of the codebase owns the behavior you want to change, read [docs/architecture.mdx](docs/architecture.mdx) before editing.

Start the web app:

```bash
pnpm --filter @profilecore/web dev
```

Start the parser service:

```bash
uv run --project apps/parser uvicorn profilecore_parser.main:app --reload
```

## Quality Checks

Run these before opening a pull request:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

If your change only affects one area, run the narrowest relevant checks in addition to the full suite when practical.

If your local environment is failing before you get this far, check [docs/troubleshooting.mdx](docs/troubleshooting.mdx).

## Pull Request Expectations

- Describe the problem and the approach clearly
- Link the relevant issue when one exists
- Add or update tests for behavior changes
- Update documentation when setup, APIs, or workflows change
- Avoid unrelated refactors in the same pull request

## Development Notes

- `apps/web` contains the frontend and API routes
- `apps/parser` contains document parsing and extraction logic
- `packages/profile-schema` contains shared schema definitions

For a more detailed ownership map and request flow, see [docs/architecture.mdx](docs/architecture.mdx).

Do not commit secrets, local `.env` files, or generated local-only artifacts.

## Community

Please be respectful in issues, pull requests, and discussions. All participants are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
