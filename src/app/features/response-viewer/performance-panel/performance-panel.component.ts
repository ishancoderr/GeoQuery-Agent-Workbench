import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AgentQueryResponse, ProvenanceInfo, isDataGroupsResponse } from '../../../core/models/agent-response.model';

@Component({
  selector: 'app-performance-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './performance-panel.component.html',
  styleUrl: './performance-panel.component.scss',
})
export class PerformancePanelComponent {
  response = input.required<AgentQueryResponse>();

  provenance = computed<ProvenanceInfo | null>(() => {
    const r = this.response();
    return isDataGroupsResponse(r) ? r.provenance : null;
  });
}
