# Doctor Report - AI Timeout Investigation
Date: 2026-04-06

## Problem
Vercel serverless timeout (60s) when Mistral AI generates itinerary. Mistral response time exceeds Vercel's 60s limit for serverless functions.

## Solution: Streaming + Edge Runtime + Retry Pattern
Since Vercel serverless functions have a hard 60s timeout (max 600s on Pro plan), and Mistral takes longer than 60s, we need a different architecture:

### Option 1: Vercel Edge Runtime (not suitable)
Edge runtime has max 30s timeout - worse, not viable.

### Option 2: Route Handlers with Vercel Hobby Free Tier
Hobby tier: 60s max - can't be changed.

### Option 3: Background Job Pattern (RECOMMENDED)
1. Client calls API
2. API starts AI generation as background task (webhook/callback)
3. API returns immediately with a job ID
4. Client polls for results or receives via WebSocket/SSE

### Option 4: Server-Sent Events (SSE) Streaming
If we stream the response, Vercel supports streaming up to 60s for hobby tier, but the response starts immediately. The key is that streaming begins before timeout.

### Best Fix: Polling Pattern
1. POST /api/itinerary/generate → creates job, returns { jobId }
2. GET /api/itinerary/status/:jobId → polls status
3. Background processing happens outside the 60s window

Alternatively, use `maxDuration` in Vercel config:
- Can set up to 600s (10 min) on Pro plan
- Hobby plan is capped at 60s

Since user is on Hobby, need architecture change.
