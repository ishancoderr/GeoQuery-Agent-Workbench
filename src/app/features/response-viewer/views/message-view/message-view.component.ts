import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { MessageResponse } from '../../../../core/models/agent-response.model';

@Component({
  selector: 'app-message-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './message-view.component.html',
  styleUrl: './message-view.component.scss',
})
export class MessageViewComponent {
  response = input.required<MessageResponse>();
}
