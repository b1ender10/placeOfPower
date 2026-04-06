/** Дни с записями дневника (YYYY-MM-DD) */
export function streakEndingOn(dateStr: string, datesWithEntries: Set<string>): number {
  const d = new Date(dateStr + 'T12:00:00')
  let n = 0
  for (;;) {
    const y = d.getFullYear()
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    const da = String(d.getDate()).padStart(2, '0')
    const key = `${y}-${mo}-${da}`
    if (!datesWithEntries.has(key)) break
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

/** XP за запись: min(стрик, 5), стрик ≥1 */
export function diaryXpForStreak(streak: number): number {
  return Math.min(Math.max(0, streak), 5)
}
