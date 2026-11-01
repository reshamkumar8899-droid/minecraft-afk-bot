// src/tpa.js
// Outgoing TPA + auto-accept with whitelist hardening + pattern matching.

const fs = require('fs');
const path = require('path');
const config = require('./config');

let bot = null;
let running = false;
let tpaTimer = null;
let acceptTimer = null;
let retryCount = 0;
let acceptCountThisHour = 0;
let acceptResetTimer = null;
let lastAcceptTime = 0;
let patterns = null;

function log(msg) { console.log(`[tpa] ${new Date().toISOString()} ${msg}`); }

function stripColors(text) {
  return text.replace(/§./g, '').replace(/&[0-9a-fk-or]/g, '').replace(/§./g, '').trim();
}

function loadPatterns() {
  try {
    const filePath = path.resolve(config.TPA_PATTERNS_FILE);
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!raw.requests || !raw.responses) throw new Error('missing keys');
    patterns = {
      requests: raw.requests.map(s => new RegExp(s)),
      responses: {},
    };
    for (const key of Object.keys(raw.responses)) {
      patterns.responses[key] = raw.responses[key].map(s => new RegExp(s));
    }
    log(`loaded patterns from ${filePath}`);
  } catch (e) {
    log(`pattern load failed, using defaults: ${e.message}`);
    patterns = {
      requests: [
        /^(\w{3,16}) has requested to teleport to you$/,
        /^(\w{3,16}) has requested that you teleport to them$/,
        /^(\w{3,16}) wants to teleport to you$/,
        /^(\w{3,16}) wants you to teleport to them$/,
      ],
      responses: {
        request_sent: [],
        player_not_found: [/player not found/i, /could not find the player/i],
        player_offline: [/is offline/i, /is not online/i],
        cooldown: [/cooldown/i, /please wait/i],
        teleporting: [/teleporting/i, /accepted/i],
      },
    };
  }
}

function matchPatterns(text, list) {
  for (const re of list) {
    const m = text.match(re);
    if (m) return m;
  }
  return null;
}

function classifyResponse(text) {
  if (!patterns || !patterns.responses) return null;
  for (const key of Object.keys(patterns.responses)) {
    if (matchPatterns(text, patterns.responses[key])) return key;
  }
  return null;
}

function sendTpa() {
  if (!bot || !running || !config.TPA_PLAYER) return;
  if (config.TPA_RETRY && retryCount >= config.TPA_MAX_RETRIES) {
    log(`TPA max retries (${config.TPA_MAX_RETRIES}) reached for ${config.TPA_PLAYER}`);
    return;
  }
  bot.chat(`/tpa ${config.TPA_PLAYER}`);
  log(`sent /tpa ${config.TPA_PLAYER}`);
  if (config.TPA_RETRY) {
    retryCount++;
    tpaTimer = setTimeout(sendTpa, config.TPA_RETRY_INTERVAL_SEC * 1000);
  }
}

function handleAcceptRequest(text) {
  if (!config.TPA_ACCEPT_ENABLED) return;
  if (!config.TPA_ACCEPT_WHITELIST || config.TPA_ACCEPT_WHITELIST.length === 0) return;
  if (!featuresStarted) return;

  const m = matchPatterns(text, patterns.requests);
  if (!m) return;
  const name = m[1];
  const wl = config.TPA_ACCEPT_WHITELIST.map(s => s.toLowerCase());
  if (!wl.includes(name.toLowerCase())) {
    log(`TPA ignored: ${name} not in whitelist`);
    return;
  }

  // Rate limit
  const now = Date.now();
  if (now - lastAcceptTime < 10000) {
    log(`TPA ignored: duplicate from ${name} within 10s`);
    return;
  }
  if (acceptCountThisHour >= config.TPA_ACCEPT_MAX_PER_HOUR) {
    log(`TPA ignored: rate limit (${acceptCountThisHour}/${config.TPA_ACCEPT_MAX_PER_HOUR})`);
    return;
  }

  lastAcceptTime = now;
  acceptCountThisHour++;
  const wait = 1000 + Math.random() * 2000;
  setTimeout(() => {
    bot.chat('/tpaccept');
    log(`TPA accepted: ${name}`);
  }, wait);
}

function start(b) {
  if (running) return;
  bot = b; running = true;
  retryCount = 0; acceptCountThisHour = 0; lastAcceptTime = 0;
  loadPatterns();

  if (config.TPA_ACCEPT_WHITELIST.length > 3) {
    log(`Large whitelist: every listed player can teleport to the bot's location.`);
  }

  // Watch system messages
  bot.on('chat', (username, message, onGround, position) => {
    if (username !== null) return;
    const text = stripColors(message);

    if (config.TPA_DEBUG_CHAT) {
      log(`DEBUG chat [${position}]: ${text}`);
    }

    // Auto-accept only from system/game_info positions
    if (position === 'system' || position === 'game_info') {
      handleAcceptRequest(text);
    }

    // Outgoing TPA response classification
    if (config.TPA_PLAYER && config.TPA_RETRY) {
      const kind = classifyResponse(text);
      if (kind === 'player_not_found') log(`TPA: player not found (${config.TPA_PLAYER})`);
      else if (kind === 'player_offline') log(`TPA: player offline (${config.TPA_PLAYER})`);
      else if (kind === 'cooldown') log(`TPA: cooldown active`);
      else if (kind === 'teleporting') log(`TPA: teleporting to ${config.TPA_PLAYER}`);
    }
  });

  // Send outgoing TPA after delay
  setTimeout(() => {
    if (config.TPA_PLAYER) sendTpa();
  }, config.TPA_DELAY_MS);

  // Hourly accept counter reset
  acceptResetTimer = setInterval(() => { acceptCountThisHour = 0; }, 3600000);

  log('tpa started');
}

function stop() {
  running = false; bot = null;
  if (tpaTimer) { clearTimeout(tpaTimer); tpaTimer = null; }
  if (acceptResetTimer) { clearInterval(acceptResetTimer); acceptResetTimer = null; }
  log('tpa stopped');
}

module.exports = { start, stop };
