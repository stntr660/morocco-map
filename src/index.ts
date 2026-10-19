/**
 * @zonemation/morocco-map - the server-safe half: census data, placing a
 * typed city, counting records per region / province / city.
 * The React map lives in "@zonemation/morocco-map/react".
 */
export { HCP_REGIONS, HCP_PROVINCES } from "./data/admin"
export { HCP_COMMUNES } from "./data/communes"
export {
  placeCity,
  createPlacer,
  communePoint,
  placeKey,
  DEFAULT_ALIASES,
  type PlaceCity,
  type PlacedLocation,
  type PlacerOptions,
  type CommunePoint,
} from "./place"
export { countPlaces, cityPoints, emptyPlaceCounts, type PlaceCounts, type PlaceRow, type CountOptions } from "./counts"
