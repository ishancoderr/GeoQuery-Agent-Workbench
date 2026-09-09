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
