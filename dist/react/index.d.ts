import * as react from 'react';
import { ReactNode } from 'react';

/** Every word the map shows, in the four languages our apps speak. */
interface MoroccoMapLabels {
    morocco: string;
    allMorocco: string;
    breadcrumb: string;
    level: string;
    levelCountry: string;
    levelRegion: string;
    levelProvince: string;
    levelCity: string;
    hintCountry: string;
    hintRegion: string;
    /** At province level when the map has no city data. */
    hintProvince: string;
    hintProvinceCities: string;
    hintCity: string;
    zoomIn: string;
    zoomOut: string;
    noCities: string;
    provincesCount: (n: number) => string;
    citiesCount: (n: number) => string;
    shareOfRegion: (percent: number) => string;
    shareOfProvince: (percent: number) => string;
    /** `value` arrives already formatted. */
    regionOnly: (value: string) => string;
    provinceOnly: (value: string) => string;
}
type MoroccoMapLocale = "fr" | "ar" | "ary" | "en";
declare const MOROCCO_MAP_LABELS: Record<MoroccoMapLocale, MoroccoMapLabels>;

/** What the map shows, keyed by HCP code. Same shape as `PlaceCounts`. */
interface MoroccoMapData {
    regions: Record<string, number>;
    provinces: Record<string, number>;
    /** Per commune ("city"). Without it, the map stops at provinces. */
    cities?: Record<string, number>;
    /** Per region: counted there, but no province is known. */
    regionOnly?: Record<string, number>;
    /** Per province: counted there, but no city is known. */
    provinceOnly?: Record<string, number>;
}
/** Where to draw a city, and what to call it. Same shape as `CommunePoint`. */
interface MoroccoCity {
    province: string;
    fr: string;
    ar: string;
    lng: number | null;
    lat: number | null;
}
interface MoroccoHeatMapProps {
    data: MoroccoMapData;
    /** Name and point per commune code in `data.cities`. */
    cityInfo?: Record<string, MoroccoCity>;
    /** Words and place names: "ar"/"ary" use Arabic names. Default "fr". */
    locale?: MoroccoMapLocale;
    /** Override any word of the locale. */
    labels?: Partial<MoroccoMapLabels>;
    /** How a value reads (count, DH...). Defaults to a plain number. */
    formatValue?: (value: number) => string;
    /** Shown under the list, e.g. "City unknown: 12". */
    footer?: ReactNode;
    loading?: boolean;
    className?: string;
}
declare function MoroccoHeatMap({ data, cityInfo, locale, labels, formatValue, footer, loading, className, }: MoroccoHeatMapProps): react.JSX.Element;

export { MOROCCO_MAP_LABELS, type MoroccoCity, MoroccoHeatMap, type MoroccoHeatMapProps, type MoroccoMapData, type MoroccoMapLabels, type MoroccoMapLocale };
