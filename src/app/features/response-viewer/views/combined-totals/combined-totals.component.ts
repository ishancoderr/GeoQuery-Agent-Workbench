import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CombinedTotal } from '../../../../core/models/agent-response.model';
import { attrLabel, fmtNum } from '../../../../core/utils/format.util';

/** The places' values combined per year — shared by the data-table and spatial-operation views. */
@Component({
  selector: 'app-combined-totals',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="group-block">
      <div class="group-label complete">combined totals ({{ totals().length }})</div>
      <div class="table-scroll">
        <table class="result-table">
          <thead>
            <tr>
              <th>year</th>
              <th>attribute</th>
              <th>aggregate</th>
              <th>places</th>
              <th>total</th>
              <th>missing</th>
            </tr>
          </thead>
          <tbody>
            @for (t of totals(); track t.year + t.attribute) {
              <tr>
                <td>{{ t.year }}</td>
                <td>{{ attrLabel(t.attribute) }}</td>
                <td>{{ t.aggregate }}</td>
                <td>{{ t.places.join(', ') }}</td>
                <td>{{ fmtNum(t.total) }}</td>
                <td>{{ t.missing.length ? t.missing.join(', ') : '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (fullTotalYears(); as years) {
        <p class="section-note">
          @if (years.length) {
            a full total is available for: {{ years.join(', ') }}
          } @else {
            no nearby year has a full total either
          }
        </p>
      }
    </div>
  `,
})
export class CombinedTotalsComponent {
  totals = input.required<CombinedTotal[]>();
  fullTotalYears = input<number[] | null | undefined>(null);

  readonly fmtNum = fmtNum;
  readonly attrLabel = attrLabel;
}
