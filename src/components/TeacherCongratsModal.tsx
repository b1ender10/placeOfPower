import { useEffect, useMemo } from 'react'
import { characterById, pickRandomQuote } from '../data/characters'
import { emptyTiers, highestTierHeld } from '../lib/inventoryMerge'
import { useStore } from '../store/useStore'

type Props = {
  level: number
}

export function TeacherCongratsModal({ level }: Props) {
  const teacherId = useStore((s) => s.profile.teacherCharacterId)
  const dismissTeacherModal = useStore((s) => s.dismissTeacherModal)
  const ch = teacherId ? characterById(teacherId) : undefined

  useEffect(() => {
    if (teacherId && !ch) dismissTeacherModal()
  }, [teacherId, ch, dismissTeacherModal])

  const quoteLine = useMemo(() => {
    if (!ch) return ''
    const inv = useStore.getState().profile.characterInventory[ch.id] ?? emptyTiers()
    const tier = highestTierHeld(inv)
    return pickRandomQuote(ch, tier)
  }, [ch, level])

  if (!ch) return null

  const close = () => dismissTeacherModal()

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={close}
        aria-label="Закрыть"
      />
      <div
        className="modal-level-panel relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/30 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-center text-2xl font-bold text-emerald-400">Уровень {level}!</h2>
        <p className="mt-2 text-center text-sm text-zinc-400">Твой учитель гордится тобой</p>
        <div className="mt-6 flex flex-col items-center">
          <img
            src={ch.imageUrl}
            alt=""
            className="h-28 w-28 rounded-full border-4 border-emerald-600/50 object-cover shadow-lg"
          />
          <p className="mt-4 text-lg font-semibold text-zinc-100">{ch.name}</p>
          {quoteLine ? (
            <p className="mt-3 text-center text-sm italic leading-relaxed text-zinc-300">«{quoteLine}»</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={close}
          className="mt-8 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-zinc-950 hover:bg-emerald-500"
        >
          Вперёд
        </button>
      </div>
    </div>
  )
}
