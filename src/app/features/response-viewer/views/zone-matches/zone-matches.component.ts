import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ZoneMatch } from '../../../../core/models/agent-response.model';
import { wktGeometryType } from '../../../../core/utils/wkt.util';
import { CopyButtonComponent } from '../../../../shared/copy-button/copy-button.component';
import { SourceBadgeComponent } from '../../../../shared/source-badge/source-badge.component';

/** The places found inside a zone — shared by the buffer and spatial-operation views. */
@Component({
  selector: 'app-zone-matches',
  standalone: true,
  imports: [SourceBadgeComponent, CopyButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-scroll">
      <table class="result-table">
        <thead>
          <tr>
            <th>#</th>
            <th>name</th>
            <th>type</th>
            <th>geometry</th>
            <th>source</th>
            <th>wkt</th>
          </tr>
        </thead>
        <tbody>
          @for (m of matches(); track m.name + m.source; let i = $index) {
            <tr>
              <td>{{ i + 1 }}</td>
              <td>{{ m.name }}</td>
              <td>{{ m.entity_type }}</td>
              <td>{{ m.wkt ? wktGeometryType(m.wkt) : 'n/a' }}</td>
              <td><app-source-badge [source]="m.source" /></td>
              <td>
                @if (m.wkt) {
                  <app-copy-button [text]="m.wkt" />
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class ZoneMatchesComponent {
  matches = input.required<ZoneMatch[]>();

  readonly wktGeometryType = wktGeometryType;
}
