/** XP за действие: КС +1 / −0.5, СС +2 / −1, ДС +3 / −1.5 за единицу дельты */
export function xpFromDeltas(deltaKs: number, deltaSs: number, deltaDs: number): number {
  const seg = (d: number, plus: number, minus: number) => (d > 0 ? d * plus : d * minus)
  return seg(deltaKs, 1, 0.5) + seg(deltaSs, 2, 1) + seg(deltaDs, 3, 1.5)
}

/** Уровень 0 при XP < 10; дальше floor(XP/10). Отрицательный XP не даёт уровень ниже 0. */
export function levelFromXp(levelXp: number): number {
  return Math.max(0, Math.floor(levelXp / 10))
}

/** Прогресс 0–10 внутри текущего «десятка» XP */
export function xpProgressInLevel(levelXp: number): number {
  if (levelXp < 0) return 0
  return levelXp % 10
}
