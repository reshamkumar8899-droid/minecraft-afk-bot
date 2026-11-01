// src/bot.js
// Bot creation, events, lifecycle, auto-eat plugin, and reconnect logic.

const mineflayer = require('mineflayer');
const config = require('./config');
const antiAfk = require('./antiAfk');
const tpa = require('./tpa');

let bot = null;
let reconnectTimer = null;
let reconnectDelay = config.RECONNECT_DELAY_MS;
let reconnectAttempts = 0;
let loginSent = false;
let featuresStarted = false;
let isLoggedIn = false;

function log(msg) { console.log(`[bot] ${new Date().toISOString()} ${msg}`); }

function createBot() {
  log(`connecting to ${config.HOST}:${config.PORT} as ${config.USERNAME}`);
  const options = {
    host: config.HOST,
    port: config.PORT,
    username: config.USERNAME,
    version: config.VERSION || undefined,
    auth: config.AUTH,
  };
  bot = mineflayer.createBot(options);

  bot.on('spawn', () => {
    log('spawned in');
    reconnectDelay = config.RECONNECT_DELAY_MS;
    reconnectAttempts = 0;
    loginSent = false;
    featuresStarted = false;
    isLoggedIn = false;

    // Load auto-eat plugin
    try {
      const autoEat = require('mineflayer-auto-eat');
      bot.loadPlugin(autoEat);
      if (bot.autoEat) {
        bot.autoEat.setOpts({
          priority: 'food',
          minHunger: config.EAT_BELOW_FOOD,
          offhand: true,
          bannedFood: ['rotten flesh', 'spider eye'],
        });
        bot.autoEat.enableAuto();
      }
      log('auto-eat enabled');
    } catch (e) {
      log(`auto-eat not available: ${e.message}`);
    }

    // Login sequence
    setTimeout(() => {
      if (loginSent) return;
      sendLogin();
    }, config.LOGIN_DELAY_MS);

    // Watch system messages for login/register prompts
    bot.on('chat', onChat);
    bot.on('message', onMessage);
  });

  bot.on('end', (reason) => {
    log(`disconnected: ${reason}`);
    cleanup();
    scheduleReconnect();
  });

  bot.on('kicked', (reason) => {
    log(`kicked: ${reason}`);
    cleanup();
    scheduleReconnect();
  });

  bot.on('error', (err) => {
    log(`error: ${err.message}`);
    cleanup();
    scheduleReconnect();
  });

  function onChat(username, message, onGround, position) {
    if (username === null) {
      const lower = message.toLowerCase();
      if (lower.includes('log in') || lower.includes('login')) {
        if (!loginSent) sendLogin();
      }
      if (lower.includes('register')) {
        if (!loginSent) sendRegister();
      }
      if (lower.includes('successfully logged in') || lower.includes('login successful') || lower.includes('you are now logged in')) {
        loginSent = true;
        isLoggedIn = true;
        startFeatures();
      }
    }
  }

  function onMessage(message) {
    const text = message.toString();
    if (text.toLowerCase().includes('ate') || text.toLowerCase().includes('eating')) {
      log(`ate food: ${text}`);
    }
  }

  function startFeatures() {
    if (featuresStarted) return;
    featuresStarted = true;
    if (config.ANTI_AFK_ENABLED) antiAfk.start(bot);
    tpa.start(bot, isLoggedIn);
    log('features started');
  }

  function sendLogin() {
    if (loginSent) return;
    loginSent = true;
    bot.chat(`/login ${config.PASSWORD}`);
    log('sent /login');
    setTimeout(() => {
      if (!featuresStarted) startFeatures();
    }, 3000);
  }

  function sendRegister() {
    if (loginSent) return;
    loginSent = true;
    bot.chat(`/register ${config.PASSWORD} ${config.PASSWORD}`);
    log('sent /register');
    setTimeout(() => {
      if (!featuresStarted) startFeatures();
    }, 3000);
  }

  function cleanup() {
    try { antiAfk.stop(); } catch (e) { log(`antiAfk stop error: ${e.message}`); }
    try { tpa.stop(); } catch (e) { log(`tpa stop error: ${e.message}`); }
    if (bot) {
      try { bot.removeListener('chat', onChat); } catch (e) {}
      try { bot.removeListener('message', onMessage); } catch (e) {}
      try { bot.quit(); } catch (e) {}
    }
    featuresStarted = false;
    loginSent = false;
    isLoggedIn = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectAttempts++;
    const delay = Math.min(60000, reconnectDelay * Math.pow(2, reconnectAttempts - 1));
    log(`reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      createBot();
    }, delay);
  }
}

module.exports = { createBot, getBot: () => bot, isLoggedIn: () => isLoggedIn };
