import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';

import { AuthActions } from '../../state/auth/auth.actions';
import { selectAuthState } from '../../state/auth/auth.reducer';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly store = inject(Store);

  auth = this.store.selectSignal(selectAuthState);
  username = '';
  password = '';

  submit(): void {
    const username = this.username.trim();
    if (!username || !this.password || this.auth().submitting) return;
    this.store.dispatch(AuthActions.logIn({ username, password: this.password }));
    this.password = '';
  }
}
