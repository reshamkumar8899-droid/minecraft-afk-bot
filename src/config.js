// src/config.js
// Loads and validates all environment variables, applies defaults, and exits
// with a clear message if required ones (HOST, USERNAME, PASSWORD) are missing.

require('dotenv').config();

function parseBool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const v = String(value).trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return fallback;
}

function parseInt(value, fallback, min) {
  if (value === undefined || value === null || value === '') return fallback;
  const trimmed = String(value).trim();
  if (trimmed === '') return fallback;
  const n = Number(trimmed);
  if (Number.isNaN(n) || !Number.isFinite(n)) return fallback;
  return Math.max(min, Math.floor(n));
}

const config = {
  // --- Connection ---
  HOST: process.env.HOST || null,
  PORT: parseInt(process.env.PORT, 25565, 1),
  USERNAME: process.env.USERNAME || null,
  VERSION: process.env.VERSION || undefined,
  AUTH: process.env.AUTH || 'offline',

  // --- Login ---
  PASSWORD: process.env.PASSWORD || null,
  LOGIN_DELAY_MS: parseInt(process.env.LOGIN_DELAY_MS, 2000, 0),

  // --- Auto Eat ---
  EAT_BELOW_FOOD: parseInt(process.env.EAT_BELOW_FOOD, 14, 0),

  // --- Rotation ---
  ROTATE_INTERVAL_MS: parseInt(process.env.ROTATE_INTERVAL_MS, 5000, 100),

  // --- Reconnect ---
  RECONNECT_DELAY_MS: parseInt(process.env.RECONNECT_DELAY_MS, 5000, 1000),

  // --- Anti-AFK ---
  ANTI_AFK_ENABLED: parseBool(process.env.ANTI_AFK_ENABLED, true),
  ANTI_AFK_SWING_MIN_MS: parseInt(process.env.ANTI_AFK_SWING_MIN_MS, 20000, 1000),
  ANTI_AFK_SWING_MAX_MS: parseInt(process.env.ANTI_AFK_SWING_MAX_MS, 45000, 1000),
  ANTI_AFK_SNEAK: parseBool(process.env.ANTI_AFK_SNEAK, true),
  ANTI_AFK_SLOT_SWITCH: parseBool(process.env.ANTI_AFK_SLOT_SWITCH, true),
  ANTI_AFK_COMMAND: process.env.ANTI_AFK_COMMAND || '',
  ANTI_AFK_COMMAND_INTERVAL_MIN: parseInt(process.env.ANTI_AFK_COMMAND_INTERVAL_MIN, 10, 1),
  LOG_ANTI_AFK: parseBool(process.env.LOG_ANTI_AFK, true),

  // --- TPA (outgoing) ---
  TPA_PLAYER: process.env.TPA_PLAYER || '',
  TPA_DELAY_MS: parseInt(process.env.TPA_DELAY_MS, 5000, 0),
  TPA_RETRY: parseBool(process.env.TPA_RETRY, false),
  TPA_RETRY_INTERVAL_SEC: parseInt(process.env.TPA_RETRY_INTERVAL_SEC, 60, 1),
  TPA_MAX_RETRIES: parseInt(process.env.TPA_MAX_RETRIES, 3, 0),

  // --- TPA (auto-accept) ---
  TPA_ACCEPT_ENABLED: parseBool(process.env.TPA_ACCEPT_ENABLED, false),
  TPA_ACCEPT_WHITELIST: (process.env.TPA_ACCEPT_WHITELIST || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  TPA_ACCEPT_MAX_PER_HOUR: parseInt(process.env.TPA_ACCEPT_MAX_PER_HOUR, 10, 0),
  TPA_PATTERNS_FILE: process.env.TPA_PATTERNS_FILE || './tpa-patterns.json',
  TPA_DEBUG_CHAT: parseBool(process.env.TPA_DEBUG_CHAT, false),
};

// Validate required fields (including whitespace)
const missing = [];
if (!config.HOST || String(config.HOST).trim() === '') missing.push('HOST');
if (!config.USERNAME || String(config.USERNAME).trim() === '') missing.push('USERNAME');
if (!config.PASSWORD || String(config.PASSWORD).trim() === '') missing.push('PASSWORD');

if (missing.length > 0) {
  console.error(
    `[config] FATAL: Missing required environment variable(s): ${missing.join(', ')}. ` +
    `Copy .env.example to .env and fill in the values.`
  );
  process.exit(1);
}

// Log large whitelist warning at startup
if (config.TPA_ACCEPT_ENABLED && config.TPA_ACCEPT_WHITELIST.length > 3) {
  console.log('[config] WARNING: Large whitelist: every listed player can teleport to the bot\'s location.');
}

// Validate TPA_PATTERNS_FILE path (prevent path traversal)
if (config.TPA_PATTERNS_FILE) {
  const normalized = require('path').normalize(config.TPA_PATTERNS_FILE);
  if (normalized.includes('..') || normalized.startsWith('/')) {
    console.error('[config] ERROR: TPA_PATTERNS_FILE path is invalid (may be outside project directory)');
    process.exit(1);
  }
}

module.exports = config;
