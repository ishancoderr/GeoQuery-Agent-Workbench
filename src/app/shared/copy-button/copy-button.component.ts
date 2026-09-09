import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-copy-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="copy-btn" [class.copied]="copied()" (click)="copy()">
      {{ copied() ? 'Copied' : 'Copy' }}
    </button>
  `,
  styleUrl: './copy-button.component.scss',
})
export class CopyButtonComponent {
  text = input.required<string>();
  copied = signal(false);

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.text());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1400);
    } catch {
      // clipboard API unavailable — nothing sensible to fall back to silently
    }
  }
}
