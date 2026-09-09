import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SpatialOperationResponse } from '../../../../core/models/agent-response.model';
import { CopyButtonComponent } from '../../../../shared/copy-button/copy-button.component';

@Component({
  selector: 'app-spatial-operation-view',
  standalone: true,
  imports: [CopyButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spatial-operation-view.component.html',
  styleUrl: './spatial-operation-view.component.scss',
})
export class SpatialOperationViewComponent {
  response = input.required<SpatialOperationResponse>();
}
