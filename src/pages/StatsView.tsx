import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { StatsChart } from '../components/StatsChart'
import type { StatsPeriod } from '../store/types'

const PERIODS: { id: StatsPeriod; label: string }[] = [
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'all', label: 'Всё время' },
]

export function StatsView() {
  const { entries, categories, load } = useStore()
  const recordInteraction = useStore((s) => s.recordSectionInteraction)
  const [period, setPeriod] = useState<StatsPeriod>('week')

  useEffect(() => {
    load()
  }, [load])

  let filtered = entries
  if (period === 'week') {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const str = weekAgo.toISOString().slice(0, 10)
    filtered = entries.filter((e) => e.date >= str)
  } else if (period === 'month') {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const str = monthAgo.toISOString().slice(0, 10)
    filtered = entries.filter((e) => e.date >= str)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100">Статистика</h1>
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPeriod(p.id)
              recordInteraction('stats')
            }}
            className={`rounded px-4 py-2 text-sm font-medium transition ${
              period === p.id ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <StatsChart entries={filtered} categories={categories} period={period} />
    </div>
  )
}
