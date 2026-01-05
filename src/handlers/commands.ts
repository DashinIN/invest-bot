import { Telegraf } from 'telegraf';
import { User, UserAsset } from '../models';
import { config } from '../config';
import { getPlayerStatus } from '../utils/calculator';
import { getStatus } from '../utils/industries';

function showMainMenu(text: string) {
  return {
    parse_mode: 'Markdown' as const,
    reply_markup: {
      inline_keyboard: [
        [{ text: '📦 Мои активы', callback_data: 'my_assets' }],
        [{ text: '🏪 Купить активы', callback_data: 'shop' }],
        [{ text: '🎖️ Достижения', callback_data: 'show_achievements' }],
        [{ text: '🏆 Топ игроков', callback_data: 'top10' }],
        [{ text: 'ℹ️ Справка', callback_data: 'help_menu' }]
      ]
    }
  };
}

function getProfileText(user: User): string {
  const statusId = getPlayerStatus(user.totalAssets, user.totalIncome);
  const statusConfig = getStatus(statusId);
  const statusName = statusConfig?.name || 'Новичок';
  
  return (
    `👤 **${user.firstName} ${user.lastName || ''}**\n\n` +
    `💰 Баланс: ${user.currency} монет\n` +
    `📦 Активов: ${user.totalAssets}\n` +
    `📈 Доход в день: ${user.totalIncome}\n` +
    `🏆 Статус: ${statusName}`
  );
}

export function registerCommands(bot: Telegraf) {
  // /start command - главное меню
  bot.command('start', async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      let user = await User.findByPk(userId);

      if (!user) {
        // Create new user
        user = await User.create({
          id: userId,
          username: ctx.from?.username,
          firstName: ctx.from?.first_name,
          lastName: ctx.from?.last_name,
          currency: config.startingCurrency,
          level: 1,
          status: 'novice'
        });

        await ctx.reply(
          `🎉 **Добро пожаловать в Invest Bot!**\n\n` +
          `Вы начинаете с ${config.startingCurrency} монет 💰\n\n` +
          getProfileText(user),
          showMainMenu('')
        );
      } else {
        await ctx.reply(getProfileText(user), showMainMenu(''));
      }
    } catch (error) {
      console.error('Error in /start command:', error);
      ctx.reply('❌ Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
  });

  // Back to main menu
  bot.action('back_menu', async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const user = await User.findByPk(userId);
      if (!user) return ctx.answerCbQuery('❌ Вы не зарегистрированы');

      await ctx.editMessageText(getProfileText(user), showMainMenu(''));
    } catch (error) {
      console.error('Error in back_menu:', error);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // Help menu
  bot.action('help_menu', async (ctx) => {
    const helpText =
      `🎮 **Справка по игре**\n\n` +
      `**📦 Мои активы** - Список ваших активов, доступные действия\n` +
      `**🏪 Купить активы** - Покупка новых активов\n\n` +
      `**Как играть:**\n` +
      `1️⃣ Купите активы в разных индустриях\n` +
      `2️⃣ Выполняйте действия для повышения дохода\n` +
      `3️⃣ Доход пополняется автоматически каждый день\n` +
      `4️⃣ Расширяйте портфель для роста дохода`;

    await ctx.editMessageText(helpText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'back_menu' }]]
      }
    });
  });
}
