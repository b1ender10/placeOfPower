import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { levelFromXp, xpProgressInLevel } from '../lib/stateLevel'
import { CHARACTERS } from '../data/characters'
import { emptyTiers } from '../lib/inventoryMerge'

function resizeToDataUrl(file: File, maxSide: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxSide || height > maxSide) {
        if (width > height) {
          height = Math.round((height * maxSide) / width)
          width = maxSide
        } else {
          width = Math.round((width * maxSide) / height)
          height = maxSide
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image'))
    }
    img.src = url
  })
}

export function ProfileMain() {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const fileRef = useRef<HTMLInputElement>(null)

  const level = levelFromXp(profile.levelXp)
  const inLevel = xpProgressInLevel(profile.levelXp)
  const pct = (inLevel / 10) * 100
  const xpToNext = Math.max(0, (level + 1) * 10 - profile.levelXp)

  const owned = CHARACTERS.filter((c) => {
    const t = profile.characterInventory[c.id] ?? emptyTiers()
    return t.base + t.bronze + t.silver + t.gold > 0
  })

  useEffect(() => {
    const tid = profile.teacherCharacterId
    if (!tid) return
    const t = profile.characterInventory[tid] ?? emptyTiers()
    const inInv = t.base + t.bronze + t.silver + t.gold > 0
    if (!inInv) setProfile({ teacherCharacterId: null })
  }, [profile.teacherCharacterId, profile.characterInventory, setProfile])

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Профиль</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Фото, ФИО, уровень. Учитель — поздравляет при апе уровня. Инвентарь: 3 одинаковых → бронза → серебро → золото.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
        <div
          className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-zinc-600 bg-zinc-900"
          style={{ aspectRatio: '1' }}
        >
          {profile.avatarDataUrl ? (
            <img src={profile.avatarDataUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-zinc-600">?</div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f || !f.type.startsWith('image/')) return
            try {
              const dataUrl = await resizeToDataUrl(f, 320)
              setProfile({ avatarDataUrl: dataUrl })
            } catch {
              /* ignore */
            }
          }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded bg-zinc-700 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-600"
            onClick={() => fileRef.current?.click()}
          >
            Загрузить фото
          </button>
          {profile.avatarDataUrl && (
            <button
              type="button"
              className="rounded px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
              onClick={() => setProfile({ avatarDataUrl: null })}
            >
              Убрать
            </button>
          )}
        </div>
      </div>

      <label className="block text-sm">
        <span className="text-zinc-400">ФИО</span>
        <input
          value={profile.displayName}
          onChange={(e) => setProfile({ displayName: e.target.value })}
          className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100"
          placeholder="Имя Фамилия"
        />
      </label>

      <label className="block text-sm">
        <span className="text-zinc-400">Учитель (только из инвентаря)</span>
        <select
          value={
            owned.some((c) => c.id === profile.teacherCharacterId)
              ? (profile.teacherCharacterId ?? '')
              : ''
          }
          onChange={(e) => setProfile({ teacherCharacterId: e.target.value || null })}
          disabled={owned.length === 0}
          className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">
            {owned.length === 0 ? 'Сначала выпади персонажа в кейсе' : '— не выбран —'}
          </option>
          {owned.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500">
          Поздравление при новом уровне: аватар и цитата. Доступны только персонажи, которые есть в инвентаре.
        </p>
      </label>

      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-zinc-400">Уровень</span>
          <span className="text-2xl font-bold text-amber-500">{level}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">Всего XP: {profile.levelXp.toFixed(1)}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-700">
          <div
            className="h-full rounded-full bg-amber-500 transition-[width]"
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          До следующего уровня: {xpToNext.toFixed(1)} XP (10 XP на уровень)
        </p>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Инвентарь</h2>
        {owned.length === 0 ? (
          <p className="text-sm text-zinc-500">Пока пусто. Открывай кейсы при повышении уровня.</p>
        ) : (
          <ul className="space-y-4">
            {owned.map((c) => {
              const t = profile.characterInventory[c.id] ?? emptyTiers()
              return (
                <li key={c.id} className="flex gap-3 rounded-lg border border-zinc-700/80 bg-zinc-900/40 p-3">
                  <img src={c.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-200">{c.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      база {t.base} · бронза {t.bronze} · серебро {t.silver} · золото {t.gold}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
