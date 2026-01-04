import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/invest_bot',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  channelId: process.env.CHANNEL_ID ? parseInt(process.env.CHANNEL_ID) : 0,
  adminId: process.env.ADMIN_ID ? parseInt(process.env.ADMIN_ID) : 0,
  startingCurrency: 1000n,
  dailyIncomeHours: 24
};

export function validateConfig(): boolean {
  const required = ['botToken', 'databaseUrl', 'channelId'];
  const missing = required.filter(key => !config[key as keyof typeof config]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    return false;
  }

  return true;
}
