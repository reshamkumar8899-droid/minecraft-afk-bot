// index.js — Entry point for the Minecraft AFK bot.

const config = require('./src/config');
const { createBot } = require('./src/bot');

console.log('===========================================');
console.log('  Minecraft AFK Bot');
console.log('===========================================');
console.log(`Host: ${config.HOST}:${config.PORT}`);
console.log(`Username: ${config.USERNAME}`);
console.log(`Auto-eat: food < ${config.EAT_BELOW_FOOD}`);
console.log(`Anti-AFK: ${config.ANTI_AFK_ENABLED ? 'ON' : 'OFF'}`);
console.log(`TPA outgoing: ${config.TPA_PLAYER || 'disabled'}`);
console.log(`TPA auto-accept: ${config.TPA_ACCEPT_ENABLED ? 'ON' : 'OFF'}`);
console.log('===========================================');

createBot();

// --- Stability ---
process.on('uncaughtException', (err) => {
  console.error(`[fatal] uncaughtException: ${err.message}`);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error(`[fatal] unhandledRejection: ${reason}`);
});

// --- Graceful shutdown ---
process.on('SIGINT', () => {
  console.log('[bot] shutting down...');
  try {
    if (bot && bot.bot) bot.bot.quit();
  } catch (e) {}
  process.exit(0);
});
