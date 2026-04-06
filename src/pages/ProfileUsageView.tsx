import { useStore } from '../store/useStore'
import { SECTION_IDS, SECTION_LABELS } from '../lib/sectionTelemetry'

export function ProfileUsageView() {
  const sectionStats = useStore((s) => s.sectionStats)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Статистика разделов</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Заходы — сколько раз открывал раздел. Взаимодействия — сохранения, отметки, любые действия с данными в
          разделе.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-700">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-800/80">
              <th className="px-4 py-3 font-medium text-zinc-300">Раздел</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Заходы</th>
              <th className="px-4 py-3 font-medium text-zinc-300">Взаимодействия</th>
            </tr>
          </thead>
          <tbody>
            {SECTION_IDS.map((id) => {
              const st = sectionStats[id] ?? { visits: 0, interactions: 0 }
              return (
                <tr key={id} className="border-b border-zinc-800/80 last:border-0">
                  <td className="px-4 py-2.5 text-zinc-200">{SECTION_LABELS[id]}</td>
                  <td className="px-4 py-2.5 font-mono text-zinc-400">{st.visits}</td>
                  <td className="px-4 py-2.5 font-mono text-zinc-400">{st.interactions}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
