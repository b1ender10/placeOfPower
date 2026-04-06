import { useEffect, useState } from 'react'
import { levelFromXp, xpProgressInLevel } from '../lib/stateLevel'

type Props = {
  onClose: () => void
  xpBefore: number
  xpGain: number
  xpAfter: number
}

export function LevelChangeModal({ onClose, xpBefore, xpGain, xpAfter }: Props) {
  const lvlFrom = levelFromXp(xpBefore)
  const lvlTo = levelFromXp(xpAfter)
  const [dispXp, setDispXp] = useState(xpBefore)
  const [dispGain, setDispGain] = useState(0)
  const [dispLvl, setDispLvl] = useState(lvlFrom)

  useEffect(() => {
    setDispXp(xpBefore)
    setDispGain(0)
    setDispLvl(lvlFrom)
    let cancelled = false
    const t0 = performance.now()
    const dur = 720
    const step = (t: number) => {
      if (cancelled) return
      const p = Math.min(1, (t - t0) / dur)
      const e = 1 - (1 - p) ** 3
      setDispXp(xpBefore + xpGain * e)
      setDispGain(xpGain * e)
      setDispLvl(Math.round(lvlFrom + (lvlTo - lvlFrom) * e))
      if (p >= 1) {
        setDispXp(xpAfter)
        setDispGain(xpGain)
        setDispLvl(lvlTo)
      }
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
    return () => {
      cancelled = true
    }
  }, [xpBefore, xpGain, xpAfter, lvlFrom, lvlTo])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const gainColor = xpGain >= 0 ? 'text-emerald-400' : 'text-rose-400'
  const prog = xpProgressInLevel(xpAfter)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
        aria-label="Закрыть"
      />
      <div
        className="modal-level-panel relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/35 bg-zinc-900 p-6 shadow-2xl shadow-black/50"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />
        <h2 className="text-center text-lg font-semibold text-zinc-100">Действие записано</h2>
        <p className="mt-1 text-center text-sm text-zinc-500">Изменение опыта и уровня</p>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-zinc-700/80 bg-zinc-950/50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Опыт (XP)</p>
            <p className="mt-1 font-mono text-2xl text-zinc-100">
              <span className="text-zinc-500">{xpBefore.toFixed(1)}</span>
              <span className="mx-2 text-zinc-600">→</span>
              <span>{dispXp.toFixed(1)}</span>
            </p>
            <p className={`mt-2 font-mono text-sm ${gainColor}`}>
              {xpGain >= 0 ? '+' : ''}
              {dispGain.toFixed(1)} XP
            </p>
          </div>

          <div className="rounded-xl border border-zinc-700/80 bg-zinc-950/50 px-4 py-4 text-center">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Уровень</p>
            <p
              className={`mt-1 text-5xl font-bold tabular-nums transition-colors duration-500 ${
                lvlTo > lvlFrom ? 'text-amber-400' : 'text-zinc-100'
              }`}
            >
              {dispLvl}
            </p>
            {lvlTo > lvlFrom && (
              <p className="mt-2 text-sm text-emerald-400/90">Новый уровень!</p>
            )}
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs text-zinc-500">
              <span>Прогресс до следующего уровня</span>
              <span>{prog.toFixed(1)} / 10</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-700 to-amber-400 transition-[width] duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, (prog / 10) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-zinc-950 hover:bg-amber-500"
        >
          Понятно
        </button>
      </div>
    </div>
  )
}
