import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { VerdictResponse } from '../../../../core/models/agent-response.model';

@Component({
  selector: 'app-verdict-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './verdict-view.component.html',
  styleUrl: './verdict-view.component.scss',
})
export class VerdictViewComponent {
  response = input.required<VerdictResponse>();

  /** "states", "cities", ... — the backend names the candidate type instead of assuming states. */
  entityLabel = computed(() => {
    const t = this.response().query.entity_type || 'state';
    return t.endsWith('y') ? t.slice(0, -1) + 'ies' : t + 's';
  });

  isVerdictQuestion = computed(() => this.response().query.relationship.subject !== null);

  verdictClass = computed<'yes' | 'no' | 'na'>(() => {
    const v = this.response().verdict;
    if (v === true) return 'yes';
    if (v === false) return 'no';
    return 'na';
  });

  verdictLabel = computed(() => {
    const v = this.response().verdict;
    if (v === true) return 'YES';
    if (v === false) return 'NO';
    return 'UNKNOWN';
  });
}
