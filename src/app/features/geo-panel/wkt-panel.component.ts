import { toSignal } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Store } from '@ngrx/store';
import type { GeoJSONGeometry } from 'wellknown';

import { AgentId } from '../../core/models/agent.model';
import {
  getInvolvedSpatialNames,
  isBufferResponse,
  isGeometryResponse,
  isMessageResponse,
  isSpatialOperationResponse,
} from '../../core/models/agent-response.model';
import { BoundaryGeoJsonService } from '../../core/services/boundary-geojson.service';
import { geoJsonToWkt, wktGeometryType } from '../../core/utils/wkt.util';
import { CopyButtonComponent } from '../../shared/copy-button/copy-button.component';
import { selectAgentResult } from '../../state/agents/agents.selectors';

interface WktEntry {
  name: string;
  wkt: string;
  typeLabel: string;
}

@Component({
  selector: 'app-wkt-panel',
  standalone: true,
  imports: [CopyButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './wkt-panel.component.html',
  styleUrl: './wkt-panel.component.scss',
})
export class WktPanelComponent {
  private readonly store = inject(Store);
  private readonly boundaryService = inject(BoundaryGeoJsonService);

  agentId = input.required<AgentId>();

  // Select both up front and pick per the input lazily inside a computed — see
  // the same pattern (and the reason for it) in GeoMapComponent.
  private readonly agent1Result = this.store.selectSignal(selectAgentResult('agent1'));
  private readonly agent2Result = this.store.selectSignal(selectAgentResult('agent2'));
  private readonly activeResult = computed(() =>
    this.agentId() === 'agent1' ? this.agent1Result() : this.agent2Result(),
  );
  private readonly featureByName = toSignal(this.boundaryService.featureByName$, { initialValue: null });

  /** True when the current response already shows its own real WKT inline (geometry/buffer/operation views). */
  showsInlineElsewhere = computed(() => {
    const result = this.activeResult();
    if (!result) return false;
    const r = result.response;
    return isGeometryResponse(r) || isBufferResponse(r) || isSpatialOperationResponse(r);
  });

  isIdle = computed(() => {
    const result = this.activeResult();
    return !result || isMessageResponse(result.response);
  });

  /** Reference boundary WKT (public dataset, not returned by the agent) for data-table/verdict shapes. */
  entries = computed<WktEntry[]>(() => {
    const result = this.activeResult();
    const byName = this.featureByName();
    if (!result || !byName || this.showsInlineElsewhere() || this.isIdle()) return [];

    const names = getInvolvedSpatialNames(result.response);
    const out: WktEntry[] = [];
    for (const name of names) {
      const feature = byName.get(name.toLowerCase());
      if (!feature) continue;
      const wkt = geoJsonToWkt(feature.geometry as unknown as GeoJSONGeometry);
      if (!wkt) continue;
      out.push({ name: feature.properties.name, wkt, typeLabel: wktGeometryType(wkt) });
    }
    return out;
  });
}
