import { Telegraf, Context } from 'telegraf';
import { config } from './config';

export const bot = new Telegraf(config.botToken);

// Extend context type
export interface BotContext extends Context {
  scene?: any;
}

// Global error handler
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err);
  ctx.reply('⚠️ Произошла ошибка. Пожалуйста, попробуйте позже.').catch(e => console.error(e));
});

export default bot;
