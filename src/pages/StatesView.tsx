import { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { useStore } from '../store/useStore'
import type { StateAction } from '../store/types'
import { formatDateTime } from '../store/types'
import { xpFromDeltas } from '../lib/stateLevel'
import { LevelChangeModal } from '../components/LevelChangeModal'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type Axis = 'deltaKs' | 'deltaSs' | 'deltaDs'

function sumState(actions: StateAction[]) {
  return actions.reduce(
    (s, a) => ({
      ks: s.ks + a.deltaKs,
      ss: s.ss + a.deltaSs,
      ds: s.ds + a.deltaDs,
    }),
    { ks: 0, ss: 0, ds: 0 },
  )
}

function topsForAxis(actions: StateAction[], key: Axis, mode: 'pos' | 'neg') {
  const map = new Map<string, number>()
  for (const a of actions) {
    const d = a[key]
    if (mode === 'pos' && d <= 0) continue
    if (mode === 'neg' && d >= 0) continue
    map.set(a.category, (map.get(a.category) ?? 0) + d)
  }
  const rows = [...map.entries()].map(([category, sum]) => ({ category, sum }))
  rows.sort((a, b) => (mode === 'pos' ? b.sum - a.sum : a.sum - b.sum))
  return rows.slice(0, 5)
}

const AXIS_LABELS: Record<Axis, string> = {
  deltaKs: 'КС',
  deltaSs: 'СС',
  deltaDs: 'ДС',
}

type Sign = 1 | -1

function AxisControl({
  label,
  mag,
  sign,
  onMag,
  onSign,
}: {
  label: string
  mag: number
  sign: Sign
  onMag: (v: number) => void
  onSign: (s: Sign) => void
}) {
  const delta = sign * mag
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <span
          className={`font-mono text-lg tabular-nums ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
        >
          {delta >= 0 ? '+' : ''}
          {delta}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={mag}
        onChange={(e) => onMag(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-amber-500"
      />
      <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
        <span>0</span>
        <span>10</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSign(1)}
          className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
            sign === 1 ? 'bg-emerald-600 text-white shadow-inner' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => onSign(-1)}
          className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
            sign === -1 ? 'bg-rose-600 text-white shadow-inner' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          −
        </button>
      </div>
    </div>
  )
}

export function StatesView() {
  const categories = useStore((s) => s.categories)
  const stateActions = useStore((s) => s.stateActions)
  const addStateAction = useStore((s) => s.addStateAction)
  const removeStateAction = useStore((s) => s.removeStateAction)

  const [categoryId, setCategoryId] = useState('')
  const [magKs, setMagKs] = useState(0)
  const [signKs, setSignKs] = useState<Sign>(1)
  const [magSs, setMagSs] = useState(0)
  const [signSs, setSignSs] = useState<Sign>(1)
  const [magDs, setMagDs] = useState(0)
  const [signDs, setSignDs] = useState<Sign>(1)
  const [reason, setReason] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalXp, setModalXp] = useState({ before: 0, gain: 0, after: 0 })

  const totals = useMemo(() => sumState(stateActions), [stateActions])
  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name ?? id

  const chartData = {
    labels: ['КС', 'СС', 'ДС'],
    datasets: [
      {
        label: 'Текущее состояние',
        data: [totals.ks, totals.ss, totals.ds],
        backgroundColor: ['rgba(34, 211, 238, 0.65)', 'rgba(168, 85, 247, 0.65)', 'rgba(251, 191, 36, 0.65)'],
        borderColor: ['rgb(34, 211, 238)', 'rgb(168, 85, 247)', 'rgb(251, 191, 36)'],
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        ticks: { color: '#a1a1aa' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#a1a1aa' },
      },
    },
  } as const

  const recent = useMemo(
    () => [...stateActions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 30),
    [stateActions],
  )

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId.trim()) return
    const deltaKs = signKs * magKs
    const deltaSs = signSs * magSs
    const deltaDs = signDs * magDs
    if (deltaKs === 0 && deltaSs === 0 && deltaDs === 0) return

    const xpBefore = useStore.getState().profile.levelXp
    const xpGain = xpFromDeltas(deltaKs, deltaSs, deltaDs)
    const xpAfter = xpBefore + xpGain

    addStateAction({
      category: categoryId,
      deltaKs,
      deltaSs,
      deltaDs,
      reason: reason.trim(),
    })
    setModalXp({ before: xpBefore, gain: xpGain, after: xpAfter })
    setModalOpen(true)

    setMagKs(0)
    setMagSs(0)
    setMagDs(0)
    setSignKs(1)
    setSignSs(1)
    setSignDs(1)
    setReason('')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Состояния</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Краткосрочное (КС), среднесрочное (СС), долгосрочное (ДС). Старт с нуля, потолка нет.
        </p>
      </div>

      <div className="h-56 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <h2 className="text-sm font-medium text-zinc-300">Добавить действие</h2>
        <p className="text-xs text-zinc-500">По каждой оси: шкала 0–10 и знак + или −.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-zinc-400">Категория</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-zinc-100"
              required
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <AxisControl label="КС (краткосрочное)" mag={magKs} sign={signKs} onMag={setMagKs} onSign={setSignKs} />
          <AxisControl label="СС (среднесрочное)" mag={magSs} sign={signSs} onMag={setMagSs} onSign={setSignSs} />
          <AxisControl label="ДС (долгосрочное)" mag={magDs} sign={signDs} onMag={setMagDs} onSign={setSignDs} />
        </div>
        <label className="block text-sm">
          <span className="text-zinc-400">Почему (кратко)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-zinc-100"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-500"
        >
          Записать
        </button>
      </form>

      {modalOpen && (
        <LevelChangeModal
          onClose={() => setModalOpen(false)}
          xpBefore={modalXp.before}
          xpGain={modalXp.gain}
          xpAfter={modalXp.after}
        />
      )}

      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Топы по категориям</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {(['deltaKs', 'deltaSs', 'deltaDs'] as const).map((axis) => {
            const pos = topsForAxis(stateActions, axis, 'pos')
            const neg = topsForAxis(stateActions, axis, 'neg')
            return (
              <div key={axis}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-500/90">
                  {AXIS_LABELS[axis]}
                </p>
                <p className="text-xs text-zinc-500">Больше всего прибавили</p>
                <ul className="mb-3 mt-1 space-y-1 text-sm">
                  {pos.length === 0 && <li className="text-zinc-500">—</li>}
                  {pos.map(({ category, sum }) => (
                    <li key={`${axis}-p-${category}`} className="flex justify-between gap-2">
                      <span className="truncate text-zinc-300">{getCatName(category)}</span>
                      <span className="text-emerald-400">+{sum}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-zinc-500">Больше всего убавили</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {neg.length === 0 && <li className="text-zinc-500">—</li>}
                  {neg.map(({ category, sum }) => (
                    <li key={`${axis}-n-${category}`} className="flex justify-between gap-2">
                      <span className="truncate text-zinc-300">{getCatName(category)}</span>
                      <span className="text-rose-400">{sum}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {recent.length > 0 && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Последние действия</h2>
          <ul className="space-y-3 text-sm">
            {recent.map((a) => (
              <li key={a.id} className="flex flex-col gap-1 border-b border-zinc-700/80 pb-3 last:border-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-zinc-200">{getCatName(a.category)}</span>
                  <span className="text-xs text-zinc-500">{formatDateTime(a.createdAt)}</span>
                </div>
                <p className="text-xs text-zinc-400">
                  КС {a.deltaKs > 0 ? '+' : ''}
                  {a.deltaKs} · СС {a.deltaSs > 0 ? '+' : ''}
                  {a.deltaSs} · ДС {a.deltaDs > 0 ? '+' : ''}
                  {a.deltaDs}
                </p>
                {a.reason && <p className="text-zinc-300">{a.reason}</p>}
                <button
                  type="button"
                  onClick={() => removeStateAction(a.id)}
                  className="self-start text-xs text-rose-400 hover:text-rose-300"
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
