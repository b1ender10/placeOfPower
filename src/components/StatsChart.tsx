import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { HappinessEntry, Category, StatsPeriod } from '../store/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface Props {
  entries: HappinessEntry[]
  categories: Category[]
  period: StatsPeriod
}

function aggregateByDay(entries: HappinessEntry[]): { date: string; avg: number; count: number }[] {
  const byDate = new Map<string, number[]>()
  for (const e of entries) {
    const arr = byDate.get(e.date) ?? []
    arr.push(e.rating)
    byDate.set(e.date, arr)
  }
  return Array.from(byDate.entries())
    .map(([date, ratings]) => ({
      date,
      avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
      count: ratings.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function StatsChart({ entries, categories, period }: Props) {
  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name ?? id
  const aggregated = aggregateByDay(entries)

  const now = new Date()
  let filtered = aggregated
  let labels: string[]
  let dataPoints: number[]

  if (period === 'week') {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().slice(0, 10)
    filtered = aggregated.filter((x) => x.date >= weekAgoStr)
    labels = filtered.map((x) => new Date(x.date + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }))
    dataPoints = filtered.map((x) => x.avg)
  } else if (period === 'month') {
    const monthAgo = new Date(now)
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const monthAgoStr = monthAgo.toISOString().slice(0, 10)
    filtered = aggregated.filter((x) => x.date >= monthAgoStr)
    labels = filtered.map((x) => new Date(x.date + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }))
    dataPoints = filtered.map((x) => x.avg)
  } else {
    const byMonth = new Map<string, number[]>()
    for (const x of aggregated) {
      const month = x.date.slice(0, 7)
      const arr = byMonth.get(month) ?? []
      arr.push(x.avg)
      byMonth.set(month, arr)
    }
    labels = Array.from(byMonth.keys()).sort().map((m) => {
      const [y, mo] = m.split('-')
      return new Date(Number(y), Number(mo) - 1).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })
    })
    dataPoints = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, arr]) => arr.reduce((a, b) => a + b, 0) / arr.length)
  }

  const labelToEntries = (() => {
    const map = new Map<number, HappinessEntry[]>()
    if (period === 'week' || period === 'month') {
      filtered.forEach((f, i) => {
        map.set(i, entries.filter((e) => e.date === f.date))
      })
    } else {
      const byMonth = new Map<string, HappinessEntry[]>()
      for (const e of entries) {
        const m = e.date.slice(0, 7)
        const arr = byMonth.get(m) ?? []
        arr.push(e)
        byMonth.set(m, arr)
      }
      const months = Array.from(byMonth.keys()).sort()
      months.forEach((m, i) => map.set(i, byMonth.get(m) ?? []))
    }
    return map
  })()

  const data = {
    labels,
    datasets: [
      {
        label: 'Средний рейтинг',
        data: dataPoints,
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        fill: true,
        tension: 0.3,
        spanGaps: true,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 10,
        ticks: { stepSize: 1 },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterBody: (items: { dataIndex: number }[]) => {
            const idx = items[0]?.dataIndex
            if (idx == null) return []
            const dayEntries = labelToEntries.get(idx) ?? []
            if (!dayEntries.length) return []
            return dayEntries.map((e) => `• ${getCatName(e.category)}`)
          },
        },
      },
    },
  }

  const overallAvg = entries.length
    ? entries.reduce((s, e) => s + e.rating, 0) / entries.length
    : 0

  const categoryStats = (() => {
    const byCat = new Map<string, number[]>()
    for (const e of entries) {
      const arr = byCat.get(e.category) ?? []
      arr.push(e.rating)
      byCat.set(e.category, arr)
    }
    return Array.from(byCat.entries())
      .map(([cat, ratings]) => ({
        category: cat,
        avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
        count: ratings.length,
      }))
      .sort((a, b) => b.count - a.count)
  })()

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <p className="text-sm text-zinc-400">Средний рейтинг за период</p>
        <p className="text-2xl font-bold text-amber-500">{overallAvg.toFixed(1)}</p>
      </div>
      <div className="h-64 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="h-48">
          <Line data={data} options={options} />
        </div>
      </div>
      {categoryStats.length > 0 && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <h3 className="mb-3 text-sm font-medium text-zinc-400">По категориям</h3>
          <ul className="space-y-2">
            {categoryStats.map(({ category, avg, count }) => (
              <li key={category} className="flex justify-between text-sm">
                <span className="text-zinc-300">{getCatName(category)}</span>
                <span className="text-amber-500">{avg.toFixed(1)} ({count})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
