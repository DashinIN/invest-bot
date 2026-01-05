import { Telegraf } from 'telegraf';
import { User, UserAsset, AssetAction } from '../models';
import { getAllIndustries, getAsset, getAction } from '../utils/industries';
import { calculateActionCost, executeAction, canAffordAction, canExecuteAction, getNextActionCost } from '../utils/calculator';

export function registerAssetHandlers(bot: Telegraf) {
  // =============== МОИ АКТИВЫ ===============
  
  // Показать список активов пользователя
  bot.action('my_assets', async (ctx) => {
    try {
      const userId = ctx.from?.id;
      if (!userId) return ctx.answerCbQuery('❌ Ошибка');

      const user = await User.findByPk(userId);
      if (!user) return ctx.answerCbQuery('❌ Вы не зарегистрированы');

      const assets = await UserAsset.findAll({ where: { userId } });

      if (assets.length === 0) {
        return ctx.editMessageText(
          '📦 **У вас нет активов**\n\n' +
          'Купите первый актив в магазине!',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🏪 Магазин', callback_data: 'shop' }],
                [{ text: '◀️ Назад', callback_data: 'back_menu' }]
              ]
            }
          }
        );
      }

      // Группируем активы по индустриям
      const assetsByIndustry: { [key: string]: UserAsset[] } = {};
      for (const asset of assets) {
        if (!assetsByIndustry[asset.industryId]) {
          assetsByIndustry[asset.industryId] = [];
        }
        assetsByIndustry[asset.industryId].push(asset);
      }

      // Создаем кнопки по индустриям
      const buttons: any[] = [];
      for (const [industryId, industryAssets] of Object.entries(assetsByIndustry)) {
        const industries = getAllIndustries();
        const industry = industries.find(i => i.id === industryId);
        const count = industryAssets.length;
        
        buttons.push([
          {
            text: `${industry?.name} (${count})`,
            callback_data: `my_industry_${industryId}`
          }
        ]);
      }

      buttons.push([{ text: '◀️ Назад', callback_data: 'back_menu' }]);

      await ctx.editMessageText(
        `📦 **Ваши активы**\n\n` +
        `Всего: ${assets.length} активов\n\n` +
        `Выберите индустрию:`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: buttons
          }
        }
      );
    } catch (error) {
      console.error('Error in my_assets:', error);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // Показать активы в выбранной индустрии
  bot.action(/^my_industry_(.+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      const industryId = ctx.match?.[1];
      
      if (!userId || !industryId) return ctx.answerCbQuery('❌ Ошибка');

      const assets = await UserAsset.findAll({
        where: {
          userId,
          industryId
        }
      });

      if (assets.length === 0) {
        return ctx.answerCbQuery('❌ Нет активов в этой индустрии');
      }

      const industries = getAllIndustries();
      const industry = industries.find(i => i.id === industryId);

      const buttons: any[] = [];
      for (const asset of assets) {
        const assetData = getAsset(industryId, asset.assetId);
        if (assetData) {
          buttons.push([
            {
              text: `${assetData.name} (+${asset.currentIncome}/д)`,
              callback_data: `view_asset_${asset.id}`
            }
          ]);
        }
      }

      buttons.push([{ text: '◀️ Назад', callback_data: 'my_assets' }]);

      await ctx.editMessageText(
        `${industry?.name} - **Ваши активы:**`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: buttons
          }
        }
      );
    } catch (error) {
      console.error('Error in my_industry:', error);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // Просмотр актива и доступных действий
  bot.action(/^view_asset_(\d+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      const assetId = parseInt(ctx.match?.[1] || '0');
      
      if (!userId || !assetId) return ctx.answerCbQuery('❌ Ошибка');

      const user = await User.findByPk(userId);
      const userAsset = await UserAsset.findByPk(assetId);
      if (!userAsset || userAsset.userId !== userId) {
        return ctx.answerCbQuery('❌ Актив не найден');
      }

      const assetData = getAsset(userAsset.industryId, userAsset.assetId);
      if (!assetData) return ctx.answerCbQuery('❌ Данные актива не найдены');

      const message =
        `💼 **${assetData.name}**\n\n` +
        `📈 Доход/день: ${userAsset.currentIncome} еврорублей\n` +
        `💰 Ваш баланс: ${user?.currency} еврорублей\n\n` +
        `**Доступные действия:**`;

      const buttons: any[] = [];
      for (const action of assetData.actions) {
        // Get or create AssetAction to check level and get current cost
        const [assetAction] = await AssetAction.findOrCreate({
          where: { userId, assetId: userAsset.assetId, actionId: action.id },
          defaults: { currentLevel: 0, currentCost: action.baseCost }
        });

        // Check if action is maxed out
        const isMaxed = assetAction.currentLevel >= action.maxLevel;
        
        if (isMaxed) {
          // Show maxed actions with lock emoji
          buttons.push([
            {
              text: `🔒 ${action.name} (Максимум)`,
              callback_data: `action_maxed_${userAsset.id}_${action.id}`
            }
          ]);
        } else {
          // Show available actions with current cost
          buttons.push([
            {
              text: `${action.name} (${assetAction.currentCost} еврорублей)`,
              callback_data: `action_${userAsset.id}_${action.id}`
            }
          ]);
        }
      }

      buttons.push([{ text: '◀️ Назад', callback_data: `my_industry_${userAsset.industryId}` }]);

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: buttons
        }
      });
    } catch (error) {
      console.error('Error in view_asset:', error);
      ctx.answerCbQuery('❌ Ошибка');
    }
  });

  // Handle maxed out action attempts
  bot.action(/^action_maxed_/, async (ctx) => {
    return ctx.answerCbQuery('🔒 Это действие уже прокачано на максимум!');
  });

  // Выполнить действие
  bot.action(/^action_(\d+)_(.+)$/, async (ctx) => {
    try {
      const userId = ctx.from?.id;
      const userAssetId = parseInt(ctx.match?.[1] || '0');
      const actionId = ctx.match?.[2];
      
      if (!userId || !userAssetId || !actionId) return ctx.answerCbQuery('❌ Ошибка');

      const user = await User.findByPk(userId);
      const userAsset = await UserAsset.findByPk(userAssetId);

      if (!user || !userAsset || userAsset.userId !== userId) {
        return ctx.answerCbQuery('❌ Ошибка');
      }

      const assetData = getAsset(userAsset.industryId, userAsset.assetId);
      const action = getAction(userAsset.industryId, userAsset.assetId, actionId);

      if (!assetData || !action) {
        return ctx.answerCbQuery('❌ Действие не найдено');
      }

      // Get or create AssetAction to track current level
      const [assetAction] = await AssetAction.findOrCreate({
        where: { userId, assetId: userAsset.assetId, actionId },
        defaults: { currentLevel: 0, currentCost: action.baseCost }
      });

      // Check if action can be executed (maxLevel restriction)
      if (!canExecuteAction(assetAction.currentLevel, action.maxLevel)) {
        return ctx.answerCbQuery(
          `❌ Это действие достигло максимального уровня!\n\nМаксимум: ${action.maxLevel} раз`
        );
      }

      const cost = assetAction.currentCost;

      if (!canAffordAction(user.currency, cost)) {
        return ctx.answerCbQuery(
          `❌ Недостаточно средств!\n\nНужно: ${cost} еврорублей\nЕсть: ${user.currency} еврорублей`
        );
      }

      // Выполняем действие
      const success = executeAction(action.successChance);

      // Обновляем данные
      user.currency -= cost;

      if (success) {
        // Успех - увеличиваем доход и уровень действия
        const incomeBenefit = action.incomeBonus;
        userAsset.currentIncome += incomeBenefit;
        user.totalIncome += incomeBenefit;

        // Update AssetAction level and next cost
        assetAction.currentLevel += 1;
        assetAction.currentCost = getNextActionCost(action, assetAction.currentLevel);

        await Promise.all([user.save(), userAsset.save(), assetAction.save()]);

        // Показываем результат успеха с анимацией
        const resultMessage =
          `🎉 **УСПЕХ!**\n\n` +
          `Действие "${action.name}" выполнено!\n\n` +
          `✨ Доход активности повышен на +${action.incomeBonus} еврорублей\n` +
          `📈 Новый доход актива: ${userAsset.currentIncome}/день\n\n` +
          `💰 Ваш баланс: ${user.currency} еврорублей`;

        await ctx.editMessageText(resultMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '↩️ Ещё действие', callback_data: `view_asset_${userAssetId}` }],
              [{ text: '◀️ Назад', callback_data: `view_asset_${userAssetId}` }]
            ]
          }
        });
      } else {
        // Неудача - теряем деньги
        await user.save();

        const resultMessage =
          `❌ **НЕУДАЧА**\n\n` +
          `Действие "${action.name}" не удалось 😞\n\n` +
          `💸 Вы потеряли ${cost} еврорублей\n` +
          `📉 Доход не изменился\n\n` +
          `💰 Ваш баланс: ${user.currency} еврорублей\n\n` +
          `*Попробуйте снова или выполните другое действие!*`;

        await ctx.editMessageText(resultMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '↩️ Ещё попытка', callback_data: `view_asset_${userAssetId}` }],
              [{ text: '◀️ Назад', callback_data: `view_asset_${userAssetId}` }]
            ]
          }
        });
      }
    } catch (error) {
      console.error('Error in action execution:', error);
      ctx.answerCbQuery('❌ Ошибка при выполнении действия');
    }
  });
}
