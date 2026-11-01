// src/antiAfk.js
// Anti-AFK actions that NEVER move the bot.

const config = require('./config');

let bot = null;
let running = false;

let swingTimer = null;
let sneakTimer = null;
let slotTimer = null;
let cmdTimer = null;

let lastSlot = 0;
let originalSlot = 0;
let eatingInhibited = false;

function jitter(base, pct = 0.2) {
  const delta = base * pct * (Math.random() * 2 - 1);
  return Math.max(100, Math.floor(base + delta));
}

function log(msg) {
  if (config.LOG_ANTI_AFK) console.log(`[antiAfk] ${new Date().toISOString()} ${msg}`);
}

function isEating(b) {
  return !!(b && b.autoEat && b.autoEat.isEating);
}

function scheduleAction(fn, name) {
  if (!running) return;
  fn();
}

function swingArm() {
  if (!bot || !running) return;
  if (isEating(bot)) return;
  try {
    bot.swingArm('right');
    log('swung right arm');
  } catch (e) {
    log(`swingArm error: ${e.message}`);
  }
}

function toggleSneak() {
  if (!bot || !running) return;
  if (isEating(bot)) return;
  try {
    bot.setControlState('sneak', true);
    const hold = jitter(750, 0.33);
    setTimeout(() => {
      if (!running || !bot) return;
      try { bot.setControlState('sneak', false); log('sneak released'); }
      catch (e) { log(`sneak release error: ${e.message}`); }
    }, hold);
    log('sneak toggled on');
  } catch (e) {
    log(`sneak error: ${e.message}`);
  }
}

function slotSwitch() {
  if (!bot || !running) return;
  if (isEating(bot)) return;
  try {
    // Save original slot on first switch
    if (originalSlot === 0 && !lastSlot) {
      try { originalSlot = bot.quickBarSlotIndex || 0; } catch (e) { originalSlot = 0; }
    }

    const slots = [0,1,2,3,4,5,6,7,8];
    let next;
    do { next = slots[Math.floor(Math.random() * slots.length)]; } while (next === bot.quickBarSlotIndex || next === originalSlot);
    bot.setQuickBarSlot(next);
    log(`quickbar slot switched to ${next}`);
    lastSlot = next;
  } catch (e) {
    log(`slotSwitch error: ${e.message}`);
  }
}

function restoreSlot() {
  if (!bot || !running || isEating(bot)) return;
  try {
    bot.setQuickBarSlot(originalSlot);
    log(`quickbar slot restored to ${originalSlot}`);
  } catch (e) {
    log(`restoreSlot error: ${e.message}`);
  }
}

function sendCommand() {
  if (!bot || !running) return;
  const cmd = config.ANTI_AFK_COMMAND;
  if (!cmd) return;
  if (isEating(bot)) return;
  try {
    bot.chat(cmd);
    log(`sent command: ${cmd}`);
  } catch (e) {
    log(`sendCommand error: ${e.message}`);
  }
}

function scheduleSwing() {
  if (!running) return;
  const interval = jitter(
    Math.random() * (config.ANTI_AFK_SWING_MAX_MS - config.ANTI_AFK_SWING_MIN_MS) + config.ANTI_AFK_SWING_MIN_MS,
    0.2
  );
  swingTimer = setTimeout(() => {
    scheduleAction(swingArm, 'swing');
    scheduleSwing();
  }, interval);
}

function scheduleSneak() {
  if (!running || !config.ANTI_AFK_SNEAK) return;
  const interval = jitter(90000, 0.33);
  sneakTimer = setTimeout(() => {
    scheduleAction(toggleSneak, 'sneak');
    scheduleSneak();
  }, interval);
}

function scheduleSlotSwitch() {
  if (!running || !config.ANTI_AFK_SLOT_SWITCH) return;
  const interval = jitter(180000, 0.22);
  slotTimer = setTimeout(() => {
    scheduleAction(slotSwitch, 'slot');
    restoreSlot();
    scheduleSlotSwitch();
  }, interval);
}

function scheduleCommand() {
  if (!running || !config.ANTI_AFK_COMMAND) return;
  const interval = jitter(config.ANTI_AFK_COMMAND_INTERVAL_MIN * 60 * 1000, 0.2);
  cmdTimer = setTimeout(() => {
    scheduleAction(sendCommand, 'cmd');
    scheduleCommand();
  }, interval);
}

function start(b) {
  if (running) return;
  bot = b; running = true;
  lastSlot = bot.quickBarSlotIndex || 0;
  originalSlot = lastSlot;
  log('anti-AFK started');
  scheduleSwing(); scheduleSneak(); scheduleSlotSwitch(); scheduleCommand();
}

function stop() {
  running = false; bot = null; eatingInhibited = false;
  clearTimeout(swingTimer); clearTimeout(sneakTimer); clearTimeout(slotTimer); clearTimeout(cmdTimer);
  swingTimer = sneakTimer = slotTimer = cmdTimer = null;
  log('anti-AFK stopped');
}

module.exports = { start, stop };
