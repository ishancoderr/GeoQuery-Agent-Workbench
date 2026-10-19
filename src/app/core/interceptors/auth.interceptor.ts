import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';

import { isAuthRequest } from '../services/auth-api.service';
import { AuthActions } from '../../state/auth/auth.actions';

/**
 * Any 401 from an agent (outside the /auth calls themselves) means the
 * session expired or was cleared: back to the login page.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(Store);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthRequest(req.url)) {
        store.dispatch(AuthActions.sessionEnded());
      }
      return throwError(() => err);
    }),
  );
};
