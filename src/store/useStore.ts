import { create } from 'zustand'
import type {
  HappinessEntry,
  Category,
  ThoughtNote,
  StateAction,
  UserProfile,
  VictoryEntry,
  VictoryDraft,
  RewardTask,
  RewardSubtask,
  HypothesisExperiment,
  HaaAction,
} from './types'
import { rewardSubtaskXp, sumSubtaskPercents } from './types'
import * as appData from '../lib/appData'
import { xpFromDeltas, levelFromXp } from '../lib/stateLevel'
import { streakEndingOn, diaryXpForStreak } from '../lib/victoryStreak'
import { addBaseAndMerge } from '../lib/inventoryMerge'
import { bumpInteraction, bumpVisit, emptySectionStats } from '../lib/sectionTelemetry'

interface Store {
  entries: HappinessEntry[]
  categories: Category[]
  thoughts: ThoughtNote[]
  stateActions: StateAction[]
  victoryEntries: VictoryEntry[]
  victoryDrafts: VictoryDraft[]
  rewardTasks: RewardTask[]
  hypotheses: HypothesisExperiment[]
  sectionStats: Record<string, { visits: number; interactions: number }>
  /** false до завершения load() — иначе persist перезапишет файл пустым */
  dataReady: boolean
  /** true только после успешного loadSnapshot — учёт визитов без этого не пишет на диск */
  hydratedFromServer: boolean
  profile: UserProfile
  load: () => Promise<void>
  recordSectionVisit: (sectionId: string) => void
  recordSectionInteraction: (sectionId: string) => void
  addEntry: (entry: Omit<HappinessEntry, 'id' | 'createdAt'>) => void
  updateEntry: (entry: HappinessEntry) => void
  removeEntry: (id: string) => void
  addCategory: (cat: Omit<Category, 'id'>) => void
  updateCategory: (cat: Category) => void
  removeCategory: (id: string, reassignToId?: string) => void
  addThought: (t: Omit<ThoughtNote, 'id' | 'createdAt'> & { createdAt?: number }) => void
  updateThought: (t: ThoughtNote) => void
  removeThought: (id: string) => void
  addStateAction: (a: Omit<StateAction, 'id' | 'createdAt'>) => void
  removeStateAction: (id: string) => void
  setProfile: (p: Partial<UserProfile>) => void
  upsertVictoryEntry: (date: string, text: string) => void
  removeVictoryEntry: (id: string) => void
  upsertVictoryDraft: (date: string, text: string) => void
  removeVictoryDraft: (date: string) => void
  addHypothesis: (title: string) => void
  closeHypothesis: (id: string, conclusion: string) => void
  addHypothesisAction: (hypothesisId: string, text: string) => void
  setHypothesisActionAnalysis: (hypothesisId: string, actionId: string, analysis: string) => void
  removeHypothesis: (id: string) => void
  addRewardTask: (t: Omit<RewardTask, 'id' | 'createdAt' | 'completedAt' | 'qualityPercent' | 'pointsEarned'>) => void
  updateRewardTask: (
    id: string,
    patch: Partial<Pick<RewardTask, 'title' | 'rewardPoints' | 'hypothesisId'>>,
  ) => void
  addRewardSubtask: (taskId: string, description: string, percentOfReward: number) => void
  removeRewardSubtask: (taskId: string, subtaskId: string) => void
  completeRewardSubtask: (taskId: string, subtaskId: string) => void
  completeRewardTask: (id: string, qualityPercent: number) => void
  removeRewardTask: (id: string) => void
  completeCaseDrop: (characterId: string) => void
  dismissTeacherModal: () => void
}

function genId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function profileWithXp(prev: UserProfile, newXp: number): UserProfile {
  const oldL = levelFromXp(prev.levelXp)
  const newL = levelFromXp(newXp)
  const cases = [...prev.pendingCaseLevels]
  const teach = [...prev.pendingTeacherLevels]
  for (let L = oldL + 1; L <= newL; L++) {
    cases.push(L)
    teach.push(L)
  }
  return { ...prev, levelXp: newXp, pendingCaseLevels: cases, pendingTeacherLevels: teach }
}

const defaultProfile: UserProfile = {
  displayName: '',
  avatarDataUrl: null,
  levelXp: 0,
  teacherCharacterId: null,
  pendingCaseLevels: [],
  pendingTeacherLevels: [],
  pendingTeacherModalLevel: null,
  characterInventory: {},
}

async function persist(get: () => Store) {
  if (!get().dataReady) return
  const {
    entries,
    categories,
    thoughts,
    stateActions,
    victoryEntries,
    victoryDrafts,
    rewardTasks,
    hypotheses,
    sectionStats,
    profile,
  } = get()
  await appData.saveSnapshot({
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
  })
}

export const useStore = create<Store>((set, get) => ({
  entries: [],
  categories: [],
  thoughts: [],
  stateActions: [],
  victoryEntries: [],
  victoryDrafts: [],
  rewardTasks: [],
  hypotheses: [],
  sectionStats: emptySectionStats(),
  dataReady: false,
  hydratedFromServer: false,
  profile: defaultProfile,

  load: async () => {
    try {
      const s = await appData.loadSnapshot()
      set({
        entries: s.happy_entries,
        categories: s.happy_categories,
        thoughts: s.happy_thoughts,
        stateActions: s.happy_state_actions,
        victoryEntries: s.happy_victory_entries,
        victoryDrafts: s.happy_victory_drafts,
        rewardTasks: s.happy_reward_tasks,
        hypotheses: s.happy_hypotheses,
        sectionStats: s.happy_section_stats,
        profile: s.happy_profile,
        dataReady: true,
        hydratedFromServer: true,
      })
    } catch (e) {
      console.error(e)
      set({ dataReady: true, hydratedFromServer: false })
    }
  },

  recordSectionVisit: (sectionId) => {
    if (!get().dataReady || !get().hydratedFromServer) return
    set((s) => ({ sectionStats: bumpVisit(s.sectionStats, sectionId) }))
    void persist(get)
  },

  recordSectionInteraction: (sectionId) => {
    set((s) => ({ sectionStats: bumpInteraction(s.sectionStats, sectionId) }))
    void persist(get)
  },

  addEntry: (entry) => {
    const full: HappinessEntry = {
      ...entry,
      id: genId(),
      createdAt: Date.now(),
    }
    set((s) => ({
      entries: [...s.entries, full],
      sectionStats: bumpInteraction(s.sectionStats, 'day'),
    }))
    void persist(get)
  },

  updateEntry: (entry) => {
    set((s) => ({
      entries: s.entries.map((e) => (e.id === entry.id ? entry : e)),
      sectionStats: bumpInteraction(s.sectionStats, 'day'),
    }))
    void persist(get)
  },

  removeEntry: (id) => {
    set((s) => ({
      entries: s.entries.filter((e) => e.id !== id),
      sectionStats: bumpInteraction(s.sectionStats, 'day'),
    }))
    void persist(get)
  },

  addCategory: (cat) => {
    const full: Category = { ...cat, id: genId() }
    set((s) => ({
      categories: [...s.categories, full],
      sectionStats: bumpInteraction(s.sectionStats, 'categories'),
    }))
    void persist(get)
  },

  updateCategory: (cat) => {
    set((s) => ({
      categories: s.categories.map((c) => (c.id === cat.id ? cat : c)),
      sectionStats: bumpInteraction(s.sectionStats, 'categories'),
    }))
    void persist(get)
  },

  removeCategory: (id, reassignToId) => {
    set((s) => {
      let { entries, categories, stateActions } = s
      if (reassignToId) {
        entries = entries.map((e) => (e.category === id ? { ...e, category: reassignToId } : e))
        stateActions = stateActions.map((a) => (a.category === id ? { ...a, category: reassignToId } : a))
      }
      categories = categories.filter((c) => c.id !== id)
      return {
        entries,
        categories,
        stateActions,
        sectionStats: bumpInteraction(s.sectionStats, 'categories'),
      }
    })
    void persist(get)
  },

  addThought: (t) => {
    const { createdAt, ...rest } = t
    const full: ThoughtNote = { ...rest, id: genId(), createdAt: createdAt ?? Date.now() }
    set((s) => ({
      thoughts: [...s.thoughts, full],
      sectionStats: bumpInteraction(s.sectionStats, 'thoughts'),
    }))
    void persist(get)
  },

  updateThought: (t) => {
    set((s) => ({
      thoughts: s.thoughts.map((x) => (x.id === t.id ? t : x)),
      sectionStats: bumpInteraction(s.sectionStats, 'thoughts'),
    }))
    void persist(get)
  },

  removeThought: (id) => {
    set((s) => ({
      thoughts: s.thoughts.filter((x) => x.id !== id),
      sectionStats: bumpInteraction(s.sectionStats, 'thoughts'),
    }))
    void persist(get)
  },

  addStateAction: (a) => {
    const full: StateAction = { ...a, id: genId(), createdAt: Date.now() }
    const xp = xpFromDeltas(full.deltaKs, full.deltaSs, full.deltaDs)
    set((s) => {
      const p = s.profile
      return {
        stateActions: [...s.stateActions, full],
        profile: profileWithXp(p, p.levelXp + xp),
        sectionStats: bumpInteraction(s.sectionStats, 'states'),
      }
    })
    void persist(get)
  },

  removeStateAction: (id) => {
    const act = get().stateActions.find((x) => x.id === id)
    if (!act) return
    const xp = xpFromDeltas(act.deltaKs, act.deltaSs, act.deltaDs)
    set((s) => ({
      stateActions: s.stateActions.filter((x) => x.id !== id),
      profile: { ...s.profile, levelXp: s.profile.levelXp - xp },
      sectionStats: bumpInteraction(s.sectionStats, 'states'),
    }))
    void persist(get)
  },

  setProfile: (partial) => {
    set((s) => ({
      profile: { ...s.profile, ...partial },
      sectionStats: bumpInteraction(s.sectionStats, 'profile'),
    }))
    void persist(get)
  },

  upsertVictoryEntry: (date, text) => {
    const t = text.trim()
    if (!t) return
    const prev = get().victoryEntries.find((e) => e.date === date)
    set((s) => {
      let list = s.victoryEntries
      list = list.filter((e) => e.date !== date)
      const datesSet = new Set(list.map((e) => e.date))
      datesSet.add(date)
      const streak = streakEndingOn(date, datesSet)
      const xp = diaryXpForStreak(streak)
      const id = prev?.id ?? genId()
      const createdAt = prev?.createdAt ?? Date.now()
      const entry: VictoryEntry = { id, date, text: t, createdAt, xpAwarded: xp }
      const delta = xp - (prev?.xpAwarded ?? 0)
      const p = s.profile
      return {
        victoryEntries: [...list, entry],
        victoryDrafts: s.victoryDrafts.filter((d) => d.date !== date),
        profile: delta !== 0 ? profileWithXp(p, p.levelXp + delta) : p,
        sectionStats: bumpInteraction(s.sectionStats, 'victory'),
      }
    })
    void persist(get)
  },

  upsertVictoryDraft: (date, text) => {
    const t = text.trim()
    set((s) => {
      const drafts = s.victoryDrafts.filter((d) => d.date !== date)
      if (!t) {
        return {
          victoryDrafts: drafts,
          sectionStats: bumpInteraction(s.sectionStats, 'victory'),
        }
      }
      const draft: VictoryDraft = { date, text, updatedAt: Date.now() }
      return {
        victoryDrafts: [...drafts, draft],
        sectionStats: bumpInteraction(s.sectionStats, 'victory'),
      }
    })
    void persist(get)
  },

  removeVictoryDraft: (date) => {
    set((s) => ({
      victoryDrafts: s.victoryDrafts.filter((d) => d.date !== date),
      sectionStats: bumpInteraction(s.sectionStats, 'victory'),
    }))
    void persist(get)
  },

  removeVictoryEntry: (id) => {
    const v = get().victoryEntries.find((e) => e.id === id)
    if (!v) return
    set((s) => ({
      victoryEntries: s.victoryEntries.filter((e) => e.id !== id),
      profile: { ...s.profile, levelXp: s.profile.levelXp - v.xpAwarded },
      sectionStats: bumpInteraction(s.sectionStats, 'victory'),
    }))
    void persist(get)
  },

  addRewardTask: (t) => {
    const rp = Math.min(10, Math.max(1, Math.round(t.rewardPoints)))
    const hidRaw = t.hypothesisId
    const hypotheses = get().hypotheses
    const hypothesisId =
      typeof hidRaw === 'string' && hypotheses.some((h) => h.id === hidRaw) ? hidRaw : null
    const full: RewardTask = {
      id: genId(),
      title: t.title.trim() || 'Без названия',
      rewardPoints: rp,
      hypothesisId,
      subtasks: undefined,
      createdAt: Date.now(),
      completedAt: null,
      qualityPercent: null,
      pointsEarned: null,
    }
    set((s) => ({
      rewardTasks: [...s.rewardTasks, full],
      sectionStats: bumpInteraction(s.sectionStats, 'tasks'),
    }))
    void persist(get)
  },

  updateRewardTask: (id, patch) => {
    set((s) => {
      const cur = s.rewardTasks.find((x) => x.id === id)
      if (!cur) return s
      const next: RewardTask = { ...cur }
      if (patch.title !== undefined) next.title = patch.title.trim() || 'Без названия'
      if (patch.rewardPoints !== undefined) {
        next.rewardPoints = Math.min(10, Math.max(1, Math.round(patch.rewardPoints)))
      }
      if (patch.hypothesisId !== undefined) {
        const hid = patch.hypothesisId
        next.hypothesisId = hid && s.hypotheses.some((h) => h.id === hid) ? hid : null
      }
      return {
        rewardTasks: s.rewardTasks.map((x) => (x.id === id ? next : x)),
        sectionStats: bumpInteraction(s.sectionStats, 'tasks'),
      }
    })
    void persist(get)
  },

  addRewardSubtask: (taskId, description, percentOfReward) => {
    const desc = description.trim()
    if (!desc) return
    const t = get().rewardTasks.find((x) => x.id === taskId)
    if (!t || t.completedAt != null) return
    const pct = Math.min(100, Math.max(1, Math.round(percentOfReward)))
    const subs = [...(t.subtasks ?? [])]
    if (sumSubtaskPercents(subs) + pct > 100) return
    const st: RewardSubtask = {
      id: genId(),
      description: desc,
      percentOfReward: pct,
      completedAt: null,
      pointsGranted: null,
    }
    set((s) => ({
      rewardTasks: s.rewardTasks.map((x) =>
        x.id === taskId ? { ...x, subtasks: [...subs, st] } : x,
      ),
      sectionStats: bumpInteraction(s.sectionStats, 'tasks'),
    }))
    void persist(get)
  },

  removeRewardSubtask: (taskId, subtaskId) => {
    const t = get().rewardTasks.find((x) => x.id === taskId)
    if (!t || t.completedAt != null) return
    const subs = t.subtasks ?? []
    const st = subs.find((x) => x.id === subtaskId)
    if (!st) return
    const refunded = st.pointsGranted ?? 0
    const nextSubs = subs.filter((x) => x.id !== subtaskId)
    const pr = get().profile
    const newXp = refunded !== 0 ? pr.levelXp - refunded : pr.levelXp
    const earnedFromRemaining = nextSubs.reduce((sum, s) => sum + (s.pointsGranted ?? 0), 0)
    const allDone = nextSubs.length > 0 && nextSubs.every((s) => s.completedAt != null)
    set((s) => ({
      rewardTasks: s.rewardTasks.map((x) => {
        if (x.id !== taskId) return x
        if (nextSubs.length === 0) {
          return {
            ...x,
            subtasks: undefined,
            pointsEarned: null,
            completedAt: null,
            qualityPercent: null,
          }
        }
        return {
          ...x,
          subtasks: nextSubs,
          pointsEarned: earnedFromRemaining > 0 ? earnedFromRemaining : null,
          completedAt: allDone ? (x.completedAt ?? Date.now()) : null,
          qualityPercent: allDone ? 100 : null,
        }
      }),
      profile: refunded !== 0 ? { ...pr, levelXp: newXp } : pr,
      sectionStats: bumpInteraction(s.sectionStats, 'tasks'),
    }))
    void persist(get)
  },

  completeRewardSubtask: (taskId, subtaskId) => {
    const t = get().rewardTasks.find((x) => x.id === taskId)
    if (!t || t.completedAt != null) return
    const subs = t.subtasks ?? []
    if (subs.length === 0) return
    const st = subs.find((x) => x.id === subtaskId)
    if (!st || st.completedAt != null) return
    if (sumSubtaskPercents(subs) !== 100) return
    const xp = rewardSubtaskXp(t.rewardPoints, st.percentOfReward)
    const now = Date.now()
    const newSubs = subs.map((s) =>
      s.id === subtaskId ? { ...s, completedAt: now, pointsGranted: xp } : s,
    )
    const totalPoints = newSubs.reduce((sum, s) => sum + (s.pointsGranted ?? 0), 0)
    const allDone = newSubs.every((s) => s.completedAt != null)
    const pr = get().profile
    set((s) => {
      let stats = bumpInteraction(s.sectionStats, 'tasks')
      if (t.hypothesisId) stats = bumpInteraction(stats, 'hypothesis')
      return {
        rewardTasks: s.rewardTasks.map((x) =>
          x.id === taskId
            ? {
                ...x,
                subtasks: newSubs,
                pointsEarned: totalPoints,
                completedAt: allDone ? now : null,
                qualityPercent: allDone ? 100 : null,
              }
            : x,
        ),
        profile: profileWithXp(pr, pr.levelXp + xp),
        sectionStats: stats,
      }
    })
    void persist(get)
  },

  completeRewardTask: (id, qualityPercent) => {
    const tasks = get().rewardTasks
    const t = tasks.find((x) => x.id === id)
    if (!t || t.completedAt != null) return
    if (t.subtasks && t.subtasks.length > 0) return
    const p = Math.max(-100, Math.min(100, qualityPercent))
    const pointsEarned = Math.round((t.rewardPoints * p) / 100)
    const pr = get().profile
    set((s) => {
      let stats = bumpInteraction(s.sectionStats, 'tasks')
      if (t.hypothesisId) stats = bumpInteraction(stats, 'hypothesis')
      return {
        rewardTasks: tasks.map((x) =>
          x.id === id
            ? {
                ...x,
                completedAt: Date.now(),
                qualityPercent: p,
                pointsEarned,
              }
            : x,
        ),
        profile: profileWithXp(pr, pr.levelXp + pointsEarned),
        sectionStats: stats,
      }
    })
    void persist(get)
  },

  removeRewardTask: (id) => {
    const t = get().rewardTasks.find((x) => x.id === id)
    if (!t) return
    const p = get().profile
    const delta = t.pointsEarned ?? 0
    set((s) => ({
      rewardTasks: s.rewardTasks.filter((x) => x.id !== id),
      profile: delta !== 0 ? { ...p, levelXp: p.levelXp - delta } : p,
      sectionStats: bumpInteraction(s.sectionStats, 'tasks'),
    }))
    void persist(get)
  },

  addHypothesis: (title) => {
    const t = title.trim()
    if (!t) return
    const h: HypothesisExperiment = {
      id: genId(),
      title: t,
      createdAt: Date.now(),
      closedAt: null,
      conclusion: null,
      actions: [],
    }
    set((s) => ({
      hypotheses: [...s.hypotheses, h],
      sectionStats: bumpInteraction(s.sectionStats, 'hypothesis'),
    }))
    void persist(get)
  },

  closeHypothesis: (id, conclusion) => {
    const c = conclusion.trim()
    if (!c) return
    set((s) => ({
      hypotheses: s.hypotheses.map((h) =>
        h.id === id ? { ...h, closedAt: Date.now(), conclusion: c } : h,
      ),
      sectionStats: bumpInteraction(s.sectionStats, 'hypothesis'),
    }))
    void persist(get)
  },

  addHypothesisAction: (hypothesisId, text) => {
    const t = text.trim()
    if (!t) return
    const act: HaaAction = {
      id: genId(),
      text: t,
      createdAt: Date.now(),
      analysis: null,
      analysisAt: null,
    }
    set((s) => ({
      hypotheses: s.hypotheses.map((h) =>
        h.id === hypothesisId ? { ...h, actions: [...h.actions, act] } : h,
      ),
      sectionStats: bumpInteraction(s.sectionStats, 'hypothesis'),
    }))
    void persist(get)
  },

  setHypothesisActionAnalysis: (hypothesisId, actionId, analysis) => {
    const trimmed = analysis.trim()
    const analysisVal = trimmed.length > 0 ? trimmed : null
    const now = Date.now()
    set((s) => ({
      hypotheses: s.hypotheses.map((h) => {
        if (h.id !== hypothesisId) return h
        return {
          ...h,
          actions: h.actions.map((a) =>
            a.id === actionId
              ? { ...a, analysis: analysisVal, analysisAt: analysisVal ? now : null }
              : a,
          ),
        }
      }),
      sectionStats: bumpInteraction(s.sectionStats, 'hypothesis'),
    }))
    void persist(get)
  },

  removeHypothesis: (id) => {
    set((s) => ({
      hypotheses: s.hypotheses.filter((h) => h.id !== id),
      rewardTasks: s.rewardTasks.map((t) =>
        t.hypothesisId === id ? { ...t, hypothesisId: null } : t,
      ),
      sectionStats: bumpInteraction(s.sectionStats, 'hypothesis'),
    }))
    void persist(get)
  },

  completeCaseDrop: (characterId) => {
    const p = get().profile
    if (p.pendingCaseLevels.length === 0) return
    const inv = addBaseAndMerge(p.characterInventory, characterId)
    const nextCases = p.pendingCaseLevels.slice(1)
    const hasTeacher = Boolean(p.teacherCharacterId) && p.pendingTeacherLevels.length > 0
    set((s) => ({
      profile: {
        ...p,
        characterInventory: inv,
        pendingCaseLevels: nextCases,
        pendingTeacherModalLevel: hasTeacher ? p.pendingTeacherLevels[0] : null,
        pendingTeacherLevels: hasTeacher ? p.pendingTeacherLevels : p.pendingTeacherLevels.slice(1),
      },
      sectionStats: bumpInteraction(s.sectionStats, 'profile'),
    }))
    void persist(get)
  },

  dismissTeacherModal: () => {
    const p = get().profile
    if (p.pendingTeacherModalLevel == null) return
    set((s) => ({
      profile: {
        ...s.profile,
        pendingTeacherModalLevel: null,
        pendingTeacherLevels: s.profile.pendingTeacherLevels.slice(1),
      },
      sectionStats: bumpInteraction(s.sectionStats, 'profile'),
    }))
    void persist(get)
  },
}))
