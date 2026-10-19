/**
 * Counts anything that has a city into the map's levels: region, province,
 * city (commune). Hand rows of (typed city, value) and get back what
 * <MoroccoHeatMap data={...} /> draws.
 *
 * Nothing is dropped. A row placed only as far as its region or province is
 * counted there and in `regionOnly` / `provinceOnly`; a row that cannot be
 * placed at all is in `unplaced`.
 */
import { communePoint, placeCity as defaultPlacer, type CommunePoint, type PlaceCity } from "./place"

export interface PlaceCounts {
  /** Keyed by HCP region code ("06"). */
  regions: Record<string, number>
  /** Keyed by HCP province code ("06.141"). */
  provinces: Record<string, number>
  /** Keyed by HCP commune code ("06.141.01.0"). */
  cities: Record<string, number>
  /** Per region: counted in it, but no province is known. */
  regionOnly: Record<string, number>
  /** Per province: counted in it, but no city is known. */
  provinceOnly: Record<string, number>
  unplaced: number
  total: number
}

export interface PlaceRow {
  city: string | null | undefined
  /** Defaults to 1: one row, one record. */
  value?: number
}

export interface CountOptions {
  /** Your placer from createPlacer(); the default knows no app hints. */
  placer?: PlaceCity
  /** Applied once to every sum at the end, e.g. to cents for money. */
  round?: (v: number) => number
}

export function emptyPlaceCounts(): PlaceCounts {
  return { regions: {}, provinces: {}, cities: {}, regionOnly: {}, provinceOnly: {}, unplaced: 0, total: 0 }
}

export function countPlaces(rows: Iterable<PlaceRow>, options: CountOptions = {}): PlaceCounts {
  const place = options.placer ?? defaultPlacer
  const out = emptyPlaceCounts()
  const add = (bag: Record<string, number>, key: string, v: number) => (bag[key] = (bag[key] ?? 0) + v)
  for (const row of rows) {
    const value = row.value ?? 1
    if (!value) continue
    out.total += value
    const p = place(row.city)
    if (!p) {
      out.unplaced += value
      continue
    }
    add(out.regions, p.region, value)
    if (!p.province) {
      add(out.regionOnly, p.region, value)
      continue
    }
    add(out.provinces, p.province, value)
    if (p.commune) add(out.cities, p.commune, value)
    else add(out.provinceOnly, p.province, value)
  }
  const round = options.round
  if (round) {
    out.total = round(out.total)
    out.unplaced = round(out.unplaced)
    for (const bag of [out.regions, out.provinces, out.cities, out.regionOnly, out.provinceOnly]) {
      for (const k of Object.keys(bag)) bag[k] = round(bag[k])
    }
  }
  return out
}

/** Name and point of every city that has a count, so the map can draw them. */
export function cityPoints(...counts: PlaceCounts[]): Record<string, CommunePoint> {
  const out: Record<string, CommunePoint> = {}
  for (const c of counts) {
    for (const code of Object.keys(c.cities)) {
      if (out[code]) continue
      const point = communePoint(code)
      if (point) out[code] = point
    }
  }
  return out
}
