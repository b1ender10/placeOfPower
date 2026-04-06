/**
 * Скачивает портреты персонажей в public/characters/
 * Запуск: node scripts/download-character-images.mjs
 */
import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/characters')

const TIMEOUT_MS = 45_000
const BETWEEN_MS = 2500
const UA = 'happy-character-assets/1.0 (local dev; contact: none)'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchTimeout(url, init = {}) {
  const headers = { 'User-Agent': UA, ...init.headers }
  let res = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (res.status === 429) {
    await sleep(8000)
    res = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(TIMEOUT_MS) })
  }
  return res
}

/** Прямые URL (миниатюры Commons / enwiki) */
const SOURCES = [
  ['arsen', 'png', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/%D0%90%D1%80%D1%81%D0%B5%D0%BD_%D0%9C%D0%B0%D1%80%D0%BA%D0%B0%D1%80%D1%8F%D0%BD.png/330px-%D0%90%D1%80%D1%81%D0%B5%D0%BD_%D0%9C%D0%B0%D1%80%D0%BA%D0%B0%D1%80%D1%8F%D0%BD.png'],
  ['goggins', 'jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/DavidGogginsMay08.jpg/330px-DavidGogginsMay08.jpg'],
  ['tate', 'png', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Andrew_Tate_-_James_Tamim_Upload_%28Cropped_Wide_Portrait%29.png/330px-Andrew_Tate_-_James_Tamim_Upload_%28Cropped_Wide_Portrait%29.png'],
  ['fedor', 'jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Fedor_Emelianenko_Dec_2015.jpg/330px-Fedor_Emelianenko_Dec_2015.jpg'],
  ['ali', 'jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Muhammad_Ali_NYWTS.jpg/330px-Muhammad_Ali_NYWTS.jpg'],
  ['kasparov', 'jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Garri_Kasparow_%2818776605665%29_%28cropped%29_2.jpg/330px-Garri_Kasparow_%2818776605665%29_%28cropped%29_2.jpg'],
  ['blood', 'jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Finn_Balor_080325_%28cropped%29.jpg/330px-Finn_Balor_080325_%28cropped%29.jpg'],
  ['sarychev', 'jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Kirill_Sarychev%2C_March_2021.jpg/330px-Kirill_Sarychev%2C_March_2021.jpg'],
  ['lee', 'jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Bruce_Lee_as_Chen_Zhen_%284x5_cropped%29.jpg/330px-Bruce_Lee_as_Chen_Zhen_%284x5_cropped%29.jpg'],
  ['rocky', 'jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/P20251206DT-0472_%28cropped%3B_Sylvester_Stallone%29.jpg/330px-P20251206DT-0472_%28cropped%3B_Sylvester_Stallone%29.jpg'],
  ['karelin', 'jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Aleksandr_Karelin_WCG-2013.jpg/330px-Aleksandr_Karelin_WCG-2013.jpg'],
  ['khabib', 'jpg', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Khabib_nurmagomedov.jpg/330px-Khabib_nurmagomedov.jpg'],
  ['guts', 'png', 'https://upload.wikimedia.org/wikipedia/en/d/db/GutsBerserk.PNG'],
]

async function commonsFirstImageUrl(search) {
  const u = new URL('https://commons.wikimedia.org/w/api.php')
  u.searchParams.set('action', 'query')
  u.searchParams.set('list', 'search')
  u.searchParams.set('srsearch', search)
  u.searchParams.set('srnamespace', '6')
  u.searchParams.set('srlimit', '5')
  u.searchParams.set('format', 'json')
  const r = await fetchTimeout(u)
  const j = await r.json()
  const hit = j?.query?.search?.[0]?.title
  if (!hit) return null
  const u2 = new URL('https://commons.wikimedia.org/w/api.php')
  u2.searchParams.set('action', 'query')
  u2.searchParams.set('titles', hit)
  u2.searchParams.set('prop', 'imageinfo')
  u2.searchParams.set('iiprop', 'url')
  u2.searchParams.set('iiurlwidth', '400')
  u2.searchParams.set('format', 'json')
  const r2 = await fetchTimeout(u2)
  const j2 = await r2.json()
  const pages = j2?.query?.pages
  const p = pages && Object.values(pages)[0]
  const ii = p?.imageinfo?.[0]
  return ii?.thumburl || ii?.url || null
}

async function download(id, ext, url) {
  const res = await fetchTimeout(url)
  if (!res.ok) throw new Error(`${id}: ${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(join(outDir, `${id}.${ext}`), buf)
  console.log('ok', `${id}.${ext}`, buf.length)
}

mkdirSync(outDir, { recursive: true })

console.log('Загрузка известных URL…')
for (const [id, ext, url] of SOURCES) {
  await download(id, ext, url)
  await sleep(BETWEEN_MS)
}

await sleep(BETWEEN_MS)
console.log('Поиск Commons: Игорь Войтенко блогер…')
let vUrl = await commonsFirstImageUrl('Игорь Войтенко блогер')
if (!vUrl) vUrl = await commonsFirstImageUrl('Igor Voytenko')
if (!vUrl)
  vUrl =
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Small_group_fitness_sessions_bundall.jpg/330px-Small_group_fitness_sessions_bundall.jpg'
await download('voytenko', vUrl.includes('.png') ? 'png' : 'jpg', vUrl)
await sleep(BETWEEN_MS)

console.log('Поиск Commons: Андрей Смаев…')
let sUrl = await commonsFirstImageUrl('Андрей Смаев')
if (!sUrl) sUrl = await commonsFirstImageUrl('Andrey Smaev powerlifting')
if (!sUrl)
  sUrl =
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/IPF_World_Champion_Dean_Bowring_performing_the_three_Powerlifting_moves.jpg/330px-IPF_World_Champion_Dean_Bowring_performing_the_three_Powerlifting_moves.jpg'
const sExt = sUrl.toLowerCase().includes('.png') ? 'png' : 'jpg'
await download('smaev', sExt, sUrl)

console.log('Готово:', outDir)
