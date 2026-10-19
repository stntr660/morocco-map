"use client";

// src/react/MoroccoHeatMap.tsx
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { geoMercator, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";

// src/data/admin.ts
var HCP_REGIONS = [{ "code": "01", "fr": "Tanger-T\xE9touan-Al Hoceima", "ar": "\u0637\u0646\u062C\u0629-\u062A\u0637\u0648\u0627\u0646-\u0627\u0644\u062D\u0633\u064A\u0645\u0629" }, { "code": "02", "fr": "Oriental", "ar": "\u0627\u0644\u0634\u0631\u0642" }, { "code": "03", "fr": "F\xE8s-Mekn\xE8s", "ar": "\u0641\u0627\u0633-\u0645\u0643\u0646\u0627\u0633" }, { "code": "04", "fr": "Rabat-Sal\xE9-K\xE9nitra", "ar": "\u0627\u0644\u0631\u0628\u0627\u0637-\u0633\u0644\u0627-\u0627\u0644\u0642\u0646\u064A\u0637\u0631\u0629" }, { "code": "05", "fr": "B\xE9ni Mellal-Kh\xE9nifra", "ar": "\u0628\u0646\u064A \u0645\u0644\u0627\u0644-\u062E\u0646\u064A\u0641\u0631\u0629" }, { "code": "06", "fr": "Casablanca-Settat", "ar": "\u0627\u0644\u062F\u0627\u0631 \u0627\u0644\u0628\u064A\u0636\u0627\u0621-\u0633\u0637\u0627\u062A" }, { "code": "07", "fr": "Marrakech-Safi", "ar": "\u0645\u0631\u0627\u0643\u0634-\u0622\u0633\u0641\u064A" }, { "code": "08", "fr": "Dr\xE2a-Tafilalet", "ar": "\u062F\u0631\u0639\u0629-\u062A\u0627\u0641\u064A\u0644\u0627\u0644\u062A" }, { "code": "09", "fr": "Souss-Massa", "ar": "\u0633\u0648\u0633-\u0645\u0627\u0633\u0629" }, { "code": "10", "fr": "Guelmim-Oued Noun", "ar": "\u0643\u0644\u0645\u064A\u0645-\u0648\u0627\u062F \u0646\u0648\u0646" }, { "code": "11", "fr": "La\xE2youne-Sakia El Hamra", "ar": "\u0627\u0644\u0639\u064A\u0648\u0646-\u0627\u0644\u0633\u0627\u0642\u064A\u0629 \u0627\u0644\u062D\u0645\u0631\u0627\u0621" }, { "code": "12", "fr": "Dakhla-Oued Ed-Dahab", "ar": "\u0627\u0644\u062F\u0627\u062E\u0644\u0629-\u0648\u0627\u062F\u064A \u0627\u0644\u0630\u0647\u0628" }];
var HCP_PROVINCES = [{ "code": "01.511", "region": "01", "fr": "Tanger-Assilah", "ar": "\u0637\u0646\u062C\u0629-\u0623\u0635\u064A\u0644\u0629" }, { "code": "01.573", "region": "01", "fr": "M'diq-Fnideq", "ar": "\u0627\u0644\u0645\u0636\u064A\u0642-\u0627\u0644\u0641\u0646\u064A\u062F\u0642" }, { "code": "01.571", "region": "01", "fr": "T\xE9touan", "ar": "\u062A\u0637\u0648\u0627\u0646" }, { "code": "01.227", "region": "01", "fr": "Fahs-Anjra", "ar": "\u0627\u0644\u0641\u062D\u0635-\u0623\u0646\u062C\u0631\u0629" }, { "code": "01.331", "region": "01", "fr": "Larache", "ar": "\u0627\u0644\u0639\u0631\u0627\u0626\u0634" }, { "code": "01.051", "region": "01", "fr": "Al Hoceima", "ar": "\u0627\u0644\u062D\u0633\u064A\u0645\u0629" }, { "code": "01.151", "region": "01", "fr": "Chefchaouen", "ar": "\u0634\u0641\u0634\u0627\u0648\u0646" }, { "code": "01.405", "region": "01", "fr": "Ouezzane", "ar": "\u0648\u0632\u0627\u0646" }, { "code": "02.411", "region": "02", "fr": "Oujda-Angad", "ar": "\u0648\u062C\u062F\u0629-\u0623\u0646\u062C\u0627\u062F" }, { "code": "02.381", "region": "02", "fr": "Nador", "ar": "\u0627\u0644\u0646\u0627\u0636\u0648\u0631" }, { "code": "02.167", "region": "02", "fr": "Driouch", "ar": "\u0627\u0644\u062F\u0631\u064A\u0648\u0634" }, { "code": "02.275", "region": "02", "fr": "Jerada", "ar": "\u062C\u0631\u0627\u062F\u0629" }, { "code": "02.113", "region": "02", "fr": "Berkane", "ar": "\u0628\u0631\u0643\u0627\u0646" }, { "code": "02.533", "region": "02", "fr": "Taourirt", "ar": "\u062A\u0627\u0648\u0631\u064A\u0631\u062A" }, { "code": "02.265", "region": "02", "fr": "Guercif", "ar": "\u062C\u0631\u0633\u064A\u0641" }, { "code": "02.251", "region": "02", "fr": "Figuig", "ar": "\u0641\u062C\u064A\u062C" }, { "code": "03.231", "region": "03", "fr": "F\xE8s", "ar": "\u0641\u0627\u0633" }, { "code": "03.061", "region": "03", "fr": "Mekn\xE8s", "ar": "\u0645\u0643\u0646\u0627\u0633" }, { "code": "03.171", "region": "03", "fr": "El Hajeb", "ar": "\u0627\u0644\u062D\u0627\u062C\u0628" }, { "code": "03.271", "region": "03", "fr": "Ifrane", "ar": "\u0625\u0641\u0631\u0627\u0646" }, { "code": "03.591", "region": "03", "fr": "Moulay Yacoub", "ar": "\u0645\u0648\u0644\u0627\u064A \u064A\u0639\u0642\u0648\u0628" }, { "code": "03.451", "region": "03", "fr": "Sefrou", "ar": "\u0635\u0641\u0631\u0648" }, { "code": "03.131", "region": "03", "fr": "Boulemane", "ar": "\u0628\u0648\u0644\u0645\u0627\u0646" }, { "code": "03.531", "region": "03", "fr": "Taounate", "ar": "\u062A\u0627\u0648\u0646\u0627\u062A" }, { "code": "03.561", "region": "03", "fr": "Taza", "ar": "\u062A\u0627\u0632\u0629" }, { "code": "04.421", "region": "04", "fr": "Rabat", "ar": "\u0627\u0644\u0631\u0628\u0627\u0637" }, { "code": "04.441", "region": "04", "fr": "Sal\xE9", "ar": "\u0633\u0644\u0627" }, { "code": "04.501", "region": "04", "fr": "Skhirate-T\xE9mara", "ar": "\u0627\u0644\u0635\u062E\u064A\u0631\u0627\u062A-\u062A\u0645\u0627\u0631\u0629" }, { "code": "04.281", "region": "04", "fr": "K\xE9nitra", "ar": "\u0627\u0644\u0642\u0646\u064A\u0637\u0631\u0629" }, { "code": "04.291", "region": "04", "fr": "Kh\xE9misset", "ar": "\u0627\u0644\u062E\u0645\u064A\u0633\u0627\u062A" }, { "code": "04.481", "region": "04", "fr": "Sidi Kacem", "ar": "\u0633\u064A\u062F\u064A \u0642\u0627\u0633\u0645" }, { "code": "04.491", "region": "04", "fr": "Sidi Slimane", "ar": "\u0633\u064A\u062F\u064A \u0633\u0644\u064A\u0645\u0627\u0646" }, { "code": "05.091", "region": "05", "fr": "B\xE9ni Mellal", "ar": "\u0628\u0646\u064A \u0645\u0644\u0627\u0644" }, { "code": "05.081", "region": "05", "fr": "Azilal", "ar": "\u0623\u0632\u064A\u0644\u0627\u0644" }, { "code": "05.255", "region": "05", "fr": "Fquih Ben Salah", "ar": "\u0627\u0644\u0641\u0642\u064A\u0647 \u0628\u0646 \u0635\u0627\u0644\u062D" }, { "code": "05.301", "region": "05", "fr": "Kh\xE9nifra", "ar": "\u062E\u0646\u064A\u0641\u0631\u0629" }, { "code": "05.311", "region": "05", "fr": "Khouribga", "ar": "\u062E\u0631\u064A\u0628\u0643\u0629" }, { "code": "06.141", "region": "06", "fr": "Casablanca", "ar": "\u0627\u0644\u062F\u0627\u0631 \u0627\u0644\u0628\u064A\u0636\u0627\u0621" }, { "code": "06.371", "region": "06", "fr": "Mohammadia", "ar": "\u0627\u0644\u0645\u062D\u0645\u062F\u064A\u0629" }, { "code": "06.181", "region": "06", "fr": "El Jadida", "ar": "\u0627\u0644\u062C\u062F\u064A\u062F\u0629" }, { "code": "06.385", "region": "06", "fr": "Nouaceur", "ar": "\u0627\u0644\u0646\u0648\u0627\u0635\u0631" }, { "code": "06.355", "region": "06", "fr": "M\xE9diouna", "ar": "\u0645\u062F\u064A\u0648\u0646\u0629" }, { "code": "06.111", "region": "06", "fr": "Benslimane", "ar": "\u0628\u0646\u0633\u0644\u064A\u0645\u0627\u0646" }, { "code": "06.117", "region": "06", "fr": "Berrechid", "ar": "\u0628\u0631\u0634\u064A\u062F" }, { "code": "06.461", "region": "06", "fr": "Settat", "ar": "\u0633\u0637\u0627\u062A" }, { "code": "06.467", "region": "06", "fr": "Sidi Bennour", "ar": "\u0633\u064A\u062F\u064A \u0628\u0646\u0648\u0631" }, { "code": "07.351", "region": "07", "fr": "Marrakech", "ar": "\u0645\u0631\u0627\u0643\u0634" }, { "code": "07.161", "region": "07", "fr": "Chichaoua", "ar": "\u0634\u064A\u0634\u0627\u0648\u0629" }, { "code": "07.041", "region": "07", "fr": "Al Haouz", "ar": "\u0627\u0644\u062D\u0648\u0632" }, { "code": "07.191", "region": "07", "fr": "El Kel\xE2a Des-Sraghna", "ar": "\u0642\u0644\u0639\u0629 \u0627\u0644\u0633\u0631\u0627\u063A\u0646\u0629" }, { "code": "07.211", "region": "07", "fr": "Essaouira", "ar": "\u0627\u0644\u0635\u0648\u064A\u0631\u0629" }, { "code": "07.427", "region": "07", "fr": "Rehamna", "ar": "\u0627\u0644\u0631\u062D\u0627\u0645\u0646\u0629" }, { "code": "07.431", "region": "07", "fr": "Safi", "ar": "\u0622\u0633\u0641\u064A" }, { "code": "07.585", "region": "07", "fr": "Youssoufia", "ar": "\u0627\u0644\u064A\u0648\u0633\u0641\u064A\u0629" }, { "code": "08.201", "region": "08", "fr": "Errachidia", "ar": "\u0627\u0644\u0631\u0634\u064A\u062F\u064A\u0629" }, { "code": "08.401", "region": "08", "fr": "Ouarzazate", "ar": "\u0648\u0631\u0632\u0627\u0632\u0627\u062A" }, { "code": "08.363", "region": "08", "fr": "Midelt", "ar": "\u0645\u064A\u062F\u0644\u062A" }, { "code": "08.577", "region": "08", "fr": "Tinghir", "ar": "\u062A\u0646\u063A\u064A\u0631" }, { "code": "08.587", "region": "08", "fr": "Zagora", "ar": "\u0632\u0627\u0643\u0648\u0631\u0629" }, { "code": "09.001", "region": "09", "fr": "Agadir-Ida-Ou-Tanane", "ar": "\u0623\u0643\u0627\u062F\u064A\u0631-\u0625\u062F\u0627 \u0648\u062A\u0646\u0627\u0646" }, { "code": "09.273", "region": "09", "fr": "Inezgane-A\xEFt Melloul", "ar": "\u0625\u0646\u0632\u0643\u0627\u0646-\u0622\u064A\u062A \u0645\u0644\u0648\u0644" }, { "code": "09.163", "region": "09", "fr": "Chtouka-A\xEFt Baha", "ar": "\u0627\u0634\u062A\u0648\u0643\u0629-\u0622\u064A\u062A \u0628\u0627\u0647\u0627" }, { "code": "09.541", "region": "09", "fr": "Taroudannt", "ar": "\u062A\u0627\u0631\u0648\u062F\u0627\u0646\u062A" }, { "code": "09.581", "region": "09", "fr": "Tiznit", "ar": "\u062A\u064A\u0632\u0646\u064A\u062A" }, { "code": "09.551", "region": "09", "fr": "Tata", "ar": "\u0637\u0627\u0637\u0627" }, { "code": "10.261", "region": "10", "fr": "Guelmim", "ar": "\u0643\u0644\u0645\u064A\u0645" }, { "code": "10.071", "region": "10", "fr": "Assa-Zag", "ar": "\u0622\u0633\u0627-\u0627\u0644\u0632\u0627\u0643" }, { "code": "10.521", "region": "10", "fr": "Tan-Tan", "ar": "\u0637\u0627\u0646\u0637\u0627\u0646" }, { "code": "10.473", "region": "10", "fr": "Sidi Ifni", "ar": "\u0633\u064A\u062F\u064A \u0625\u0641\u0646\u064A" }, { "code": "11.321", "region": "11", "fr": "La\xE2youne", "ar": "\u0627\u0644\u0639\u064A\u0648\u0646" }, { "code": "11.121", "region": "11", "fr": "Boujdour", "ar": "\u0628\u0648\u062C\u062F\u0648\u0631" }, { "code": "11.537", "region": "11", "fr": "Tarfaya", "ar": "\u0637\u0631\u0641\u0627\u064A\u0629" }, { "code": "11.221", "region": "11", "fr": "Es-Semara", "ar": "\u0627\u0644\u0633\u0645\u0627\u0631\u0629" }, { "code": "12.391", "region": "12", "fr": "Oued Ed-Dahab", "ar": "\u0648\u0627\u062F\u064A \u0627\u0644\u0630\u0647\u0628" }, { "code": "12.066", "region": "12", "fr": "Aousserd", "ar": "\u0623\u0648\u0633\u0631\u062F" }];

// src/react/labels.ts
var MOROCCO_MAP_LABELS = {
  fr: {
    morocco: "Maroc",
    allMorocco: "Tout le Maroc",
    breadcrumb: "O\xF9 vous \xEAtes",
    level: "Niveau",
    levelCountry: "Pays",
    levelRegion: "R\xE9gion",
    levelProvince: "Province",
    levelCity: "Ville",
    hintCountry: "Touchez une r\xE9gion pour voir ses provinces",
    hintRegion: "Touchez une province pour la voir de pr\xE8s",
    hintProvince: "Touchez une autre province, ou remontez par le chemin ci-dessus",
    hintProvinceCities: "Touchez une ville pour la voir de pr\xE8s",
    hintCity: "Touchez une autre ville, ou remontez par le chemin ci-dessus",
    zoomIn: "Zoomer",
    zoomOut: "D\xE9zoomer",
    noCities: "Aucune ville connue ici pour l'instant.",
    provincesCount: (n) => `${n} provinces`,
    citiesCount: (n) => n === 1 ? "1 ville" : `${n} villes`,
    shareOfRegion: (p) => `${p} % de la r\xE9gion`,
    shareOfProvince: (p) => `${p} % de la province`,
    regionOnly: (v) => `Dans cette r\xE9gion, province inconnue : ${v}`,
    provinceOnly: (v) => `Dans cette province, ville inconnue : ${v}`
  },
  ar: {
    morocco: "\u0627\u0644\u0645\u063A\u0631\u0628",
    allMorocco: "\u0627\u0644\u0645\u063A\u0631\u0628 \u0643\u0627\u0645\u0644\u0627\u064B",
    breadcrumb: "\u0645\u0648\u0642\u0639\u0643",
    level: "\u0627\u0644\u0645\u0633\u062A\u0648\u0649",
    levelCountry: "\u0627\u0644\u0628\u0644\u062F",
    levelRegion: "\u0627\u0644\u062C\u0647\u0629",
    levelProvince: "\u0627\u0644\u0625\u0642\u0644\u064A\u0645",
    levelCity: "\u0627\u0644\u0645\u062F\u064A\u0646\u0629",
    hintCountry: "\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u062C\u0647\u0629 \u0644\u0631\u0624\u064A\u0629 \u0623\u0642\u0627\u0644\u064A\u0645\u0647\u0627",
    hintRegion: "\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0625\u0642\u0644\u064A\u0645 \u0644\u0631\u0624\u064A\u062A\u0647 \u0639\u0646 \u0642\u0631\u0628",
    hintProvince: "\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0625\u0642\u0644\u064A\u0645 \u0622\u062E\u0631\u060C \u0623\u0648 \u0627\u0631\u062C\u0639 \u0639\u0628\u0631 \u0627\u0644\u0645\u0633\u0627\u0631 \u0623\u0639\u0644\u0627\u0647",
    hintProvinceCities: "\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0645\u062F\u064A\u0646\u0629 \u0644\u0631\u0624\u064A\u062A\u0647\u0627 \u0639\u0646 \u0642\u0631\u0628",
    hintCity: "\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0645\u062F\u064A\u0646\u0629 \u0623\u062E\u0631\u0649\u060C \u0623\u0648 \u0627\u0631\u062C\u0639 \u0639\u0628\u0631 \u0627\u0644\u0645\u0633\u0627\u0631 \u0623\u0639\u0644\u0627\u0647",
    zoomIn: "\u062A\u0643\u0628\u064A\u0631",
    zoomOut: "\u062A\u0635\u063A\u064A\u0631",
    noCities: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u0639\u062F \u0623\u064A \u0645\u062F\u064A\u0646\u0629 \u0645\u0639\u0631\u0648\u0641\u0629 \u0647\u0646\u0627.",
    provincesCount: (n) => `${n} \u0623\u0642\u0627\u0644\u064A\u0645`,
    citiesCount: (n) => n === 1 ? "\u0645\u062F\u064A\u0646\u0629 \u0648\u0627\u062D\u062F\u0629" : `${n} \u0645\u062F\u0646`,
    shareOfRegion: (p) => `${p}% \u0645\u0646 \u0627\u0644\u062C\u0647\u0629`,
    shareOfProvince: (p) => `${p}% \u0645\u0646 \u0627\u0644\u0625\u0642\u0644\u064A\u0645`,
    regionOnly: (v) => `\u0641\u064A \u0647\u0630\u0647 \u0627\u0644\u062C\u0647\u0629 \u062F\u0648\u0646 \u0625\u0642\u0644\u064A\u0645 \u0645\u0639\u0631\u0648\u0641: ${v}`,
    provinceOnly: (v) => `\u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0625\u0642\u0644\u064A\u0645 \u062F\u0648\u0646 \u0645\u062F\u064A\u0646\u0629 \u0645\u0639\u0631\u0648\u0641\u0629: ${v}`
  },
  ary: {
    morocco: "\u0627\u0644\u0645\u063A\u0631\u0628",
    allMorocco: "\u0627\u0644\u0645\u063A\u0631\u0628 \u0643\u0627\u0645\u0644",
    breadcrumb: "\u0641\u064A\u0646 \u0646\u062A\u0627",
    level: "\u0627\u0644\u0645\u0633\u062A\u0648\u0649",
    levelCountry: "\u0627\u0644\u0628\u0644\u0627\u062F",
    levelRegion: "\u0627\u0644\u062C\u0647\u0629",
    levelProvince: "\u0627\u0644\u0625\u0642\u0644\u064A\u0645",
    levelCity: "\u0627\u0644\u0645\u062F\u064A\u0646\u0629",
    hintCountry: "\u0648\u0631\u0643 \u0639\u0644\u0649 \u062C\u0647\u0629 \u0628\u0627\u0634 \u062A\u0634\u0648\u0641 \u0627\u0644\u0623\u0642\u0627\u0644\u064A\u0645 \u062F\u064A\u0627\u0644\u0647\u0627",
    hintRegion: "\u0648\u0631\u0643 \u0639\u0644\u0649 \u0625\u0642\u0644\u064A\u0645 \u0628\u0627\u0634 \u062A\u0634\u0648\u0641\u0648 \u0645\u0646 \u0642\u0631\u064A\u0628",
    hintProvince: "\u0648\u0631\u0643 \u0639\u0644\u0649 \u0625\u0642\u0644\u064A\u0645 \u0622\u062E\u0631\u060C \u0648\u0644\u0627 \u0631\u062C\u0639 \u0645\u0646 \u0627\u0644\u0637\u0631\u064A\u0642 \u0644\u0641\u0648\u0642",
    hintProvinceCities: "\u0648\u0631\u0643 \u0639\u0644\u0649 \u0645\u062F\u064A\u0646\u0629 \u0628\u0627\u0634 \u062A\u0634\u0648\u0641\u0647\u0627 \u0645\u0646 \u0642\u0631\u064A\u0628",
    hintCity: "\u0648\u0631\u0643 \u0639\u0644\u0649 \u0645\u062F\u064A\u0646\u0629 \u0623\u062E\u0631\u0649\u060C \u0648\u0644\u0627 \u0631\u062C\u0639 \u0645\u0646 \u0627\u0644\u0637\u0631\u064A\u0642 \u0644\u0641\u0648\u0642",
    zoomIn: "\u0642\u0631\u0651\u0628",
    zoomOut: "\u0628\u0639\u0651\u062F",
    noCities: "\u0645\u0627\u0632\u0627\u0644 \u0645\u0627 \u0643\u0627\u064A\u0646\u0629 \u062D\u062A\u0649 \u0645\u062F\u064A\u0646\u0629 \u0645\u0639\u0631\u0648\u0641\u0629 \u0647\u0646\u0627.",
    provincesCount: (n) => `${n} \u0623\u0642\u0627\u0644\u064A\u0645`,
    citiesCount: (n) => n === 1 ? "\u0645\u062F\u064A\u0646\u0629 \u0648\u062D\u062F\u0629" : `${n} \u0645\u062F\u0646`,
    shareOfRegion: (p) => `${p}% \u0645\u0646 \u0627\u0644\u062C\u0647\u0629`,
    shareOfProvince: (p) => `${p}% \u0645\u0646 \u0627\u0644\u0625\u0642\u0644\u064A\u0645`,
    regionOnly: (v) => `\u0641\u0647\u0627\u062F \u0627\u0644\u062C\u0647\u0629 \u0628\u0644\u0627 \u0625\u0642\u0644\u064A\u0645 \u0645\u0639\u0631\u0648\u0641: ${v}`,
    provinceOnly: (v) => `\u0641\u0647\u0627\u062F \u0627\u0644\u0625\u0642\u0644\u064A\u0645 \u0628\u0644\u0627 \u0645\u062F\u064A\u0646\u0629 \u0645\u0639\u0631\u0648\u0641\u0629: ${v}`
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
    citiesCount: (n) => n === 1 ? "1 city" : `${n} cities`,
    shareOfRegion: (p) => `${p}% of the region`,
    shareOfProvince: (p) => `${p}% of the province`,
    regionOnly: (v) => `In this region, province unknown: ${v}`,
    provinceOnly: (v) => `In this province, city unknown: ${v}`
  }
};

// src/react/MoroccoHeatMap.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var WIDTH = 520;
var HEIGHT = 560;
var PAD = 12;
var MAX_ZOOM = 32;
var STEP = 1.6;
var CITY_ZOOM = 18;
var CITY_LABELS = 8;
var FULL = [0, 0, WIDTH, HEIGHT];
var SHADE_OPACITY = [0, 0.18, 0.34, 0.52, 0.72, 0.92];
var topologyPromise = null;
function loadTopology() {
  topologyPromise ?? (topologyPromise = import("../morocco.topo-3AOTPACR.js").then((m) => m.default ?? m));
  return topologyPromise;
}
function shade(value, max) {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(5, Math.max(1, Math.ceil(Math.sqrt(value / max) * 5)));
}
var depthOf = (code) => Math.min(2, code.split(".").length - 1);
var cx = (...names) => names.filter(Boolean).join(" ");
var Chevron = () => /* @__PURE__ */ jsx("svg", { className: "mm-chev mm-flip", viewBox: "0 0 24 24", "aria-hidden": true, children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" }) });
var Icon = ({ d }) => /* @__PURE__ */ jsx("svg", { className: "mm-icon", viewBox: "0 0 24 24", "aria-hidden": true, children: /* @__PURE__ */ jsx("path", { d }) });
var ICON = {
  plus: "M5 12h14M12 5v14",
  minus: "M5 12h14",
  fit: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  map: "M14.1 5.9 9 3.1a2 2 0 0 0-1.8 0L3.6 4.9A1 1 0 0 0 3 5.8v13.4a1 1 0 0 0 1.4.9l3.6-1.8a2 2 0 0 1 1.8 0l5.1 2.6a2 2 0 0 0 1.8 0l3.7-1.8a1 1 0 0 0 .6-.9V4.8a1 1 0 0 0-1.4-.9l-3.6 1.8a2 2 0 0 1-1.9.1zM15 5.8v15M9 3.2v15",
  pointer: "M22 14a8 8 0 0 1-8 8M18 11v-1a2 2 0 0 0-4 0M14 10V9a2 2 0 0 0-4 0v1M10 9.5V4a2 2 0 0 0-4 0v10M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"
};
function MoroccoHeatMap({
  data,
  cityInfo,
  locale = "fr",
  labels,
  formatValue,
  footer,
  loading,
  className
}) {
  const L = useMemo(() => ({ ...MOROCCO_MAP_LABELS[locale], ...labels }), [locale, labels]);
  const { regions, provinces } = data;
  const cities = useMemo(() => data.cities ?? {}, [data.cities]);
  const [topology, setTopology] = useState(null);
  const [selected, setSelected] = useState(null);
  const [province, setProvince] = useState(null);
  const [city, setCity] = useState(null);
  const [hovered, setHovered] = useState(null);
  const fmt = formatValue ?? ((v) => v.toLocaleString("en-US"));
  const nameOf = (item) => locale === "ar" || locale === "ary" ? item.ar : item.fr;
  const hasCities = !!cityInfo;
  const level = city ? "city" : province ? "province" : selected ? "region" : "country";
  useEffect(() => {
    let alive = true;
    loadTopology().then((tp) => alive && setTopology(tp));
    return () => {
      alive = false;
    };
  }, []);
  const geo = useMemo(() => {
    if (!topology) return null;
    const regionObj = topology.objects.regions;
    const provinceObj = topology.objects.provinces;
    const regionShapes = feature(topology, regionObj).features;
    const provinceShapes = feature(topology, provinceObj).features;
    const all = { type: "FeatureCollection", features: regionShapes };
    const projection = geoMercator().fitExtent(
      [
        [PAD, PAD],
        [WIDTH - PAD, HEIGHT - PAD]
      ],
      all
    );
    const path = geoPath(projection);
    return {
      projection,
      path,
      regionShapes,
      provinceShapes,
      // Borders drawn once each, not twice per shared edge.
      regionBorders: path(mesh(topology, regionObj, (a, b) => a !== b)) ?? "",
      outline: path(mesh(topology, regionObj, (a, b) => a === b)) ?? ""
    };
  }, [topology]);
  const cityDots = useMemo(() => {
    if (!geo || !cityInfo) return [];
    return Object.entries(cities).map(([code, value]) => {
      const info = cityInfo[code];
      if (!info || info.lng === null || info.lat === null || !value) return null;
      const xy = geo.projection([info.lng, info.lat]);
      if (!xy) return null;
      const region = HCP_PROVINCES.find((p) => p.code === info.province)?.region ?? "";
      return { code, value, info, region, x: xy[0], y: xy[1] };
    }).filter((d) => d !== null);
  }, [geo, cityInfo, cities]);
  const fitBox = useCallback(
    (shape, margin) => {
      if (!geo || !shape) return FULL;
      const [[x0, y0], [x1, y1]] = geo.path.bounds(shape);
      const w = x1 - x0;
      const h = y1 - y0;
      const scale = Math.max(w / WIDTH, h / HEIGHT) * margin;
      return [x0 + w / 2 - WIDTH * scale / 2, y0 + h / 2 - HEIGHT * scale / 2, WIDTH * scale, HEIGHT * scale];
    },
    [geo]
  );
  const placeBox = useMemo(() => {
    if (!geo) return FULL;
    const provinceBox = province ? fitBox(geo.provinceShapes.find((s) => s.properties.code === province), 1.8) : null;
    const dot = city ? cityDots.find((d) => d.code === city) : null;
    if (dot) {
      const w = Math.min(WIDTH / CITY_ZOOM, (provinceBox?.[2] ?? WIDTH) / 2);
      const h = w * HEIGHT / WIDTH;
      return [dot.x - w / 2, dot.y - h / 2, w, h];
    }
    if (provinceBox) return provinceBox;
    if (selected) return fitBox(geo.regionShapes.find((s) => s.properties.code === selected), 1.12);
    return FULL;
  }, [geo, selected, province, city, cityDots, fitBox]);
  const { box: viewBox, go } = useViewBox();
  const placeKey = placeBox.map((v) => v.toFixed(2)).join(" ");
  useEffect(() => go(placeBox, true), [placeKey, go]);
  const zoom = WIDTH / viewBox[2];
  const svgRef = useRef(null);
  const pointers = useRef(/* @__PURE__ */ new Map());
  const dragged = useRef(false);
  const toSvg = (clientX, clientY) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return [p.x, p.y];
  };
  const zoomBy = useCallback(
    (factor, at, animate = false) => {
      go(([x, y, w, h]) => {
        const [px, py] = at ?? [x + w / 2, y + h / 2];
        return [px - (px - x) / factor, py - (py - y) / factor, w / factor, h / factor];
      }, animate);
    },
    [go]
  );
  const onPointerDown = (e) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) dragged.current = false;
  };
  const onPointerMove = (e) => {
    const prev = pointers.current.get(e.pointerId);
    const ctm = svgRef.current?.getScreenCTM();
    if (!prev || !ctm) return;
    if (pointers.current.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (!dragged.current && Math.hypot(dx, dy) < 4) return;
      if (!dragged.current) {
        dragged.current = true;
        svgRef.current?.setPointerCapture(e.pointerId);
      }
      go(([x, y, w, h]) => [x - dx / ctm.a, y - dy / ctm.d, w, h], false);
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.entries()];
      const other = a[0] === e.pointerId ? b[1] : a[1];
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      const mid = toSvg((e.clientX + other.x) / 2, (e.clientY + other.y) / 2);
      dragged.current = true;
      if (before > 0 && mid) zoomBy(after / before, mid);
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
  };
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const at = toSvg(e.clientX, e.clientY);
      if (at) zoomBy(Math.exp(-e.deltaY / 200), at);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [geo, zoomBy]);
  const goCountry = () => {
    setSelected(null);
    setProvince(null);
    setCity(null);
    go(FULL, true);
  };
  const goRegion = (code) => {
    setCity(null);
    setProvince(null);
    setSelected(code);
    if (code === selected) go(fitBox(geo?.regionShapes.find((s) => s.properties.code === code), 1.12), true);
  };
  const goProvince = (code) => {
    const p = HCP_PROVINCES.find((x) => x.code === code);
    if (!p) return;
    setCity(null);
    setSelected(p.region);
    setProvince(code);
    if (code === province) go(fitBox(geo?.provinceShapes.find((s) => s.properties.code === code), 1.8), true);
  };
  const goCity = (code) => {
    const info = cityInfo?.[code];
    const p = info && HCP_PROVINCES.find((x) => x.code === info.province);
    if (!p) return;
    setSelected(p.region);
    setProvince(p.code);
    setCity(code);
  };
  const goTo = (code) => [goRegion, goProvince, goCity][depthOf(code)](code);
  useEffect(() => setHovered(null), [selected, province, city]);
  const counts = useMemo(() => {
    const provincesPer = {};
    for (const p of HCP_PROVINCES) provincesPer[p.region] = (provincesPer[p.region] ?? 0) + 1;
    const citiesPer = {};
    for (const d of cityDots) citiesPer[d.info.province] = (citiesPer[d.info.province] ?? 0) + 1;
    return { provincesPer, citiesPer };
  }, [cityDots]);
  const regionMax = Math.max(0, ...Object.values(regions));
  const inRegion = useMemo(() => selected ? HCP_PROVINCES.filter((p) => p.region === selected) : [], [selected]);
  const provinceMax = Math.max(0, ...inRegion.map((p) => provinces[p.code] ?? 0));
  const dotsHere = cityDots.filter((d) => province ? d.info.province === province : d.region === selected);
  const dotMax = Math.max(0, ...dotsHere.map((d) => d.value));
  const rows = level === "country" ? HCP_REGIONS.map((r) => ({
    code: r.code,
    name: nameOf(r),
    value: regions[r.code] ?? 0,
    sub: L.provincesCount(counts.provincesPer[r.code] ?? 0),
    deeper: true
  })) : level === "region" || !hasCities && level === "province" ? inRegion.map((p) => ({
    code: p.code,
    name: nameOf(p),
    value: provinces[p.code] ?? 0,
    sub: hasCities && counts.citiesPer[p.code] ? L.citiesCount(counts.citiesPer[p.code]) : void 0,
    deeper: hasCities
  })) : dotsHere.map((d) => ({ code: d.code, name: nameOf(d.info), value: d.value, deeper: false }));
  rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const listMax = Math.max(0, ...rows.map((r) => r.value));
  const selectedRegion = selected ? HCP_REGIONS.find((r) => r.code === selected) : null;
  const selectedProvince = province ? HCP_PROVINCES.find((p) => p.code === province) : null;
  const selectedCity = city && cityInfo?.[city] ? { code: city, ...cityInfo[city] } : null;
  const countryTotal = Object.values(regions).reduce((a, b) => a + b, 0);
  const here = selectedCity ? { name: nameOf(selectedCity), value: cities[selectedCity.code] ?? 0, parent: province ? provinces[province] ?? 0 : 0 } : selectedProvince ? { name: nameOf(selectedProvince), value: provinces[selectedProvince.code] ?? 0, parent: regions[selected] ?? 0 } : selectedRegion ? { name: nameOf(selectedRegion), value: regions[selectedRegion.code] ?? 0, parent: 0 } : { name: L.allMorocco, value: countryTotal, parent: 0 };
  const share = here.parent > 0 && level !== "region" ? Math.round(here.value / here.parent * 100) : null;
  const unknownBelow = level === "region" ? data.regionOnly?.[selected] ?? 0 : level === "province" || level === "city" ? data.provinceOnly?.[province] ?? 0 : 0;
  const tap = (code) => {
    if (dragged.current) return;
    goTo(code);
  };
  const onKey = (code) => (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goTo(code);
    }
  };
  const hover = (code) => ({
    onPointerEnter: () => setHovered(code),
    onPointerLeave: () => setHovered((h) => h === code ? null : h)
  });
  if (loading || !geo) {
    return /* @__PURE__ */ jsxs("div", { className: cx("mm-root", className), "aria-busy": true, children: [
      /* @__PURE__ */ jsx("div", { className: "mm-skel mm-skel-line" }),
      /* @__PURE__ */ jsxs("div", { className: "mm-grid", children: [
        /* @__PURE__ */ jsx("div", { className: "mm-skel mm-skel-map" }),
        /* @__PURE__ */ jsx("div", { children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "mm-skel mm-skel-row" }, i)) })
      ] })
    ] });
  }
  const hoverLabel = (() => {
    if (!hovered) return null;
    const d = depthOf(hovered);
    if (d === 2) {
      const info = cityInfo?.[hovered];
      return info ? `${nameOf(info)} \xB7 ${fmt(cities[hovered] ?? 0)}` : null;
    }
    if (d === 1) {
      const p = HCP_PROVINCES.find((x) => x.code === hovered);
      return p ? `${nameOf(p)} \xB7 ${fmt(provinces[p.code] ?? 0)}` : null;
    }
    const r = HCP_REGIONS.find((x) => x.code === hovered);
    return r ? `${nameOf(r)} \xB7 ${fmt(regions[r.code] ?? 0)}` : null;
  })();
  const shapeOf = (code) => !code || depthOf(code) === 2 ? void 0 : (depthOf(code) === 1 ? geo.provinceShapes : geo.regionShapes).find((s) => s.properties.code === code);
  const hoveredShape = shapeOf(hovered);
  const selectedShape = city ? void 0 : shapeOf(province);
  const crumbs = [
    { key: "country", label: L.morocco, onClick: level === "country" ? void 0 : goCountry },
    ...selectedRegion ? [{ key: selectedRegion.code, label: nameOf(selectedRegion), onClick: province ? () => goRegion(selectedRegion.code) : void 0 }] : [],
    ...selectedProvince ? [{ key: selectedProvince.code, label: nameOf(selectedProvince), onClick: city ? () => goProvince(selectedProvince.code) : void 0 }] : [],
    ...selectedCity ? [{ key: selectedCity.code, label: nameOf(selectedCity) }] : []
  ];
  const levels = [
    { key: "country", label: L.levelCountry },
    { key: "region", label: L.levelRegion },
    { key: "province", label: L.levelProvince },
    ...hasCities ? [{ key: "city", label: L.levelCity }] : []
  ];
  const depth = levels.findIndex((l) => l.key === level);
  const hint = {
    country: L.hintCountry,
    region: L.hintRegion,
    province: hasCities ? L.hintProvinceCities : L.hintProvince,
    city: L.hintCity
  }[level];
  return /* @__PURE__ */ jsxs("div", { className: cx("mm-root", className), children: [
    /* @__PURE__ */ jsxs("div", { className: "mm-head", children: [
      /* @__PURE__ */ jsx("nav", { "aria-label": L.breadcrumb, children: /* @__PURE__ */ jsx("ol", { className: "mm-crumbs", children: crumbs.map((c, i) => /* @__PURE__ */ jsxs("li", { className: "mm-crumb", children: [
        i > 0 && /* @__PURE__ */ jsx(Chevron, {}),
        c.onClick ? /* @__PURE__ */ jsxs("button", { type: "button", onClick: c.onClick, className: "mm-crumb-link", children: [
          i === 0 && /* @__PURE__ */ jsx(Icon, { d: ICON.map }),
          /* @__PURE__ */ jsx("span", { className: "mm-truncate", children: c.label })
        ] }) : /* @__PURE__ */ jsxs("span", { "aria-current": "location", className: "mm-crumb-current", children: [
          i === 0 && /* @__PURE__ */ jsx(Icon, { d: ICON.map }),
          /* @__PURE__ */ jsx("span", { className: "mm-truncate", children: c.label })
        ] })
      ] }, c.key)) }) }),
      /* @__PURE__ */ jsx("ol", { className: "mm-steps", "aria-label": L.level, children: levels.map((l, i) => /* @__PURE__ */ jsxs("li", { className: "mm-step-item", children: [
        i > 0 && /* @__PURE__ */ jsx("span", { className: cx("mm-step-line", i <= depth && "is-past"), "aria-hidden": true }),
        /* @__PURE__ */ jsx(
          "span",
          {
            "aria-current": i === depth ? "step" : void 0,
            className: cx("mm-step", i === depth ? "is-current" : i < depth ? "is-past" : "is-next"),
            children: l.label
          }
        )
      ] }, l.key)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mm-grid", children: [
      /* @__PURE__ */ jsxs("div", { className: "mm-mapcol", children: [
        /* @__PURE__ */ jsxs(
          "svg",
          {
            ref: svgRef,
            viewBox: viewBox.join(" "),
            className: cx("mm-svg", zoom > 1.01 && "is-zoomed"),
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel: onPointerUp,
            role: "group",
            "aria-label": here.name,
            children: [
              geo.regionShapes.map((s) => /* @__PURE__ */ jsx("path", { d: geo.path(s) ?? "", className: "mm-base" }, `base-${s.properties.code}`)),
              geo.regionShapes.map((s) => {
                const code = s.properties.code;
                const value = regions[code] ?? 0;
                const isOpen = code === selected;
                const isOther = selected !== null && !isOpen;
                const name = nameOf(HCP_REGIONS.find((r) => r.code === code) ?? { fr: code, ar: code });
                return /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: geo.path(s) ?? "",
                    className: cx("mm-region", value > 0 && !isOther && "is-filled", !isOpen && "is-clickable"),
                    fillOpacity: isOpen ? 0 : value > 0 && !isOther ? SHADE_OPACITY[shade(value, regionMax)] : 0,
                    strokeWidth: 2 / zoom,
                    role: isOpen ? void 0 : "button",
                    tabIndex: isOpen ? -1 : 0,
                    "aria-label": `${name}: ${fmt(value)}`,
                    onClick: () => tap(code),
                    onKeyDown: onKey(code),
                    ...hover(code)
                  },
                  code
                );
              }),
              selected && geo.provinceShapes.filter((s) => s.properties.region === selected).map((s) => {
                const code = s.properties.code;
                const value = provinces[code] ?? 0;
                const p = HCP_PROVINCES.find((x) => x.code === code);
                return /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: geo.path(s) ?? "",
                    className: cx("mm-province", value > 0 && "is-filled", province !== null && code !== province && "is-dim"),
                    fillOpacity: value > 0 ? SHADE_OPACITY[shade(value, provinceMax)] : 1,
                    strokeWidth: 1 / zoom,
                    role: "button",
                    tabIndex: 0,
                    "aria-label": `${p ? nameOf(p) : code}: ${fmt(value)}`,
                    "aria-pressed": code === province,
                    onClick: () => tap(code),
                    onKeyDown: onKey(code),
                    ...hover(code)
                  },
                  code
                );
              }),
              /* @__PURE__ */ jsx("path", { d: geo.regionBorders, className: "mm-borders", strokeWidth: 1.5 / zoom }),
              /* @__PURE__ */ jsx("path", { d: geo.outline, className: "mm-outline", strokeWidth: 1 / zoom }),
              selectedShape && /* @__PURE__ */ jsx("path", { d: geo.path(selectedShape) ?? "", className: "mm-selected", strokeWidth: 2.5 / zoom }),
              hoveredShape && hoveredShape !== selectedShape && /* @__PURE__ */ jsx("path", { d: geo.path(hoveredShape) ?? "", className: "mm-hovered", strokeWidth: 1.5 / zoom }),
              selected && [...dotsHere].sort((a, b) => b.value - a.value).map((d, i) => {
                const k = Math.sqrt(d.value / (dotMax || 1));
                const r = (level === "region" ? 2.5 + 5 * k : 4 + 9 * k) / zoom;
                const isCurrent = d.code === city;
                const isHot = isCurrent || hovered === d.code;
                const showLabel = level !== "region" && (i < CITY_LABELS || isHot);
                return /* @__PURE__ */ jsxs("g", { children: [
                  /* @__PURE__ */ jsx(
                    "circle",
                    {
                      cx: d.x,
                      cy: d.y,
                      r,
                      className: cx("mm-dot", isHot && "is-hot", city && !isCurrent && "is-dim"),
                      strokeWidth: (isCurrent ? 3 : 1.5) / zoom,
                      role: "button",
                      tabIndex: 0,
                      "aria-label": `${nameOf(d.info)}: ${fmt(d.value)}`,
                      "aria-pressed": isCurrent,
                      onClick: () => tap(d.code),
                      onKeyDown: onKey(d.code),
                      ...hover(d.code)
                    }
                  ),
                  showLabel && /* @__PURE__ */ jsx(
                    "text",
                    {
                      x: d.x + r + 3 / zoom,
                      y: d.y,
                      dominantBaseline: "middle",
                      className: cx("mm-dot-label", isCurrent && "is-current"),
                      style: { fontSize: 11 / zoom },
                      strokeWidth: 3 / zoom,
                      children: nameOf(d.info)
                    }
                  )
                ] }, d.code);
              })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mm-zoom", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "mm-zoom-btn", "aria-label": L.zoomIn, title: L.zoomIn, disabled: zoom >= MAX_ZOOM - 0.01, onClick: () => zoomBy(STEP, void 0, true), children: /* @__PURE__ */ jsx(Icon, { d: ICON.plus }) }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "mm-zoom-btn", "aria-label": L.zoomOut, title: L.zoomOut, disabled: zoom <= 1.01, onClick: () => zoomBy(1 / STEP, void 0, true), children: /* @__PURE__ */ jsx(Icon, { d: ICON.minus }) }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "mm-zoom-btn", "aria-label": L.allMorocco, title: L.allMorocco, disabled: zoom <= 1.01 && level === "country", onClick: goCountry, children: /* @__PURE__ */ jsx(Icon, { d: ICON.fit }) })
        ] }),
        hoverLabel && /* @__PURE__ */ jsx("div", { className: "mm-tip", children: /* @__PURE__ */ jsx("bdi", { children: hoverLabel }) }),
        /* @__PURE__ */ jsxs("p", { className: "mm-hint", children: [
          /* @__PURE__ */ jsx(Icon, { d: ICON.pointer }),
          hint
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mm-side", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "mm-here", children: [
            here.name,
            " \xB7 ",
            /* @__PURE__ */ jsx("bdi", { className: "mm-num", children: fmt(here.value) })
          ] }),
          share !== null && /* @__PURE__ */ jsx("p", { className: "mm-note", children: level === "city" ? L.shareOfProvince(share) : L.shareOfRegion(share) })
        ] }),
        rows.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mm-empty", children: L.noCities }) : /* @__PURE__ */ jsx("ul", { className: "mm-list", children: rows.map((row) => {
          const isCurrent = row.code === province || row.code === city;
          return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => goTo(row.code),
              ...hover(row.code),
              "aria-current": isCurrent ? "location" : void 0,
              className: cx("mm-row", hovered === row.code && "is-hover", isCurrent && "is-current", row.value === 0 && !isCurrent && "is-zero"),
              children: [
                /* @__PURE__ */ jsxs("span", { className: "mm-row-name", children: [
                  /* @__PURE__ */ jsx("span", { className: "mm-truncate", children: row.name }),
                  row.sub && /* @__PURE__ */ jsx("span", { className: "mm-row-sub", children: row.sub })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "mm-bar", children: /* @__PURE__ */ jsx("span", { className: "mm-bar-fill", style: { width: `${listMax ? row.value / listMax * 100 : 0}%` } }) }),
                /* @__PURE__ */ jsx("bdi", { className: "mm-row-value mm-num", children: row.value ? fmt(row.value) : "\u2013" }),
                row.deeper ? /* @__PURE__ */ jsx(Chevron, {}) : /* @__PURE__ */ jsx("span", { className: "mm-chev", "aria-hidden": true })
              ]
            }
          ) }, row.code);
        }) }),
        unknownBelow > 0 && /* @__PURE__ */ jsx("p", { className: "mm-note", children: level === "region" ? L.regionOnly(fmt(unknownBelow)) : L.provinceOnly(fmt(unknownBelow)) }),
        footer
      ] })
    ] })
  ] });
}
function clampBox([x, y, w]) {
  const width = Math.min(WIDTH, Math.max(WIDTH / MAX_ZOOM, w));
  if (width >= WIDTH - 0.01) return FULL;
  const height = width * HEIGHT / WIDTH;
  const cxp = Math.min(WIDTH, Math.max(0, x + w / 2));
  const cyp = Math.min(HEIGHT, Math.max(0, y + w * HEIGHT / WIDTH / 2));
  return [cxp - width / 2, cyp - height / 2, width, height];
}
function useViewBox() {
  const [box, setBox] = useState(FULL);
  const shown = useRef(FULL);
  const goal = useRef(FULL);
  const frame = useRef(0);
  const landing = useRef();
  const show = (b) => {
    shown.current = b;
    setBox(b);
  };
  const stop = () => {
    cancelAnimationFrame(frame.current);
    clearTimeout(landing.current);
  };
  const go = useCallback((next, animate) => {
    stop();
    const target = clampBox(typeof next === "function" ? next(goal.current) : next);
    goal.current = target;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduce) return show(target);
    const start = shown.current;
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 400);
      const e = 1 - Math.pow(1 - k, 3);
      show(start.map((v, i) => v + (target[i] - v) * e));
      if (k < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    landing.current = setTimeout(() => {
      cancelAnimationFrame(frame.current);
      show(target);
    }, 450);
  }, []);
  useEffect(() => stop, []);
  return { box, go };
}
export {
  MOROCCO_MAP_LABELS,
  MoroccoHeatMap
};
