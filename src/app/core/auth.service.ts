import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { CurrentUser } from './models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'https://localhost:7102'; // Verifică portul tău din appsettings.json

  isAuthenticated = signal<boolean>(this.hasToken());
  currentUser = signal<CurrentUser | null>(null);

  constructor(private http: HttpClient) {
  }

  private hasToken(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  register(data: any) {
    return this.http.post(`${this.apiUrl}/api/Account/register`, data).pipe(
      tap((res) => console.log('Register response:', res)),
      catchError(this.handleError),
    );
  }

  login(data: any) {
    return this.http
      .post<any>(`${this.apiUrl}/login?useCookies=false`, data)
      .pipe(
        tap((response) => {
          localStorage.setItem('auth_token', response.accessToken);
          localStorage.setItem('refresh_token', response.refreshToken); // salveaza si asta!
          this.isAuthenticated.set(true);
        }),
        switchMap(() => this.getCurrentUser()),
        catchError(this.handleError),
      );
  }

  refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    return this.http.post<any>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((response) => {
        localStorage.setItem('auth_token', response.accessToken);
        localStorage.setItem('refresh_token', response.refreshToken);
      }),
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    if (error.status === 0) {
      console.error(
        'Could not connect to backend. Is the server running at ' +
          'https://localhost:7102' +
          '?',
      );
    }
    return throwError(
      () =>
        new Error(
          error.error?.message ||
            'A apărut o eroare. Vă rugăm să încercați din nou.',
        ),
    );
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    this.isAuthenticated.set(false);
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  getCurrentUser(): Observable<CurrentUser> {
    return this.http
      .get<CurrentUser>(`${this.apiUrl}/api/account/me`)
      .pipe(tap((user) => this.currentUser.set(user)));
  }
}
