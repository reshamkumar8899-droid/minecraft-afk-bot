# Minecraft AFK Bot

A lightweight Node.js bot that joins a Minecraft Java server, logs in with `/login`, eats automatically, rotates its POV, performs harmless anti-AFK actions **without ever moving**, optionally sends `/tpa`, auto-accepts teleports from a whitelist, and reconnects after disconnects.

**Recommended GitHub topics:** `minecraft`, `mineflayer`, `afk-bot`, `nodejs`

## Features

- **Auto login** — sends `/login <PASSWORD>` after spawn (also handles `/register` prompts)
- **Auto eat** — eats when food drops below the threshold, prefers high-saturation food
- **Rotation** — rotates POV by 60 degrees on an interval
- **Anti-AFK** — arm swing, sneak toggle, hotbar slot switch, optional chat command (never moves the bot)
- **TPA outgoing** — sends `/tpa <PLAYER>` with optional retry
- **TPA auto-accept** — accepts `/tpa` from a whitelist of trusted players only
- **Auto reconnect** — reconnects with exponential backoff (max 60s)
- **Stability** — handles `uncaughtException` and `unhandledRejection`, graceful shutdown on SIGINT

## Setup

1. Install **Node.js 20+**.
2. Clone this repo:

   ```bash
   git clone https://github.com/<your-username>/minecraft-afk-bot.git
   cd minecraft-afk-bot
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy the config template and fill in your real values:

   ```bash
   cp .env.example .env
   ```

   On Windows:

   ```cmd
   copy .env.example .env
   ```

## Where to write your password and player name

Open the local `.env` file and fill in:

- **`HOST`** — the server address
- **`USERNAME`** — the bot's in-game name
- **`PASSWORD`** — sent as `/login <PASSWORD>` (Essentials login)
- **`TPA_PLAYER`** — the exact in-game name; the bot sends `/tpa PlayerName` and that player must be online
  and type `/tpaccept`. Leave empty to disable.

Example final `.env`:

```env
HOST=play.example.com
PORT=25565
USERNAME=MyBot
AUTH=offline
PASSWORD=supersecret
TPA_PLAYER=Steve
```

> **Warning:** Never edit real values on GitHub and never commit your real `.env`. Only `.env.example` with
> fake values goes on GitHub. Run `git status` before every push to confirm `.env` is not listed.

## Config table

| Variable | Default | What it does |
|---|---|---|
| `HOST` | — (required) | Server address |
| `PORT` | `25565` | Server port |
| `USERNAME` | — (required) | Bot's in-game name |
| `VERSION` | empty | Minecraft version; empty = auto-detect |
| `AUTH` | `offline` | `offline` or `microsoft` |
| `PASSWORD` | — (required) | Login password (sent as `/login <PASSWORD>`) |
| `LOGIN_DELAY_MS` | `2000` | Delay after spawn before sending `/login` |
| `EAT_BELOW_FOOD` | `14` | Eat when food drops below this |
| `ROTATE_INTERVAL_MS` | `5000` | Rotation interval in ms |
| `RECONNECT_DELAY_MS` | `5000` | Base reconnect delay in ms |
| `ANTI_AFK_ENABLED` | `true` | Enable anti-AFK |
| `ANTI_AFK_SWING_MIN_MS` | `20000` | Min arm-swing interval |
| `ANTI_AFK_SWING_MAX_MS` | `45000` | Max arm-swing interval |
| `ANTI_AFK_SNEAK` | `true` | Toggle sneak |
| `ANTI_AFK_SLOT_SWITCH` | `true` | Switch hotbar slot |
| `ANTI_AFK_COMMAND` | empty | Optional harmless chat command |
| `ANTI_AFK_COMMAND_INTERVAL_MIN` | `10` | Command interval in minutes |
| `LOG_ANTI_AFK` | `true` | Log anti-AFK actions |
| `TPA_PLAYER` | empty | Player to send `/tpa` to |
| `TPA_DELAY_MS` | `5000` | Delay before first `/tpa` |
| `TPA_RETRY` | `false` | Retry `/tpa` on failure |
| `TPA_RETRY_INTERVAL_SEC` | `60` | Retry interval |
| `TPA_MAX_RETRIES` | `3` | Max retries |
| `TPA_ACCEPT_ENABLED` | `false` | Enable auto-accept |
| `TPA_ACCEPT_WHITELIST` | empty | Comma-separated trusted players |
| `TPA_ACCEPT_MAX_PER_HOUR` | `10` | Max accepts per hour |
| `TPA_PATTERNS_FILE` | `./tpa-patterns.json` | Chat pattern file |
| `TPA_DEBUG_CHAT` | `false` | Log every system message |

## How to run

```bash
npm start
```

### Run 24/7 with PM2

```bash
npm install -g pm2
pm2 start index.js --name "minecraft-afk-bot"
pm2 save
```

### Run with Docker

```bash
docker compose up -d
```
*(or `docker-compose up -d` for older Docker versions)*

> **Note:** You must create `.env` before running with Docker.

View logs with:
```bash
docker compose logs -f
```

## Important notes

- **Essentials permissions:** the bot account needs `essentials.tpa`. Some servers block `/tpa` for new or
  unverified players, so an admin may need to promote or whitelist the bot.
- **Teleport after reconnect:** the bot sends `/tpa` once per session, so it asks again after every reconnect.
  If this annoys the player, keep `TPA_RETRY=false` and consider increasing `RECONNECT_DELAY_MS`.
- **Auto-accept safety:** keep `TPA_ACCEPT_WHITELIST` short (ideally 1-3 trusted players), because anyone
  on it can teleport to the bot's location. Leave `TPA_ACCEPT_ENABLED=false` if not needed. Player chat is
  ignored to prevent fake requests, and there is an hourly limit.
- **Chat message formats:** Essentials messages differ between servers, plugins, and languages. If auto-accept
  doesn't trigger: (1) set `TPA_DEBUG_CHAT=true` and restart, (2) have the player send `/tpa` to the bot,
  (3) read the exact message in the console, (4) add that wording as a new regex in `tpa-patterns.json` keeping
  `(\w{3,16})` where the player name appears, (5) set `TPA_DEBUG_CHAT=false` and restart.

  Inside JSON files every backslash must be doubled. Example patterns:

  ```json
  "^(\w{3,16}) a demandé de vous téléporter"
  ```
  ```json
  "^(\w{3,16}) quiere teletransportarse a ti"
  ```
  *(These are only examples for non-English servers)*

- **Server rules:** many servers ban AFK bots or have anti-bot rules, so check the rules first. The anti-AFK
  features never move the bot, so position-based AFK checks may still kick it.

## Troubleshooting

| Problem | Likely cause |
|---|---|
| "Player not found" | Wrong name or player offline |
| "Nothing happens after /tpa" | Player didn't type `/tpaccept`, or the request expired |
| "Cooldown" | Essentials teleport cooldown; increase `TPA_RETRY_INTERVAL_SEC` |
| "No permission" | Bot account needs `essentials.tpa` |
| "Auto-accept doesn't work" | Check whitelist spelling, `TPA_DEBUG_CHAT` output, pattern match |
| "Bot gets kicked for AFK" | Server uses position-based AFK detection |

## License

MIT
