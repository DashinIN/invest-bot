import { Telegraf } from 'telegraf';
import { User } from '../models';
import { getStatus } from '../utils/industries';

export function registerStatsHandlers(bot: Telegraf) {
  // Profile button
  bot.action('profile', async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const user = await User.findByPk(userId);
      if (!user) {
        return ctx.answerCbQuery('❌ Вы не зарегистрированы');
      }

      const statusConfig = getStatus(user.status || 'novice');

      const message =
        `👤 **Ваш профиль**\n\n` +
        `💰 Валюта: ${user.currency}\n` +
        `📈 Уровень: ${user.level}\n` +
        `🏆 Статус: ${statusConfig?.name || 'Новичок'}\n` +
        `📊 Всего активов: ${user.totalAssets}\n` +
        `💵 Дневной доход: ${user.totalIncome}\n\n` +
        `📅 Зарегистрирован: ${user.createdAt?.toLocaleDateString('ru-RU')}`;

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏢 Магазин', callback_data: 'shop' }],
            [{ text: '💰 Получить доход', callback_data: 'claim' }],
            [{ text: '🎖️ Достижения', callback_data: 'achievements' }],
            [{ text: '🏅 Рейтинг', callback_data: 'top10' }],
            [{ text: '◀️ Назад', callback_data: 'back_menu' }]
          ]
        }
      });
    } catch (error) {
      console.error('Error in profile:', error);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // Leaderboard
  bot.action('top10', async (ctx) => {
    try {
      const topPlayers = await User.findAll({
        limit: 10,
        order: [['totalIncome', 'DESC']]
      });

      let message = '🏆 **Топ-10 игроков**\n\n';

      topPlayers.forEach((player, index) => {
        const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][index];
        message += `${emoji} ${player.firstName} - ${player.totalIncome} 💰/день\n`;
      });

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '◀️ Назад', callback_data: 'profile' }]
          ]
        }
      });
    } catch (error) {
      console.error('Error in leaderboard:', error);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // Achievements (stub)
  bot.action('achievements', async (ctx) => {
    try {
      const message =
        `🎖️ **Достижения**\n\n` +
        `Эта функция скоро появится!\n\n` +
        `Получайте достижения за:\n` +
        `✅ Покупку первого актива\n` +
        `✅ Достижение статусов\n` +
        `✅ Успешные инвестиции\n` +
        `✅ Попадание в топ рейтинга`;

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '◀️ Назад', callback_data: 'profile' }]
          ]
        }
      });
    } catch (error) {
      console.error('Error in achievements:', error);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });
}
