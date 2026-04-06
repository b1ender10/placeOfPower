import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { formatDateTime, localDateFromTs } from '../store/types'
import { streakEndingOn } from '../lib/victoryStreak'

export function VictoryDiaryView() {
  const victoryEntries = useStore((s) => s.victoryEntries)
  const victoryDrafts = useStore((s) => s.victoryDrafts)
  const upsertVictoryEntry = useStore((s) => s.upsertVictoryEntry)
  const upsertVictoryDraft = useStore((s) => s.upsertVictoryDraft)
  const removeVictoryDraft = useStore((s) => s.removeVictoryDraft)
  const removeVictoryEntry = useStore((s) => s.removeVictoryEntry)

  const [date, setDate] = useState(() => localDateFromTs(Date.now()))
  const [text, setText] = useState('')

  const datesSet = useMemo(() => new Set(victoryEntries.map((e) => e.date)), [victoryEntries])

  const streakPreview = useMemo(() => {
    const next = new Set(datesSet)
    next.add(date)
    return streakEndingOn(date, next)
  }, [datesSet, date])

  const xpPreview = useMemo(() => Math.min(Math.max(0, streakPreview), 5), [streakPreview])

  const sorted = useMemo(
    () => [...victoryEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [victoryEntries],
  )

  const entryForDate = victoryEntries.find((e) => e.date === date)
  const draftForDate = victoryDrafts.find((d) => d.date === date)

  useEffect(() => {
    const v = victoryEntries.find((x) => x.date === date)
    const d = victoryDrafts.find((x) => x.date === date)
    if (d) setText(d.text)
    else setText(v?.text ?? '')
  }, [date, victoryEntries, victoryDrafts])

  function onPublish(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    upsertVictoryEntry(date, t)
  }

  function onSaveDraft(e: React.FormEvent) {
    e.preventDefault()
    upsertVictoryDraft(date, text)
  }

  function onDiscardDraft() {
    if (!draftForDate) return
    if (confirm('Сбросить черновик за этот день? Текст в поле станет как у опубликованной записи.')) {
      removeVictoryDraft(date)
      const v = victoryEntries.find((x) => x.date === date)
      setText(v?.text ?? '')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Дневник побед</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Черновик сохраняет текст без XP — в конце дня нажми «Опубликовать». XP за запись: стрик дней (макс. 5 XP
          при стрике ≥5).
        </p>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-zinc-800/40 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-zinc-400">Стрик</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: Math.min(streakPreview, 7) }).map((_, i) => (
              <span key={i} className="text-lg" title={`${streakPreview} дн.`}>
                🔥
              </span>
            ))}
          </div>
          <span className="text-sm font-medium text-amber-400">{streakPreview} дн.</span>
          <span className="text-xs text-zinc-500">
            → +{xpPreview} XP к уровню{entryForDate ? ' (пересчёт при публикации)' : ''}
          </span>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-zinc-300">Запись за день</h2>
          {draftForDate && (
            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
              Черновик · обновлён {formatDateTime(draftForDate.updatedAt)}
            </span>
          )}
        </div>
        <label className="block text-sm">
          <span className="text-zinc-400">Дата</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full max-w-xs rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-zinc-100"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Где стал лучше (пункты)</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Кратко: привычки, мысли, действия…"
            className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-zinc-100"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSaveDraft}
            className="rounded border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
          >
            Сохранить черновик
          </button>
          <button
            type="button"
            onClick={onPublish}
            className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500"
          >
            Опубликовать
          </button>
          {draftForDate && (
            <button
              type="button"
              onClick={onDiscardDraft}
              className="rounded px-3 py-2 text-sm text-zinc-500 hover:text-rose-400"
            >
              Сбросить черновик
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-600">
          Черновик не даёт XP. «Опубликовать» — вносит день в историю и начисляет XP по стрику (пустой текст не
          сохранится).
        </p>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">История</h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-500">Пока пусто.</p>
        ) : (
          <ul className="space-y-4">
            {sorted.map((e) => (
              <li key={e.id} className="border-b border-zinc-700/80 pb-4 last:border-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-amber-500/90">{e.date}</span>
                  <span className="text-xs text-zinc-500">+{e.xpAwarded} XP</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{e.text}</p>
                <button
                  type="button"
                  onClick={() => removeVictoryEntry(e.id)}
                  className="mt-2 text-xs text-rose-400 hover:text-rose-300"
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
