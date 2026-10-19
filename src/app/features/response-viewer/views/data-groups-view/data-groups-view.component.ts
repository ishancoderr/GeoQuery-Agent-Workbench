import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DataGroupsResponse, DataRow } from '../../../../core/models/agent-response.model';
import { attrLabel, fmtNum } from '../../../../core/utils/format.util';
import { SourceBadgeComponent } from '../../../../shared/source-badge/source-badge.component';
import { CombinedTotalsComponent } from '../combined-totals/combined-totals.component';

interface RowGroup {
  label: string;
  rows: DataRow[];
}

@Component({
  selector: 'app-data-groups-view',
  standalone: true,
  imports: [SourceBadgeComponent, CombinedTotalsComponent],
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
    // Read whichever attribute column the query actually asked for, by
    // name, instead of a fixed population/marriages/live_births list — a
    // list that silently rendered "—" for any other entity's attribute
    // (e.g. a river's length_km) even though the backend sent a real
    // value, since it fell through every check to the implicit undefined.
    const value = row[attr];
    return typeof value === 'number' || value === null || value === undefined ? value : undefined;
  }
}
