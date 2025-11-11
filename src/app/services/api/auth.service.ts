import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
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
    // Le backend a un context path /api, donc les URLs doivent être /api/api/...
    const baseUrl = environment.apiUrl.replace(/\/$/, '');
    const url = `${baseUrl}/api/auth/login`;

  return this.http.post<LoginResponse>(url, { email, motDePasse: password }).pipe(
    tap((res: any) => {
      // ✅ Stockage du token et refresh token dans sessionStorage
      if (res.token) {
        sessionStorage.setItem(this.TOKEN_KEY, res.token);
      }
      if (res.refreshToken) {
        sessionStorage.setItem(this.REFRESH_KEY, res.refreshToken);
      }

      // ✅ Enregistrement de l'utilisateur connecté
      let userObj: User | null = null;
      if (res.user) {
        userObj = res.user as User;
      } else if (res.email || res.id) {
        userObj = {
          id: res.id ?? 0,
          email: res.email ?? '',
          nom: res.nom ?? '',
          prenom: res.prenom ?? '',
          role: (res.role as string) ?? 'USER',
          estActive: true,
          dateCreation: new Date().toISOString()
        } as User;
      }

      if (userObj) {
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(userObj));
        this.currentUserSubject.next(userObj);
      }
    }),
    // ✅ Gestion propre des erreurs
    catchError((error: HttpErrorResponse) => {
      console.error('Erreur HTTP complète:', error);

      let errorMsg = 'Erreur inconnue';
      if (error.error instanceof ErrorEvent) {
        // Erreur côté client (réseau, navigateur)
        errorMsg = `Erreur: ${error.error.message}`;
      } else {
        // Erreur côté serveur
        if (typeof error.error === 'string') {
          try {
            const parsed = JSON.parse(error.error);
            errorMsg = parsed.detail || error.error;
          } catch {
            errorMsg = error.error;
          }
        } else if (error.error?.detail) {
          errorMsg = error.error.detail;
        } else if (error.message) {
          errorMsg = error.message;
        }
      }

      return throwError(() => ({
        message: errorMsg,
        status: error.status,
        originalError: error
      }));
    })
  );
}

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    // In bypass mode, we still need to check if we have a valid token
    if (environment.bypassAuth) {
      // If bypass is enabled, check if we have a dev token or a regular token
      return !!environment.devToken || !!this.getToken();
    }
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  isTokenExpired(): boolean {
    // In bypass mode, tokens are never considered expired
    if (environment.bypassAuth) {
      return false;
    }
    const token = this.getToken();
    if (!token) return true;
    
    return this.jwtHelper.isTokenExpired(token);
  }

  getToken(): string | null {
    // In bypass mode, use the dev token if no regular token exists
    if (environment.bypassAuth && environment.devToken && !sessionStorage.getItem(this.TOKEN_KEY)) {
      return environment.devToken;
    }
    return sessionStorage.getItem(this.TOKEN_KEY);
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
    // Le backend a un context path /api, donc les URLs doivent être /api/api/...
    const baseUrl = environment.apiUrl.replace(/\/$/, '');
    const url = `${baseUrl}/api/auth/refresh`;
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
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  private setRefreshToken(token: string): void {
    sessionStorage.setItem(this.REFRESH_KEY, token);
  }

  private setUser(user: User): void {
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getUser(): User | null {
    const userStr = sessionStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_KEY);
  }

  // Méthode pour vérifier les permissions spécifiques
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Simplified permission checking for ADMIN and ELEVE roles
    const userRole = user.role?.toUpperCase();
    
    // ADMIN has all permissions
    if (userRole === 'ADMIN') {
      return true;
    }
    
    // ELEVE has limited permissions
    const elevePermissions = ['view_content', 'take_quizzes'];
    return elevePermissions.includes(permission);
  }

  private getUserPermissions(role: string): string[] {
    // Simplified permissions for your two roles
    const permissions: { [key: string]: string[] } = {
      'ADMIN': ['*'], // ADMIN has all permissions
      'ELEVE': ['view_content', 'take_quizzes'] // ELEVE has limited permissions
    };

    return permissions[role.toUpperCase()] || [];
  }
}
