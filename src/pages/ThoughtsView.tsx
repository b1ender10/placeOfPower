import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useStore } from '../store/useStore'
import type { ThoughtNote } from '../store/types'
import { localDateFromTs, localDateTimeToMs, formatDateTime } from '../store/types'

const TOP_PREVIEW = 5

type TopModalKind = 'rating_high' | 'rating_low' | 'delta_up' | 'delta_down' | null

function ratingTrendMap(thoughts: ThoughtNote[]): Map<string, 'up' | 'down' | 'same'> {
  const sorted = [...thoughts].sort((a, b) => a.createdAt - b.createdAt)
  const map = new Map<string, 'up' | 'down' | 'same'>()
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i]
    const prev = sorted[i - 1]
    if (cur.rating > prev.rating) map.set(cur.id, 'up')
    else if (cur.rating < prev.rating) map.set(cur.id, 'down')
    else map.set(cur.id, 'same')
  }
  return map
}

function TrendMarker({ trend }: { trend?: 'up' | 'down' | 'same' }) {
  if (!trend) return null
  if (trend === 'up') return <span className="ml-1 text-emerald-400" title="Выше предыдущей мысли">↑</span>
  if (trend === 'down') return <span className="ml-1 text-rose-400" title="Ниже предыдущей мысли">↓</span>
  return <span className="ml-1 text-zinc-500" title="Как у предыдущей мысли">→</span>
}

type ThoughtWithDelta = {
  thought: ThoughtNote
  delta: number
  prevRating: number
}

function thoughtsWithDeltas(thoughts: ThoughtNote[]): ThoughtWithDelta[] {
  const sorted = [...thoughts].sort((a, b) => a.createdAt - b.createdAt)
  const out: ThoughtWithDelta[] = []
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i]
    const prev = sorted[i - 1]
    out.push({ thought: cur, delta: cur.rating - prev.rating, prevRating: prev.rating })
  }
  return out
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nowTimeStr(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function ThoughtsView() {
  const { thoughts, load, addThought, removeThought, updateThought } = useStore()
  const [text, setText] = useState('')
  const [rating, setRating] = useState(10)
  const [date, setDate] = useState(() => todayStr())
  const [time, setTime] = useState(() => nowTimeStr())
  const [editing, setEditing] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editRating, setEditRating] = useState(10)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [topModal, setTopModal] = useState<TopModalKind>(null)

  useEffect(() => {
    load()
  }, [load])

  const today = todayStr()
  const todayThoughts = useMemo(
    () => thoughts.filter((t) => localDateFromTs(t.createdAt) === today).sort((a, b) => b.createdAt - a.createdAt),
    [thoughts, today]
  )

  const topPositiveFull = useMemo(() => [...thoughts].sort((a, b) => b.rating - a.rating), [thoughts])
  const topNegativeFull = useMemo(() => [...thoughts].sort((a, b) => a.rating - b.rating), [thoughts])

  const deltas = useMemo(() => thoughtsWithDeltas(thoughts), [thoughts])
  const topImproveFull = useMemo(
    () => deltas.filter((d) => d.delta > 0).sort((a, b) => b.delta - a.delta),
    [deltas]
  )
  const topWorseFull = useMemo(
    () => deltas.filter((d) => d.delta < 0).sort((a, b) => a.delta - b.delta),
    [deltas]
  )

  const trends = useMemo(() => ratingTrendMap(thoughts), [thoughts])

  /** Последняя по времени мысль = «текущее настроение»; prev — предыдущая в хронологии */
  const currentMood = useMemo(() => {
    if (thoughts.length === 0) return null
    const sorted = [...thoughts].sort(
      (a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)
    )
    const latest = sorted[sorted.length - 1]
    const prevRating = sorted.length >= 2 ? sorted[sorted.length - 2].rating : null
    return { current: latest.rating, prevRating }
  }, [thoughts])

  const favoriteThoughts = useMemo(
    () => thoughts.filter((t) => t.favorite).sort((a, b) => b.createdAt - a.createdAt),
    [thoughts]
  )

  const toggleFavorite = (t: ThoughtNote) => {
    updateThought({ ...t, favorite: !t.favorite })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    const createdAt = localDateTimeToMs(date, time)
    addThought({ text: t, rating, createdAt })
    setText('')
    setRating(10)
    setDate(todayStr())
    setTime(nowTimeStr())
  }

  const startEdit = (t: ThoughtNote) => {
    setEditing(t.id)
    setEditText(t.text)
    setEditRating(t.rating)
    setEditDate(localDateFromTs(t.createdAt))
    const d = new Date(t.createdAt)
    setEditTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
  }

  const saveEdit = () => {
    if (!editing) return
    const t = thoughts.find((x) => x.id === editing)
    if (t && editText.trim()) {
      updateThought({
        ...t,
        text: editText.trim(),
        rating: editRating,
        createdAt: localDateTimeToMs(editDate, editTime),
      })
    }
    setEditing(null)
  }

  const modalTitles: Record<Exclude<TopModalKind, null>, string> = {
    rating_high: 'Топ по оценке (высокие)',
    rating_low: 'Топ по оценке (низкие)',
    delta_up: 'Сильнее всего улучшили настроение',
    delta_down: 'Сильнее всего ухудшили настроение',
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-zinc-100">Мысли</h1>
        <div className="mx-auto mt-4 flex max-w-md flex-col items-center rounded-xl border border-zinc-700/80 bg-zinc-800/60 px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Текущее настроение</p>
          {currentMood ? (
            <>
              <p className="mt-1 flex items-baseline justify-center gap-0.5 tabular-nums">
                <span className="text-4xl font-semibold text-amber-400">{currentMood.current}</span>
                <span className="text-xl text-zinc-500">/20</span>
              </p>
              {currentMood.prevRating !== null && (
                <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                  <span>было {currentMood.prevRating}</span>
                  {currentMood.current > currentMood.prevRating && (
                    <span className="text-emerald-400" title="Выше прошлого">
                      ↑
                    </span>
                  )}
                  {currentMood.current < currentMood.prevRating && (
                    <span className="text-rose-400" title="Ниже прошлого">
                      ↓
                    </span>
                  )}
                  {currentMood.current === currentMood.prevRating && (
                    <span className="text-zinc-500" title="Без изменений">
                      →
                    </span>
                  )}
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">Добавь первую мысль</p>
          )}
        </div>
      </div>

      <form onSubmit={submit} className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <label className="mb-2 block text-sm text-zinc-400">Мысль</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Запиши мысль…"
          rows={3}
          className="mb-3 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500"
        />
        <div className="mb-3 flex flex-wrap gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-400">Дата</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-400">Время</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              step="60"
              className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-zinc-100"
            />
          </label>
        </div>
        <div className="mb-3">
          <span className="mb-1 block text-sm text-zinc-400">Счастье (1–20)</span>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`h-6 min-w-[1.75rem] rounded px-1 text-xs font-medium ${
                  rating === n ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="rounded bg-amber-500 px-4 py-2 font-medium text-zinc-900 hover:bg-amber-400">
          Добавить
        </button>
      </form>

      <section>
        <h2 className="mb-3 text-sm font-medium text-amber-400/90">Избранное</h2>
        {favoriteThoughts.length === 0 ? (
          <p className="text-zinc-500">Нет избранных — нажми ☆ у мысли</p>
        ) : (
          <ul className="space-y-2">
            {favoriteThoughts.map((t) => (
              <li key={t.id} className="rounded border border-amber-900/40 bg-zinc-800/50 p-3">
                <p className="text-xs text-zinc-500">{formatDateTime(t.createdAt)}</p>
                <p className="text-zinc-200">{t.text}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center text-sm text-amber-500">
                    {t.rating}/20
                    <TrendMarker trend={trends.get(t.id)} />
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(t)}
                      className="text-lg text-amber-400 hover:text-amber-300"
                      title="Убрать из избранного"
                      aria-label="Убрать из избранного"
                    >
                      ★
                    </button>
                    <button type="button" onClick={() => startEdit(t)} className="text-sm text-zinc-400 hover:text-zinc-200">
                      Изменить
                    </button>
                    <button type="button" onClick={() => removeThought(t.id)} className="text-sm text-red-400 hover:text-red-300">
                      Удалить
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-400">Сегодня</h2>
        {todayThoughts.length === 0 ? (
          <p className="text-zinc-500">Пока нет записей за сегодня</p>
        ) : (
          <ul className="space-y-2">
            {todayThoughts.map((t) => (
              <li key={t.id} className="rounded border border-zinc-700 bg-zinc-800/50 p-3">
                {editing === t.id ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
                      />
                      <input
                        type="time"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        step="60"
                        className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
                      />
                    </div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      className="w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
                    />
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setEditRating(n)}
                          className={`h-5 min-w-6 rounded px-1 text-xs ${editRating === n ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-700'}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={saveEdit} className="text-amber-500 hover:underline">
                        Сохранить
                      </button>
                      <button type="button" onClick={() => setEditing(null)} className="text-zinc-400 hover:underline">
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-zinc-500">{formatDateTime(t.createdAt)}</p>
                    <p className="text-zinc-200">{t.text}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center text-sm text-amber-500">
                        {t.rating}/20
                        <TrendMarker trend={trends.get(t.id)} />
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(t)}
                          className={`text-lg ${t.favorite ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                          title={t.favorite ? 'Убрать из избранного' : 'В избранное'}
                          aria-label={t.favorite ? 'Убрать из избранного' : 'В избранное'}
                        >
                          {t.favorite ? '★' : '☆'}
                        </button>
                        <button type="button" onClick={() => startEdit(t)} className="text-sm text-zinc-400 hover:text-zinc-200">
                          Изменить
                        </button>
                        <button type="button" onClick={() => removeThought(t.id)} className="text-sm text-red-400 hover:text-red-300">
                          Удалить
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <TopBlock
          title="Топ по оценке (высокие)"
          empty={topPositiveFull.length === 0}
          totalCount={topPositiveFull.length}
          preview={topPositiveFull.slice(0, TOP_PREVIEW)}
          onExpand={() => setTopModal('rating_high')}
          getKey={(t) => t.id}
          renderItem={(t) => (
            <>
              <span className="inline-flex items-center text-emerald-400">
                {t.rating}/20
                <TrendMarker trend={trends.get(t.id)} />
              </span>{' '}
              — {t.text}
            </>
          )}
        />
        <TopBlock
          title="Топ по оценке (низкие)"
          empty={topNegativeFull.length === 0}
          totalCount={topNegativeFull.length}
          preview={topNegativeFull.slice(0, TOP_PREVIEW)}
          onExpand={() => setTopModal('rating_low')}
          getKey={(t) => t.id}
          renderItem={(t) => (
            <>
              <span className="inline-flex items-center text-rose-400">
                {t.rating}/20
                <TrendMarker trend={trends.get(t.id)} />
              </span>{' '}
              — {t.text}
            </>
          )}
        />
        <TopBlock
          title="Сильнее всего улучшили настроение"
          empty={topImproveFull.length === 0}
          totalCount={topImproveFull.length}
          preview={topImproveFull.slice(0, TOP_PREVIEW)}
          onExpand={() => setTopModal('delta_up')}
          getKey={(d) => d.thought.id}
          renderItem={(d) => (
            <>
              <span className="text-emerald-400">
                +{d.delta} ({d.prevRating}→{d.thought.rating})
              </span>{' '}
              — {d.thought.text}
            </>
          )}
        />
        <TopBlock
          title="Сильнее всего ухудшили настроение"
          empty={topWorseFull.length === 0}
          totalCount={topWorseFull.length}
          preview={topWorseFull.slice(0, TOP_PREVIEW)}
          onExpand={() => setTopModal('delta_down')}
          getKey={(d) => d.thought.id}
          renderItem={(d) => (
            <>
              <span className="text-rose-400">
                {d.delta} ({d.prevRating}→{d.thought.rating})
              </span>{' '}
              — {d.thought.text}
            </>
          )}
        />
      </div>

      {topModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setTopModal(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-zinc-600 bg-zinc-900 p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-zinc-100">{modalTitles[topModal]}</h3>
              <button
                type="button"
                onClick={() => setTopModal(null)}
                className="rounded px-2 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-zinc-300">
              {topModal === 'rating_high' &&
                topPositiveFull.map((t) => (
                  <li key={t.id}>
                    <span className="inline-flex items-center text-emerald-400">
                      {t.rating}/20
                      <TrendMarker trend={trends.get(t.id)} />
                    </span>{' '}
                    — {t.text}
                  </li>
                ))}
              {topModal === 'rating_low' &&
                topNegativeFull.map((t) => (
                  <li key={t.id}>
                    <span className="inline-flex items-center text-rose-400">
                      {t.rating}/20
                      <TrendMarker trend={trends.get(t.id)} />
                    </span>{' '}
                    — {t.text}
                  </li>
                ))}
              {topModal === 'delta_up' &&
                topImproveFull.map((d) => (
                  <li key={d.thought.id}>
                    <span className="text-emerald-400">
                      +{d.delta} ({d.prevRating}→{d.thought.rating})
                    </span>{' '}
                    — {d.thought.text}
                  </li>
                ))}
              {topModal === 'delta_down' &&
                topWorseFull.map((d) => (
                  <li key={d.thought.id}>
                    <span className="text-rose-400">
                      {d.delta} ({d.prevRating}→{d.thought.rating})
                    </span>{' '}
                    — {d.thought.text}
                  </li>
                ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

function TopBlock<T>({
  title,
  empty,
  totalCount,
  preview,
  onExpand,
  getKey,
  renderItem,
}: {
  title: string
  empty: boolean
  totalCount: number
  preview: T[]
  onExpand: () => void
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
}) {
  const hasMore = totalCount > TOP_PREVIEW
  return (
    <section className="flex flex-col">
      <h2 className="mb-2 text-sm font-medium text-zinc-300">{title}</h2>
      {empty ? (
        <p className="text-zinc-500">Нет записей</p>
      ) : (
        <>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-300">
            {preview.map((item) => (
              <li key={getKey(item)}>{renderItem(item)}</li>
            ))}
          </ol>
          {hasMore && (
            <button type="button" onClick={onExpand} className="mt-3 text-left text-sm text-amber-500 hover:underline">
              Развернуть топ
            </button>
          )}
        </>
      )}
    </section>
  )
}
