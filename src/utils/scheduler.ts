import cron from 'node-cron';
import { User, UserAsset, Transaction } from '../models';
import { Op } from 'sequelize';

/**
 * Scheduler configuration for different environments
 */
const SCHEDULER_CONFIG = {
  test: {
    passiveIncome: '*/15 * * * * *', // Every 15 seconds
    weeklyStats: '0 * * * * *' // Every minute
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
  const config = getSchedulerConfig();
  const schedule = config.weeklyStats;

  cron.schedule(schedule, async () => {
    try {
      console.log('📊 Posting weekly statistics...');

      const topPlayers = await User.findAll({
        limit: 10,
        order: [['totalIncome', 'DESC']]
      });

      // TODO: Send message to channel with leaderboard

      console.log('✅ Weekly statistics posted');
    } catch (error) {
      console.error('❌ Error posting weekly stats:', error);
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
}
