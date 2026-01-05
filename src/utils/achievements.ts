import { Achievement as AchievementModel, User, AssetAction } from '../models';
import { getAllAchievements, getAchievement, AchievementConfig } from './industries';

export async function checkAndAwardAchievements(userId: number, notifier?: (text: string) => Promise<void> | void): Promise<AchievementConfig[]> {
  const user = await User.findByPk(userId);
  if (!user) return [];

  // compute derived metrics
  const totalAssets = user.totalAssets || 0;
  const totalIncome = user.totalIncome || 0;
  const currency = user.currency || 0;

  const assetActions = await AssetAction.findAll({ where: { userId } });
  const totalActions = assetActions.reduce((s, a) => s + (a.currentLevel || 0), 0);

  const achievements = getAllAchievements();
  const newlyUnlocked: typeof achievements = [];

  for (const ach of achievements) {
    try {
      const existing = await AchievementModel.findOne({ where: { userId, achievementId: ach.id } });
      const alreadyUnlocked = existing && existing.unlocked === true;
      if (alreadyUnlocked) continue;

      let met = false;
      switch (ach.trigger) {
        case 'total_assets_owned':
          met = totalAssets >= Number(ach.condition || 0);
          break;
        case 'daily_income_milestone':
          met = totalIncome >= Number(ach.condition || 0);
          break;
        case 'max_currency_milestone':
          met = currency >= Number(ach.condition || 0);
          break;
        case 'total_actions_executed':
          met = totalActions >= Number(ach.condition || 0);
          break;
        default:
          met = false;
      }

      if (met) {
        if (existing) {
          existing.unlocked = true;
          existing.unlockedAt = new Date();
          await existing.save();
        } else {
          await AchievementModel.create({ userId, achievementId: ach.id, unlocked: true, unlockedAt: new Date() });
        }

        // award reward to user currency if reward exists
        if (ach.reward && ach.reward > 0) {
          user.currency = (user.currency || 0) + ach.reward;
          await user.save();
        }

        newlyUnlocked.push(ach);

        // notify if notifier provided
        if (notifier) {
          try { await notifier(`🏅 Достижение получено: ${ach.icon || ''} ${ach.name} — +${ach.reward || 0} монет`); } catch (e) { /* noop */ }
        }
      }
    } catch (err) {
      console.error('Error checking achievement', ach.id, err);
    }
  }

  return newlyUnlocked;
}

export async function getUserAchievementsList(userId: number) {
  const all = getAllAchievements();
  const userAch = await AchievementModel.findAll({ where: { userId } });
  const unlockedMap = new Map(userAch.filter(a => a.unlocked).map(a => [a.achievementId, a.unlockedAt]));

  return all.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    reward: a.reward,
    trigger: a.trigger,
    condition: a.condition,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id)
  }));
}

export async function getUserUnlockedCount(userId: number) {
  const c = await AchievementModel.count({ where: { userId, unlocked: true } });
  return c;
}
