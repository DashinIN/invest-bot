import { getAsset, getAction } from './industries';

/**
 * Расчет стоимости действия согласно формуле
 * current_cost = base_cost × (1.5 ^ (level - 1))
 * где level - количество успешно выполненных апгрейдов (1-indexed)
 */
export function calculateActionCost(baseCost: number, level: number): number {
  return Math.floor(baseCost * Math.pow(1.5, level - 1));
}

/**
 * Выполнить действие с проверкой вероятности
 */
export function executeAction(successChance: number): boolean {
  return Math.random() < successChance;
}

/**
 * Проверить, может ли пользователь выполнить действие
 */
export function canAffordAction(userCurrency: number, actionCost: number): boolean {
  return userCurrency >= actionCost;
}

/**
 * Получить все доступные действия для актива
 */
export function getAvailableActions(industryId: string, assetId: string): any[] {
  const asset = getAsset(industryId, assetId);
  return asset?.actions || [];
}

/**
 * Проверить, может ли действие быть выполнено еще раз
 * @param currentLevel текущее количество успешных выполнений (0-indexed)
 * @param maxLevel максимальное количество выполнений из конфига
 * @returns true если можно выполнить еще раз
 */
export function canExecuteAction(currentLevel: number, maxLevel: number): boolean {
  return currentLevel < maxLevel;
}

/**
 * Расчет стоимости следующего выполнения действия
 * @param action объект действия из конфига
 * @param currentLevel текущий уровень успешного выполнения (0-indexed)
 * @returns стоимость следующего выполнения
 */
export function getNextActionCost(action: any, currentLevel: number): number {
  // level для формулы расчета = currentLevel + 1 (так как это будет следующий уровень)
  return calculateActionCost(action.baseCost, currentLevel + 1);
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

  const canExecute = canExecuteAction(currentLevel, action.maxLevel);
  const newLevel = canExecute ? currentLevel + 1 : currentLevel;
  const newCost = canExecute ? calculateActionCost(action.baseCost, newLevel) : 0;

  return { newLevel, newCost, canExecute };
}

/**
 * Расчет дохода от актива с учетом бонусов от успешных действий
 * Формула: current_income = base_income + Σ(income_bonus_успешных_действий)
 */
export function calculateAssetIncome(
  baseIncome: number,
  successfulBonuses: number[]
): number {
  return baseIncome + successfulBonuses.reduce((sum, bonus) => sum + bonus, 0);
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
  if (totalIncome >= 500000) return 'god_of_capital';
  if (totalIncome >= 100000 && totalAssets >= 50) return 'oligarch';
  if (totalIncome >= 50000 && totalAssets >= 30) return 'tycoon';
  if (totalIncome >= 10000 && totalAssets >= 20) return 'magnate';
  if (totalIncome >= 2000 && totalAssets >= 10) return 'businessman';
  if (totalIncome >= 500 && totalAssets >= 5) return 'entrepreneur';
  if (totalIncome >= 100 && totalAssets >= 2) return 'amateur';
  return 'novice';
}

