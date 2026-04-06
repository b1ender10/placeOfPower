import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { TaskCompleteModal } from '../components/TaskCompleteModal'
import { TaskSubtasksPanel } from '../components/TaskSubtasksPanel'
import { formatDateTime } from '../store/types'
import type { RewardTask } from '../store/types'

export function TasksView() {
  const rewardTasks = useStore((s) => s.rewardTasks)
  const hypotheses = useStore((s) => s.hypotheses)
  const addRewardTask = useStore((s) => s.addRewardTask)
  const updateRewardTask = useStore((s) => s.updateRewardTask)
  const completeRewardTask = useStore((s) => s.completeRewardTask)
  const removeRewardTask = useStore((s) => s.removeRewardTask)

  const [title, setTitle] = useState('')
  const [points, setPoints] = useState(5)
  const [hypothesisId, setHypothesisId] = useState('')
  const [modalTask, setModalTask] = useState<RewardTask | null>(null)

  const hypothesisById = useMemo(() => {
    const m = new Map<string, string>()
    for (const h of hypotheses) m.set(h.id, h.title)
    return m
  }, [hypotheses])

  const active = useMemo(
    () => rewardTasks.filter((t) => t.completedAt == null),
    [rewardTasks],
  )
  const best = useMemo(
    () =>
      [...rewardTasks]
        .filter((t) => t.completedAt != null)
        .sort((a, b) => (b.pointsEarned ?? 0) - (a.pointsEarned ?? 0)),
    [rewardTasks],
  )

  function onAdd(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    addRewardTask({
      title: t,
      rewardPoints: points,
      hypothesisId: hypothesisId || null,
    })
    setTitle('')
    setPoints(5)
    setHypothesisId('')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Задачи</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Награда 1–10 XP. Простая задача: галочка и оценка −100%…100%. Составная: добавь подзадачи с
          долями % (в сумме 100%), XP начисляется по шагам; общий прогресс — в полоске.
        </p>
      </div>

      <form
        onSubmit={onAdd}
        className="flex flex-col gap-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 md:flex-row md:flex-wrap md:items-end"
      >
        <label className="min-w-0 flex-1 text-sm">
          <span className="text-zinc-400">Новая задача</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Текст задания"
            className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-zinc-100"
          />
        </label>
        <div className="w-full max-w-xs shrink-0 text-sm md:w-56">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-zinc-400">Баллы (макс. XP)</span>
            <span className="font-mono text-lg font-semibold text-amber-400">{points}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="mt-2 w-full accent-amber-500"
          />
          <div className="mt-1 flex justify-between text-xs text-zinc-600">
            <span>1</span>
            <span>10</span>
          </div>
        </div>
        <label className="w-full min-w-[12rem] text-sm md:w-64">
          <span className="text-zinc-400">Гипотеза (ГДА), опционально</span>
          <select
            value={hypothesisId}
            onChange={(e) => setHypothesisId(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-zinc-100"
          >
            <option value="">— не привязана —</option>
            {hypotheses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="shrink-0 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500 md:self-end"
        >
          Добавить
        </button>
      </form>

      <section className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Активные</h2>
        {active.length === 0 ? (
          <p className="text-sm text-zinc-500">Нет задач — добавь выше.</p>
        ) : (
          <ul className="space-y-2">
            {active.map((t) => {
              const composite = (t.subtasks?.length ?? 0) > 0
              return (
                <li
                  key={t.id}
                  className="rounded-md border border-zinc-700/80 bg-zinc-900/40 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {composite ? (
                      <div className="flex min-w-0 flex-1 items-start gap-2">
                        <span className="mt-0.5 shrink-0 text-[10px] text-emerald-500/90" title="Составная">
                          ⧉
                        </span>
                        <span className="min-w-0 text-sm text-zinc-200">
                          {t.title}
                          {t.hypothesisId && hypothesisById.get(t.hypothesisId) ? (
                            <span className="mt-0.5 block text-xs text-violet-400/90">
                              ГДА: {hypothesisById.get(t.hypothesisId)}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    ) : (
                      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => setModalTask(t)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-500 accent-amber-500"
                        />
                        <span className="min-w-0 text-sm text-zinc-200">
                          {t.title}
                          {t.hypothesisId && hypothesisById.get(t.hypothesisId) ? (
                            <span className="mt-0.5 block text-xs text-violet-400/90">
                              ГДА: {hypothesisById.get(t.hypothesisId)}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    )}
                    <select
                      value={t.hypothesisId ?? ''}
                      onChange={(e) =>
                        updateRewardTask(t.id, {
                          hypothesisId: e.target.value || null,
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="max-w-[11rem] shrink-0 rounded border border-zinc-600 bg-zinc-950 px-1.5 py-1 text-xs text-zinc-300"
                    >
                      <option value="">ГДА: —</option>
                      {hypotheses.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.title.length > 28 ? `${h.title.slice(0, 28)}…` : h.title}
                        </option>
                      ))}
                    </select>
                    <span className="shrink-0 rounded bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                      до {t.rewardPoints} XP
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRewardTask(t.id)}
                      className="shrink-0 text-xs text-rose-400 hover:text-rose-300"
                    >
                      Удалить
                    </button>
                  </div>
                  <TaskSubtasksPanel task={t} collapsible />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-amber-500/20 bg-zinc-800/50 p-4">
        <h2 className="mb-1 text-sm font-medium text-zinc-300">Лучшие выполнения по баллам</h2>
        <p className="mb-3 text-xs text-zinc-500">Сортировка по фактическим XP за попытку</p>
        {best.length === 0 ? (
          <p className="text-sm text-zinc-500">Пока нет завершённых задач.</p>
        ) : (
          <ol className="space-y-2">
            {best.map((t, i) => (
              <li
                key={t.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-zinc-700/60 bg-zinc-900/30 px-3 py-2"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="w-6 shrink-0 text-xs text-zinc-500">{i + 1}.</span>
                    <span className="text-sm text-zinc-200">{t.title}</span>
                  </div>
                  {t.hypothesisId && hypothesisById.get(t.hypothesisId) ? (
                    <p className="pl-8 text-xs text-violet-400/80">
                      ГДА: {hypothesisById.get(t.hypothesisId)}
                    </p>
                  ) : null}
                  {(t.subtasks?.length ?? 0) > 0 ? (
                    <p className="pl-8 text-xs text-zinc-500">
                      Составная · {t.subtasks!.filter((s) => s.completedAt != null).length}/
                      {t.subtasks!.length} подзадач
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs">
                  <span className="text-zinc-500">макс. {t.rewardPoints}</span>
                  {(t.subtasks?.length ?? 0) > 0 ? (
                    <span className="text-zinc-500">составная</span>
                  ) : (
                    <span className="text-zinc-500">{t.qualityPercent}%</span>
                  )}
                  <span
                    className={
                      (t.pointsEarned ?? 0) >= 0 ? 'font-medium text-emerald-400' : 'font-medium text-rose-400'
                    }
                  >
                    {(t.pointsEarned ?? 0) > 0 ? '+' : ''}
                    {t.pointsEarned} XP
                  </span>
                  <span className="text-zinc-600">{formatDateTime(t.completedAt)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeRewardTask(t.id)}
                  className="w-full text-left text-xs text-rose-400/80 hover:text-rose-300 sm:w-auto"
                >
                  Удалить из истории
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      {modalTask && (
        <TaskCompleteModal
          task={modalTask}
          hypothesisTitle={
            modalTask.hypothesisId ? hypothesisById.get(modalTask.hypothesisId) : null
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
