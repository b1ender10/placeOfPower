import type { CharacterTierCounts } from '../store/types'

export const emptyTiers = (): CharacterTierCounts => ({
  base: 0,
  bronze: 0,
  silver: 0,
  gold: 0,
})

/** Добавить один «сырой» дроп и прогнать слияния 3→бронза→серебро→золото */
export function addBaseAndMerge(
  inv: Record<string, CharacterTierCounts>,
  characterId: string,
): Record<string, CharacterTierCounts> {
  const next = { ...inv }
  const cur = { ...(next[characterId] ?? emptyTiers()) }
  cur.base += 1

  let b = cur.base
  let br = cur.bronze
  let s = cur.silver
  let g = cur.gold

  while (b >= 3) {
    b -= 3
    br += 1
  }
  while (br >= 3) {
    br -= 3
    s += 1
  }
  while (s >= 3) {
    s -= 3
    g += 1
  }

  next[characterId] = { base: b, bronze: br, silver: s, gold: g }
  return next
}

/** Какой «уровень» вырос после дропа базы (учитывает каскад 3→бронза→серебро→золото) */
export function tierDeltaAfterBaseDrop(
  prev: CharacterTierCounts | undefined,
  next: CharacterTierCounts,
): 'base' | 'bronze' | 'silver' | 'gold' {
  const p = prev ?? emptyTiers()
  if (next.gold > p.gold) return 'gold'
  if (next.silver > p.silver) return 'silver'
  if (next.bronze > p.bronze) return 'bronze'
  if (next.base > p.base) return 'base'
  return 'base'
}

/** Лучший доступный уровень копии персонажа (для цитаты учителя) */
export function highestTierHeld(t: CharacterTierCounts): 'base' | 'bronze' | 'silver' | 'gold' {
  if (t.gold > 0) return 'gold'
  if (t.silver > 0) return 'silver'
  if (t.bronze > 0) return 'bronze'
  return 'base'
}
