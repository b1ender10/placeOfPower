import type {
  HappinessEntry,
  Category,
  ThoughtNote,
  StateAction,
  UserProfile,
  VictoryEntry,
  VictoryDraft,
  RewardTask,
  HypothesisExperiment,
} from '../store/types'
import { SECTION_IDS, emptySectionStats } from './sectionTelemetry'

export type AppSnapshot = {
  happy_entries: HappinessEntry[]
  happy_categories: Category[]
  happy_thoughts: ThoughtNote[]
  happy_state_actions: StateAction[]
  happy_victory_entries: VictoryEntry[]
  happy_victory_drafts: VictoryDraft[]
  happy_reward_tasks: RewardTask[]
  happy_hypotheses: HypothesisExperiment[]
  happy_section_stats: Record<string, { visits: number; interactions: number }>
  happy_profile: UserProfile
}

/** Версия ключа — при смене схемы можно сменить ключ и мигрировать отдельно */
export const LOCAL_STORAGE_KEY = 'happy_app_snapshot_v1'

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'sport', name: 'Спорт', color: '#22c55e' },
  { id: 'supplements', name: 'БАДы', color: '#eab308' },
  { id: 'reading', name: 'Чтение', color: '#3b82f6' },
  { id: 'walk', name: 'Прогулка', color: '#06b6d4' },
  { id: 'meditation', name: 'Медитация', color: '#8b5cf6' },
  { id: 'work', name: 'Работа', color: '#f97316' },
  { id: 'sleep', name: 'Сон', color: '#6366f1' },
  { id: 'food', name: 'Еда', color: '#ec4899' },
  { id: 'social', name: 'Общение', color: '#14b8a6' },
  { id: 'other', name: 'Другое', color: '#94a3b8' },
]

function genIdCompat(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const defaultProfile = (): UserProfile => ({
  displayName: '',
  avatarDataUrl: null,
  levelXp: 0,
  teacherCharacterId: null,
  pendingCaseLevels: [],
  pendingTeacherLevels: [],
  pendingTeacherModalLevel: null,
  characterInventory: {},
})

function normalize(raw: Partial<AppSnapshot>): AppSnapshot {
  const entries = (raw.happy_entries ?? []).map((e) => ({
    ...e,
    minute: e.minute ?? 0,
  }))
  let categories = raw.happy_categories ?? []
  if (!Array.isArray(categories) || categories.length === 0) {
    categories = DEFAULT_CATEGORIES
  }
  const thoughts = (raw.happy_thoughts ?? []).map((t) => ({
    ...t,
    favorite: t.favorite ?? false,
  }))
  const stateActions = Array.isArray(raw.happy_state_actions) ? raw.happy_state_actions : []
  const victoryEntries = (raw.happy_victory_entries ?? []).map((v) => ({
    ...v,
    xpAwarded: typeof v.xpAwarded === 'number' ? v.xpAwarded : 0,
  }))
  const victoryDrafts: VictoryDraft[] = (raw.happy_victory_drafts ?? []).map((d) => ({
    date: String(d.date ?? ''),
    text: typeof d.text === 'string' ? d.text : '',
    updatedAt: typeof d.updatedAt === 'number' ? d.updatedAt : Date.now(),
  }))
  const rewardTasksRaw: RewardTask[] = (raw.happy_reward_tasks ?? []).map((t) => ({
    ...t,
    rewardPoints: Math.min(10, Math.max(1, Math.round(Number(t.rewardPoints)) || 1)),
    hypothesisId:
      typeof t.hypothesisId === 'string' && t.hypothesisId.length > 0 ? t.hypothesisId : null,
    subtasks: Array.isArray(t.subtasks)
      ? t.subtasks.map((st) => ({
          id: String(st.id ?? genIdCompat()),
          description: typeof st.description === 'string' ? st.description : '',
          percentOfReward: Math.min(100, Math.max(1, Math.round(Number(st.percentOfReward)) || 1)),
          completedAt: st.completedAt ?? null,
          pointsGranted: typeof st.pointsGranted === 'number' ? st.pointsGranted : null,
        }))
      : undefined,
    completedAt: t.completedAt ?? null,
    qualityPercent: typeof t.qualityPercent === 'number' ? t.qualityPercent : null,
    pointsEarned: typeof t.pointsEarned === 'number' ? t.pointsEarned : null,
  }))
  const hypotheses: HypothesisExperiment[] = (raw.happy_hypotheses ?? []).map((h) => ({
    id: String(h.id ?? genIdCompat()),
    title: typeof h.title === 'string' ? h.title : '',
    createdAt: typeof h.createdAt === 'number' ? h.createdAt : Date.now(),
    closedAt: h.closedAt ?? null,
    conclusion: h.conclusion ?? null,
    actions: Array.isArray(h.actions)
      ? h.actions.map((a) => ({
          id: String(a.id ?? genIdCompat()),
          text: typeof a.text === 'string' ? a.text : '',
          createdAt: typeof a.createdAt === 'number' ? a.createdAt : Date.now(),
          analysis: a.analysis ?? null,
          analysisAt: a.analysisAt ?? null,
        }))
      : [],
  }))
  const hypothesisIds = new Set(hypotheses.map((h) => h.id))
  const rewardTasks: RewardTask[] = rewardTasksRaw.map((t) => ({
    ...t,
    hypothesisId: t.hypothesisId && hypothesisIds.has(t.hypothesisId) ? t.hypothesisId : null,
  }))
  const rawStats = raw.happy_section_stats ?? {}
  const sectionStats = emptySectionStats()
  for (const id of SECTION_IDS) {
    const r = rawStats[id]
    if (r && typeof r === 'object') {
      sectionStats[id] = {
        visits: typeof r.visits === 'number' ? r.visits : 0,
        interactions: typeof r.interactions === 'number' ? r.interactions : 0,
      }
    }
  }
  const hp = raw.happy_profile
  const profile: UserProfile = {
    ...defaultProfile(),
    displayName: hp?.displayName ?? '',
    avatarDataUrl: hp?.avatarDataUrl ?? null,
    levelXp: typeof hp?.levelXp === 'number' ? hp.levelXp : 0,
    teacherCharacterId: hp?.teacherCharacterId ?? null,
    pendingCaseLevels: Array.isArray(hp?.pendingCaseLevels) ? hp.pendingCaseLevels : [],
    pendingTeacherLevels: Array.isArray(hp?.pendingTeacherLevels) ? hp.pendingTeacherLevels : [],
    pendingTeacherModalLevel: hp?.pendingTeacherModalLevel ?? null,
    characterInventory:
      hp?.characterInventory && typeof hp.characterInventory === 'object'
        ? hp.characterInventory
        : {},
  }
  return {
    happy_entries: entries,
    happy_categories: categories,
    happy_thoughts: thoughts,
    happy_state_actions: stateActions,
    happy_victory_entries: victoryEntries,
    happy_victory_drafts: victoryDrafts,
    happy_reward_tasks: rewardTasks,
    happy_hypotheses: hypotheses,
    happy_section_stats: sectionStats,
    happy_profile: profile,
  }
}

function readLocalStorage(): AppSnapshot | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw == null || raw.length < 2) return null
    const parsed = JSON.parse(raw) as Partial<AppSnapshot>
    return normalize(parsed)
  } catch {
    return null
  }
}

function writeLocalStorage(s: AppSnapshot): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(s))
}

/** Одноразовая подтяжка из dev API (файл на диске) при пустом localStorage */
async function tryMigrateFromDevApi(): Promise<AppSnapshot | null> {
  if (!import.meta.env.DEV) return null
  try {
    const res = await fetch('/api/data')
    if (!res.ok) return null
    const raw = (await res.json()) as Partial<AppSnapshot>
    const snap = normalize(raw)
    writeLocalStorage(snap)
    return snap
  } catch {
    return null
  }
}

export async function loadSnapshot(): Promise<AppSnapshot> {
  const fromLs = readLocalStorage()
  if (fromLs) return fromLs

  const migrated = await tryMigrateFromDevApi()
  if (migrated) return migrated

  return normalize({})
}

/** Зеркалирование в dev: PUT /api/data — ежедневный бэкап и защита от wipe в плагине */
async function mirrorToDevApi(s: AppSnapshot): Promise<void> {
  if (!import.meta.env.DEV) return
  try {
    const res = await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    })
    if (!res.ok) {
      let msg = res.statusText
      try {
        const j = (await res.json()) as { error?: string }
        if (j.error) msg = j.error
      } catch {
        /* ignore */
      }
      console.warn('[happy-data] зеркало в файл dev не сохранилось (данные в localStorage в безопасности):', msg)
    }
  } catch (e) {
    console.warn('[happy-data] зеркало в dev API недоступно:', e)
  }
}

export async function saveSnapshot(s: AppSnapshot): Promise<void> {
  try {
    writeLocalStorage(s)
  } catch (e) {
    console.error('localStorage недоступен или переполнен', e)
    throw e
  }
  await mirrorToDevApi(s)
}
