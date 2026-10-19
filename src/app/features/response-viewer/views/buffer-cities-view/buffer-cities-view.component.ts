import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { RelationshipBufferResponse } from '../../../../core/models/agent-response.model';
import { ZoneMatchesComponent } from '../zone-matches/zone-matches.component';

@Component({
  selector: 'app-buffer-cities-view',
  standalone: true,
  imports: [ZoneMatchesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './buffer-cities-view.component.html',
  styleUrl: './buffer-cities-view.component.scss',
})
export class BufferCitiesViewComponent {
  response = input.required<RelationshipBufferResponse>();

  referenceMissing = computed(() => this.response().query.reference_source === 'not_found');

  /** "inside Bayern", "north of Bayern", "within 40 km east of Kassel", "within 80 km of Frankfurt". */
  zoneLabel = computed(() => {
    const { reference, distance_km, direction } = this.response().query;
    if (direction) {
      const dir = direction.replace(/_of$/, '');
      return distance_km ? `within ${distance_km} km ${dir} of ${reference}` : `${dir} of ${reference}`;
    }
    if (!distance_km) return `inside ${reference}`;
    return `within ${distance_km} km of ${reference}`;
  });
}
