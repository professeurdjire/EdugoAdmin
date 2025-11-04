import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  estActive: boolean;
  photoProfil?: string;
  dateCreation: string;
}

// The backend may return either { token, user } or a flat LoginResponse with token, refreshToken and user fields.
export interface LoginResponse {
  token?: string;
  refreshToken?: string;
  user?: User;
  // fallback flat fields
  email?: string;
  nom?: string;
  prenom?: string;
  role?: string;
  id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_KEY = 'auth_refresh_token';
  private readonly USER_KEY = 'user_data';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<LoginResponse> {
    const url = `${environment.apiUrl.replace(/\/$/, '')}/auth/login`;
    // Le backend attend le champ 'motDePasse' (conforme à la spec OpenAPI)
    return this.http.post<LoginResponse>(url, { email, motDePasse: password })
      .pipe(
        tap(response => {
          // token
          if (response.token) {
            this.setToken(response.token);
          }
          // refresh token
          if ((response as any).refreshToken) {
            this.setRefreshToken((response as any).refreshToken);
          }

          // user object may be nested or returned as flat fields
          let userObj: User | null = null;
          if (response.user) {
            userObj = response.user as User;
          } else if (response.email || response.id) {
            userObj = {
              id: response.id ?? 0,
              email: response.email ?? '',
              nom: response.nom ?? '',
              prenom: response.prenom ?? '',
              role: (response.role as string) ?? 'USER',
              estActive: true,
              dateCreation: new Date().toISOString()
            } as User;
          }
          if (userObj) {
            this.setUser(userObj);
            this.currentUserSubject.next(userObj);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    return this.jwtHelper.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole?.toUpperCase() === role.toUpperCase();
  }

  refreshToken(): Observable<LoginResponse> {
    const url = `${environment.apiUrl.replace(/\/$/, '')}/auth/refresh`;
    const refresh = this.getRefreshToken();
    if (!refresh) throw new Error('No refresh token available');
    return this.http.post<LoginResponse>(url, { refreshToken: refresh })
      .pipe(
        tap(response => {
          if (response.token) this.setToken(response.token);
          if ((response as any).refreshToken) this.setRefreshToken((response as any).refreshToken);

          // update user if present
          if (response.user) {
            this.setUser(response.user);
            this.currentUserSubject.next(response.user);
          }
        })
      );
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_KEY, token);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  // Méthode pour vérifier les permissions spécifiques
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Implémentez votre logique de permissions ici
    const userPermissions = this.getUserPermissions(user.role);
    return userPermissions.includes(permission);
  }

  private getUserPermissions(role: string): string[] {
    const permissions: { [key: string]: string[] } = {
      'SUPER_ADMIN': ['*'],
      'ADMIN': [
        'manage_users', 'manage_content', 'view_reports',
        'manage_quizzes', 'manage_books', 'manage_classes'
      ],
      'MODERATOR': [
        'manage_content', 'view_reports', 'manage_quizzes'
      ],
      'USER': ['view_content', 'take_quizzes']
    };

    return permissions[role] || [];
  }
}
