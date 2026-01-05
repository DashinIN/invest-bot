import cron from 'node-cron';
import { User, UserAsset, Transaction } from '../models';
import { Op } from 'sequelize';
import bot from '../bot';
import { config } from '../config';
import { updateGameMessage } from '../handlers/channel';

/**
 * Scheduler configuration for different environments
 */
const SCHEDULER_CONFIG = {
  test: {
    passiveIncome: '0 * * * *', // Every minute
    weeklyStats: '0 0 * * *' // Every day at 00:00 UTC
  },
  production: {
    passiveIncome: '0 0 * * *', // Every day at 00:00 UTC
    weeklyStats: '0 0 * * 1' // Every Monday at 00:00 UTC
  }
};

/**
 * Get scheduler config based on NODE_ENV
 */
function getSchedulerConfig() {
  const env = process.env.NODE_ENV || 'production';
  return SCHEDULER_CONFIG[env as keyof typeof SCHEDULER_CONFIG] || SCHEDULER_CONFIG.production;
}

/**
 * Schedule daily passive income distribution
 * Runs every day at 00:00 UTC (or every 15 seconds in test mode)
 */
export function schedulePassiveIncome() {
  const config = getSchedulerConfig();
  const schedule = config.passiveIncome;

  cron.schedule(schedule, async () => {
    try {
      console.log('💰 Distributing daily passive income...');

      const users = await User.findAll();
      console.log(`   Processing ${users.length} users...`);

      for (const user of users) {
        const assets = await UserAsset.findAll({
          where: { userId: user.id }
        });

        let totalIncome = 0;
        for (const asset of assets) {
          totalIncome += Number(asset.currentIncome);
        }

        if (totalIncome > 0) {
          const oldCurrency = user.currency;
          user.currency = user.currency + totalIncome;
          await user.save();

          await Transaction.create({
            userId: user.id,
            type: 'passive_income',
            amount: totalIncome,
            description: `Daily passive income: ${totalIncome}`
          });

          console.log(`   User ${user.id}: +${totalIncome} (${oldCurrency} → ${user.currency})`);
        }
      }

      console.log(`✅ Passive income distributed for ${users.length} users`);
    } catch (error) {
      console.error('❌ Error distributing passive income:', error);
    }
  });
}

/**
 * Schedule weekly leaderboard posting
 * Runs every Monday at 00:00 UTC (or every minute in test mode)
 */
export function scheduleWeeklyStats() {
  const config_scheduler = getSchedulerConfig();
  const schedule = config_scheduler.weeklyStats;

  cron.schedule(schedule, async () => {
    try {
      console.log('📊 Posting weekly statistics...');

      const topPlayers = await User.findAll({
        limit: 10,
        order: [['totalIncome', 'DESC']]
      });

      // Send message to channel with leaderboard (only if channel is properly configured)
      if (config.channelId && topPlayers.length > 0) {
        // Validate channel ID format: should be negative (e.g., -100123456789 for supergroups/channels)
        if (config.channelId > 0) {
          console.warn(`⚠️  CHANNEL_ID (${config.channelId}) looks like a user/bot ID, not a channel. Channels have negative IDs (e.g., -100123456789).`);
          console.warn(`    Set CHANNEL_ID to your channel/group ID to enable leaderboard posting.`);
        } else {
          let message = '🏆 **Топ-10 игроков**\n\n';
          topPlayers.forEach((player, index) => {
            const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][index];
            message += `${emoji} ${player.firstName} — ${player.totalIncome} 💰/день\n`;
          });

          try {
            await bot.telegram.sendMessage(config.channelId, message, { parse_mode: 'Markdown' });
            console.log(`✅ Leaderboard sent to channel ${config.channelId}`);
          } catch (err) {
            console.error('❌ Failed to send leaderboard to channel:', err);
          }
        }
      } else if (!config.channelId) {
        console.log('ℹ️  CHANNEL_ID not configured. Set it to enable leaderboard posting.');
      }

      console.log('✅ Weekly statistics posted');
    } catch (error) {
      console.error('❌ Error posting weekly stats:', error);
    }
  });
}

/**
 * Schedule channel message update
 * Updates player count in channel message every hour
 */
export function scheduleChannelUpdate() {
  // Every hour at :00
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('📢 Updating channel message...');
      const updated = await updateGameMessage(bot);
      if (updated) {
        console.log('✅ Channel message updated');
      }
    } catch (error) {
      console.error('❌ Error updating channel message:', error);
    }
  });
}

export function initScheduler() {
  const env = process.env.NODE_ENV || 'production';
  const config = getSchedulerConfig();

  console.log(`⏰ Scheduler initialized (${env} mode)`);
  console.log(`   - Passive income: ${config.passiveIncome}`);
  console.log(`   - Weekly stats: ${config.weeklyStats}`);

  schedulePassiveIncome();
  scheduleWeeklyStats();
  scheduleChannelUpdate();
}
