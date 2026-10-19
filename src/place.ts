/**
 * Where in Morocco a free-text city is: its HCP region, province and
 * commune ("city"). Typed in French or Arabic, with or without accents
 * ("Fès", "فاس", "fes"), the same town lands on the same codes.
 *
 * It never guesses: a text that matches no commune, urban centre, province
 * or alias is not placed (null), and the caller should say so.
 *
 * Codes are the census ones: region "06", province "06.141", commune
 * "06.141.01.0".
 */
import { HCP_PROVINCES } from "./data/admin"
import { HCP_COMMUNES } from "./data/communes"

export interface PlacedLocation {
  region: string
  /** Null when only the region is known (a hint entry with no commune). */
  province: string | null
  /** Null when only the province is known ("Al Haouz") or less. */
  commune: string | null
}

export interface CommunePoint {
  code: string
  province: string
  fr: string
  ar: string
  /** The commune's centre point. Null for the one commune with no shape. */
  lng: number | null
  lat: number | null
}

export interface PlacerOptions {
  /**
   * Cities your app already knows the region of, e.g. the list behind a
   * city picker. They settle a name two regions share ("Ajdir" is in Al
   * Hoceima and in Taza), place a village the census does not list as a
   * commune at least to its region, and allow a one-or-two-letter spelling
   * match inside that region ("Ouazzane" / "Ouezzane").
   */
  regionHints?: Array<{ name: string; region: string }>
  /** Extra spellings people type, mapped to a census name: { casa: "Casablanca" }. */
  aliases?: Record<string, string>
}

/** Arabic letters people type interchangeably, folded to one form. */
function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ً-ٟـٰۖ-ۭ]/g, "")
    .replace(/[ىئ]/g, "ي")
    .replace(/ؤ/g, "و")
}

/** One key for both scripts: Latin folded and stripped, Arabic normalised. */
export function placeKey(text: string): string {
  return normalizeArabic(text.normalize("NFD").replace(/[̀-ͯ]/g, ""))
    .replace(/['`’.,()\-_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Names people type that are not the census spelling. */
export const DEFAULT_ALIASES: Record<string, string> = {
  casa: "Casablanca",
  "dar el beida": "Casablanca",
  "dar bida": "Casablanca",
  "الدار البيضاء": "Casablanca",
  "الدارالبيضاء": "Casablanca",
  "البيضاء": "Casablanca",
  tangier: "Tanger",
  tangiers: "Tanger",
  tanja: "Tanger",
  fez: "Fès",
  marrakesh: "Marrakech",
  laayoune: "Laâyoune",
  layoune: "Laâyoune",
  "el aaiun": "Laâyoune",
  smara: "Es-Semara",
  semara: "Es-Semara",
  "السمارة": "Es-Semara",
}

/** Province of a province or préfecture-d'arrondissements code (Casablanca's 8 roll up). */
function shapedProvince(code: string): string {
  return code.split(".").slice(0, 2).join(".")
}

const PROVINCE_BY_CODE = new Map(HCP_PROVINCES.map((p) => [p.code, p]))

const COMMUNE_BY_CODE = new Map(
  HCP_COMMUNES.map(([code, province, fr, ar, , lng, lat]) => [
    code,
    { code, province: shapedProvince(province), fr, ar, lng, lat } as CommunePoint,
  ])
)

/** Name and centre point of a commune, for drawing it on the map. */
export function communePoint(code: string): CommunePoint | null {
  return COMMUNE_BY_CODE.get(code) ?? null
}

/** Every place a key can name, most likely first. Built once, shared by all placers. */
const INDEX: Map<string, PlacedLocation[]> = (() => {
  const index = new Map<string, PlacedLocation[]>()
  const put = (name: string, loc: PlacedLocation) => {
    const key = placeKey(name)
    if (!key) return
    const list = index.get(key) ?? []
    const same = list.findIndex((l) => l.province === loc.province)
    if (same === -1) list.push(loc)
    // "Settat" names the province and its main town: keep the town, it is
    // the more precise answer and still in the same province.
    else if (!list[same].commune && loc.commune) list[same] = loc
    index.set(key, list)
  }

  // A province's own name ("Al Haouz", "Chtouka-Aït Baha") places it first.
  for (const p of HCP_PROVINCES) {
    put(p.fr, { region: p.region, province: p.code, commune: null })
    put(p.ar, { region: p.region, province: p.code, commune: null })
  }
  // Then communes, biggest first: "Sidi Ali" names many villages, but
  // someone typing a name means the town people know.
  const communes = [...HCP_COMMUNES].sort((a, b) => b[4] - a[4])
  for (const [commune, provinceCode, fr, ar] of communes) {
    const province = shapedProvince(provinceCode)
    const region = PROVINCE_BY_CODE.get(province)?.region
    if (!region) continue
    put(fr, { region, province, commune })
    put(ar, { region, province, commune })
  }
  // Last, urban centres inside rural communes ("Karia", "Tamansourt").
  for (const [commune, provinceCode, , , , , , centres] of communes) {
    const province = shapedProvince(provinceCode)
    const region = PROVINCE_BY_CODE.get(province)?.region
    if (!region) continue
    for (const name of centres) put(name, { region, province, commune })
  }
  return index
})()

/** Keys of every commune and province, by region, for the close-spelling pass. */
const KEYS_BY_REGION = (() => {
  const out = new Map<string, Array<[string, PlacedLocation]>>()
  for (const [key, list] of INDEX) {
    for (const loc of list) {
      const bucket = out.get(loc.region) ?? []
      bucket.push([key, loc])
      out.set(loc.region, bucket)
    }
  }
  return out
})()

export type PlaceCity = (text: string | null | undefined) => PlacedLocation | null

/** A placer with your app's own hints and aliases. Build it once and reuse it. */
export function createPlacer(options: PlacerOptions = {}): PlaceCity {
  const aliases = new Map(
    Object.entries({ ...DEFAULT_ALIASES, ...options.aliases }).map(([typed, census]) => [placeKey(typed), census])
  )
  const hints = new Map<string, string>()
  for (const h of options.regionHints ?? []) hints.set(placeKey(h.name), h.region.padStart(2, "0"))
  const nearCache = new Map<string, PlacedLocation | null>()

  /**
   * One or two letters apart, and only inside the region a hint already
   * gave, so a spelling slip can never move a record to another region.
   */
  const nearInRegion = (key: string, region: string): PlacedLocation | null => {
    const cacheKey = `${region}:${key}`
    if (nearCache.has(cacheKey)) return nearCache.get(cacheKey)!
    const budget = key.length >= 6 ? 2 : 1
    let best: PlacedLocation | null = null
    let bestDistance = budget + 1
    for (const [candidate, loc] of KEYS_BY_REGION.get(region) ?? []) {
      if (Math.abs(candidate.length - key.length) > budget) continue
      const d = editDistance(key, candidate, budget)
      if (d < bestDistance) {
        best = loc
        bestDistance = d
      }
    }
    nearCache.set(cacheKey, best)
    return best
  }

  return (text) => {
    if (!text) return null
    const typed = placeKey(text)
    if (!typed) return null
    const key = placeKey(aliases.get(typed) ?? typed)
    const hintRegion = hints.get(key)
    const candidates = INDEX.get(key) ?? []
    const match = candidates.find((c) => c.region === hintRegion) ?? candidates[0]
    if (match && (!hintRegion || match.region === hintRegion)) return match
    if (hintRegion) return nearInRegion(key, hintRegion) ?? { region: hintRegion, province: null, commune: null }
    return null
  }
}

/** A placer with no app hints: census names, urban centres and the default aliases. */
export const placeCity: PlaceCity = createPlacer()

/** Levenshtein, giving up once every path is over `max`. */
function editDistance(a: string, b: string, max: number): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      row.push(v)
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
    prev = row
  }
  return prev[b.length]
}
