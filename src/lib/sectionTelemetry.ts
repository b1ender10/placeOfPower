/** Идентификаторы разделов для учёта визитов и действий */
export const SECTION_IDS = [
  'home',
  'day',
  'stats',
  'categories',
  'thoughts',
  'states',
  'tasks',
  'hypothesis',
  'victory',
  'profile',
] as const

export type SectionId = (typeof SECTION_IDS)[number]

export const SECTION_LABELS: Record<SectionId, string> = {
  home: 'Главная',
  day: 'День',
  stats: 'Статистика',
  categories: 'Категории',
  thoughts: 'Мысли',
  states: 'КС / СС / ДС',
  tasks: 'Задачи',
  hypothesis: 'ГДА',
  victory: 'Победы',
  profile: 'Профиль',
}

export function pathToSectionId(pathname: string): SectionId | null {
  const p = pathname.replace(/\/+$/, '') || '/'
  if (p === '/' || p === '') return 'home'
  if (p.startsWith('/profile')) return 'profile'
  const first = p.split('/').filter(Boolean)[0]
  const map: Record<string, SectionId> = {
    day: 'day',
    stats: 'stats',
    categories: 'categories',
    thoughts: 'thoughts',
    states: 'states',
    tasks: 'tasks',
    hypothesis: 'hypothesis',
    victory: 'victory',
  }
  return map[first] ?? null
}

export function bumpVisit(
  stats: Record<string, { visits: number; interactions: number }>,
  id: string,
): Record<string, { visits: number; interactions: number }> {
  const e = stats[id] ?? { visits: 0, interactions: 0 }
  return { ...stats, [id]: { ...e, visits: e.visits + 1 } }
}

export function bumpInteraction(
  stats: Record<string, { visits: number; interactions: number }>,
  id: string,
): Record<string, { visits: number; interactions: number }> {
  const e = stats[id] ?? { visits: 0, interactions: 0 }
  return { ...stats, [id]: { ...e, interactions: e.interactions + 1 } }
}

export function emptySectionStats(): Record<string, { visits: number; interactions: number }> {
  const o: Record<string, { visits: number; interactions: number }> = {}
  for (const id of SECTION_IDS) {
    o[id] = { visits: 0, interactions: 0 }
  }
  return o
}
