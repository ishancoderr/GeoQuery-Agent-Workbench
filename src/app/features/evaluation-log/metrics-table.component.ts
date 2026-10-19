import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import { AGENT_META } from '../../core/models/agent.model';
import { fmtNum, truncate } from '../../core/utils/format.util';
import { MetricsEntry } from '../../state/metrics/metrics.model';
import { selectHistory } from '../../state/metrics/metrics.selectors';

const CSV_COLUMNS: (keyof MetricsEntry)[] = [
  'time',
  'agentId',
  'query',
  'llm',
  'status',
  'totalMs',
  'tokens',
  'kqmlTurns',
  'recordCount',
  'completenessPct',
];

@Component({
  selector: 'app-metrics-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './metrics-table.component.html',
  styleUrl: './metrics-table.component.scss',
})
export class MetricsTableComponent {
  private readonly store = inject(Store);

  readonly AGENT_META = AGENT_META;
  readonly fmtNum = fmtNum;
  readonly truncate = truncate;

  history = this.store.selectSignal(selectHistory);

  reversedHistory(): MetricsEntry[] {
    return [...this.history()].reverse();
  }

  exportCsv(): void {
    const rows = this.history();
    const lines = [CSV_COLUMNS.join(',')];
    for (const row of rows) {
      lines.push(
        CSV_COLUMNS.map(col => `"${String(row[col] ?? '').replace(/"/g, '""')}"`).join(','),
      );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'geoquery-evaluation-log.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
