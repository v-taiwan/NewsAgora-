# Newsagora

Cloudflare-based MVP for automated news ingestion, AI summarization, pol.is poll creation, and LINE Bot delivery.

## Overview

This project explores a Cloudflare-first automation pipeline for public-interest news workflows.
After a news item is imported, the system is designed to:

1. Store the news item in D1
2. Queue an asynchronous processing job
3. Use Workers AI to generate a summary, keywords, and discussion prompts
4. Create a poll through pol.is
5. Send the summary and poll link back through LINE Bot

The core idea is to keep orchestration inside Cloudflare, while treating pol.is as an external voting service.

## Architecture

- `Cloudflare Workers`
  API entrypoint and orchestration boundary
- `Cloudflare Queues`
  Decouples news import from long-running processing
- `Cloudflare Workflows`
  Runs the multi-step automation pipeline with retryable steps
- `Cloudflare Workers AI`
  Generates summaries and poll statements
- `Cloudflare D1`
  Stores news items, summaries, jobs, and poll records
- `pol.is`
  External discussion and voting platform
- `LINE Messaging API`
  Sends summaries and poll links back to users

## MVP Scope

Current MVP scope includes:

- Importing news through an internal API
- Storing imported news in D1
- Creating processing jobs
- Triggering the pipeline through Cloudflare Queues
- Running an automation flow through Workflows
- Generating AI summaries and poll prompts
- Preparing for pol.is conversation creation
- Preparing for LINE push delivery

## Project Structure

```text
.
├── src/
│   └── worker.js
├── scripts/
│   ├── generate-flow-slide.js
│   └── generate-ppt.js
├── schema.sql
├── wrangler.toml
├── package.json
├── .dev.vars.example
├── MVP_GUIDE.md
├── CLOUDFLARE_OPTION1_GUIDE.md
├── index.html
├── main.js
└── styles.css
```

## Key Files

- `src/worker.js`
  Main Worker entrypoint, API routes, queue consumer, and Workflow definition
- `wrangler.toml`
  Cloudflare bindings for D1, Queues, Workflows, and Workers AI
- `schema.sql`
  D1 schema for news items, summaries, processing jobs, and polls
- `MVP_GUIDE.md`
  Introductory implementation guide
- `CLOUDFLARE_OPTION1_GUIDE.md`
  Guide for the Cloudflare-first architecture

## Local Development

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .dev.vars.example .dev.vars
```

Run the front-end prototype:

```bash
npm run dev
```

Run the Worker API locally:

```bash
npm run dev:api
```

## Cloudflare Setup

Recommended setup flow:

1. Log in to Cloudflare
2. Create a D1 database
3. Create a Queue
4. Configure secrets
5. Apply the schema
6. Deploy the Worker

Example commands:

```bash
npx wrangler login
npx wrangler d1 create newsagora-mvp
npx wrangler queues create news-pipeline-queue
npx wrangler secret put OPENCLAW_SHARED_TOKEN
npx wrangler secret put POLIS_API_TOKEN
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
npx wrangler d1 execute newsagora-mvp --remote --file=schema.sql
npm run deploy:api
```

## Environment Variables

Local development uses `.dev.vars`.

Expected variables:

- `OPENCLAW_SHARED_TOKEN`
- `POLIS_API_TOKEN`
- `LINE_CHANNEL_ACCESS_TOKEN`

In `wrangler.toml`, `POLIS_API_BASE` is configured as a non-secret variable.

## Current Limitations

- LINE webhook signature validation is not implemented yet
- pol.is integration is currently a wiring skeleton and may need adjustment based on actual API access and account capabilities
- The Workflow and external integrations still need full end-to-end validation on a real Cloudflare account

## Roadmap

- Implement LINE webhook signature verification
- Replace remaining mock assumptions with full D1-backed production flows
- Confirm and finalize pol.is API integration
- Add approval and moderation flow before poll publication
- Add RSS or scheduled news ingestion
