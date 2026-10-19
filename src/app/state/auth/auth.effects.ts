import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, switchMap } from 'rxjs';

import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthActions } from './auth.actions';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(AuthApiService);

  // On load: is there still a valid session cookie?
  checkSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkSession),
      switchMap(() =>
        this.api.me().pipe(
          map(user => AuthActions.sessionFound({ user })),
          catchError(() => of(AuthActions.noSession())),
        ),
      ),
    ),
  );

  logIn$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logIn),
      switchMap(({ username, password }) =>
        this.api.login(username, password).pipe(
          map(user => AuthActions.logInSuccess({ user })),
          catchError((err: HttpErrorResponse) => of(AuthActions.logInFailure({ error: describeLoginError(err) }))),
        ),
      ),
    ),
  );

  logOut$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logOut),
      mergeMap(() =>
        this.api.logout().pipe(
          map(() => AuthActions.loggedOut()),
          catchError(() => of(AuthActions.loggedOut())), // the UI logs out either way
        ),
      ),
    ),
  );
}

function describeLoginError(err: HttpErrorResponse): string {
  if (err.status === 0 || err.status === 502 || err.status === 504) return 'Cannot reach Agent-001 — is it running?';
  const detail = err.error && (err.error.detail as string | undefined);
  if (err.status === 422) return 'Enter a username and a password.';
  return typeof detail === 'string' ? detail : `Login failed (${err.status})`;
}
