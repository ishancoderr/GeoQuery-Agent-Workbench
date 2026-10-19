import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SpatialOperationResponse } from '../../../../core/models/agent-response.model';
import { attrLabel, fmtNum } from '../../../../core/utils/format.util';
import { CopyButtonComponent } from '../../../../shared/copy-button/copy-button.component';
import { SourceBadgeComponent } from '../../../../shared/source-badge/source-badge.component';
import { CombinedTotalsComponent } from '../combined-totals/combined-totals.component';
import { ZoneMatchesComponent } from '../zone-matches/zone-matches.component';

@Component({
  selector: 'app-spatial-operation-view',
  standalone: true,
  imports: [CopyButtonComponent, SourceBadgeComponent, ZoneMatchesComponent, CombinedTotalsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spatial-operation-view.component.html',
  styleUrl: './spatial-operation-view.component.scss',
})
export class SpatialOperationViewComponent {
  response = input.required<SpatialOperationResponse>();

  readonly fmtNum = fmtNum;
  readonly attrLabel = attrLabel;

  /** An attribute cell's value as a number for fmtNum, since data rows are open-keyed. */
  numeric(value: unknown): number | null | undefined {
    if (typeof value === 'number') return value;
    return value === null ? null : undefined;
  }
}
