# Telegram Worker Bot — Architecture & Setup

## Purpose

Connect a dedicated Telegram bot (CorionWorkerBot) to the Corion backend so Adrian
can send worker tasks, intake commands, and future operational requests directly from
Telegram. Results are visible in Corion via the Agent Activity Feed (`/admin/agents`).

## Role model

```
Adrian (human)
    │  sends message to CorionWorkerBot
    ▼
Telegram Bot
    │  webhook POST or polling bridge
    ▼
POST /api/telegram/webhook  [server/routes/telegram.ts]
    │  normalize → route → log
    ▼
Corion Task Bus  [server/services/taskBus.ts]
    │  type: "delegate" → supervisor/delegate → Claude worker
    │  type: "intake"   → executeIntake workflow
    ▼
agent_events table  (visible in /admin/agents)
```

Cora remains the orchestrator. Claude is a bounded worker. This route is a thin
normalization and routing layer — it does not orchestrate, decide, or override Cora.

## Commands

| Prefix | Action |
|--------|--------|
| `/claude <prompt>` | Delegate analysis/docs/coding task to Claude worker |
| `/task <prompt>` | Same as /claude |
| `/intake <json>` | Create a new Auftrag (same path as Telegram/Cora intake) |
| bare text | Logged to agent_events, no task created |
| media (photo/document) | Logged; file_ids stored for future Drive upload slice |

## Route files

- `server/routes/telegram.ts` — webhook handler, normalization, routing
- `scripts/telegram-poll-bridge.mjs` — polling fallback for local dev
- `server/routes.ts` — registers `registerTelegramRoutes(app)`

## ENV vars

```bash
# Required for outbound bot replies
TELEGRAM_BOT_TOKEN=<from BotFather>

# Recommended: prevent unauthorized callers from triggering tasks
TELEGRAM_WEBHOOK_SECRET=<openssl rand -hex 32>

# Recommended: restrict to Adrian's chat ID only
TELEGRAM_ALLOWED_CHAT_IDS=<your_telegram_chat_id>
```

Find your chat ID: message `@userinfobot` on Telegram, or watch server logs when
you send a test message (logged as `rejected update from non-allowed chat <id>` if
TELEGRAM_ALLOWED_CHAT_IDS is set with a different value).

## Webhook setup (public server)

```bash
# Register webhook once after deploying
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://yourserver.com/api/telegram/webhook",
       "secret_token": "<TELEGRAM_WEBHOOK_SECRET>",
       "allowed_updates": ["message","channel_post"]
     }'

# Verify
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

Health check (always public, no auth):
```
GET /api/telegram/webhook
→ { ok: true, botConfigured: true, secretConfigured: true, allowedChatsConfigured: true }
```

## Polling fallback (local dev)

When the server runs on localhost without a public URL:

```bash
# 1. Delete any existing webhook (required — polling and webhook are mutually exclusive)
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# 2. Run the bridge (forwards Telegram updates to localhost)
TELEGRAM_BOT_TOKEN=xxx node scripts/telegram-poll-bridge.mjs
```

Or with dotenv:
```bash
node -r dotenv/config scripts/telegram-poll-bridge.mjs
```

## Visibility in Corion

All inbound Telegram messages are written to `agent_events` with:
- `agentSlug: "telegram_worker_bot"`
- `eventType: "telegram_inbound"`
- `busTaskType: "delegate" | "intake" | null`

Visible at `/admin/agents` — filter by agent slug `telegram_worker_bot`.

When a delegate task completes, the bus additionally writes a `bus_task_done` or
`bus_task_error` event (via `persistEventFromResult`) — so each `/claude` command
produces two events: one for the inbound message, one for the result.

## Future slices

1. **Media download** — download Telegram photos/documents to `.openclaw/media/inbound/`,
   create `drive_upload` bus task automatically
2. **Result reply** — when delegate task completes, send summary back to Telegram chat
3. **More commands** — `/code`, `/review`, `/extract` mapped to specific `taskType` values
4. **Multi-agent routing** — `/grok`, `/gemini` etc. routed to different `agentType` values

## Security assumptions

- `TELEGRAM_WEBHOOK_SECRET` verified via `timingSafeEqual` (timing-safe)
- `TELEGRAM_ALLOWED_CHAT_IDS` blocks unknown chats before any task is created
- `AGENT_TASK_SERVICE_TOKEN` is used by the bus internally — never sent to Telegram
- No secrets are sent back to Telegram in replies
- No finance-authority or account-management actions are accessible via Telegram commands
