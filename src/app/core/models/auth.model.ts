/**
 * The logged-in user, as the agents' /auth endpoints return it. The session
 * itself is an HttpOnly cookie the browser holds and sends — this app never
 * sees or stores the token.
 */
export interface AuthUser {
  username: string;
  name: string;
  /** Unix time (seconds) the session ends. */
  expires_at: number;
}

/** checking: asking /auth/me on load · anonymous: show the login page · authenticated: the workbench */
export type AuthStatus = 'checking' | 'anonymous' | 'authenticated';
