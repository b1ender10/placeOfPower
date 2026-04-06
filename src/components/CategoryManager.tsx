import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { Category } from '../store/types'

const DEFAULT_COLOR = '#22c55e'

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <label className="group flex cursor-pointer items-center gap-2">
      <span className="text-sm text-zinc-400">Цвет</span>
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-9 w-14 cursor-pointer opacity-0"
        />
        <div
          className="h-9 w-14 rounded-lg border-2 border-zinc-600 shadow-inner transition group-hover:border-amber-500/50"
          style={{ backgroundColor: value }}
        />
      </div>
    </label>
  )
}

export function CategoryManager() {
  const { categories, entries, addCategory, updateCategory, removeCategory } = useStore()
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_COLOR)
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const hasEntries = (id: string) => entries.some((e) => e.category === id)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    addCategory({ name, color: newColor })
    setNewName('')
    setNewColor(DEFAULT_COLOR)
  }

  const startEdit = (c: Category) => {
    setEditing(c.id)
    setEditName(c.name)
    setEditColor(c.color ?? DEFAULT_COLOR)
  }

  const saveEdit = () => {
    if (editing && editName.trim()) {
      const cat = categories.find((x) => x.id === editing)
      if (cat) updateCategory({ ...cat, name: editName.trim(), color: editColor })
    }
    setEditing(null)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Новая категория"
          className="flex-1 min-w-[120px] rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500"
        />
        <ColorPicker value={newColor} onChange={setNewColor} />
        <button type="submit" className="rounded bg-amber-500 px-4 py-2 font-medium text-zinc-900 hover:bg-amber-400">
          Добавить
        </button>
      </form>
      <ul className="space-y-2">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2 rounded border border-zinc-700 bg-zinc-800/50 p-2">
            {c.color && (
              <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
            )}
            {editing === c.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  autoFocus
                  className="flex-1 rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-zinc-100"
                />
                <ColorPicker value={editColor} onChange={setEditColor} />
                <button type="button" onClick={saveEdit} className="shrink-0 text-amber-500 hover:underline">
                  Сохранить
                </button>
              </>
            ) : (
              <span className="flex-1">{c.name}</span>
            )}
            <div className="flex shrink-0 gap-2">
              {editing === c.id ? (
                <button type="button" onClick={() => setEditing(null)} className="text-zinc-400 hover:text-zinc-200">
                  Отмена
                </button>
              ) : (
                <button type="button" onClick={() => startEdit(c)} className="text-zinc-400 hover:text-zinc-200">
                  Изменить
                </button>
              )}
              <button
                  type="button"
                  onClick={() => {
                    if (categories.length <= 1) {
                      alert('Должна остаться хотя бы одна категория')
                      return
                    }
                    const msg = hasEntries(c.id)
                      ? `У категории «${c.name}» есть записи. Переназначить в другую категорию и удалить?`
                      : `Удалить категорию «${c.name}»?`
                    if (!confirm(msg)) return
                    const otherId = categories.find((x) => x.id !== c.id)?.id ?? 'other'
                    removeCategory(c.id, hasEntries(c.id) ? otherId : undefined)
                    setEditing(null)
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  Удалить
                </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
