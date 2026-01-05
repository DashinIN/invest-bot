import { Telegraf } from 'telegraf';
import { User, Achievement } from '../models';
import { getStatus, getAllAchievements } from '../utils/industries';
import { getUserAchievementsList } from '../utils/achievements';

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

      // Build buttons listing players; allow viewing their achievements
      const buttons: any[] = [];
      topPlayers.forEach((player, index) => {
        const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][index];
        message += `${emoji} ${player.firstName} - ${player.totalIncome} 💰/день\n`;
        buttons.push([{ text: `${emoji} ${player.firstName}`, callback_data: `view_player_${player.id}` }]);
      });

      buttons.push([{ text: '◀️ Назад', callback_data: 'profile' }]);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
      });
    } catch (error) {
      console.error('Error in leaderboard:', error);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // Achievements tab - main achievements view
  bot.action('show_achievements', async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return ctx.answerCbQuery('❌ Ошибка');

      const list = await getUserAchievementsList(userId);
      const unlockedCount = list.filter(a => a.unlocked).length;

      let message = `🎖️ **Достижения (${unlockedCount}/${list.length})**\n\n`;
      
      // Group by trigger type
      const byTrigger: { [key: string]: typeof list } = {};
      list.forEach(a => {
        if (!byTrigger[a.trigger || 'other']) byTrigger[a.trigger || 'other'] = [];
        byTrigger[a.trigger || 'other'].push(a);
      });

      const triggerNames: { [key: string]: string } = {
        'total_assets_owned': '📦 Активы',
        'daily_income_milestone': '💰 Доход в день',
        'max_currency_milestone': '💵 Максимум валюты',
        'total_actions_executed': '⚡ Выполненные действия'
      };

      for (const [trigger, achs] of Object.entries(byTrigger)) {
        message += `**${triggerNames[trigger] || trigger}**\n`;
        achs.forEach(a => {
          const status = a.unlocked ? '✅' : '⬜';
          message += `${status} ${a.icon || ''} ${a.name}\n`;
          message += `  ${a.description}\n`;
          message += `  💎 +${a.reward} монет\n`;
        });
        message += '\n';
      }

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'back_menu' }]] }
      });
    } catch (error) {
      console.error('Error in show_achievements:', error);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // Old achievements action (for backward compatibility)
  bot.action('achievements', async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return ctx.answerCbQuery('❌ Ошибка');

      const list = await getUserAchievementsList(userId);

      let message = `🎖️ **Достижения**\n\n`;
      list.forEach(a => {
        message += `${a.unlocked ? '✅' : '⬜'} ${a.icon || ''} **${a.name}** — ${a.description}\n`;
      });

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'profile' }]] }
      });
    } catch (error) {
      console.error('Error in achievements:', error);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // View another player's full profile
  bot.action(/^view_player_(\d+)$/, async (ctx) => {
    try {
      const playerId = Number(ctx.match?.[1]);
      if (!playerId) return ctx.answerCbQuery('❌ Ошибка');

      const player = await User.findByPk(playerId);
      if (!player) return ctx.answerCbQuery('❌ Игрок не найден');

      const statusConfig = getStatus(player.status || 'novice');
      const achList = await getUserAchievementsList(playerId);
      const unlockedCount = achList.filter(a => a.unlocked).length;

      const message =
        `👤 **${player.firstName}**\n\n` +
        `💰 Баланс: ${player.currency}\n` +
        `📦 Активов: ${player.totalAssets}\n` +
        `📈 Доход/день: ${player.totalIncome}\n` +
        `🏆 Статус: ${statusConfig?.name || 'Новичок'}\n` +
        `🎖️ Достижений: ${unlockedCount}/${achList.length}\n` +
        `📅 Зарегистрирован: ${player.createdAt?.toLocaleDateString('ru-RU')}`;

      const buttons: any[] = [
        [{ text: '🎖️ Достижения', callback_data: `player_achievements_${playerId}` }],
        [{ text: '◀️ Назад', callback_data: 'top10' }]
      ];

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: buttons }
      });
    } catch (err) {
      console.error('Error viewing player profile', err);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // View player's achievements
  bot.action(/^player_achievements_(\d+)$/, async (ctx) => {
    try {
      const playerId = Number(ctx.match?.[1]);
      if (!playerId) return ctx.answerCbQuery('❌ Ошибка');

      const player = await User.findByPk(playerId);
      if (!player) return ctx.answerCbQuery('❌ Игрок не найден');

      const list = await getUserAchievementsList(playerId);

      let message = `👤 **${player.firstName}** — достижения\n\n`;
      list.filter(a => a.unlocked).forEach(a => {
        message += `✅ ${a.icon || ''} **${a.name}**\n`;
        message += `  ${a.description}\n`;
      });

      if (list.filter(a => a.unlocked).length === 0) {
        message += '*(Нет разблокированных достижений)*';
      }

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: `view_player_${playerId}` }]] }
      });
    } catch (err) {
      console.error('Error viewing player achievements', err);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });
}
