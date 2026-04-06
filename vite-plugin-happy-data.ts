import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const root = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(root, 'src/data/app-data.json')
const BACKUP_DIR = path.join(root, 'src/data/backups')

function todayStamp(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Сумма «основных» сущностей для эвристики «полный сброс» */
function snapshotMass(o: Record<string, unknown>): number {
  const n = (k: string) => (Array.isArray(o[k]) ? (o[k] as unknown[]).length : 0)
  return (
    n('happy_entries') +
    n('happy_thoughts') +
    n('happy_state_actions') +
    n('happy_victory_entries') +
    n('happy_hypotheses') +
    n('happy_reward_tasks')
  )
}

function looksLikeWipeOverNonempty(oldSnap: Record<string, unknown>, newSnap: Record<string, unknown>): boolean {
  return snapshotMass(oldSnap) > 0 && snapshotMass(newSnap) === 0
}

/** Первое сохранение за календарный день — копия текущего файла до перезаписи */
function ensureDailyBackup(): void {
  if (!fs.existsSync(DATA_FILE)) return
  const stat = fs.statSync(DATA_FILE)
  if (stat.size < 4) return
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const daily = path.join(BACKUP_DIR, `daily-${todayStamp()}.json`)
  if (fs.existsSync(daily)) return
  fs.copyFileSync(DATA_FILE, daily)
}

function attachApi(middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void }) {
  middlewares.use((req, res, next) => {
    const pathname = req.url?.split('?')[0] ?? ''
    if (pathname !== '/api/data') {
      next()
      return
    }

    if (req.method === 'GET') {
      try {
        if (!fs.existsSync(DATA_FILE)) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Нет файла src/data/app-data.json — выполни npm run data:import' }))
          return
        }
        const raw = fs.readFileSync(DATA_FILE, 'utf-8')
        res.setHeader('Content-Type', 'application/json')
        res.end(raw)
      } catch (e) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: String(e) }))
      }
      return
    }

    if (req.method === 'PUT') {
      const chunks: Buffer[] = []
      req.on('data', (c: Buffer) => chunks.push(c))
      req.on('end', () => {
        try {
          const body = Buffer.concat(chunks).toString('utf-8')
          const newSnap = JSON.parse(body) as Record<string, unknown>
          const url = new URL(req.url ?? '/', 'http://localhost')
          const force = url.searchParams.get('force') === '1' || url.searchParams.get('force') === 'true'

          let oldSnap: Record<string, unknown> | null = null
          if (fs.existsSync(DATA_FILE)) {
            try {
              oldSnap = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as Record<string, unknown>
            } catch {
              oldSnap = null
            }
          }

          if (!force && oldSnap && looksLikeWipeOverNonempty(oldSnap, newSnap)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true })
            const blockPath = path.join(BACKUP_DIR, `blocked-wipe-${Date.now()}.json`)
            fs.writeFileSync(blockPath, JSON.stringify(oldSnap, null, 2), 'utf-8')
            res.statusCode = 409
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error:
                  'Отклонено: новый снимок пустой при непустых данных. Сохранена копия в backups/blocked-wipe-*.json. Повтор с ?force=1 если намеренно.',
              }),
            )
            return
          }

          ensureDailyBackup()
          fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
          fs.writeFileSync(DATA_FILE, body, 'utf-8')
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true }))
        } catch (e) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: String(e) }))
        }
      })
      return
    }

    res.statusCode = 405
    res.end()
  })
}

export function happyDataPlugin(): Plugin {
  return {
    name: 'happy-data-api',
    configureServer(server) {
      attachApi(server.middlewares)
    },
    configurePreviewServer(server) {
      attachApi(server.middlewares)
    },
  }
}
