import { NavLink, Outlet } from 'react-router-dom'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
  }`

export function ProfileLayout() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-zinc-700 pb-3">
        <NavLink to="/profile" end className={tabClass}>
          Профиль
        </NavLink>
        <NavLink to="/profile/usage" className={tabClass}>
          Статистика
        </NavLink>
        <NavLink to="/profile/versions" className={tabClass}>
          Версии
        </NavLink>
      </div>
      <Outlet />
    </div>
  )
}
