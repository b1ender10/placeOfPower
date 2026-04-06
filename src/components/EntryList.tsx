import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { HappinessEntry } from '../store/types'
import { formatTime, timeToMinutes, timeToString, parseTime } from '../store/types'

interface Props {
  entries: HappinessEntry[]
  date: string
}

export function EntryList({ entries, date }: Props) {
  const { categories, updateEntry, removeEntry } = useStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [editComment, setEditComment] = useState('')
  const [editRating, setEditRating] = useState(5)
  const [editTime, setEditTime] = useState('')

  const getCategory = (id: string) => categories.find((c) => c.id === id)
  const getCategoryName = (id: string) => getCategory(id)?.name ?? id

  const startEdit = (e: HappinessEntry) => {
    setEditing(e.id)
    setEditComment(e.comment)
    setEditRating(e.rating)
    setEditTime(timeToString(e.hour, e.minute))
  }

  const saveEdit = () => {
    if (!editing) return
    const entry = entries.find((x) => x.id === editing)
    if (entry) {
      const { hour, minute } = parseTime(editTime)
      updateEntry({ ...entry, comment: editComment, rating: editRating, hour, minute })
    }
    setEditing(null)
  }

  const sorted = [...entries].sort(
    (a, b) => timeToMinutes(a.hour, a.minute) - timeToMinutes(b.hour, b.minute) || a.createdAt - b.createdAt
  )

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
      <h3 className="mb-3 text-sm font-medium text-zinc-400">Записи за {date}</h3>
      {sorted.length === 0 ? (
        <p className="text-zinc-500">Нет записей</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((e) => (
            <li key={e.id} className="flex items-start justify-between gap-2 rounded border border-zinc-700 bg-zinc-900/50 p-2">
              {editing === e.id ? (
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-zinc-400">Время</label>
                    <input
                      type="time"
                      value={editTime}
                      onChange={(ev) => setEditTime(ev.target.value)}
                      step="60"
                      className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-zinc-100"
                    />
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setEditRating(n)}
                        className={`h-6 w-6 rounded text-xs ${editRating === n ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-700 text-zinc-300'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <input
                    value={editComment}
                    onChange={(ev) => setEditComment(ev.target.value)}
                    className="w-full rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm text-zinc-100"
                  />
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
                  <div className="flex-1">
                    <span className="font-medium text-amber-500">{formatTime(e.hour, e.minute)}</span>
                    <span className="ml-2 text-zinc-400">— {e.rating}/10</span>
                    {(() => {
                      const cat = getCategory(e.category)
                      return (
                        <span
                          className={`ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${cat?.color ? '' : 'bg-zinc-700 text-zinc-300'}`}
                          style={cat?.color ? { backgroundColor: cat.color + '33', color: cat.color } : undefined}
                        >
                          {cat?.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                          {getCategoryName(e.category)}
                        </span>
                      )
                    })()}
                    {e.comment && <p className="mt-1 text-sm text-zinc-300">{e.comment}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(e)} className="text-zinc-400 hover:text-zinc-200">
                      Изменить
                    </button>
                    <button onClick={() => removeEntry(e.id)} className="text-red-400 hover:text-red-300">
                      Удалить
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
