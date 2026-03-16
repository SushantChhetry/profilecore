# ProfileCore

ProfileCore is an open-source engine that converts professional profile documents into structured, AI-interactable profiles.

Professional identity data usually lives inside static, unstructured documents such as LinkedIn profile PDFs, resumes, CVs, speaker bios, founder profiles, and team pages. ProfileCore turns those documents into structured profile objects that software systems can query, analyze, and interact with using AI.

For the full product vision document, see [docs/product-vision.mdx](docs/product-vision.mdx).

## Vision

Turn documents into AI-native professional profiles.

```text
Document -> Structured Profile -> AI Interaction
```

Example workflow:

```text
Upload Profile PDF
      |
      v
Extract Document Text
      |
      v
LLM Structured Extraction
      |
      v
Create Profile Object
      |
      v
Enable AI Chat & Insights
```

## Problem

Professional identity information is scattered across documents that are:

- difficult to query
- hard to integrate into systems
- non-structured
- not AI-native

People often want answers to questions like:

- What does this person specialize in?
- What companies have they worked at?
- What are good conversation starters?
- How should I introduce myself to them?

Today that usually requires manually reading and interpreting profiles.

## Solution

ProfileCore converts profile documents into structured data models that AI systems can reason about.

Example structured profile:

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

This structured profile enables intelligent interactions instead of simple document viewing.

## Core Features

### Profile Parsing

Convert profile documents into structured JSON.

Supported documents:

- LinkedIn exported PDFs
- resumes
- CVs
- professional bios
- founder profiles

Extracted information:

- name
- headline
- company
- role
- location
- experience
- education
- skills
- timeline

### Structured Profile Object

Profiles are represented as structured entities.

```text
Person
|- Name
|- Headline
|- Location
|- Experience[]
|- Education[]
|- Skills[]
`- Metadata
```

These objects can be consumed directly by AI systems and downstream applications.

### Conversational Profile Interface

Users can interact with a profile using natural language.

Use cases:

- generate a warm introduction
- suggest conversation starters
- summarize career trajectory
- explain expertise areas
- generate an email introduction
- generate a LinkedIn message

Example:

```text
User: Generate a warm introduction message
AI: Creates personalized outreach
```

### Relationship Insights

ProfileCore can analyze profiles to identify connection points such as:

- shared companies
- shared education
- industry overlap
- potential conversation topics

Example output:

```text
Shared Background
- Both worked in fintech
- Both studied computer science

Conversation Starters
- Transition into fintech
- Scaling product teams
```

## System Architecture

The initial architecture stays intentionally simple.

```text
Frontend
   |
   v
Upload API
   |
   v
PDF Text Extraction
   |
   v
LLM Structured Extraction
   |
   v
Profile JSON Object
   |
   v
Profile Store
   |
   v
AI Chat Interface
```

Early versions do not require vector databases or complex RAG pipelines.

## Target Users

### Developers

Developers building systems that need structured professional identity data.

### Founders

Founders researching potential partners, investors, or collaborators.

### Recruiters

Recruiters parsing candidate documents.

### Product Managers

Professionals performing research on people or companies.

## Design Principles

### Simplicity

Focus on clean structured extraction.

### Document First

All information originates from user-uploaded documents.

### Structured by Default

Profiles must always be represented as structured data.

### Extensible

Support multiple document formats beyond LinkedIn.

## Roadmap

### Phase 1 - Core Parser

Goal: convert LinkedIn PDFs into structured profiles.

Features:

- upload LinkedIn profile PDF
- extract structured JSON
- display structured profile
- export JSON

Example flow:

```text
Upload LinkedIn PDF
        |
        v
Parse profile
        |
        v
Structured profile created
```

### Phase 2 - AI Profile Interaction

Enable conversational interaction.

Features:

- chat interface
- outreach generation
- career summaries
- networking suggestions

Example:

```text
User: Generate a warm intro message
AI: Creates outreach message
```

### Phase 3 - Relationship Intelligence

Enable comparisons between profiles.

Features:

- profile comparison
- shared background detection
- networking insights

Outputs:

- shared companies
- shared education
- career overlap
- talking points

### Phase 4 - Universal Profile Parsing

Support multiple document types:

- resumes
- CVs
- founder bios
- team pages
- speaker bios
- portfolio documents

ProfileCore evolves into a universal professional profile parser.

### Phase 5 - Profile Graph

Profiles become nodes in a relationship graph.

```text
Person -> Company
Person -> Education
Person -> Skills
```

This enables:

- professional similarity detection
- collaboration discovery
- network analysis

## Open Source Strategy

ProfileCore is fully open source.

Goals:

- create a reusable parsing engine
- enable developers to build applications on top
- provide structured professional identity infrastructure

Potential integrations:

- CRMs
- recruiting tools
- networking tools
- research tools

## Long-Term Vision

ProfileCore becomes a profile intelligence layer for AI systems.

Instead of AI reading raw documents, it interacts with structured professional profiles. That enables faster reasoning, better professional insights, and AI-native identity models.

Professional documents become AI-ready knowledge objects.

## Summary

ProfileCore transforms professional profile documents into structured AI-interactable profiles.

```text
Document -> Structured Profile -> AI Interaction
```

By converting documents into structured entities, ProfileCore unlocks new possibilities for professional intelligence.

## License

Open source.

Contributions welcome.
