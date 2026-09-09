import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DataGroupsResponse, DataRow } from '../../../../core/models/agent-response.model';
import { attrLabel, fmtNum } from '../../../../core/utils/format.util';
import { SourceBadgeComponent } from '../../../../shared/source-badge/source-badge.component';

interface RowGroup {
  label: string;
  rows: DataRow[];
}

@Component({
  selector: 'app-data-groups-view',
  standalone: true,
  imports: [SourceBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-groups-view.component.html',
  styleUrl: './data-groups-view.component.scss',
})
export class DataGroupsViewComponent {
  response = input.required<DataGroupsResponse>();

  readonly fmtNum = fmtNum;
  readonly attrLabel = attrLabel;

  groups(): RowGroup[] {
    const d = this.response().data;
    return [
      { label: 'complete', rows: d.complete },
      { label: 'partial', rows: d.partial },
      { label: 'missing', rows: d.missing },
    ].filter(g => g.rows.length > 0);
  }

  attrValue(row: DataRow, attr: string): number | null | undefined {
    if (attr === 'population') return row.population;
    if (attr === 'marriages') return row.marriages;
    if (attr === 'live_births') return row.live_births;
    return undefined;
  }
}
