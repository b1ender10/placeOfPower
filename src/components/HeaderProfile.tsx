import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { levelFromXp } from '../lib/stateLevel'

export function HeaderProfile() {
  const profile = useStore((s) => s.profile)
  const lvl = levelFromXp(profile.levelXp)
  const pendingCases = profile.pendingCaseLevels.length

  return (
    <Link
      to="/profile"
      className="relative group flex shrink-0 items-center gap-2 rounded-full border border-zinc-600 bg-zinc-800/80 py-1 pl-1 pr-3 transition-colors hover:border-amber-500/50 hover:bg-zinc-800"
    >
      <div className="relative h-9 w-9 overflow-hidden rounded-full bg-zinc-700">
        {profile.avatarDataUrl ? (
          <img src={profile.avatarDataUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">?</div>
        )}
      </div>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[10px] uppercase tracking-wide text-zinc-500">ур.</span>
        <span className="text-sm font-bold text-amber-500">{lvl}</span>
      </div>
      {pendingCases > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white"
          title="Кейсы"
        >
          {pendingCases}
        </span>
      )}
    </Link>
  )
}
