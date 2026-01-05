import bot from './bot';
import { Database } from './models';
import { config, validateConfig } from './config';
import { loadIndustries, loadAchievements } from './utils/industries';
import { initScheduler } from './utils/scheduler';
import { registerCommands } from './handlers/commands';
import { registerGameHandlers } from './handlers/game';
import { registerAssetHandlers } from './handlers/assets';
import { registerStatsHandlers } from './handlers/stats';
import { registerChannelHandlers, postGameMessage } from './handlers/channel';

async function main() {
  try {
    // Validate config
    if (!validateConfig()) {
      process.exit(1);
    }

    console.log('🚀 Starting Invest Bot...');

    // Initialize database
    const db = new Database(config.databaseUrl);
    await db.init();

    // Load game data
    loadIndustries();
    loadAchievements();

    console.log('📦 Game data loaded');

    // Register all handlers
    registerCommands(bot);
    registerGameHandlers(bot);
    registerAssetHandlers(bot);
    registerStatsHandlers(bot);
    registerChannelHandlers(bot);

    console.log('🎮 Handlers registered');

    // Post initial message to channel if not already posted
    const CHANNEL_ID = process.env.CHANNEL_ID;
    if (CHANNEL_ID && !process.env.CHANNEL_MESSAGE_ID) {
      console.log('📢 Posting initial message to channel...');
      await postGameMessage(bot);
    }

    // Initialize scheduler for daily income, weekly stats
    initScheduler();

    // Start bot
    bot.launch();
    console.log('✅ Bot is running!');

    // Graceful shutdown
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

main();
