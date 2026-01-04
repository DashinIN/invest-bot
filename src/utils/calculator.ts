import { getAsset, getAction } from './industries';

interface CostCalc {
  base: number;
  current: number;
}

/**
 * Формула: current_cost = base_cost * (1.5 ^ level)
 */
export function calculateActionCost(baseCost: number, level: number): number {
  return Math.floor(baseCost * Math.pow(1.5, level - 1));
}

/**
 * Формула: current_income = base_income + Σ(income_bonus_успешных_действий)
 */
export function calculateAssetIncome(
  baseIncome: number,
  successfulBonuses: number[]
): number {
  return baseIncome + successfulBonuses.reduce((sum, bonus) => sum + bonus, 0);
}

/**
 * Выполнить действие с проверкой вероятности
 */
export function executeAction(successChance: number): boolean {
  return Math.random() < successChance;
}

/**
 * Рассчитать новый уровень и стоимость при успехе действия
 */
export function calculateNewActionLevel(
  industryId: string,
  assetId: string,
  actionId: string,
  currentLevel: number
): { newLevel: number; newCost: number; canExecute: boolean } {
  const action = getAction(industryId, assetId, actionId);
  if (!action) {
    return { newLevel: currentLevel, newCost: 0, canExecute: false };
  }

  const canExecute = currentLevel < action.maxLevel;
  const newLevel = canExecute ? currentLevel + 1 : currentLevel;
  const newCost = calculateActionCost(action.baseCost, newLevel);

  return { newLevel, newCost, canExecute };
}

/**
 * Получить все доступные действия для актива
 */
export function getAvailableActions(industryId: string, assetId: string): any[] {
  const asset = getAsset(industryId, assetId);
  return asset?.actions || [];
}

/**
 * Проверить, может ли пользователь выполнить действие
 */
export function canAffordAction(userCurrency: number, actionCost: number): boolean {
  return userCurrency >= actionCost;
}

/**
 * Рассчитать пассивный доход за период
 */
export function calculatePassiveIncome(
  assetIncome: number,
  hours: number = 24
): number {
  return Math.floor(assetIncome * (hours / 24));
}

/**
 * Определить статус игрока по метрикам
 */
export function getPlayerStatus(totalAssets: number, totalIncome: number): string {
  const income = totalIncome;

  if (income >= 500000) return 'god_of_capital';
  if (income >= 100000 && totalAssets >= 50) return 'oligarch';
  if (income >= 50000 && totalAssets >= 30) return 'tycoon';
  if (income >= 10000 && totalAssets >= 20) return 'magnate';
  if (income >= 2000 && totalAssets >= 10) return 'businessman';
  if (income >= 500 && totalAssets >= 5) return 'entrepreneur';
  if (income >= 100 && totalAssets >= 2) return 'amateur';
  return 'novice';
}
