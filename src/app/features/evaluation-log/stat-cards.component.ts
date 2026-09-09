import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { fmtNum } from '../../core/utils/format.util';
import {
  selectAvgCompleteness,
  selectAvgKqmlTurns,
  selectAvgTotalMs,
  selectTotalTokens,
} from '../../state/metrics/metrics.selectors';

@Component({
  selector: 'app-stat-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat-cards.component.html',
  styleUrl: './stat-cards.component.scss',
})
export class StatCardsComponent {
  private readonly store = inject(Store);

  readonly fmtNum = fmtNum;

  avgTotalMs = this.store.selectSignal(selectAvgTotalMs);
  totalTokens = this.store.selectSignal(selectTotalTokens);
  avgKqmlTurns = this.store.selectSignal(selectAvgKqmlTurns);
  avgCompleteness = this.store.selectSignal(selectAvgCompleteness);
}
