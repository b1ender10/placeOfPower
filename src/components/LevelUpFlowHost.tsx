import { useStore } from '../store/useStore'
import { CaseRouletteModal } from './CaseRouletteModal'
import { TeacherCongratsModal } from './TeacherCongratsModal'

/** Глобальная очередь: сначала кейсы, затем поздравление учителя */
export function LevelUpFlowHost() {
  const pendingCases = useStore((s) => s.profile.pendingCaseLevels)
  const teacherModalLevel = useStore((s) => s.profile.pendingTeacherModalLevel)

  const caseLevel = pendingCases[0]
  const showCase = pendingCases.length > 0
  const showTeacher = !showCase && teacherModalLevel != null

  return (
    <>
      {showCase && caseLevel != null && <CaseRouletteModal key={`case-${caseLevel}`} caseLevel={caseLevel} />}
      {showTeacher && teacherModalLevel != null && (
        <TeacherCongratsModal key={`teacher-${teacherModalLevel}`} level={teacherModalLevel} />
      )}
    </>
  )
}
