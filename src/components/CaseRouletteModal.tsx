import { useCallback, useMemo, useRef, useState } from 'react'
import { CHARACTERS, pickRandomQuote } from '../data/characters'
import { addBaseAndMerge, emptyTiers, tierDeltaAfterBaseDrop } from '../lib/inventoryMerge'
import { useStore } from '../store/useStore'

type Props = {
  caseLevel: number
}

const SLOT_W = 88
const REPEAT = 5

export function CaseRouletteModal({ caseLevel }: Props) {
  const completeCaseDrop = useStore((s) => s.completeCaseDrop)
  const [phase, setPhase] = useState<'idle' | 'spin' | 'done'>('idle')
  const [winnerId, setWinnerId] = useState<string | null>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const winnerIdx = useRef(Math.floor(Math.random() * CHARACTERS.length))

  const runSpin = useCallback(() => {
    if (phase !== 'idle') return
    const id = CHARACTERS[winnerIdx.current].id
    setWinnerId(id)
    setPhase('spin')
    const wrap = wrapRef.current
    const strip = stripRef.current
    if (!wrap || !strip) return
    const cw = wrap.clientWidth
    const idx = 3 * CHARACTERS.length + winnerIdx.current
    const slotCenter = idx * SLOT_W + SLOT_W / 2
    const tx = cw / 2 - slotCenter
    strip.style.transition = 'transform 3.2s cubic-bezier(0.12, 0.85, 0.15, 1)'
    strip.style.transform = `translateX(${tx}px)`
    window.setTimeout(() => setPhase('done'), 3300)
  }, [phase])

  const takeReward = useCallback(() => {
    if (phase !== 'done' || !winnerId) return
    completeCaseDrop(winnerId)
  }, [phase, winnerId, completeCaseDrop])

  const winner = winnerId ? CHARACTERS.find((c) => c.id === winnerId) : null

  const quoteLine = useMemo(() => {
    if (phase !== 'done' || !winnerId) return null
    const w = CHARACTERS.find((c) => c.id === winnerId)
    if (!w) return null
    const inv = useStore.getState().profile.characterInventory
    const prev = inv[winnerId] ?? emptyTiers()
    const nextInv = addBaseAndMerge(inv, winnerId)
    const nextT = nextInv[winnerId]
    if (!nextT) return null
    const tier = tierDeltaAfterBaseDrop(prev, nextT)
    return pickRandomQuote(w, tier)
  }, [phase, winnerId, caseLevel])

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => phase === 'done' && takeReward()}
        aria-label="Закрыть"
      />
      <div
        className="modal-level-panel relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/40 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-center text-xl font-bold text-amber-400">Кейс уровня {caseLevel}</h2>
        <p className="mt-1 text-center text-sm text-zinc-500">Рулетка персонажей</p>

        <div ref={wrapRef} className="relative mt-6 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 py-3">
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-1 -translate-x-1/2 bg-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
          <div className="overflow-hidden px-2">
            <div
              ref={stripRef}
              className="flex w-max will-change-transform"
              style={{ transform: 'translateX(0)' }}
            >
              {Array.from({ length: REPEAT }).map((_, r) => (
                <div key={r} className="flex">
                  {CHARACTERS.map((c) => (
                    <div
                      key={`${r}-${c.id}`}
                      className="flex h-[100px] shrink-0 flex-col items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 p-1"
                      style={{ width: SLOT_W }}
                    >
                      <img src={c.imageUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                      <span className="mt-1 line-clamp-2 text-center text-[9px] leading-tight text-zinc-400">
                        {c.name}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {phase === 'idle' && (
          <button
            type="button"
            onClick={runSpin}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 py-3 text-sm font-bold text-zinc-950 shadow-lg hover:brightness-110"
          >
            Крутить
          </button>
        )}

        {phase === 'spin' && <p className="mt-6 text-center text-sm text-zinc-400">Крутим…</p>}

        {phase === 'done' && winner && (
          <div className="mt-6 text-center">
            <p className="text-sm text-emerald-400">Выпало</p>
            <p className="mt-2 text-lg font-semibold text-zinc-100">{winner.name}</p>
            <img
              src={winner.imageUrl}
              alt=""
              className="mx-auto mt-3 h-20 w-20 rounded-full border-2 border-amber-500/50 object-cover"
            />
            {quoteLine && (
              <p className="mx-auto mt-3 max-w-sm text-sm italic text-zinc-400">«{quoteLine}»</p>
            )}
            <button
              type="button"
              onClick={takeReward}
              className="mt-6 w-full rounded-lg bg-zinc-700 py-2.5 text-sm font-medium text-zinc-100 hover:bg-zinc-600"
            >
              Забрать
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
