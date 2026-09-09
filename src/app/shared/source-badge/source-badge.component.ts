import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type BadgeDot = 'agent1' | 'agent2' | 'mixed' | 'missing';

@Component({
  selector: 'app-source-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="src-badge" [class]="dot()">
      <span class="d"></span>{{ source() }}
    </span>
  `,
  styleUrl: './source-badge.component.scss',
})
export class SourceBadgeComponent {
  source = input.required<string>();

  dot = computed<BadgeDot>(() => {
    const s = this.source();
    if (s === 'missing' || s === 'not_found') return 'missing';
    if (s.includes('+')) return 'mixed';
    if (s === 'Agent-1') return 'agent1';
    return 'agent2';
  });
}
