import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

const BOUNDARY_URL =
  'https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/main/2_bundeslaender/4_niedrig.geo.json';

export interface BoundaryFeature {
  type: 'Feature';
  properties: { name: string };
  geometry: GeoJSON.Geometry;
}

export interface BoundaryFeatureCollection {
  type: 'FeatureCollection';
  features: BoundaryFeature[];
}

/**
 * Public German state boundary GeoJSON, used purely as map/WKT context for
 * query shapes that don't return their own geometry (data-table, verdict).
 * Fetched once and cached — this is reference context, not agent data.
 */
@Injectable({ providedIn: 'root' })
export class BoundaryGeoJsonService {
  private readonly http = inject(HttpClient);

  readonly boundaries$: Observable<BoundaryFeatureCollection> = this.http
    .get<BoundaryFeatureCollection>(BOUNDARY_URL)
    .pipe(shareReplay(1));

  readonly featureByName$: Observable<Map<string, BoundaryFeature>> = this.boundaries$.pipe(
    map(collection => {
      const byName = new Map<string, BoundaryFeature>();
      for (const feature of collection.features) {
        byName.set(feature.properties.name.toLowerCase(), feature);
      }
      return byName;
    }),
  );
}
