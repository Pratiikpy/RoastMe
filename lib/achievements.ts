import { getUserStats, getAchievements, awardAchievement, getRoastChain } from "./db";
import { sendAchievementNotification } from "./notifications";
import { ACHIEVEMENTS } from "./constants";

type AchievementTrigger = "roast-created" | "reaction-received";

interface AchievementContext {
  fid: number;
  isSelfRoast?: boolean;
  parentRoastId?: string;
}

export async function checkAndAwardAchievements(
  trigger: AchievementTrigger,
  context: AchievementContext
): Promise<string[]> {
  const { fid } = context;
  const [stats, existing] = await Promise.all([
    getUserStats(fid),
    getAchievements(fid),
  ]);

  const existingSet = new Set(existing);
  const newlyAwarded: string[] = [];

  const checks: Array<{ id: string; condition: boolean }> = [
    { id: "first-roast", condition: trigger === "roast-created" && stats.sent >= 1 },
    { id: "10-roasts", condition: trigger === "roast-created" && stats.sent >= 10 },
    { id: "100-reactions", condition: stats.reactions >= 100 },
    { id: "self-roaster", condition: trigger === "roast-created" && !!context.isSelfRoast },
  ];

  // Chain check
  if (trigger === "roast-created" && context.parentRoastId) {
    const chain = await getRoastChain(context.parentRoastId);
    if (chain.length >= 2) {
      checks.push({ id: "chain-x3", condition: true });
    }
  }

  for (const check of checks) {
    if (check.condition && !existingSet.has(check.id)) {
      const awarded = await awardAchievement(fid, check.id);
      if (awarded) {
        newlyAwarded.push(check.id);
        const def = ACHIEVEMENTS.find((a) => a.id === check.id);
        if (def) {
          sendAchievementNotification(fid, def.label, def.emoji).catch(() => {});
        }
      }
    }
  }

  return newlyAwarded;
}
