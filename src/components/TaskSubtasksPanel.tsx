import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { RewardTask } from '../store/types'
import {
  rewardSubtaskXp,
  subtasksProgressPercent,
  sumSubtaskPercents,
} from '../store/types'

export function TaskSubtasksPanel({
  task,
  compact,
  collapsible = false,
}: {
  task: RewardTask
  compact?: boolean
  /** Скрыть содержимое за summary (раздел «Задачи») */
  collapsible?: boolean
}) {
  const addRewardSubtask = useStore((s) => s.addRewardSubtask)
  const removeRewardSubtask = useStore((s) => s.removeRewardSubtask)
  const completeRewardSubtask = useStore((s) => s.completeRewardSubtask)

  const [desc, setDesc] = useState('')
  const [pct, setPct] = useState(10)

  const subs = task.subtasks ?? []
  const sum = sumSubtaskPercents(subs)
  const progress = subtasksProgressPercent(subs)
  const ready = subs.length > 0 && sum === 100

  if (task.completedAt != null) return null

  function onAdd(e: React.FormEvent) {
    e.preventDefault()
    const d = desc.trim()
    if (!d) return
    const nextPct = Math.min(100, Math.max(1, Math.round(pct)))
    if (sum + nextPct > 100) return
    addRewardSubtask(task.id, d, nextPct)
    setDesc('')
  }

  const pad = compact ? 'pt-2 mt-2' : 'mt-3 border-t border-zinc-700/70 pt-3'

  const body = (
    <div className="space-y-3">
      {subs.length > 0 && (
        <>
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500/85 transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
              <span>Прогресс</span>
              <span className="font-mono text-zinc-400">{progress}%</span>
            </div>
          </div>

          <ul className="space-y-2">
            {subs.map((s) => {
              const done = s.completedAt != null
              const xpPreview = rewardSubtaskXp(task.rewardPoints, s.percentOfReward)
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-start gap-2 rounded border border-zinc-700/50 bg-zinc-950/40 px-2 py-1.5"
                >
                  <input
                    type="checkbox"
                    disabled={!ready || done}
                    checked={done}
                    onChange={() => {
                      if (!ready || done) return
                      completeRewardSubtask(task.id, s.id)
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-500 accent-emerald-500 disabled:opacity-40"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${done ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                      {s.description}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {s.percentOfReward}% от макс. · {done && s.pointsGranted != null ? `+${s.pointsGranted}` : `до ${xpPreview}`}{' '}
                      XP
                    </p>
                  </div>
                  {!done && (
                    <button
                      type="button"
                      onClick={() => removeRewardSubtask(task.id, s.id)}
                      className="shrink-0 text-[11px] text-rose-400/90 hover:text-rose-300"
                    >
                      Удалить
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

      <form onSubmit={onAdd} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="min-w-0 flex-1 text-[11px] text-zinc-500">
          Подзадача
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Описание шага"
            className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
          />
        </label>
        <label className="w-24 text-[11px] text-zinc-500">
          % от XP
          <input
            type="number"
            min={1}
            max={100}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
          />
        </label>
        <button
          type="submit"
          disabled={sum >= 100}
          className="shrink-0 rounded bg-zinc-700 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-600 disabled:opacity-40"
        >
          Добавить
        </button>
      </form>

      <p className="text-[11px] text-zinc-500">
        Сумма долей: <span className="font-mono text-zinc-400">{sum}%</span>
        {sum === 100 ? (
          <span className="text-emerald-500/90"> — можно отмечать выполнение</span>
        ) : (
          <span> · до 100% осталось {Math.max(0, 100 - sum)}%</span>
        )}
      </p>
    </div>
  )

  if (collapsible) {
    return (
      <details className="mt-2 rounded-lg border border-zinc-700/80 bg-zinc-950/40">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 [&::-webkit-details-marker]:hidden">
          <span>
            Подзадачи
            {subs.length > 0 ? ` · ${subs.length}` : ''}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {subs.length > 0 ? (
              <span className="font-mono text-emerald-400/90">{progress}%</span>
            ) : null}
            <span className="text-[10px] text-zinc-600">▼</span>
          </span>
        </summary>
        <div className="border-t border-zinc-700/50 px-3 pb-3 pt-1">{body}</div>
      </details>
    )
  }

  return <div className={`${pad} space-y-3`}>{body}</div>
}
