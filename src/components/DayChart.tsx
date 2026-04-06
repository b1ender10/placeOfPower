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
import type { ChartData, ChartOptions } from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { HappinessEntry } from '../store/types'
import { formatTime, timeToMinutes } from '../store/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface Props {
  entries: HappinessEntry[]
  date: string
  getCategoryName: (id: string) => string
}

export function DayChart({ entries, date, getCategoryName }: Props) {
  const sorted = [...entries].sort(
    (a, b) => timeToMinutes(a.hour, a.minute) - timeToMinutes(b.hour, b.minute) || a.createdAt - b.createdAt
  )

  if (sorted.length === 0) {
    return (
      <div className="flex h-56 min-h-[200px] items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <p className="text-zinc-500">Нет записей за {date}</p>
      </div>
    )
  }

  const data: ChartData<'line', { x: number; y: number }[]> = {
    datasets: [
      {
        label: 'Рейтинг',
        data: sorted.map((e) => ({ x: timeToMinutes(e.hour, e.minute), y: e.rating })),
        parsing: false as const,
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        fill: true,
        tension: 0.3,
        spanGaps: false,
        borderWidth: 2,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        min: 0,
        max: 1440,
        ticks: {
          stepSize: 60,
          callback: (v) => formatTime(Math.floor(Number(v) / 60), Number(v) % 60),
        },
      },
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
          label: (ctx) => {
            const e = sorted[ctx.dataIndex]
            return e ? `${formatTime(e.hour, e.minute)} — ${e.rating}/10` : ''
          },
          afterBody: (items) => {
            const idx = items[0]?.dataIndex
            if (idx == null) return []
            const e = sorted[idx]
            return e ? [`• ${getCategoryName(e.category)}`] : []
          },
        },
      },
    },
  }

  return (
    <div className="min-w-0 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
      <h3 className="mb-2 text-sm font-medium text-zinc-400">График за {date}</h3>
      <div className="h-56 min-h-[200px] w-full">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
