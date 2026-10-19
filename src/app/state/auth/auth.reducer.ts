import { createFeature, createReducer, on } from '@ngrx/store';

import { AuthStatus, AuthUser } from '../../core/models/auth.model';
import { AuthActions } from './auth.actions';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /** True while a login request is on its way. */
  submitting: boolean;
  /** Why the last login failed, shown on the login page. */
  error: string | null;
  /** Why the user is back on the login page (e.g. the session ended). */
  notice: string | null;
}

export const initialAuthState: AuthState = {
  status: 'checking',
  user: null,
  submitting: false,
  error: null,
  notice: null,
};

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialAuthState,
    on(AuthActions.sessionFound, (state, { user }) => ({ ...state, status: 'authenticated' as const, user })),
    on(AuthActions.noSession, state => ({ ...state, status: 'anonymous' as const, user: null })),
    on(AuthActions.logIn, state => ({ ...state, submitting: true, error: null, notice: null })),
    on(AuthActions.logInSuccess, (state, { user }) => ({
      ...state, status: 'authenticated' as const, user, submitting: false, error: null, notice: null,
    })),
    on(AuthActions.logInFailure, (state, { error }) => ({ ...state, submitting: false, error })),
    on(AuthActions.loggedOut, () => ({ ...initialAuthState, status: 'anonymous' as const })),
    on(AuthActions.sessionEnded, state =>
      state.status === 'authenticated'
        ? { ...initialAuthState, status: 'anonymous' as const, notice: 'Your session has ended — please log in again.' }
        : state,
    ),
  ),
});

export const { name: authFeatureKey, reducer: authReducer, selectAuthState, selectStatus, selectUser } = authFeature;
