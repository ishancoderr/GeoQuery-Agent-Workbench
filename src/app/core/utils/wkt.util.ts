import { parse, stringify } from 'wellknown';
import type { GeoJSONGeometry } from 'wellknown';

/** Safely parses a raw WKT string (as returned by ST_AsText) into GeoJSON geometry. */
export function wktToGeoJson(wkt: string | null | undefined): GeoJSONGeometry | null {
  if (!wkt) return null;
  try {
    return parse(wkt);
  } catch {
    return null;
  }
}

/** Converts a GeoJSON geometry (e.g. from the public boundary dataset) back to WKT text for display. */
export function geoJsonToWkt(geometry: GeoJSONGeometry): string {
  try {
    return stringify(geometry);
  } catch {
    return '';
  }
}

/** The leading word of a WKT string names its geometry type (POLYGON, LINESTRING, ...). */
export function wktGeometryType(wkt: string | null | undefined): string {
  if (!wkt) return 'EMPTY';
  return wkt.trim().split('(', 1)[0].trim().split(/\s+/)[0].toUpperCase();
}
