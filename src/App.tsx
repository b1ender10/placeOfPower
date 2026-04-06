import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Link, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { HomeView } from './pages/HomeView'
import { DayView } from './pages/DayView'
import { StatsView } from './pages/StatsView'
import { CategoriesView } from './pages/CategoriesView'
import { ThoughtsView } from './pages/ThoughtsView'
import { StatesView } from './pages/StatesView'
import { ProfileLayout } from './pages/ProfileLayout'
import { ProfileMain } from './pages/ProfileMain'
import { ProfileUsageView } from './pages/ProfileUsageView'
import { VictoryDiaryView } from './pages/VictoryDiaryView'
import { TasksView } from './pages/TasksView'
import { HypothesisView } from './pages/HypothesisView'
import { VersionsView } from './pages/VersionsView'
import { HeaderProfile } from './components/HeaderProfile'
import { LevelUpFlowHost } from './components/LevelUpFlowHost'
import { AppLogo } from './components/AppLogo'
import { RouteVisitTracker } from './components/RouteVisitTracker'

function Nav() {
  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-700 pb-4">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `font-medium ${isActive ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`
        }
      >
        Главная
      </NavLink>
      <NavLink
        to="/day"
        className={({ isActive }) =>
          `font-medium ${isActive ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`
        }
      >
        День
      </NavLink>
      <NavLink
        to="/stats"
        className={({ isActive }) =>
          `font-medium ${isActive ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`
        }
      >
        Статистика
      </NavLink>
      <NavLink
        to="/categories"
        className={({ isActive }) =>
          `font-medium ${isActive ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`
        }
      >
        Категории
      </NavLink>
      <NavLink
        to="/thoughts"
        className={({ isActive }) =>
          `font-medium ${isActive ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`
        }
      >
        Мысли
      </NavLink>
      <NavLink
        to="/states"
        className={({ isActive }) =>
          `font-medium ${isActive ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`
        }
      >
        КС / СС / ДС
      </NavLink>
      <NavLink
        to="/tasks"
        className={({ isActive }) =>
          `font-medium ${isActive ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`
        }
      >
        Задачи
      </NavLink>
      <NavLink
        to="/hypothesis"
        className={({ isActive }) =>
          `font-medium ${isActive ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`
        }
      >
        ГДА
      </NavLink>
      <NavLink
        to="/victory"
        className={({ isActive }) =>
          `font-medium ${isActive ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-200'}`
        }
      >
        Победы
      </NavLink>
    </nav>
  )
}

export default function App() {
  const load = useStore((s) => s.load)

  useEffect(() => {
    void load().catch(console.error)
  }, [load])

  return (
    <BrowserRouter>
      <RouteVisitTracker />
      <div className="min-h-screen bg-zinc-900 p-6 text-zinc-100">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/"
                className="group flex w-fit max-w-full items-center gap-3 rounded-xl border border-transparent px-1 py-1 transition-colors hover:border-zinc-700 hover:bg-zinc-800/50"
              >
                <AppLogo size="md" className="shrink-0" />
                <div className="min-w-0 text-left leading-tight">
                  <div className="text-base font-semibold text-zinc-100 group-hover:text-amber-500/95">
                    Место осознанности
                  </div>
                  <div className="text-xs text-zinc-500">цифровой дневник состояния</div>
                </div>
              </Link>
              <HeaderProfile />
            </div>
            <Nav />
          </div>
          <main className="mt-6">
            <Routes>
              <Route path="/" element={<HomeView />} />
              <Route path="/day" element={<DayView />} />
              <Route path="/stats" element={<StatsView />} />
              <Route path="/categories" element={<CategoriesView />} />
              <Route path="/thoughts" element={<ThoughtsView />} />
              <Route path="/states" element={<StatesView />} />
              <Route path="/tasks" element={<TasksView />} />
              <Route path="/hypothesis" element={<HypothesisView />} />
              <Route path="/victory" element={<VictoryDiaryView />} />
              <Route path="/versions" element={<Navigate to="/profile/versions" replace />} />
              <Route path="/profile" element={<ProfileLayout />}>
                <Route index element={<ProfileMain />} />
                <Route path="usage" element={<ProfileUsageView />} />
                <Route path="versions" element={<VersionsView />} />
              </Route>
            </Routes>
          </main>
        </div>
      </div>
      <LevelUpFlowHost />
    </BrowserRouter>
  )
}
