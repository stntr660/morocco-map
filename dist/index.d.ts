declare const HCP_REGIONS: ReadonlyArray<{
    code: string;
    fr: string;
    ar: string;
}>;
/** Casablanca's 8 préfectures d'arrondissements are left out: the map draws Casablanca whole. */
declare const HCP_PROVINCES: ReadonlyArray<{
    code: string;
    region: string;
    fr: string;
    ar: string;
}>;

/**
 * [commune code, province code, French name, Arabic name, 2024 population,
 *  longitude, latitude, urban-centre names]. The point is the commune's
 *  centroid, rounded to ~100 m; null for the one commune OSM has no shape for.
 */
declare const HCP_COMMUNES: ReadonlyArray<readonly [string, string, string, string, number, number | null, number | null, readonly string[]]>;

interface PlacedLocation {
    region: string;
    /** Null when only the region is known (a hint entry with no commune). */
    province: string | null;
    /** Null when only the province is known ("Al Haouz") or less. */
    commune: string | null;
}
interface CommunePoint {
    code: string;
    province: string;
    fr: string;
    ar: string;
    /** The commune's centre point. Null for the one commune with no shape. */
    lng: number | null;
    lat: number | null;
}
interface PlacerOptions {
    /**
     * Cities your app already knows the region of, e.g. the list behind a
     * city picker. They settle a name two regions share ("Ajdir" is in Al
     * Hoceima and in Taza), place a village the census does not list as a
     * commune at least to its region, and allow a one-or-two-letter spelling
     * match inside that region ("Ouazzane" / "Ouezzane").
     */
    regionHints?: Array<{
        name: string;
        region: string;
    }>;
    /** Extra spellings people type, mapped to a census name: { casa: "Casablanca" }. */
    aliases?: Record<string, string>;
}
/** One key for both scripts: Latin folded and stripped, Arabic normalised. */
declare function placeKey(text: string): string;
/** Names people type that are not the census spelling. */
declare const DEFAULT_ALIASES: Record<string, string>;
/** Name and centre point of a commune, for drawing it on the map. */
declare function communePoint(code: string): CommunePoint | null;
type PlaceCity = (text: string | null | undefined) => PlacedLocation | null;
/** A placer with your app's own hints and aliases. Build it once and reuse it. */
declare function createPlacer(options?: PlacerOptions): PlaceCity;
/** A placer with no app hints: census names, urban centres and the default aliases. */
declare const placeCity: PlaceCity;

/**
 * Counts anything that has a city into the map's levels: region, province,
 * city (commune). Hand rows of (typed city, value) and get back what
 * <MoroccoHeatMap data={...} /> draws.
 *
 * Nothing is dropped. A row placed only as far as its region or province is
 * counted there and in `regionOnly` / `provinceOnly`; a row that cannot be
 * placed at all is in `unplaced`.
 */

interface PlaceCounts {
    /** Keyed by HCP region code ("06"). */
    regions: Record<string, number>;
    /** Keyed by HCP province code ("06.141"). */
    provinces: Record<string, number>;
    /** Keyed by HCP commune code ("06.141.01.0"). */
    cities: Record<string, number>;
    /** Per region: counted in it, but no province is known. */
    regionOnly: Record<string, number>;
    /** Per province: counted in it, but no city is known. */
    provinceOnly: Record<string, number>;
    unplaced: number;
    total: number;
}
interface PlaceRow {
    city: string | null | undefined;
    /** Defaults to 1: one row, one record. */
    value?: number;
}
interface CountOptions {
    /** Your placer from createPlacer(); the default knows no app hints. */
    placer?: PlaceCity;
    /** Applied once to every sum at the end, e.g. to cents for money. */
    round?: (v: number) => number;
}
declare function emptyPlaceCounts(): PlaceCounts;
declare function countPlaces(rows: Iterable<PlaceRow>, options?: CountOptions): PlaceCounts;
/** Name and point of every city that has a count, so the map can draw them. */
declare function cityPoints(...counts: PlaceCounts[]): Record<string, CommunePoint>;

export { type CommunePoint, type CountOptions, DEFAULT_ALIASES, HCP_COMMUNES, HCP_PROVINCES, HCP_REGIONS, type PlaceCity, type PlaceCounts, type PlaceRow, type PlacedLocation, type PlacerOptions, cityPoints, communePoint, countPlaces, createPlacer, emptyPlaceCounts, placeCity, placeKey };
