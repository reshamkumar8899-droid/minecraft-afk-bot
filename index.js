// index.js — Entry point for the Minecraft AFK bot.

const { createBot, getBot, isLoggedIn } = require('./src/bot');
const config = require('./src/config');

console.log('===========================================');
console.log('  Minecraft AFK Bot');
console.log('===========================================');
console.log(`Host: ${config.HOST}:${config.PORT}`);
console.log(`Username: ${config.USERNAME}`);
console.log(`Auth: ${config.AUTH}`);
console.log(`Version: ${config.VERSION || 'auto-detect'}`);
console.log(`Auto-eat: food < ${config.EAT_BELOW_FOOD}`);
console.log(`Anti-AFK: ${config.ANTI_AFK_ENABLED ? 'ON' : 'OFF'}`);
console.log(`TPA outgoing: ${config.TPA_PLAYER || 'disabled'}`);
console.log(`TPA auto-accept: ${config.TPA_ACCEPT_ENABLED ? 'ON' : 'OFF'}`);
console.log('===========================================');

// Register handlers BEFORE creating bot
process.on('uncaughtException', (err) => {
  console.error(`[fatal] uncaughtException: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(`[fatal] unhandledRejection: ${reason}`);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('[bot] shutting down...');
  try {
    const bot = getBot();
    if (bot && bot.bot) bot.bot.quit();
  } catch (e) {}
  process.exit(0);
});

createBot();
