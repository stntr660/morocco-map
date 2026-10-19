# @zonemation/morocco-map

A Morocco heat map for React apps. You walk down **Maroc › Région ›
Province › Ville**: regions and provinces are shaded by a number, cities are
dots sized by it. The country is drawn whole, Southern Provinces included,
with no dotted line. It is pure SVG with no map tiles, so it works offline
and follows the app's colours and dark mode.

It also turns a typed city ("Casa", "الدار البيضاء", "Fès") into its official
HCP region, province and commune, and counts any list of records per
level. It never guesses: what it cannot place is counted as such.

Used by Jmla Pro. Built to drop into any Zonemation project.

## Install

```bash
npm i github:stntr660/morocco-map#v0.1.0
# or
pnpm add github:stntr660/morocco-map#v0.1.0
```

React 18 or 19. The built files are committed, so nothing builds at
install. To update, change the tag.

## Use

**1. Count, on the server** (API route, server action, script):

```ts
import { countPlaces, cityPoints, createPlacer } from "@zonemation/morocco-map"

// Optional: what your app already knows (e.g. the list behind a city picker)
const placer = createPlacer({ regionHints: myCities.map((c) => ({ name: c.name, region: c.regionId })) })

const counts = countPlaces(
  clients.map((c) => ({ city: c.city })), // value defaults to 1; pass value for DH
  { placer }
)
return { counts, cities: cityPoints(counts) }
```

**2. Draw, in the browser:**

```tsx
"use client"
import { MoroccoHeatMap } from "@zonemation/morocco-map/react"
import "@zonemation/morocco-map/styles.css"

<MoroccoHeatMap
  data={counts}            // regions, provinces, cities, regionOnly, provinceOnly
  cityInfo={cities}        // from cityPoints(); leave out to stop at provinces
  locale="ar"              // "fr" (default) | "ar" | "ary" | "en": words and place names
  formatValue={(v) => `${v} DH`}
  footer={<p>Ville inconnue : {counts.unplaced}</p>}
/>
```

Keep `countPlaces` on the server: the commune table (~120 KB) lives in the
main entry. The `/react` entry only carries regions, provinces and the map
shapes (~60 KB, loaded on demand).

## Look

The map reads shadcn's HSL tokens (`--primary`, `--foreground`, `--muted`,
`--card`...), so it takes the app's brand and dark mode with no setup.
To restyle, set the `--mm-*` variables on `.mm-root`, e.g. for an app
whose tokens are full colours (shadcn v4 oklch):

```css
.mm-root {
  --mm-primary: var(--primary);
  --mm-fg: var(--foreground);
  --mm-muted: var(--muted);
  --mm-bg: var(--background);
  --mm-card: var(--card);
  --mm-border: var(--border);
}
```

Words: `locale` picks one of four built-in sets, and `labels` overrides any
of them (`labels={{ hintCountry: "..." }}`).

## Codes

HCP census codes: region `"06"`, province `"06.141"`, commune
`"06.141.01.0"`. 12 regions, 75 provinces/préfectures (Casablanca's 8
préfectures d'arrondissements roll up into `06.141`), 1,503 communes.

## Develop

```bash
npm run verify     # typecheck + tests + build; run before every tag
npm run build:data # only when a source dataset changes, see scripts/build-data.mjs
```

Release: bump `version`, `npm run verify`, commit `dist/`, tag `vX.Y.Z`,
push the tag, then update the tag in each app.

Sources and licences: [LICENSES.md](LICENSES.md).
