import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { Store } from '@ngrx/store';

import { AGENT_META } from '../../core/models/agent.model';
import {
  AgentQueryResponse,
  isBufferResponse,
  isGeometryResponse,
  isMessageResponse,
  isSpatialOperationResponse,
} from '../../core/models/agent-response.model';
import { BoundaryFeature, BoundaryGeoJsonService } from '../../core/services/boundary-geojson.service';
import { classifySpatialInvolvement, SpatialClass } from '../../core/utils/geo-color.util';
import { wktToGeoJson } from '../../core/utils/wkt.util';
import { truncate } from '../../core/utils/format.util';
import { ActiveResult, selectLastActiveResult } from '../../state/agents/agents.selectors';

const IDLE_STYLE: L.PathOptions = { color: '#2A3D5C', weight: 1, fillColor: '#17263D', fillOpacity: 0.55 };

const CLASS_STYLE: Record<SpatialClass, L.PathOptions> = {
  agent1: { color: '#EAF1F8', weight: 1.5, fillColor: '#45D6C4', fillOpacity: 0.6 },
  agent2: { color: '#EAF1F8', weight: 1.5, fillColor: '#F0A860', fillOpacity: 0.6 },
  mixed: { color: '#EAF1F8', weight: 1.5, fillColor: '#B6D66E', fillOpacity: 0.65 },
  missing: { color: '#E8C34E', weight: 1.5, dashArray: '4 4', fillColor: '#E8C34E', fillOpacity: 0.05 },
  qualifies: { color: '#EAF1F8', weight: 1.5, fillColor: '#5FD98A', fillOpacity: 0.55 },
  unknown: { color: '#E8C34E', weight: 1.5, dashArray: '4 4', fillColor: '#E8C34E', fillOpacity: 0.05 },
};

const REFERENCE_OVERRIDE: L.PathOptions = { color: '#EAF1F8', weight: 2.5 };

@Component({
  selector: 'app-geo-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="geo-map-panel">
      <div class="geo-map-head">
        <h4>Leaflet — Bundesländer boundaries</h4>
      </div>
      <div class="geo-current mono">{{ caption }}</div>
      <div #mapEl class="leaflet-map"></div>
      <div class="geo-legend">
        <div class="legend-item"><span class="sw a1"></span>agent&#8209;001</div>
        <div class="legend-item"><span class="sw a2"></span>agent&#8209;002</div>
        <div class="legend-item"><span class="sw mix"></span>both / qualifies</div>
        <div class="legend-item"><span class="sw miss"></span>missing / unknown</div>
        <div class="legend-item"><span class="sw ref"></span>reference</div>
      </div>
    </div>
  `,
  styleUrl: './geo-map.component.scss',
})
export class GeoMapComponent implements AfterViewInit {
  private readonly store = inject(Store);
  private readonly boundaryService = inject(BoundaryGeoJsonService);

  private readonly mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');
  private readonly activeResult = this.store.selectSignal(selectLastActiveResult);

  caption = 'No query run yet — showing all 16 states, idle.';

  private map!: L.Map;
  private boundaryLayer!: L.GeoJSON;
  private overlayLayer = L.layerGroup();

  constructor() {
    effect(() => {
      const result = this.activeResult();
      if (this.map) this.render(result);
    });
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl().nativeElement, { scrollWheelZoom: false }).setView([51.16, 10.45], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 12,
    }).addTo(this.map);

    this.overlayLayer.addTo(this.map);

    this.boundaryService.boundaries$.subscribe(collection => {
      this.boundaryLayer = L.geoJSON(collection as unknown as GeoJSON.GeoJsonObject, {
        style: () => IDLE_STYLE,
        onEachFeature: (feature, layer) => {
          const name = (feature.properties?.['name'] as string | undefined) ?? '';
          layer.bindPopup(name);
        },
      }).addTo(this.map);

      this.render(this.activeResult());
    });
  }

  private render(result: ActiveResult | null): void {
    this.overlayLayer.clearLayers();

    if (!result || isMessageResponse(result.response)) {
      this.boundaryLayer?.eachLayer(layer => (layer as L.Path).setStyle(IDLE_STYLE));
      this.caption = 'No query run yet — showing all 16 states, idle.';
      return;
    }

    const { agentId, queryText, response } = result;
    this.caption = `Last query — asked ${AGENT_META[agentId].label}: ${truncate(queryText, 70)}`;

    if (isGeometryResponse(response) || isBufferResponse(response) || isSpatialOperationResponse(response)) {
      this.boundaryLayer?.eachLayer(layer => (layer as L.Path).setStyle(IDLE_STYLE));
      this.renderRealGeometry(response);
      return;
    }

    const { colorByName, referenceNames } = classifySpatialInvolvement(response);
    const involved: L.Layer[] = [];
    this.boundaryLayer?.eachLayer(layer => {
      const feature = (layer as L.Path & { feature: BoundaryFeature }).feature;
      const name = feature.properties.name.toLowerCase();
      const cls = colorByName.get(name);
      if (!cls) {
        (layer as L.Path).setStyle(IDLE_STYLE);
        return;
      }
      let style = CLASS_STYLE[cls];
      if (referenceNames.has(name)) style = { ...style, ...REFERENCE_OVERRIDE };
      (layer as L.Path).setStyle(style);
      involved.push(layer);
    });

    if (involved.length > 0) {
      this.map.fitBounds(L.featureGroup(involved).getBounds().pad(0.25));
    }
  }

  private renderRealGeometry(response: AgentQueryResponse): void {
    const entries: { wkt: string | null | undefined; style: L.PathOptions }[] = [];

    if (isGeometryResponse(response)) {
      for (const g of response.geometries) {
        entries.push({ wkt: g.wkt, style: g.source === 'Agent-1' ? CLASS_STYLE.agent1 : CLASS_STYLE.agent2 });
      }
    } else if (isBufferResponse(response)) {
      for (const c of response.cities) {
        entries.push({ wkt: c.wkt, style: c.source === 'Agent-1' ? CLASS_STYLE.agent1 : CLASS_STYLE.agent2 });
      }
    } else if (isSpatialOperationResponse(response) && response.result) {
      entries.push({ wkt: response.result.wkt, style: { color: '#EAF1F8', weight: 2, fillColor: '#6C8EF5', fillOpacity: 0.45 } });
    }

    const layers: L.Layer[] = [];
    for (const { wkt, style } of entries) {
      const geom = wktToGeoJson(wkt);
      if (!geom) continue;
      const layer = L.geoJSON(geom as unknown as GeoJSON.GeoJsonObject, {
        style: () => style,
        pointToLayer: (_feature, latlng) => L.circleMarker(latlng, { ...style, radius: 6 }),
      });
      layer.addTo(this.overlayLayer);
      layers.push(layer);
    }

    if (layers.length > 0) {
      this.map.fitBounds(L.featureGroup(layers).getBounds().pad(0.25));
    }
  }
}
