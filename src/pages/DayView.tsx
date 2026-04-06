import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { AddEntryForm } from '../components/AddEntryForm'
import { DayChart } from '../components/DayChart'
import { EntryList } from '../components/EntryList'

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(d: string) {
  const date = new Date(d + 'T12:00:00')
  return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function DayView() {
  const { entries, categories, load } = useStore()
  const [date, setDate] = useState(today)

  useEffect(() => {
    load()
  }, [load])

  const dayEntries = entries.filter((e) => e.date === date)

  const changeDay = (delta: number) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setDate(d.toISOString().slice(0, 10))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">День</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDay(-1)}
            className="rounded border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-zinc-200 hover:bg-zinc-700"
          >
            ←
          </button>
          <span className="min-w-[140px] text-center font-medium text-zinc-200">{formatDate(date)}</span>
          <button
            onClick={() => changeDay(1)}
            className="rounded border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-zinc-200 hover:bg-zinc-700"
          >
            →
          </button>
        </div>
      </div>

      <DayChart
        entries={dayEntries}
        date={formatDate(date)}
        getCategoryName={(id) => categories.find((c) => c.id === id)?.name ?? id}
      />
      <AddEntryForm defaultDate={date} />
      <EntryList entries={dayEntries} date={formatDate(date)} />
    </div>
  )
}
