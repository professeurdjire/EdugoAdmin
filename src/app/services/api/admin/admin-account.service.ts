import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService, User } from '../auth.service';
import { Suggestion } from '../../../api/model/suggestion';

export interface AdminPreferencesDto {
  langueInterface?: string;
  theme?: string;
  notificationsEmail?: boolean;
  notificationsInApp?: boolean;
  recevoirRapportQuotidien?: boolean;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface AdminNotification {
  id: number;
  titre: string;
  message: string;
  type: string;
  lu: boolean;
  dateCreation: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAccountService {
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  // Profil courant
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/api/admin/me`);
  }

  updateMe(payload: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/api/admin/me`, payload);
  }

  // Mot de passe
  changePassword(payload: ChangePasswordRequest): Observable<void> {
    const current = this.auth.getCurrentUser();
    const id = current?.id;
    return this.http.post<void>(`${this.baseUrl}/api/admin/users/${id}/change-password`, payload);
  }

  // Préférences
  getPreferences(): Observable<AdminPreferencesDto> {
    return this.http.get<AdminPreferencesDto>(`${this.baseUrl}/api/admin/preferences`);
  }

  updatePreferences(prefs: AdminPreferencesDto): Observable<AdminPreferencesDto> {
    return this.http.put<AdminPreferencesDto>(`${this.baseUrl}/api/admin/preferences`, prefs);
  }

  // Notifications
  getNotifications(): Observable<AdminNotification[]> {
    return this.http.get<AdminNotification[]>(`${this.baseUrl}/api/admin/notifications`);
  }

  getUnreadNotifications(): Observable<AdminNotification[]> {
    return this.http.get<AdminNotification[]>(`${this.baseUrl}/api/admin/notifications/non-lues`);
  }

  markNotificationAsRead(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/api/admin/notifications/${id}/marquer-lue`, {});
  }

  // Suggestions des élèves (pour affichage dans l'admin)
  getSuggestions(): Observable<Suggestion[]> {
    return this.http.get<Suggestion[]>(`${this.baseUrl}/api/suggestions`);
  }
}
