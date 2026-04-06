/**
 * Импорт из src/data.js → src/data/app-data.json
 * Запуск: node scripts/generate-app-data.mjs
 */
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const mod = await import(pathToFileURL(join(root, 'src/data.js')).href)
const { happy_thoughts, happy_entries, happy_categories } = mod

const payload = {
  happy_entries,
  happy_categories,
  happy_thoughts: happy_thoughts.map((t) => ({ ...t, favorite: t.favorite ?? false })),
  happy_state_actions: [],
  happy_victory_entries: [],
  happy_victory_drafts: [],
  happy_reward_tasks: [],
  happy_hypotheses: [],
  happy_section_stats: {},
  happy_profile: {
    displayName: '',
    avatarDataUrl: null,
    levelXp: 0,
    teacherCharacterId: null,
    pendingCaseLevels: [],
    pendingTeacherLevels: [],
    pendingTeacherModalLevel: null,
    characterInventory: {},
  },
}
const outDir = join(root, 'src/data')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'app-data.json'), JSON.stringify(payload, null, 2), 'utf8')
console.log('Written src/data/app-data.json')
