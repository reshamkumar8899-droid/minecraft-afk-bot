// src/config.js
// Loads and validates all environment variables, applies defaults, and exits
// with a clear message if required ones (HOST, USERNAME, PASSWORD) are missing.

require('dotenv').config();

function parseBool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

function parseInt(value, fallback, min) {
  const n = Number(value);
  if (Number.isNaN(n) || !Number.isFinite(n)) return fallback;
  return Math.max(min, Math.floor(n));
}

const config = {
  HOST: process.env.HOST || null,
  PORT: parseInt(process.env.PORT, 25565, 1),
  USERNAME: process.env.USERNAME || null,
  VERSION: process.env.VERSION || undefined,
  AUTH: process.env.AUTH || 'offline',
  PASSWORD: process.env.PASSWORD || null,
  LOGIN_DELAY_MS: parseInt(process.env.LOGIN_DELAY_MS, 2000, 0),
  EAT_BELOW_FOOD: parseInt(process.env.EAT_BELOW_FOOD, 14, 0),
  ROTATE_INTERVAL_MS: parseInt(process.env.ROTATE_INTERVAL_MS, 5000, 100),
  RECONNECT_DELAY_MS: parseInt(process.env.RECONNECT_DELAY_MS, 5000, 1000),
  ANTI_AFK_ENABLED: parseBool(process.env.ANTI_AFK_ENABLED, true),
  ANTI_AFK_SWING_MIN_MS: parseInt(process.env.ANTI_AFK_SWING_MIN_MS, 20000, 1000),
  ANTI_AFK_SWING_MAX_MS: parseInt(process.env.ANTI_AFK_SWING_MAX_MS, 45000, 1000),
  ANTI_AFK_SNEAK: parseBool(process.env.ANTI_AFK_SNEAK, true),
  ANTI_AFK_SLOT_SWITCH: parseBool(process.env.ANTI_AFK_SLOT_SWITCH, true),
  ANTI_AFK_COMMAND: process.env.ANTI_AFK_COMMAND || '',
  ANTI_AFK_COMMAND_INTERVAL_MIN: parseInt(process.env.ANTI_AFK_COMMAND_INTERVAL_MIN, 10, 1),
  LOG_ANTI_AFK: parseBool(process.env.LOG_ANTI_AFK, true),
  TPA_PLAYER: process.env.TPA_PLAYER || '',
  TPA_DELAY_MS: parseInt(process.env.TPA_DELAY_MS, 5000, 0),
  TPA_RETRY: parseBool(process.env.TPA_RETRY, false),
  TPA_RETRY_INTERVAL_SEC: parseInt(process.env.TPA_RETRY_INTERVAL_SEC, 60, 1),
  TPA_MAX_RETRIES: parseInt(process.env.TPA_MAX_RETRIES, 3, 0),
  TPA_ACCEPT_ENABLED: parseBool(process.env.TPA_ACCEPT_ENABLED, false),
  TPA_ACCEPT_WHITELIST: (process.env.TPA_ACCEPT_WHITELIST || '').split(',').map(s => s.trim()).filter(Boolean),
  TPA_ACCEPT_MAX_PER_HOUR: parseInt(process.env.TPA_ACCEPT_MAX_PER_HOUR, 10, 0),
  TPA_PATTERNS_FILE: process.env.TPA_PATTERNS_FILE || './tpa-patterns.json',
  TPA_DEBUG_CHAT: parseBool(process.env.TPA_DEBUG_CHAT, false),
};

const missing = [];
if (!config.HOST) missing.push('HOST');
if (!config.USERNAME) missing.push('USERNAME');
if (!config.PASSWORD) missing.push('PASSWORD');

if (missing.length > 0) {
  console.error(`[config] FATAL: Missing required env var(s): ${missing.join(', ')}. Copy .env.example to .env.`);
  process.exit(1);
}

if (config.ANTI_AFK_SWING_MAX_MS < config.ANTI_AFK_SWING_MIN_MS) {
  config.ANTI_AFK_SWING_MAX_MS = config.ANTI_AFK_SWING_MIN_MS;
}

module.exports = config;
