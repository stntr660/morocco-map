import { describe, expect, it } from "vitest"
import {
  HCP_PROVINCES,
  HCP_REGIONS,
  cityPoints,
  communePoint,
  countPlaces,
  createPlacer,
  placeCity,
} from "../src/index"
import topology from "../src/data/morocco.topo.json"

describe("placeCity", () => {
  it.each([
    ["Casablanca", "06", "06.141"],
    ["الدار البيضاء", "06", "06.141"],
    ["casa", "06", "06.141"],
    ["Fès", "03", "03.231"],
    ["fes", "03", "03.231"],
    ["فاس", "03", "03.231"],
    ["Meknès", "03", "03.061"],
    ["مكناس", "03", "03.061"],
    ["Tanger", "01", "01.511"],
    ["طنجة", "01", "01.511"],
    ["Salé", "04", "04.441"],
    ["Laâyoune", "11", "11.321"],
    ["العيون", "11", "11.321"],
    ["Smara", "11", "11.221"],
    ["Dakhla", "12", "12.391"],
    ["الداخلة", "12", "12.391"],
    ["Lagouira", "12", "12.066"],
    ["  marrakech ", "07", "07.351"],
  ])("%s -> region %s, province %s", (text, region, province) => {
    expect(placeCity(text)).toMatchObject({ region, province })
  })

  it("names the city (commune), even where a province shares its name", () => {
    const settat = placeCity("Settat")
    expect(settat).toMatchObject({ region: "06", province: "06.461" })
    expect(communePoint(settat!.commune!)?.fr).toBe("Settat")
    expect(communePoint(placeCity("الدار البيضاء")!.commune!)?.fr).toBe("Casablanca")
    expect(placeCity("Al Haouz")).toEqual({ region: "07", province: "07.041", commune: null })
  })

  it("knows urban centres the census counts under another commune", () => {
    // A town that is not a commune: the census counts it under Sidi Lyamani.
    const tnine = placeCity("Tnine Sidi Lyamani")
    expect(tnine).toMatchObject({ region: "01", province: "01.511" })
    expect(communePoint(tnine!.commune!)?.fr).toBe("Sidi Lyamani")
  })

  it("gives every city a point", () => {
    const point = communePoint(placeCity("Agadir")!.commune!)
    expect(point?.lng).toBeCloseTo(-9.6, 0)
    expect(point?.lat).toBeCloseTo(30.4, 0)
  })

  it("does not guess", () => {
    expect(placeCity("xyz")).toBeNull()
    expect(placeCity("")).toBeNull()
    expect(placeCity(null)).toBeNull()
  })
})

describe("createPlacer", () => {
  it("settles a name two regions share by the app's hint", () => {
    // Ajdir is in Al Hoceima (01) and in Taza (03).
    const placer = createPlacer({ regionHints: [{ name: "Ajdir", region: "1" }] })
    expect(placer("Ajdir")?.region).toBe("01")
  })

  it("places a hinted village the census does not list, to its region only", () => {
    const placer = createPlacer({ regionHints: [{ name: "Akchour", region: "01" }] })
    expect(placer("Akchour")).toEqual({ region: "01", province: null, commune: null })
    expect(placeCity("Akchour")).toBeNull()
  })

  it("matches a close spelling only inside the hinted region", () => {
    const placer = createPlacer({ regionHints: [{ name: "Ouazzane", region: "01" }] })
    expect(placer("Ouazzane")).toMatchObject({ region: "01", province: "01.405" })
  })

  it("takes the app's own aliases", () => {
    const placer = createPlacer({ aliases: { "dar lbida": "Casablanca" } })
    expect(placer("Dar Lbida")).toMatchObject({ province: "06.141" })
  })
})

describe("countPlaces", () => {
  it("counts each level and drops nothing", () => {
    const placer = createPlacer({ regionHints: [{ name: "Akchour", region: "01" }] })
    const c = countPlaces(
      [
        { city: "Casablanca", value: 3 },
        { city: "casa", value: 2 },
        { city: "Al Haouz" },
        { city: "Akchour", value: 4 },
        { city: "xyz", value: 5 },
        { city: null, value: 6 },
      ],
      { placer }
    )
    expect(c.total).toBe(21)
    expect(c.unplaced).toBe(11)
    expect(c.regions["06"]).toBe(5)
    expect(c.provinces["06.141"]).toBe(5)
    expect(Object.values(c.cities)).toEqual([5])
    expect(c.provinceOnly["07.041"]).toBe(1)
    expect(c.regionOnly["01"]).toBe(4)
    expect(Object.keys(cityPoints(c))).toHaveLength(1)
  })

  it("rounds money once, at the end", () => {
    const c = countPlaces(
      [
        { city: "Rabat", value: 0.1 },
        { city: "Rabat", value: 0.2 },
      ],
      { round: (v) => Math.round(v * 100) / 100 }
    )
    expect(c.provinces["04.421"]).toBe(0.3)
  })
})

describe("map file", () => {
  const objects = (topology as any).objects

  it("has all 12 regions, the south included", () => {
    const codes = objects.regions.geometries.map((g: any) => g.properties.code).sort()
    expect(codes).toEqual(HCP_REGIONS.map((r) => r.code).sort())
    expect(codes).toEqual(expect.arrayContaining(["10", "11", "12"]))
  })

  it("has one shape per province, each in its census region", () => {
    const shapes = objects.provinces.geometries.map((g: any) => g.properties)
    expect(shapes).toHaveLength(75)
    for (const p of HCP_PROVINCES) {
      expect(shapes.find((s: any) => s.code === p.code)?.region).toBe(p.region)
    }
  })
})
