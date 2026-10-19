"use client"

/**
 * Morocco, whole, as a heat map you walk down: Maroc > Région > Province >
 * Ville. Regions and provinces are shaded by a number, cities are dots sized
 * by it. Pure SVG from a bundled TopoJSON: no tiles, works offline.
 *
 * It draws numbers keyed by HCP code ("06", "06.141", "06.141.01.0") and
 * knows nothing about what they count. Build `data` and `cityInfo` with
 * countPlaces() and cityPoints() from "@zonemation/morocco-map".
 *
 * Styles: import "@zonemation/morocco-map/styles.css" once. Colours come
 * from --mm-* variables, which default to shadcn's tokens.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import { geoMercator, geoPath, type GeoPermissibleObjects } from "d3-geo"
import { feature, mesh } from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"
import type { Feature, Geometry } from "geojson"
import { HCP_PROVINCES, HCP_REGIONS } from "../data/admin"
import { MOROCCO_MAP_LABELS, type MoroccoMapLabels, type MoroccoMapLocale } from "./labels"

type Props = { code: string; region?: string }
type Shape = Feature<Geometry, Props>

/** What the map shows, keyed by HCP code. Same shape as `PlaceCounts`. */
export interface MoroccoMapData {
  regions: Record<string, number>
  provinces: Record<string, number>
  /** Per commune ("city"). Without it, the map stops at provinces. */
  cities?: Record<string, number>
  /** Per region: counted there, but no province is known. */
  regionOnly?: Record<string, number>
  /** Per province: counted there, but no city is known. */
  provinceOnly?: Record<string, number>
}

/** Where to draw a city, and what to call it. Same shape as `CommunePoint`. */
export interface MoroccoCity {
  province: string
  fr: string
  ar: string
  lng: number | null
  lat: number | null
}

export interface MoroccoHeatMapProps {
  data: MoroccoMapData
  /** Name and point per commune code in `data.cities`. */
  cityInfo?: Record<string, MoroccoCity>
  /** Words and place names: "ar"/"ary" use Arabic names. Default "fr". */
  locale?: MoroccoMapLocale
  /** Override any word of the locale. */
  labels?: Partial<MoroccoMapLabels>
  /** How a value reads (count, DH...). Defaults to a plain number. */
  formatValue?: (value: number) => string
  /** Shown under the list, e.g. "City unknown: 12". */
  footer?: ReactNode
  loading?: boolean
  className?: string
}

type Level = "country" | "region" | "province" | "city"
type Box = [number, number, number, number]

const WIDTH = 520
const HEIGHT = 560
const PAD = 12
/** How far the buttons, pinch and wheel may zoom: a city fills the box. */
const MAX_ZOOM = 32
const STEP = 1.6
/** How close a city is shown when picked. */
const CITY_ZOOM = 18
/** City names drawn next to their dot, biggest first; the list has the rest. */
const CITY_LABELS = 8
const FULL: Box = [0, 0, WIDTH, HEIGHT]
const SHADE_OPACITY = [0, 0.18, 0.34, 0.52, 0.72, 0.92]

// The topology is ~60 KB; load it once, in its own chunk.
let topologyPromise: Promise<Topology> | null = null
function loadTopology(): Promise<Topology> {
  topologyPromise ??= import("../data/morocco.topo.json").then((m: any) => (m.default ?? m) as Topology)
  return topologyPromise
}

/** 0 -> empty, then 5 steps. sqrt so one big city does not wash out the rest. */
function shade(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0
  return Math.min(5, Math.max(1, Math.ceil(Math.sqrt(value / max) * 5)))
}

/** "06" region, "06.141" province, "06.141.01.0" city. */
const depthOf = (code: string) => Math.min(2, code.split(".").length - 1)
const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ")

const Chevron = () => (
  <svg className="mm-chev mm-flip" viewBox="0 0 24 24" aria-hidden>
    <path d="m9 18 6-6-6-6" />
  </svg>
)
const Icon = ({ d }: { d: string }) => (
  <svg className="mm-icon" viewBox="0 0 24 24" aria-hidden>
    <path d={d} />
  </svg>
)
const ICON = {
  plus: "M5 12h14M12 5v14",
  minus: "M5 12h14",
  fit: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  map: "M14.1 5.9 9 3.1a2 2 0 0 0-1.8 0L3.6 4.9A1 1 0 0 0 3 5.8v13.4a1 1 0 0 0 1.4.9l3.6-1.8a2 2 0 0 1 1.8 0l5.1 2.6a2 2 0 0 0 1.8 0l3.7-1.8a1 1 0 0 0 .6-.9V4.8a1 1 0 0 0-1.4-.9l-3.6 1.8a2 2 0 0 1-1.9.1zM15 5.8v15M9 3.2v15",
  pointer: "M22 14a8 8 0 0 1-8 8M18 11v-1a2 2 0 0 0-4 0M14 10V9a2 2 0 0 0-4 0v1M10 9.5V4a2 2 0 0 0-4 0v10M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15",
}

export function MoroccoHeatMap({
  data,
  cityInfo,
  locale = "fr",
  labels,
  formatValue,
  footer,
  loading,
  className,
}: MoroccoHeatMapProps) {
  const L = useMemo(() => ({ ...MOROCCO_MAP_LABELS[locale], ...labels }), [locale, labels])
  const { regions, provinces } = data
  const cities = useMemo(() => data.cities ?? {}, [data.cities])
  const [topology, setTopology] = useState<Topology | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [province, setProvince] = useState<string | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const fmt = formatValue ?? ((v: number) => v.toLocaleString("en-US"))
  const nameOf = (item: { fr: string; ar: string }) => (locale === "ar" || locale === "ary" ? item.ar : item.fr)
  const hasCities = !!cityInfo
  const level: Level = city ? "city" : province ? "province" : selected ? "region" : "country"

  useEffect(() => {
    let alive = true
    loadTopology().then((tp) => alive && setTopology(tp))
    return () => {
      alive = false
    }
  }, [])

  const geo = useMemo(() => {
    if (!topology) return null
    const regionObj = topology.objects.regions as GeometryCollection<Props>
    const provinceObj = topology.objects.provinces as GeometryCollection<Props>
    const regionShapes = (feature(topology, regionObj) as any).features as Shape[]
    const provinceShapes = (feature(topology, provinceObj) as any).features as Shape[]
    const all = { type: "FeatureCollection", features: regionShapes } as GeoPermissibleObjects
    const projection = geoMercator().fitExtent(
      [
        [PAD, PAD],
        [WIDTH - PAD, HEIGHT - PAD],
      ],
      all
    )
    const path = geoPath(projection)
    return {
      projection,
      path,
      regionShapes,
      provinceShapes,
      // Borders drawn once each, not twice per shared edge.
      regionBorders: path(mesh(topology, regionObj, (a, b) => a !== b)) ?? "",
      outline: path(mesh(topology, regionObj, (a, b) => a === b)) ?? "",
    }
  }, [topology])

  // Cities that can be drawn: a point, a count, and in a known province.
  const cityDots = useMemo(() => {
    if (!geo || !cityInfo) return []
    return Object.entries(cities)
      .map(([code, value]) => {
        const info = cityInfo[code]
        if (!info || info.lng === null || info.lat === null || !value) return null
        const xy = geo.projection([info.lng, info.lat])
        if (!xy) return null
        const region = HCP_PROVINCES.find((p) => p.code === info.province)?.region ?? ""
        return { code, value, info, region, x: xy[0], y: xy[1] }
      })
      .filter((d): d is NonNullable<typeof d> => d !== null)
  }, [geo, cityInfo, cities])

  // Picking a place flies the view to it.
  const fitBox = useCallback(
    (shape: Shape | undefined, margin: number): Box => {
      if (!geo || !shape) return FULL
      const [[x0, y0], [x1, y1]] = geo.path.bounds(shape)
      const w = x1 - x0
      const h = y1 - y0
      // Keep the box's aspect so the shape is not stretched, with a margin.
      const scale = Math.max(w / WIDTH, h / HEIGHT) * margin
      return [x0 + w / 2 - (WIDTH * scale) / 2, y0 + h / 2 - (HEIGHT * scale) / 2, WIDTH * scale, HEIGHT * scale]
    },
    [geo]
  )
  const placeBox = useMemo<Box>(() => {
    if (!geo) return FULL
    const provinceBox = province ? fitBox(geo.provinceShapes.find((s) => s.properties.code === province), 1.8) : null
    const dot = city ? cityDots.find((d) => d.code === city) : null
    if (dot) {
      // Always closer than the province it sits in: a small province is
      // already zoomed past CITY_ZOOM.
      const w = Math.min(WIDTH / CITY_ZOOM, (provinceBox?.[2] ?? WIDTH) / 2)
      const h = (w * HEIGHT) / WIDTH
      return [dot.x - w / 2, dot.y - h / 2, w, h]
    }
    if (provinceBox) return provinceBox
    if (selected) return fitBox(geo.regionShapes.find((s) => s.properties.code === selected), 1.12)
    return FULL
  }, [geo, selected, province, city, cityDots, fitBox])
  const { box: viewBox, go } = useViewBox()
  // Keyed on the numbers, not the array: a parent re-render that hands new
  // data objects must not restart the flight.
  const placeKey = placeBox.map((v) => v.toFixed(2)).join(" ")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => go(placeBox, true), [placeKey, go])
  const zoom = WIDTH / viewBox[2]

  // Free navigation on top: buttons, drag to pan, pinch, ctrl/trackpad wheel.
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const dragged = useRef(false)
  const toSvg = (clientX: number, clientY: number): [number, number] | null => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return null
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const p = pt.matrixTransform(ctm.inverse())
    return [p.x, p.y]
  }
  const zoomBy = useCallback(
    (factor: number, at?: [number, number], animate = false) => {
      go(([x, y, w, h]) => {
        const [px, py] = at ?? [x + w / 2, y + h / 2]
        return [px - (px - x) / factor, py - (py - y) / factor, w / factor, h / factor]
      }, animate)
    },
    [go]
  )

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) dragged.current = false
  }
  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const prev = pointers.current.get(e.pointerId)
    const ctm = svgRef.current?.getScreenCTM()
    if (!prev || !ctm) return
    if (pointers.current.size === 1) {
      const dx = e.clientX - prev.x
      const dy = e.clientY - prev.y
      // A few pixels of wobble is still a tap.
      if (!dragged.current && Math.hypot(dx, dy) < 4) return
      if (!dragged.current) {
        dragged.current = true
        svgRef.current?.setPointerCapture(e.pointerId)
      }
      go(([x, y, w, h]) => [x - dx / ctm.a, y - dy / ctm.d, w, h], false)
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.entries()]
      const other = a[0] === e.pointerId ? b[1] : a[1]
      const before = Math.hypot(prev.x - other.x, prev.y - other.y)
      const after = Math.hypot(e.clientX - other.x, e.clientY - other.y)
      const mid = toSvg((e.clientX + other.x) / 2, (e.clientY + other.y) / 2)
      dragged.current = true
      if (before > 0 && mid) zoomBy(after / before, mid)
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
  }
  const onPointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId)
  }

  // The wheel zooms only with ctrl/cmd (a trackpad pinch sends ctrl), so plain
  // scrolling still scrolls the page. Needs a non-passive listener.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const at = toSvg(e.clientX, e.clientY)
      if (at) zoomBy(Math.exp(-e.deltaY / 200), at)
    }
    svg.addEventListener("wheel", onWheel, { passive: false })
    return () => svg.removeEventListener("wheel", onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, zoomBy])

  // Moving between levels. Going to the place already open flies back to it
  // anyway (after panning, or back up from a level below).
  const goCountry = () => {
    setSelected(null)
    setProvince(null)
    setCity(null)
    go(FULL, true)
  }
  const goRegion = (code: string) => {
    setCity(null)
    setProvince(null)
    setSelected(code)
    if (code === selected) go(fitBox(geo?.regionShapes.find((s) => s.properties.code === code), 1.12), true)
  }
  const goProvince = (code: string) => {
    const p = HCP_PROVINCES.find((x) => x.code === code)
    if (!p) return
    setCity(null)
    setSelected(p.region)
    setProvince(code)
    if (code === province) go(fitBox(geo?.provinceShapes.find((s) => s.properties.code === code), 1.8), true)
  }
  const goCity = (code: string) => {
    const info = cityInfo?.[code]
    const p = info && HCP_PROVINCES.find((x) => x.code === info.province)
    if (!p) return
    setSelected(p.region)
    setProvince(p.code)
    setCity(code)
  }
  const goTo = (code: string) => [goRegion, goProvince, goCity][depthOf(code)](code)
  // The list is rebuilt under the pointer when the level changes, so its
  // pointer-leave never fires: drop the stale hover.
  useEffect(() => setHovered(null), [selected, province, city])

  const counts = useMemo(() => {
    const provincesPer: Record<string, number> = {}
    for (const p of HCP_PROVINCES) provincesPer[p.region] = (provincesPer[p.region] ?? 0) + 1
    const citiesPer: Record<string, number> = {}
    for (const d of cityDots) citiesPer[d.info.province] = (citiesPer[d.info.province] ?? 0) + 1
    return { provincesPer, citiesPer }
  }, [cityDots])

  const regionMax = Math.max(0, ...Object.values(regions))
  const inRegion = useMemo(() => (selected ? HCP_PROVINCES.filter((p) => p.region === selected) : []), [selected])
  const provinceMax = Math.max(0, ...inRegion.map((p) => provinces[p.code] ?? 0))
  const dotsHere = cityDots.filter((d) => (province ? d.info.province === province : d.region === selected))
  const dotMax = Math.max(0, ...dotsHere.map((d) => d.value))

  // The list always shows the level below where you are (at the last
  // level: its siblings), biggest first.
  type Row = { code: string; name: string; value: number; sub?: string; deeper: boolean }
  const rows: Row[] =
    level === "country"
      ? HCP_REGIONS.map((r) => ({
          code: r.code,
          name: nameOf(r),
          value: regions[r.code] ?? 0,
          sub: L.provincesCount(counts.provincesPer[r.code] ?? 0),
          deeper: true,
        }))
      : level === "region" || (!hasCities && level === "province")
        ? inRegion.map((p) => ({
            code: p.code,
            name: nameOf(p),
            value: provinces[p.code] ?? 0,
            sub: hasCities && counts.citiesPer[p.code] ? L.citiesCount(counts.citiesPer[p.code]) : undefined,
            deeper: hasCities,
          }))
        : dotsHere.map((d) => ({ code: d.code, name: nameOf(d.info), value: d.value, deeper: false }))
  rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
  const listMax = Math.max(0, ...rows.map((r) => r.value))

  const selectedRegion = selected ? HCP_REGIONS.find((r) => r.code === selected) : null
  const selectedProvince = province ? HCP_PROVINCES.find((p) => p.code === province) : null
  const selectedCity = city && cityInfo?.[city] ? { code: city, ...cityInfo[city] } : null
  const countryTotal = Object.values(regions).reduce((a, b) => a + b, 0)
  const here = selectedCity
    ? { name: nameOf(selectedCity), value: cities[selectedCity.code] ?? 0, parent: province ? provinces[province] ?? 0 : 0 }
    : selectedProvince
      ? { name: nameOf(selectedProvince), value: provinces[selectedProvince.code] ?? 0, parent: regions[selected!] ?? 0 }
      : selectedRegion
        ? { name: nameOf(selectedRegion), value: regions[selectedRegion.code] ?? 0, parent: 0 }
        : { name: L.allMorocco, value: countryTotal, parent: 0 }
  const share = here.parent > 0 && level !== "region" ? Math.round((here.value / here.parent) * 100) : null
  const unknownBelow =
    level === "region"
      ? data.regionOnly?.[selected!] ?? 0
      : level === "province" || level === "city"
        ? data.provinceOnly?.[province!] ?? 0
        : 0

  // A tap on the map. The end of a drag is not a tap.
  const tap = (code: string) => {
    if (dragged.current) return
    goTo(code)
  }
  const onKey = (code: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      goTo(code)
    }
  }
  const hover = (code: string) => ({
    onPointerEnter: () => setHovered(code),
    onPointerLeave: () => setHovered((h) => (h === code ? null : h)),
  })

  if (loading || !geo) {
    return (
      <div className={cx("mm-root", className)} aria-busy>
        <div className="mm-skel mm-skel-line" />
        <div className="mm-grid">
          <div className="mm-skel mm-skel-map" />
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="mm-skel mm-skel-row" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const hoverLabel = (() => {
    if (!hovered) return null
    const d = depthOf(hovered)
    if (d === 2) {
      const info = cityInfo?.[hovered]
      return info ? `${nameOf(info)} · ${fmt(cities[hovered] ?? 0)}` : null
    }
    if (d === 1) {
      const p = HCP_PROVINCES.find((x) => x.code === hovered)
      return p ? `${nameOf(p)} · ${fmt(provinces[p.code] ?? 0)}` : null
    }
    const r = HCP_REGIONS.find((x) => x.code === hovered)
    return r ? `${nameOf(r)} · ${fmt(regions[r.code] ?? 0)}` : null
  })()
  const shapeOf = (code: string | null) =>
    !code || depthOf(code) === 2
      ? undefined
      : (depthOf(code) === 1 ? geo.provinceShapes : geo.regionShapes).find((s) => s.properties.code === code)
  const hoveredShape = shapeOf(hovered)
  const selectedShape = city ? undefined : shapeOf(province)

  const crumbs: Array<{ key: string; label: string; onClick?: () => void }> = [
    { key: "country", label: L.morocco, onClick: level === "country" ? undefined : goCountry },
    ...(selectedRegion
      ? [{ key: selectedRegion.code, label: nameOf(selectedRegion), onClick: province ? () => goRegion(selectedRegion.code) : undefined }]
      : []),
    ...(selectedProvince
      ? [{ key: selectedProvince.code, label: nameOf(selectedProvince), onClick: city ? () => goProvince(selectedProvince.code) : undefined }]
      : []),
    ...(selectedCity ? [{ key: selectedCity.code, label: nameOf(selectedCity) }] : []),
  ]
  const levels: Array<{ key: Level; label: string }> = [
    { key: "country", label: L.levelCountry },
    { key: "region", label: L.levelRegion },
    { key: "province", label: L.levelProvince },
    ...(hasCities ? [{ key: "city" as const, label: L.levelCity }] : []),
  ]
  const depth = levels.findIndex((l) => l.key === level)
  const hint = {
    country: L.hintCountry,
    region: L.hintRegion,
    province: hasCities ? L.hintProvinceCities : L.hintProvince,
    city: L.hintCity,
  }[level]

  return (
    <div className={cx("mm-root", className)}>
      {/* Where you are, and how deep. Every step above the current one is a
          way back up. */}
      <div className="mm-head">
        <nav aria-label={L.breadcrumb}>
          <ol className="mm-crumbs">
            {crumbs.map((c, i) => (
              <li key={c.key} className="mm-crumb">
                {i > 0 && <Chevron />}
                {c.onClick ? (
                  <button type="button" onClick={c.onClick} className="mm-crumb-link">
                    {i === 0 && <Icon d={ICON.map} />}
                    <span className="mm-truncate">{c.label}</span>
                  </button>
                ) : (
                  <span aria-current="location" className="mm-crumb-current">
                    {i === 0 && <Icon d={ICON.map} />}
                    <span className="mm-truncate">{c.label}</span>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <ol className="mm-steps" aria-label={L.level}>
          {levels.map((l, i) => (
            <li key={l.key} className="mm-step-item">
              {i > 0 && <span className={cx("mm-step-line", i <= depth && "is-past")} aria-hidden />}
              <span
                aria-current={i === depth ? "step" : undefined}
                className={cx("mm-step", i === depth ? "is-current" : i < depth ? "is-past" : "is-next")}
              >
                {l.label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mm-grid">
        <div className="mm-mapcol">
          <svg
            ref={svgRef}
            viewBox={viewBox.join(" ")}
            className={cx("mm-svg", zoom > 1.01 && "is-zoomed")}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="group"
            aria-label={here.name}
          >
            {/* A muted base under every shade, so the faintest one still reads. */}
            {geo.regionShapes.map((s) => (
              <path key={`base-${s.properties.code}`} d={geo.path(s) ?? ""} className="mm-base" />
            ))}

            {/* Regions: shaded at country level; once one is open the others
                fade but stay tappable, to jump straight to them. */}
            {geo.regionShapes.map((s) => {
              const code = s.properties.code
              const value = regions[code] ?? 0
              const isOpen = code === selected
              const isOther = selected !== null && !isOpen
              const name = nameOf(HCP_REGIONS.find((r) => r.code === code) ?? { fr: code, ar: code })
              return (
                <path
                  key={code}
                  d={geo.path(s) ?? ""}
                  className={cx("mm-region", value > 0 && !isOther && "is-filled", !isOpen && "is-clickable")}
                  fillOpacity={isOpen ? 0 : value > 0 && !isOther ? SHADE_OPACITY[shade(value, regionMax)] : 0}
                  strokeWidth={2 / zoom}
                  role={isOpen ? undefined : "button"}
                  tabIndex={isOpen ? -1 : 0}
                  aria-label={`${name}: ${fmt(value)}`}
                  onClick={() => tap(code)}
                  onKeyDown={onKey(code)}
                  {...hover(code)}
                />
              )
            })}

            {/* Provinces of the open region, each a tap away. */}
            {selected &&
              geo.provinceShapes
                .filter((s) => s.properties.region === selected)
                .map((s) => {
                  const code = s.properties.code
                  const value = provinces[code] ?? 0
                  const p = HCP_PROVINCES.find((x) => x.code === code)
                  return (
                    <path
                      key={code}
                      d={geo.path(s) ?? ""}
                      className={cx("mm-province", value > 0 && "is-filled", province !== null && code !== province && "is-dim")}
                      fillOpacity={value > 0 ? SHADE_OPACITY[shade(value, provinceMax)] : 1}
                      strokeWidth={1 / zoom}
                      role="button"
                      tabIndex={0}
                      aria-label={`${p ? nameOf(p) : code}: ${fmt(value)}`}
                      aria-pressed={code === province}
                      onClick={() => tap(code)}
                      onKeyDown={onKey(code)}
                      {...hover(code)}
                    />
                  )
                })}

            <path d={geo.regionBorders} className="mm-borders" strokeWidth={1.5 / zoom} />
            <path d={geo.outline} className="mm-outline" strokeWidth={1 / zoom} />

            {/* The chosen province, then whatever the pointer is on, outlined
                on top so it reads as "this one". */}
            {selectedShape && <path d={geo.path(selectedShape) ?? ""} className="mm-selected" strokeWidth={2.5 / zoom} />}
            {hoveredShape && hoveredShape !== selectedShape && (
              <path d={geo.path(hoveredShape) ?? ""} className="mm-hovered" strokeWidth={1.5 / zoom} />
            )}

            {/* Cities of the open region: dots sized by their count, named
                once a province is open. Sizes are in screen pixels. */}
            {selected &&
              [...dotsHere]
                .sort((a, b) => b.value - a.value)
                .map((d, i) => {
                  const k = Math.sqrt(d.value / (dotMax || 1))
                  const r = (level === "region" ? 2.5 + 5 * k : 4 + 9 * k) / zoom
                  const isCurrent = d.code === city
                  const isHot = isCurrent || hovered === d.code
                  const showLabel = level !== "region" && (i < CITY_LABELS || isHot)
                  return (
                    <g key={d.code}>
                      <circle
                        cx={d.x}
                        cy={d.y}
                        r={r}
                        className={cx("mm-dot", isHot && "is-hot", city && !isCurrent && "is-dim")}
                        strokeWidth={(isCurrent ? 3 : 1.5) / zoom}
                        role="button"
                        tabIndex={0}
                        aria-label={`${nameOf(d.info)}: ${fmt(d.value)}`}
                        aria-pressed={isCurrent}
                        onClick={() => tap(d.code)}
                        onKeyDown={onKey(d.code)}
                        {...hover(d.code)}
                      />
                      {showLabel && (
                        <text
                          x={d.x + r + 3 / zoom}
                          y={d.y}
                          dominantBaseline="middle"
                          className={cx("mm-dot-label", isCurrent && "is-current")}
                          style={{ fontSize: 11 / zoom }}
                          strokeWidth={3 / zoom}
                        >
                          {nameOf(d.info)}
                        </text>
                      )}
                    </g>
                  )
                })}
          </svg>

          <div className="mm-zoom">
            <button type="button" className="mm-zoom-btn" aria-label={L.zoomIn} title={L.zoomIn} disabled={zoom >= MAX_ZOOM - 0.01} onClick={() => zoomBy(STEP, undefined, true)}>
              <Icon d={ICON.plus} />
            </button>
            <button type="button" className="mm-zoom-btn" aria-label={L.zoomOut} title={L.zoomOut} disabled={zoom <= 1.01} onClick={() => zoomBy(1 / STEP, undefined, true)}>
              <Icon d={ICON.minus} />
            </button>
            <button type="button" className="mm-zoom-btn" aria-label={L.allMorocco} title={L.allMorocco} disabled={zoom <= 1.01 && level === "country"} onClick={goCountry}>
              <Icon d={ICON.fit} />
            </button>
          </div>

          {hoverLabel && (
            <div className="mm-tip">
              <bdi>{hoverLabel}</bdi>
            </div>
          )}
          <p className="mm-hint">
            <Icon d={ICON.pointer} />
            {hint}
          </p>
        </div>

        <div className="mm-side">
          <div>
            <p className="mm-here">
              {here.name} · <bdi className="mm-num">{fmt(here.value)}</bdi>
            </p>
            {share !== null && <p className="mm-note">{level === "city" ? L.shareOfProvince(share) : L.shareOfRegion(share)}</p>}
          </div>

          {rows.length === 0 ? (
            <p className="mm-empty">{L.noCities}</p>
          ) : (
            <ul className="mm-list">
              {rows.map((row) => {
                const isCurrent = row.code === province || row.code === city
                return (
                  <li key={row.code}>
                    <button
                      type="button"
                      onClick={() => goTo(row.code)}
                      {...hover(row.code)}
                      aria-current={isCurrent ? "location" : undefined}
                      className={cx("mm-row", hovered === row.code && "is-hover", isCurrent && "is-current", row.value === 0 && !isCurrent && "is-zero")}
                    >
                      <span className="mm-row-name">
                        <span className="mm-truncate">{row.name}</span>
                        {row.sub && <span className="mm-row-sub">{row.sub}</span>}
                      </span>
                      <span className="mm-bar">
                        <span className="mm-bar-fill" style={{ width: `${listMax ? (row.value / listMax) * 100 : 0}%` }} />
                      </span>
                      <bdi className="mm-row-value mm-num">{row.value ? fmt(row.value) : "–"}</bdi>
                      {/* A chevron means there is a level below; none, the last level. */}
                      {row.deeper ? <Chevron /> : <span className="mm-chev" aria-hidden />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {unknownBelow > 0 && (
            <p className="mm-note">{level === "region" ? L.regionOnly(fmt(unknownBelow)) : L.provinceOnly(fmt(unknownBelow))}</p>
          )}
          {footer}
        </div>
      </div>
    </div>
  )
}

/** Keeps a box on the map: no further out than all of Morocco, no further in than MAX_ZOOM. */
function clampBox([x, y, w]: Box): Box {
  const width = Math.min(WIDTH, Math.max(WIDTH / MAX_ZOOM, w))
  if (width >= WIDTH - 0.01) return FULL
  const height = (width * HEIGHT) / WIDTH
  // The centre may go anywhere over the map, never off it.
  const cxp = Math.min(WIDTH, Math.max(0, x + w / 2))
  const cyp = Math.min(HEIGHT, Math.max(0, y + (w * HEIGHT) / WIDTH / 2))
  return [cxp - width / 2, cyp - height / 2, width, height]
}

/**
 * The visible part of the map. `go` takes a box or a function of the current
 * one. Animated moves ease over ~400 ms (skipped for reduced motion); direct
 * ones (drag, pinch, wheel) follow the hand.
 */
function useViewBox() {
  const [box, setBox] = useState<Box>(FULL)
  // What is on screen, and where the view is heading. A move made
  // mid-animation starts from the goal, so "+" right after a tap zooms
  // into that place, not into wherever the animation had got to.
  const shown = useRef<Box>(FULL)
  const goal = useRef<Box>(FULL)
  const frame = useRef(0)
  const landing = useRef<ReturnType<typeof setTimeout>>()

  const show = (b: Box) => {
    shown.current = b
    setBox(b)
  }
  const stop = () => {
    cancelAnimationFrame(frame.current)
    clearTimeout(landing.current)
  }

  const go = useCallback((next: Box | ((b: Box) => Box), animate: boolean) => {
    stop()
    const target = clampBox(typeof next === "function" ? next(goal.current) : next)
    goal.current = target
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (!animate || reduce) return show(target)

    const start = shown.current
    const t0 = performance.now()
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 400)
      const e = 1 - Math.pow(1 - k, 3)
      show(start.map((v, i) => v + (target[i] - v) * e) as Box)
      if (k < 1) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
    // A hidden tab runs no animation frames; land on the target anyway.
    landing.current = setTimeout(() => {
      cancelAnimationFrame(frame.current)
      show(target)
    }, 450)
  }, [])

  useEffect(() => stop, [])
  return { box, go }
}
