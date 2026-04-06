export interface HappinessEntry {
  id: string
  date: string
  hour: number
  minute?: number // 0-59, default 0 for backward compat
  rating: number
  comment: string
  category: string
  createdAt: number
}

export function slotToTime(slot: number): { hour: number; minute: number } {
  return { hour: Math.floor(slot / 2), minute: (slot % 2) * 30 }
}

export function timeToMinutes(hour: number, minute?: number): number {
  return hour * 60 + (minute ?? 0)
}

export function formatTime(hour: number, minute?: number): string {
  const m = minute ?? 0
  return `${hour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function timeToString(hour: number, minute?: number): string {
  return formatTime(hour, minute ?? 0)
}

export function parseTime(s: string): { hour: number; minute: number } {
  const [h, m] = s.split(':').map(Number)
  return { hour: Number.isNaN(h) ? 0 : h, minute: Number.isNaN(m) ? 0 : m }
}

export interface Category {
  id: string
  name: string
  color?: string
}

export type StatsPeriod = 'week' | 'month' | 'all'

export interface ThoughtNote {
  id: string
  text: string
  rating: number // 1–20
  createdAt: number
  favorite?: boolean
}

/** Действие, влияющее на кратко-/средне-/долгосрочное состояние */
export interface StateAction {
  id: string
  category: string
  createdAt: number
  deltaKs: number
  deltaSs: number
  deltaDs: number
  reason: string
}

export interface CharacterTierCounts {
  base: number
  bronze: number
  silver: number
  gold: number
}

/** Подзадача составной задачи: доля от rewardPoints родителя; XP при завершении = round(rewardPoints × percent / 100) */
export interface RewardSubtask {
  id: string
  description: string
  /** Доля от макс. XP основной задачи (1–100); сумма по всем подзадачам должна быть 100 */
  percentOfReward: number
  completedAt: number | null
  /** Фактически начисленный XP (для удаления/учёта) */
  pointsGranted?: number | null
}

/** Задача с наградой в баллах (1–10); после выполнения — фактические баллы с учётом % качества */
export interface RewardTask {
  id: string
  title: string
  /** Макс. баллы за идеальное выполнение (1–10) */
  rewardPoints: number
  /** Привязка к гипотезе (ГДА); одна и та же запись в «Задачах» и в карточке гипотезы */
  hypothesisId?: string | null
  /** Составная задача: подзадачи с долями XP; завершение основной — через подзадачи */
  subtasks?: RewardSubtask[] | null
  createdAt: number
  completedAt: number | null
  /** −100…100, только после завершения (простая задача без подзадач) */
  qualityPercent: number | null
  /** Фактическое изменение XP: простая задача — по качеству; составная — сумма начислений подзадач */
  pointsEarned: number | null
}

export function sumSubtaskPercents(subtasks: RewardSubtask[] | null | undefined): number {
  if (!subtasks?.length) return 0
  return subtasks.reduce((s, x) => s + x.percentOfReward, 0)
}

export function rewardSubtaskXp(rewardPoints: number, percent: number): number {
  return Math.round((rewardPoints * percent) / 100)
}

export function subtasksProgressPercent(subtasks: RewardSubtask[] | null | undefined): number {
  if (!subtasks?.length) return 0
  let done = 0
  for (const s of subtasks) {
    if (s.completedAt != null) done += s.percentOfReward
  }
  return Math.min(100, done)
}

/** Черновик победы за день (без XP, до публикации) */
export interface VictoryDraft {
  date: string
  text: string
  updatedAt: number
}

/** Запись «дневника побед» — один день = одна заметка */
export interface VictoryEntry {
  id: string
  date: string
  text: string
  createdAt: number
  xpAwarded: number
}

/** Действие в рамках гипотезы; анализ — опционально после действия */
export interface HaaAction {
  id: string
  text: string
  createdAt: number
  analysis: string | null
  analysisAt: number | null
}

/** Гипотеза → действия → анализ; закрытие с выводом */
export interface HypothesisExperiment {
  id: string
  title: string
  createdAt: number
  closedAt: number | null
  conclusion: string | null
  actions: HaaAction[]
}

export interface UserProfile {
  displayName: string
  /** data URL или пусто */
  avatarDataUrl: string | null
  /** Опыт уровня: +10 → следующий уровень */
  levelXp: number
  /** id из CHARACTERS — учитель для поздравлений при апе уровня */
  teacherCharacterId: string | null
  /** Очередь кейсов по номерам уровней */
  pendingCaseLevels: number[]
  /** Синхронно с кейсами — кого поздравить учителем */
  pendingTeacherLevels: number[]
  /** Показать модалку учителя для этого уровня (после кейса) */
  pendingTeacherModalLevel: number | null
  /** Инвентарь персонажей по id */
  characterInventory: Record<string, CharacterTierCounts>
}

export function localDateFromTs(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function localDateTimeToMs(dateStr: string, timeStr: string): number {
  const [y, mo, da] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  return new Date(y, (mo ?? 1) - 1, da ?? 1, hh ?? 0, mm ?? 0, 0, 0).getTime()
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts)
  return `${formatTime(d.getHours(), d.getMinutes())} · ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
}
