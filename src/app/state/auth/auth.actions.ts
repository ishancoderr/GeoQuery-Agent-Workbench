import { createActionGroup, emptyProps, props } from '@ngrx/store';

import { AuthUser } from '../../core/models/auth.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'Check Session': emptyProps(),
    'Session Found': props<{ user: AuthUser }>(),
    'No Session': emptyProps(),

    'Log In': props<{ username: string; password: string }>(),
    'Log In Success': props<{ user: AuthUser }>(),
    'Log In Failure': props<{ error: string }>(),

    'Log Out': emptyProps(),
    'Logged Out': emptyProps(),
    /** An agent answered 401 to a logged-in request: the session expired or was cleared. */
    'Session Ended': emptyProps(),
  },
});
