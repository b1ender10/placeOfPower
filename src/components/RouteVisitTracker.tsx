import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { pathToSectionId } from '../lib/sectionTelemetry'

/** Учёт заходов в разделы по текущему URL */
export function RouteVisitTracker() {
  const location = useLocation()
  const recordVisit = useStore((s) => s.recordSectionVisit)

  useEffect(() => {
    const id = pathToSectionId(location.pathname)
    if (id) recordVisit(id)
  }, [location.pathname, recordVisit])

  return null
}
