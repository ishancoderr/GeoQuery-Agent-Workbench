import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { RelationshipBufferResponse } from '../../../../core/models/agent-response.model';
import { CopyButtonComponent } from '../../../../shared/copy-button/copy-button.component';
import { SourceBadgeComponent } from '../../../../shared/source-badge/source-badge.component';

@Component({
  selector: 'app-buffer-cities-view',
  standalone: true,
  imports: [SourceBadgeComponent, CopyButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './buffer-cities-view.component.html',
  styleUrl: './buffer-cities-view.component.scss',
})
export class BufferCitiesViewComponent {
  response = input.required<RelationshipBufferResponse>();
}
