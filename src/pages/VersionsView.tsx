import { APP_VERSION_HISTORY } from '../data/versions'

export function VersionsView() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Версии</h1>
        <p className="mt-1 text-sm text-zinc-400">
          История изменений приложения: дата релиза, номер версии и что нового.
        </p>
      </div>

      <ol className="space-y-6">
        {APP_VERSION_HISTORY.map((entry) => (
          <li
            key={`${entry.version}-${entry.date}`}
            className="relative rounded-xl border border-zinc-700 bg-zinc-800/50 p-5 pl-6 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-xl before:bg-amber-500/60"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-lg font-semibold text-amber-400">v{entry.version}</span>
              <time
                dateTime={entry.date}
                className="text-sm text-zinc-500"
              >
                {new Date(entry.date + 'T12:00:00').toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            </div>
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-zinc-300">
              {entry.changes.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <p className="text-xs text-zinc-600">
        Новые версии добавляются вручную в код:{' '}
        <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-400">src/data/versions.ts</code>
        <span className="text-zinc-600"> (или через репозиторий)</span>
      </p>
    </div>
  )
}
