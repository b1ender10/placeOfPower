import { useState } from 'react'
import { useStore } from '../store/useStore'
import { timeToString, parseTime } from '../store/types'

interface Props {
  defaultDate?: string
  defaultTime?: string
  onAdded?: () => void
}

export function AddEntryForm({ defaultDate, defaultTime, onAdded }: Props) {
  const { categories, addEntry } = useStore()
  const now = new Date()
  const defaultT = defaultTime ?? timeToString(now.getHours(), now.getMinutes())
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [date, setDate] = useState(defaultDate ?? today)
  const [time, setTime] = useState(defaultT)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [category, setCategory] = useState(categories[0]?.id ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!category.trim()) return
    const { hour, minute } = parseTime(time)
    addEntry({ date, hour, minute, rating, comment, category })
    setComment('')
    setRating(5)
    onAdded?.()
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
      <div className="mb-3 flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Дата
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Время
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            step="60"
            className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Категория
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-zinc-100"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mb-3">
        <span className="mb-1 block text-sm">Рейтинг (1–10)</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`h-8 w-8 rounded text-sm font-medium transition ${
                rating === n
                  ? 'bg-amber-500 text-zinc-900'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <label className="mb-1 block text-sm">Комментарий</label>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Почему такая оценка?"
          className="w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-amber-500 px-4 py-2 font-medium text-zinc-900 hover:bg-amber-400"
      >
        Добавить
      </button>
    </form>
  )
}
