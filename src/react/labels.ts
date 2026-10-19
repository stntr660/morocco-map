/** Every word the map shows, in the four languages our apps speak. */
export interface MoroccoMapLabels {
  morocco: string
  allMorocco: string
  breadcrumb: string
  level: string
  levelCountry: string
  levelRegion: string
  levelProvince: string
  levelCity: string
  hintCountry: string
  hintRegion: string
  /** At province level when the map has no city data. */
  hintProvince: string
  hintProvinceCities: string
  hintCity: string
  zoomIn: string
  zoomOut: string
  noCities: string
  provincesCount: (n: number) => string
  citiesCount: (n: number) => string
  shareOfRegion: (percent: number) => string
  shareOfProvince: (percent: number) => string
  /** `value` arrives already formatted. */
  regionOnly: (value: string) => string
  provinceOnly: (value: string) => string
}

export type MoroccoMapLocale = "fr" | "ar" | "ary" | "en"

export const MOROCCO_MAP_LABELS: Record<MoroccoMapLocale, MoroccoMapLabels> = {
  fr: {
    morocco: "Maroc",
    allMorocco: "Tout le Maroc",
    breadcrumb: "Où vous êtes",
    level: "Niveau",
    levelCountry: "Pays",
    levelRegion: "Région",
    levelProvince: "Province",
    levelCity: "Ville",
    hintCountry: "Touchez une région pour voir ses provinces",
    hintRegion: "Touchez une province pour la voir de près",
    hintProvince: "Touchez une autre province, ou remontez par le chemin ci-dessus",
    hintProvinceCities: "Touchez une ville pour la voir de près",
    hintCity: "Touchez une autre ville, ou remontez par le chemin ci-dessus",
    zoomIn: "Zoomer",
    zoomOut: "Dézoomer",
    noCities: "Aucune ville connue ici pour l'instant.",
    provincesCount: (n) => `${n} provinces`,
    citiesCount: (n) => (n === 1 ? "1 ville" : `${n} villes`),
    shareOfRegion: (p) => `${p} % de la région`,
    shareOfProvince: (p) => `${p} % de la province`,
    regionOnly: (v) => `Dans cette région, province inconnue : ${v}`,
    provinceOnly: (v) => `Dans cette province, ville inconnue : ${v}`,
  },
  ar: {
    morocco: "المغرب",
    allMorocco: "المغرب كاملاً",
    breadcrumb: "موقعك",
    level: "المستوى",
    levelCountry: "البلد",
    levelRegion: "الجهة",
    levelProvince: "الإقليم",
    levelCity: "المدينة",
    hintCountry: "اضغط على جهة لرؤية أقاليمها",
    hintRegion: "اضغط على إقليم لرؤيته عن قرب",
    hintProvince: "اضغط على إقليم آخر، أو ارجع عبر المسار أعلاه",
    hintProvinceCities: "اضغط على مدينة لرؤيتها عن قرب",
    hintCity: "اضغط على مدينة أخرى، أو ارجع عبر المسار أعلاه",
    zoomIn: "تكبير",
    zoomOut: "تصغير",
    noCities: "لا توجد بعد أي مدينة معروفة هنا.",
    provincesCount: (n) => `${n} أقاليم`,
    citiesCount: (n) => (n === 1 ? "مدينة واحدة" : `${n} مدن`),
    shareOfRegion: (p) => `${p}% من الجهة`,
    shareOfProvince: (p) => `${p}% من الإقليم`,
    regionOnly: (v) => `في هذه الجهة دون إقليم معروف: ${v}`,
    provinceOnly: (v) => `في هذا الإقليم دون مدينة معروفة: ${v}`,
  },
  ary: {
    morocco: "المغرب",
    allMorocco: "المغرب كامل",
    breadcrumb: "فين نتا",
    level: "المستوى",
    levelCountry: "البلاد",
    levelRegion: "الجهة",
    levelProvince: "الإقليم",
    levelCity: "المدينة",
    hintCountry: "ورك على جهة باش تشوف الأقاليم ديالها",
    hintRegion: "ورك على إقليم باش تشوفو من قريب",
    hintProvince: "ورك على إقليم آخر، ولا رجع من الطريق لفوق",
    hintProvinceCities: "ورك على مدينة باش تشوفها من قريب",
    hintCity: "ورك على مدينة أخرى، ولا رجع من الطريق لفوق",
    zoomIn: "قرّب",
    zoomOut: "بعّد",
    noCities: "مازال ما كاينة حتى مدينة معروفة هنا.",
    provincesCount: (n) => `${n} أقاليم`,
    citiesCount: (n) => (n === 1 ? "مدينة وحدة" : `${n} مدن`),
    shareOfRegion: (p) => `${p}% من الجهة`,
    shareOfProvince: (p) => `${p}% من الإقليم`,
    regionOnly: (v) => `فهاد الجهة بلا إقليم معروف: ${v}`,
    provinceOnly: (v) => `فهاد الإقليم بلا مدينة معروفة: ${v}`,
  },
  en: {
    morocco: "Morocco",
    allMorocco: "All of Morocco",
    breadcrumb: "Where you are",
    level: "Level",
    levelCountry: "Country",
    levelRegion: "Region",
    levelProvince: "Province",
    levelCity: "City",
    hintCountry: "Tap a region to see its provinces",
    hintRegion: "Tap a province to see it up close",
    hintProvince: "Tap another province, or go back up with the path above",
    hintProvinceCities: "Tap a city to see it up close",
    hintCity: "Tap another city, or go back up with the path above",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    noCities: "No known city here yet.",
    provincesCount: (n) => `${n} provinces`,
    citiesCount: (n) => (n === 1 ? "1 city" : `${n} cities`),
    shareOfRegion: (p) => `${p}% of the region`,
    shareOfProvince: (p) => `${p}% of the province`,
    regionOnly: (v) => `In this region, province unknown: ${v}`,
    provinceOnly: (v) => `In this province, city unknown: ${v}`,
  },
}
