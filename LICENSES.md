# Data sources and licences

The code is Zonemation's (UNLICENSED, internal). The data it ships comes
from:

| Data | Source | Licence | Credit asked |
|---|---|---|---|
| Region and province shapes (`src/data/morocco.topo.json`) | `morocco-map@1.3.0` (npm), from OpenStreetMap | ODbL-1.0 | "© OpenStreetMap contributors" |
| City centre points and urban centres (`src/data/communes.ts`) | `morocco-communes` repo, `data/v1/attributes/communes.json`, from OpenStreetMap | ODbL-1.0 | "© OpenStreetMap contributors" |
| Codes and French/Arabic names (`src/data/*.ts`) | Haut-Commissariat au Plan, RGPH 2024, via `morocco-communes@1.9.1` (code MIT) | CC BY 4.0 | "Haut-Commissariat au Plan" |

The map does not print a credit line (owner's choice, 2026-10-19). Both
licences ask for attribution where the data is shown; if that is ever
raised, add the line under the map (`footer` prop) or on an "About" page.

Boundary files must keep Morocco whole: regions 10, 11 and 12 present, no
separate Western Sahara shape. HDX/OCHA COD-AB, GADM and Natural Earth
admin-1 do not, and must not be used. `test/place.test.ts` checks it.
