import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { CategoryManager } from '../components/CategoryManager'

export function CategoriesView() {
  const { load } = useStore()

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100">Категории</h1>
      <CategoryManager />
    </div>
  )
}
