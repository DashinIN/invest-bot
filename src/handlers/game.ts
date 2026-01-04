import { Telegraf } from 'telegraf';
import { User, UserAsset } from '../models';
import { getAllIndustries, getAsset } from '../utils/industries';
import { calculateActionCost, canAffordAction } from '../utils/calculator';

export function registerGameHandlers(bot: Telegraf) {
  // =============== МАГАЗИН ===============
  
  // Выбор индустрии
  bot.action('shop', async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return ctx.answerCbQuery('❌ Ошибка');

      const industries = getAllIndustries();

      const buttons = industries.map(ind => [
        { text: ind.name, callback_data: `shop_industry_${ind.id}` }
      ]);

      buttons.push([{ text: '◀️ Назад', callback_data: 'back_menu' }]);

      await ctx.editMessageText('🏪 **Магазин - выберите индустрию:**', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: buttons
        }
      });
    } catch (error) {
      console.error('Error in shop:', error);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // Показать активы в индустрии (только непокупленные)
  bot.action(/^shop_industry_(.+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      const industryId = ctx.match?.[1];
      
      if (!userId || !industryId) return ctx.answerCbQuery('❌ Ошибка');

      const industries = getAllIndustries();
      const industry = industries.find(i => i.id === industryId);

      if (!industry) {
        return ctx.answerCbQuery('❌ Индустрия не найдена');
      }

      // Получаем все купленные активы пользователя в этой индустрии
      const ownedAssets = await UserAsset.findAll({
        where: {
          user_id: userId,
          industry_id: industryId
        }
      });

      const ownedAssetIds = new Set(ownedAssets.map(a => a.assetId));

      // Фильтруем только непокупленные активы
      const availableAssets = industry.assets.filter(
        asset => !ownedAssetIds.has(asset.id)
      );

      if (availableAssets.length === 0) {
        return ctx.editMessageText(
          `${industry.name}\n\n` +
          `✅ **Вы уже приобрели все активы в этой индустрии!**`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '◀️ Назад', callback_data: 'shop' }]
              ]
            }
          }
        );
      }

      const buttons = availableAssets.map(asset => {
        const cost = calculateActionCost(asset.base_cost || 1000, 1);
        return [
          {
            text: `${asset.name} (${cost} 💰)`,
            callback_data: `shop_asset_${industryId}_${asset.id}`
          }
        ];
      });

      buttons.push([{ text: '◀️ Назад', callback_data: 'shop' }]);

      await ctx.editMessageText(
        `${industry.name}\n\n` +
        `**Доступные активы к покупке:**`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: buttons
          }
        }
      );
    } catch (error) {
      console.error('Error in shop_industry:', error);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // Просмотр актива перед покупкой
  bot.action(/^shop_asset_(.+?)_(.+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      const industryId = ctx.match?.[1];
      const assetId = ctx.match?.[2];

      if (!userId || !industryId || !assetId) return ctx.answerCbQuery('❌ Ошибка');

      const user = await User.findByPk(userId);
      if (!user) return ctx.answerCbQuery('❌ Вы не зарегистрированы');

      const asset = getAsset(industryId, assetId);
      if (!asset) return ctx.answerCbQuery('❌ Актив не найден');

      const cost = calculateActionCost(asset.base_cost || 1000, 1);
      const canAfford = user.currency >= BigInt(cost);

      const message =
        `💼 **${asset.name}**\n\n` +
        `📝 Инвестиционный актив\n\n` +
        `💰 Стоимость: ${cost} монет\n` +
        `📈 Базовый доход: ${asset.base_income} монет/день\n` +
        `🎯 Действий: ${asset.actions.length}\n\n` +
        `**Ваш баланс:** ${user.currency} монет\n` +
        `${canAfford ? '✅ Достаточно средств' : '❌ Недостаточно средств'}`;

      const buttons = [
        [
          {
            text: canAfford ? '✅ Купить' : '❌ Не хватает средств',
            callback_data: canAfford ? `buy_asset_${industryId}_${assetId}` : 'noop'
          }
        ],
        [{ text: '◀️ Назад', callback_data: `shop_industry_${industryId}` }]
      ];

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: buttons
        }
      });
    } catch (error) {
      console.error('Error in shop_asset:', error);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // Выполнить покупку
  bot.action(/^buy_asset_(.+?)_(.+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      const industryId = ctx.match?.[1];
      const assetId = ctx.match?.[2];

      if (!userId || !industryId || !assetId) return ctx.answerCbQuery('❌ Ошибка');

      const user = await User.findByPk(userId);
      if (!user) return ctx.answerCbQuery('❌ Вы не зарегистрированы');

      const asset = getAsset(industryId, assetId);
      if (!asset) return ctx.answerCbQuery('❌ Актив не найден');

      const cost = calculateActionCost(asset.base_cost || 1000, 1);

      // Проверяем, уже ли есть актив
      const existing = await UserAsset.findOne({
        where: {
          user_id: userId,
          industry_id: industryId,
          asset_id: assetId
        }
      });

      if (existing) {
        return ctx.answerCbQuery('⚠️ У вас уже есть этот актив');
      }

      if (!canAffordAction(user.currency, cost)) {
        return ctx.answerCbQuery(`❌ Недостаточно средств!\nНужно: ${cost}\nЕсть: ${user.currency}`);
      }

      // Создаем новый актив
      await UserAsset.create({
        user_id: userId,
        industry_id: industryId,
        asset_id: assetId,
        level: 1,
        current_cost: cost,
        current_income: asset.base_income
      });

      // Обновляем статистику пользователя
      user.currency -= cost;
      user.totalAssets += 1;
      user.totalIncome += asset.base_income;
      await user.save();

      // Показываем сообщение о успешной покупке
      const message =
        `🎉 **УСПЕШНО!**\n\n` +
        `Вы приобрели "${asset.name}"!\n\n` +
        `💸 Потрачено: ${cost} монет\n` +
        `📈 Теперь получаете +${asset.base_income} монет/день\n\n` +
        `💰 Ваш баланс: ${user.currency} монет\n` +
        `📦 Всего активов: ${user.totalAssets}`;

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏪 Ещё покупки', callback_data: 'shop' }],
            [{ text: '📦 Мои активы', callback_data: 'my_assets' }],
            [{ text: '◀️ Главное меню', callback_data: 'back_menu' }]
          ]
        }
      });
    } catch (error) {
      console.error('Error buying asset:', error);
      ctx.answerCbQuery('❌ Ошибка при покупке');
    }
  });

  // =============== ПОЛУЧИТЬ ДОХОД ===============
  
  bot.action('claim', async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return ctx.answerCbQuery('❌ Ошибка');

      const user = await User.findByPk(userId);
      if (!user) return ctx.answerCbQuery('❌ Вы не зарегистрированы');

      const lastClaim = new Date(user.lastIncomeClaim || 0);
      const now = new Date();
      const hoursSince = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

      if (hoursSince < 24) {
        const hoursLeft = Math.ceil(24 - hoursSince);
        const minutesLeft = Math.ceil((24 - hoursSince) * 60) % 60;
        
        return ctx.editMessageText(
          `⏰ **Доход будет доступен через:**\n\n` +
          `${hoursLeft}ч ${minutesLeft}м`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '◀️ Назад', callback_data: 'back_menu' }]
              ]
            }
          }
        );
      }

      const income = user.totalIncome;
      user.currency += income;
      user.lastIncomeClaim = now;
      await user.save();

      const message =
        `💰 **ДОХОД ПОЛУЧЕН!**\n\n` +
        `✨ Вы получили ${income} монет за сегодня\n\n` +
        `🏦 Ваш баланс: ${user.currency} монет`;

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏪 Купить активы', callback_data: 'shop' }],
            [{ text: '📦 Мои активы', callback_data: 'my_assets' }],
            [{ text: '◀️ Назад', callback_data: 'back_menu' }]
          ]
        }
      });
    } catch (error) {
      console.error('Error claiming income:', error);
      ctx.answerCbQuery('❌ Ошибка при получении дохода');
    }
  });

  // no-op действие (для отключенных кнопок)
  bot.action('noop', async (ctx) => {
    await ctx.answerCbQuery('❌ Это действие недоступно');
  });
}
