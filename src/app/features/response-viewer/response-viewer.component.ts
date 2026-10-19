import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  AgentQueryResponse,
  isBufferResponse,
  isDataGroupsResponse,
  isGeometryResponse,
  isMessageResponse,
  isSpatialOperationResponse,
  isUnrecognizedResponse,
  isVerdictResponse,
} from '../../core/models/agent-response.model';
import { AgentId } from '../../core/models/agent.model';
import { BufferCitiesViewComponent } from './views/buffer-cities-view/buffer-cities-view.component';
import { DataGroupsViewComponent } from './views/data-groups-view/data-groups-view.component';
import { GeometryLookupViewComponent } from './views/geometry-lookup-view/geometry-lookup-view.component';
import { MessageViewComponent } from './views/message-view/message-view.component';
import { SpatialOperationViewComponent } from './views/spatial-operation-view/spatial-operation-view.component';
import { VerdictViewComponent } from './views/verdict-view/verdict-view.component';
import { PerformancePanelComponent } from './performance-panel/performance-panel.component';

@Component({
  selector: 'app-response-viewer',
  standalone: true,
  imports: [
    DataGroupsViewComponent,
    VerdictViewComponent,
    GeometryLookupViewComponent,
    SpatialOperationViewComponent,
    BufferCitiesViewComponent,
    MessageViewComponent,
    PerformancePanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './response-viewer.component.html',
  styleUrl: './response-viewer.component.scss',
})
export class ResponseViewerComponent {
  response = input.required<AgentQueryResponse>();
  agentId = input.required<AgentId>();

  // Each computed narrows the union to one shape (or null) so the template can
  // pass a correctly-typed value to each sub-view. The response() signal must be
  // captured into a local first — two separate calls to it don't narrow together.
  messageResponse = computed(() => {
    const r = this.response();
    return isMessageResponse(r) ? r : null;
  });
  dataResponse = computed(() => {
    const r = this.response();
    return !isMessageResponse(r) && isDataGroupsResponse(r) ? r : null;
  });
  verdictResponse = computed(() => {
    const r = this.response();
    return !isMessageResponse(r) && isVerdictResponse(r) ? r : null;
  });
  geometryResponse = computed(() => {
    const r = this.response();
    return !isMessageResponse(r) && isGeometryResponse(r) ? r : null;
  });
  bufferResponse = computed(() => {
    const r = this.response();
    return !isMessageResponse(r) && isBufferResponse(r) ? r : null;
  });
  operationResponse = computed(() => {
    const r = this.response();
    return !isMessageResponse(r) && isSpatialOperationResponse(r) ? r : null;
  });
  unrecognized = computed(() => isUnrecognizedResponse(this.response()));
  rawJson = computed(() => JSON.stringify(this.response(), null, 2));
}
