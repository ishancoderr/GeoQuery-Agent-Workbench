import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthUser } from '../models/auth.model';

/**
 * Login goes through Agent-001; the session cookie it sets is accepted by
 * both agents (they share AUTH_SECRET), and the browser sends it with every
 * /api/agent1 and /api/agent2 request.
 */
const AUTH = '/api/agent1/auth';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(username: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${AUTH}/login`, { username, password });
  }

  logout(): Observable<unknown> {
    return this.http.post(`${AUTH}/logout`, {});
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${AUTH}/me`);
  }
}

/** Requests whose 401 means "not logged in yet", not "the session ended". */
export function isAuthRequest(url: string): boolean {
  return url.startsWith(`${AUTH}/`);
}
