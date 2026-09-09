import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { GeometryLookupResponse } from '../../../../core/models/agent-response.model';
import { wktGeometryType } from '../../../../core/utils/wkt.util';
import { CopyButtonComponent } from '../../../../shared/copy-button/copy-button.component';
import { SourceBadgeComponent } from '../../../../shared/source-badge/source-badge.component';

@Component({
  selector: 'app-geometry-lookup-view',
  standalone: true,
  imports: [SourceBadgeComponent, CopyButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './geometry-lookup-view.component.html',
  styleUrl: './geometry-lookup-view.component.scss',
})
export class GeometryLookupViewComponent {
  response = input.required<GeometryLookupResponse>();

  readonly wktGeometryType = wktGeometryType;
}
