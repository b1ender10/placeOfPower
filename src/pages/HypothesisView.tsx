import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { formatDateTime } from '../store/types'
import type { HypothesisExperiment, RewardTask } from '../store/types'
import { TaskCompleteModal } from '../components/TaskCompleteModal'
import { TaskSubtasksPanel } from '../components/TaskSubtasksPanel'

function HypothesisCard({
  h,
  expanded,
  onToggle,
  onClose,
  onAddAction,
  onSetAnalysis,
  onRemove,
  linkedTasks,
  onOpenTaskComplete,
  onRemoveTask,
  readOnly = false,
}: {
  h: HypothesisExperiment
  expanded: boolean
  onToggle: () => void
  onClose: (id: string, conclusion: string) => void
  onAddAction: (hid: string, text: string) => void
  onSetAnalysis: (hid: string, aid: string, analysis: string) => void
  onRemove: (id: string) => void
  linkedTasks: RewardTask[]
  onOpenTaskComplete: (t: RewardTask) => void
  onRemoveTask: (id: string) => void
  readOnly?: boolean
}) {
  const [actionText, setActionText] = useState('')
  const [closeText, setCloseText] = useState('')
  const [analysisLocal, setAnalysisLocal] = useState<Record<string, string>>({})

  const closed = h.closedAt != null
  /** Один счётчик: текстовые действия + связанные задачи из раздела «Задачи» */
  const stepsTotal = h.actions.length + linkedTasks.length

  function submitAction(e: React.FormEvent) {
    e.preventDefault()
    const t = actionText.trim()
    if (!t) return
    onAddAction(h.id, t)
    setActionText('')
  }

  function submitClose(e: React.FormEvent) {
    e.preventDefault()
    onClose(h.id, closeText)
    setCloseText('')
  }

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="font-medium text-zinc-100">{h.title}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {closed ? `Закрыта ${formatDateTime(h.closedAt!)}` : `Создана ${formatDateTime(h.createdAt)}`}
            {' · '}
            {stepsTotal} действ.
          </p>
        </div>
        <span className="shrink-0 text-zinc-500">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-zinc-700/80 px-4 pb-4 pt-2">
          {closed && h.conclusion && (
            <div className="rounded-md border border-emerald-500/25 bg-emerald-950/20 px-3 py-2">
              <p className="text-xs font-medium text-emerald-400/90">Вывод</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">{h.conclusion}</p>
            </div>
          )}

          {linkedTasks.length > 0 && (
            <div className="rounded-md border border-violet-500/25 bg-zinc-950/50 p-3">
              <p className="text-xs font-medium text-violet-400/90">Задачи (раздел «Задачи»)</p>
              <p className="mb-2 text-xs text-zinc-500">
                Гипотеза: <span className="text-zinc-300">{h.title}</span> · те же баллы и статус, что в
                «Задачах»
              </p>
              <ul className="space-y-3">
                {linkedTasks.map((t) => {
                  const composite = (t.subtasks?.length ?? 0) > 0
                  return (
                    <li
                      key={t.id}
                      className="rounded border border-zinc-700/60 bg-zinc-900/50 px-2 py-2"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {t.completedAt == null && !composite ? (
                          <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => onOpenTaskComplete(t)}
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-500 accent-amber-500"
                            />
                            <span className="text-sm text-zinc-200">{t.title}</span>
                          </label>
                        ) : t.completedAt == null ? (
                          <div className="flex min-w-0 flex-1 items-start gap-2">
                            <span className="mt-0.5 shrink-0 text-[10px] text-emerald-500/90" title="Составная">
                              ⧉
                            </span>
                            <span className="text-sm text-zinc-200">{t.title}</span>
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1 text-sm text-zinc-400">
                            <span className="line-through opacity-80">{t.title}</span>
                            <span className="mt-0.5 block text-xs text-zinc-500">
                              {t.pointsEarned !== null ? `${t.pointsEarned >= 0 ? '+' : ''}${t.pointsEarned} XP` : ''}
                              {composite ? (
                                <span> · составная</span>
                              ) : (
                                t.qualityPercent != null && ` · ${t.qualityPercent}%`
                              )}
                              {t.completedAt ? ` · ${formatDateTime(t.completedAt)}` : ''}
                            </span>
                          </div>
                        )}
                        <span className="shrink-0 rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                          {t.completedAt != null ? `итог ${t.pointsEarned ?? 0} XP` : `до ${t.rewardPoints} XP`}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveTask(t.id)}
                          className="shrink-0 text-xs text-rose-400/90 hover:text-rose-300"
                        >
                          Удалить
                        </button>
                      </div>
                      {t.completedAt == null ? <TaskSubtasksPanel task={t} compact /> : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <ul className="space-y-4">
            {h.actions.map((a) => (
              <li key={a.id} className="rounded-md border border-zinc-700/60 bg-zinc-900/40 p-3">
                <p className="whitespace-pre-wrap text-sm text-zinc-200">{a.text}</p>
                <p className="mt-1 text-xs text-zinc-600">
                  {formatDateTime(a.createdAt)}
                  {a.analysisAt && ` · анализ ${formatDateTime(a.analysisAt)}`}
                </p>
                {a.analysis && (
                  <div className="mt-2 border-l-2 border-amber-500/40 pl-3">
                    <p className="text-xs text-zinc-500">Анализ</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-300">{a.analysis}</p>
                  </div>
                )}
                {!closed && !readOnly && (
                  <label className="mt-3 block text-xs">
                    <span className="text-zinc-500">
                      {a.analysis ? 'Изменить анализ' : 'Анализ (опционально)'}
                    </span>
                    <textarea
                      value={analysisLocal[a.id] ?? a.analysis ?? ''}
                      onChange={(e) =>
                        setAnalysisLocal((m) => ({ ...m, [a.id]: e.target.value }))
                      }
                      rows={2}
                      placeholder="Что получилось, что нет…"
                      className="mt-1 w-full rounded border border-zinc-600 bg-zinc-950 px-2 py-1.5 text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = analysisLocal[a.id] ?? a.analysis ?? ''
                        onSetAnalysis(h.id, a.id, val)
                        setAnalysisLocal((m) => {
                          const next = { ...m }
                          delete next[a.id]
                          return next
                        })
                      }}
                      className="mt-1 text-xs text-amber-500 hover:text-amber-400"
                    >
                      Сохранить анализ
                    </button>
                  </label>
                )}
              </li>
            ))}
          </ul>

          {!closed && !readOnly && (
            <>
              <form onSubmit={submitAction} className="space-y-2">
                <label className="block text-xs text-zinc-500">
                  Новое действие
                  <textarea
                    value={actionText}
                    onChange={(e) => setActionText(e.target.value)}
                    rows={2}
                    placeholder="Что сделал в рамках гипотезы"
                    className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded bg-zinc-700 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-600"
                >
                  Добавить действие
                </button>
              </form>

              <form onSubmit={submitClose} className="space-y-2 border-t border-zinc-700/60 pt-3">
                <label className="block text-xs text-zinc-500">
                  Закрыть гипотезу с выводом
                  <textarea
                    value={closeText}
                    onChange={(e) => setCloseText(e.target.value)}
                    rows={3}
                    placeholder="Итог эксперимента"
                    className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
                    required
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="rounded bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-600"
                  >
                    Закрыть гипотезу
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Удалить гипотезу со всеми действиями?')) onRemove(h.id)
                    }}
                    className="text-sm text-rose-400 hover:text-rose-300"
                  >
                    Удалить
                  </button>
                </div>
              </form>
            </>
          )}

          {(closed || readOnly) && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Удалить гипотезу?')) onRemove(h.id)
              }}
              className="text-xs text-rose-400/90 hover:text-rose-300"
            >
              Удалить из списка
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function HypothesisView() {
  const hypotheses = useStore((s) => s.hypotheses)
  const rewardTasks = useStore((s) => s.rewardTasks)
  const addHypothesis = useStore((s) => s.addHypothesis)
  const closeHypothesis = useStore((s) => s.closeHypothesis)
  const addHypothesisAction = useStore((s) => s.addHypothesisAction)
  const setHypothesisActionAnalysis = useStore((s) => s.setHypothesisActionAnalysis)
  const removeHypothesis = useStore((s) => s.removeHypothesis)
  const completeRewardTask = useStore((s) => s.completeRewardTask)
  const removeRewardTask = useStore((s) => s.removeRewardTask)

  const [newTitle, setNewTitle] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [modalTask, setModalTask] = useState<RewardTask | null>(null)

  const tasksByHypothesis = useMemo(() => {
    const m = new Map<string, RewardTask[]>()
    for (const t of rewardTasks) {
      const hid = t.hypothesisId
      if (!hid) continue
      const list = m.get(hid)
      if (list) list.push(t)
      else m.set(hid, [t])
    }
    for (const list of m.values()) {
      list.sort((a, b) => {
        const ac = a.completedAt != null ? 1 : 0
        const bc = b.completedAt != null ? 1 : 0
        if (ac !== bc) return ac - bc
        return b.createdAt - a.createdAt
      })
    }
    return m
  }, [rewardTasks])

  const { open, closed } = useMemo(() => {
    const o: HypothesisExperiment[] = []
    const c: HypothesisExperiment[] = []
    for (const h of hypotheses) {
      if (h.closedAt) c.push(h)
      else o.push(h)
    }
    o.sort((a, b) => b.createdAt - a.createdAt)
    c.sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))
    return { open: o, closed: c }
  }, [hypotheses])

  function onCreate(e: React.FormEvent) {
    e.preventDefault()
    const t = newTitle.trim()
    if (!t) return
    addHypothesis(t)
    setNewTitle('')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Гипотеза — действие — анализ</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Заведи гипотезу, фиксируй действия и по желанию — анализ после каждого. Закрой эксперимент с выводом.
        </p>
      </div>

      <form onSubmit={onCreate} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm">
          <span className="text-zinc-400">Новая гипотеза</span>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Формулировка гипотезы"
            className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-zinc-100"
          />
        </label>
        <button
          type="submit"
          className="shrink-0 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500"
        >
          Добавить
        </button>
      </form>

      {open.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Активные</h2>
          {open.map((h) => (
            <HypothesisCard
              key={h.id}
              h={h}
              expanded={openId === h.id}
              onToggle={() => setOpenId((id) => (id === h.id ? null : h.id))}
              onClose={closeHypothesis}
              onAddAction={addHypothesisAction}
              onSetAnalysis={setHypothesisActionAnalysis}
              onRemove={removeHypothesis}
              linkedTasks={tasksByHypothesis.get(h.id) ?? []}
              onOpenTaskComplete={setModalTask}
              onRemoveTask={removeRewardTask}
            />
          ))}
        </section>
      )}

      {closed.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-500">Закрытые</h2>
          {closed.map((h) => (
            <HypothesisCard
              key={h.id}
              h={h}
              expanded={openId === h.id}
              onToggle={() => setOpenId((id) => (id === h.id ? null : h.id))}
              onClose={closeHypothesis}
              onAddAction={addHypothesisAction}
              onSetAnalysis={setHypothesisActionAnalysis}
              onRemove={removeHypothesis}
              linkedTasks={tasksByHypothesis.get(h.id) ?? []}
              onOpenTaskComplete={setModalTask}
              onRemoveTask={removeRewardTask}
              readOnly
            />
          ))}
        </section>
      )}

      {hypotheses.length === 0 && (
        <p className="text-sm text-zinc-500">Пока нет гипотез — добавь первую выше.</p>
      )}

      {modalTask && (
        <TaskCompleteModal
          task={modalTask}
          hypothesisTitle={
            modalTask.hypothesisId
              ? hypotheses.find((x) => x.id === modalTask.hypothesisId)?.title
              : null
          }
          onCancel={() => setModalTask(null)}
          onConfirm={(qualityPercent) => {
            completeRewardTask(modalTask.id, qualityPercent)
            setModalTask(null)
          }}
        />
      )}
    </div>
  )
}
