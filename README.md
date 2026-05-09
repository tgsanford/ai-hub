# OpenAIwork AI Harness

This is a local-first AI harness with an Angular frontend and an Express API backend.

## What It Does

- Configure provider keys and defaults locally
- Pick OpenAI models, with fallback presets when no key is configured
- Upload files into the harness workspace
- Run AI-driven conversations through the backend
- Switch conversation mode for coding, code review, documentation, and product output
- Keep conversation state on the server so the frontend stays provider-agnostic

## API Direction

The backend is shaped around OpenAI's Responses API because OpenAI recommends it for new agentic/conversational integrations. Relevant docs:

- Responses API: https://platform.openai.com/docs/api-reference/responses
- Streaming responses: https://platform.openai.com/docs/guides/streaming-responses
- Models: https://platform.openai.com/docs/models
- File inputs: https://platform.openai.com/docs/guides/pdf-files
- File search: https://platform.openai.com/docs/guides/tools-file-search

## Run Locally

```bash
npm install
npm run dev
```

Frontend: http://localhost:4200

API: http://localhost:3000

## Configure Keys

You can set `OPENAI_API_KEY` in `.env`:

```bash
OPENAI_API_KEY=sk-...
PORT=3000
```

Or configure the key from the app settings screen. Keys saved through the UI are stored in `.data/settings.json` for local development only. Do not use this storage strategy for a hosted multi-user deployment.

## Project Layout

```text
apps/
  api/    Express API, OpenAI integration, local JSON store
  web/    Angular standalone app
```
