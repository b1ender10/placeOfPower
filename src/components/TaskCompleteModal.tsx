import { useEffect, useState } from 'react'
import type { RewardTask } from '../store/types'

type Props = {
  task: RewardTask
  /** Подпись гипотезы (ГДА), если задача привязана */
  hypothesisTitle?: string | null
  onConfirm: (qualityPercent: number) => void
  onCancel: () => void
}

export function TaskCompleteModal({ task, hypothesisTitle, onConfirm, onCancel }: Props) {
  const [pct, setPct] = useState(0)
  const preview = Math.round((task.rewardPoints * pct) / 100)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-label="Закрыть"
      />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-amber-500/35 bg-zinc-900 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-zinc-100">Как выполнил задание?</h2>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{task.title}</p>
        {hypothesisTitle ? (
          <p className="mt-1 text-xs text-violet-400/90">Гипотеза (ГДА): {hypothesisTitle}</p>
        ) : null}
        <p className="mt-2 text-xs text-zinc-500">
          Макс. награда: {task.rewardPoints} XP · итог = макс × (оценка / 100%)
        </p>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-zinc-500">Оценка</span>
            <span className="font-mono text-amber-400">{pct > 0 ? '+' : ''}{pct}%</span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={1}
            value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="mt-1 flex justify-between text-xs text-zinc-600">
            <span>−100%</span>
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <p className="mt-4 text-center text-sm">
          <span className="text-zinc-500">К балансу: </span>
          <span className={preview >= 0 ? 'font-semibold text-emerald-400' : 'font-semibold text-rose-400'}>
            {preview > 0 ? '+' : ''}
            {preview} XP
          </span>
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => onConfirm(pct)}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500"
          >
            Записать
          </button>
        </div>
      </div>
    </div>
  )
}
