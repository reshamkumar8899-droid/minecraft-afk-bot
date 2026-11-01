// src/antiAfk.js
// Anti-AFK actions that NEVER move the bot.
// - Arm swing at random intervals
// - Sneak toggle (controlled)
// - Hotbar slot switch (controlled)
// - Optional harmless chat command
// - Jitter on every interval

const config = require('./config');

let bot = null;
let running = false;
let swingTimer = null;
let sneakTimer = null;
let slotTimer = null;
let cmdTimer = null;
let currentSlot = 0;

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

function swingArm() {
  if (!bot || !running || isEating(bot)) return;
  try { bot.swingArm('right'); log('swung right arm'); }
  catch (e) { log(`swingArm error: ${e.message}`); }
}

function toggleSneak() {
  if (!bot || !running || isEating(bot)) return;
  try {
    bot.setControlState('sneak', true);
    const hold = jitter(750, 0.33);
    setTimeout(() => {
      try { bot.setControlState('sneak', false); log('sneak released'); }
      catch (e) { log(`sneak release error: ${e.message}`); }
    }, hold);
    log('sneak toggled on');
  } catch (e) { log(`sneak error: ${e.message}`); }
}

function slotSwitch() {
  if (!bot || !running || isEating(bot)) return;
  try {
    const slots = [0,1,2,3,4,5,6,7,8];
    let next = currentSlot;
    while (next === currentSlot) next = slots[Math.floor(Math.random() * slots.length)];
    currentSlot = next;
    bot.setQuickBarSlot(next);
    log(`quickbar slot switched to ${next}`);
  } catch (e) { log(`slotSwitch error: ${e.message}`); }
}

function sendCommand() {
  if (!bot || !running || !config.ANTI_AFK_COMMAND || isEating(bot)) return;
  try { bot.chat(config.ANTI_AFK_COMMAND); log(`sent command: ${config.ANTI_AFK_COMMAND}`); }
  catch (e) { log(`sendCommand error: ${e.message}`); }
}

function scheduleSwing() {
  if (!running) return;
  const interval = jitter(Math.random() * (config.ANTI_AFK_SWING_MAX_MS - config.ANTI_AFK_SWING_MIN_MS) + config.ANTI_AFK_SWING_MIN_MS, 0.2);
  swingTimer = setTimeout(() => { swingArm(); scheduleSwing(); }, interval);
}

function scheduleSneak() {
  if (!running || !config.ANTI_AFK_SNEAK) return;
  sneakTimer = setTimeout(() => { toggleSneak(); scheduleSneak(); }, jitter(90000, 0.33));
}

function scheduleSlotSwitch() {
  if (!running || !config.ANTI_AFK_SLOT_SWITCH) return;
  slotTimer = setTimeout(() => { slotSwitch(); scheduleSlotSwitch(); }, jitter(180000, 0.22));
}

function scheduleCommand() {
  if (!running || !config.ANTI_AFK_COMMAND) return;
  cmdTimer = setTimeout(() => { sendCommand(); scheduleCommand(); }, config.ANTI_AFK_COMMAND_INTERVAL_MIN * 60 * 1000);
}

function start(b) {
  if (running) return;
  bot = b; running = true;
  try { currentSlot = bot.quickBarSlotIndex != null ? bot.quickBarSlotIndex : 0; } catch (e) { currentSlot = 0; }
  log('anti-AFK started');
  scheduleSwing(); scheduleSneak(); scheduleSlotSwitch(); scheduleCommand();
}

function stop() {
  running = false; bot = null;
  [swingTimer, sneakTimer, slotTimer, cmdTimer].forEach(t => { if (t) clearTimeout(t); });
  swingTimer = sneakTimer = slotTimer = cmdTimer = null;
  log('anti-AFK stopped');
}

module.exports = { start, stop };
