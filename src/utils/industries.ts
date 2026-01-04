import * as fs from 'fs';
import * as path from 'path';

interface Industry {
  id: string;
  name: string;
  assets: Asset[];
}

interface Asset {
  id: string;
  name: string;
  base_income: number;
  base_cost?: number;
  actions: Action[];
}

interface Action {
  id: string;
  name: string;
  base_cost: number;
  success_chance: number;
  income_bonus: number;
  max_level: number;
}

interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: number;
  trigger: string;
  condition?: number | string;
}

interface StatusConfig {
  id: string;
  name: string;
  min_level: number;
  min_income: number;
  description: string;
}

const INDUSTRIES = ['showbiz', 'tech', 'real_estate', 'trade', 'transport'];
const ASSETS_DIR = path.join(__dirname, '../../assets');

let industriesCache: Map<string, Industry> = new Map();
let achievementsCache: AchievementConfig[] = [];
let statusesCache: StatusConfig[] = [];

export function loadIndustries(): Map<string, Industry> {
  if (industriesCache.size > 0) return industriesCache;

  for (const industryId of INDUSTRIES) {
    const filePath = path.join(ASSETS_DIR, `${industryId}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    industriesCache.set(industryId, data.industry);
  }

  console.log(`✅ Loaded ${industriesCache.size} industries`);
  return industriesCache;
}

export function loadAchievements() {
  if (achievementsCache.length > 0) return achievementsCache;

  const filePath = path.join(ASSETS_DIR, 'achievements.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  achievementsCache = data.achievements;
  statusesCache = data.statuses;

  console.log(`✅ Loaded ${achievementsCache.length} achievements and ${statusesCache.length} statuses`);
  return { achievements: achievementsCache, statuses: statusesCache };
}

export function getIndustry(id: string): Industry | undefined {
  return industriesCache.get(id);
}

export function getAsset(industryId: string, assetId: string): Asset | undefined {
  const industry = getIndustry(industryId);
  return industry?.assets.find(a => a.id === assetId);
}

export function getAction(industryId: string, assetId: string, actionId: string): Action | undefined {
  const asset = getAsset(industryId, assetId);
  return asset?.actions.find(a => a.id === actionId);
}

export function getAchievement(achievementId: string): AchievementConfig | undefined {
  return achievementsCache.find(a => a.id === achievementId);
}

export function getStatus(statusId: string): StatusConfig | undefined {
  return statusesCache.find(s => s.id === statusId);
}

export function getStatusByMetrics(level: number, income: number): StatusConfig {
  const statuses = statusesCache.sort((a, b) => b.min_income - a.min_income);
  return statuses.find(s => level >= s.min_level && income >= s.min_income) || statuses[statuses.length - 1];
}

export function getAllIndustries(): Industry[] {
  return Array.from(industriesCache.values());
}

export function getAllAchievements(): AchievementConfig[] {
  return achievementsCache;
}

export function getAllStatuses(): StatusConfig[] {
  return statusesCache;
}
