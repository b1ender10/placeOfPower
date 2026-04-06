import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { AppLogo } from '../components/AppLogo'

const SECTIONS: { to: string; title: string; hint?: string; body: string }[] = [
  {
    to: '/day',
    title: 'День',
    body: 'Почасовые отметки настроения и заметки по категориям — картина дня и что тебя трогает.',
  },
  {
    to: '/stats',
    title: 'Статистика',
    body: 'Графики и сводка: как меняется счастье за неделю, месяц или за всё время.',
  },
  {
    to: '/categories',
    title: 'Категории',
    body: 'Темы активности (спорт, сон, работа…) — чтобы потом фильтровать записи и видеть закономерности.',
  },
  {
    to: '/thoughts',
    title: 'Мысли',
    body: 'Короткие заметки и оценка «силы» мысли — отдельный поток от дневных слотов.',
  },
  {
    to: '/states',
    title: 'КС / СС / ДС',
    hint: 'кратко-, средне-, долгосрочное состояние',
    body: 'Действия, которые двигают три горизонта состояния; опыт к уровню и прогрессу.',
  },
  {
    to: '/tasks',
    title: 'Задачи',
    body: 'Свои задачи с наградой в XP и честной оценкой выполнения (−100%…100%).',
  },
  {
    to: '/hypothesis',
    title: 'ГДА',
    hint: 'гипотеза — действие — анализ',
    body: 'Проверка гипотез: действия, опциональный разбор после каждого, итог при закрытии.',
  },
  {
    to: '/victory',
    title: 'Победы',
    body: 'Вечерний дневник побед: можно вести черновик днём и опубликовать, когда готов.',
  },
  {
    to: '/profile/versions',
    title: 'Версии',
    body: 'История версий приложения — что появилось в каждом обновлении (вкладка в профиле).',
  },
  {
    to: '/profile',
    title: 'Профиль',
    body: 'Имя, аватар, уровень, учитель, кейсы с персонажами — твоя игровая оболочка вокруг данных.',
  },
]

export function HomeView() {
  const recordInteraction = useStore((s) => s.recordSectionInteraction)

  return (
    <div className="space-y-10">
      <header className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-zinc-800/80 via-zinc-900/90 to-zinc-950 px-6 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
          <AppLogo size="lg" className="shrink-0 drop-shadow-lg" />
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              Место осознанности
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Приложение для мягкого отслеживания состояния, мыслей и действий — без геймификации ради одних
              только цифр. Здесь можно замечать день, проверять гипотезы, отмечать победы и копить опыт
              осознанно: как опору, а не как кнут.
            </p>
            <Link
              to="/day"
              onClick={() => recordInteraction('home')}
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-500 sm:inline-flex"
            >
              Перейти к дню
            </Link>
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-500">Разделы</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={() => recordInteraction('home')}
                className="group block h-full rounded-xl border border-zinc-700 bg-zinc-800/40 p-4 transition-colors hover:border-amber-500/40 hover:bg-zinc-800/70"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-amber-500/95 group-hover:text-amber-400">{item.title}</span>
                  <span className="text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500/80">
                    →
                  </span>
                </div>
                {item.hint && <p className="mt-0.5 text-xs text-zinc-600">{item.hint}</p>}
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
