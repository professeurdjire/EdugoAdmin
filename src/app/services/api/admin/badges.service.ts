import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BadgeResponse } from '../../../api/model/badgeResponse';
import { BadgeRequest } from '../../../api/model/badgeRequest';

@Injectable({ providedIn: 'root' })
export class BadgesService {
  // Le backend a un context path /api, donc les URLs doivent être /api/api/...
  private base = `${environment.apiUrl.replace(/\/$/, '')}/api/admin/badges`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  list(): Observable<BadgeResponse[]> {
    return this.http.get<BadgeResponse[]>(this.base, { headers: this.getHeaders() });
  }

  get(id: number): Observable<BadgeResponse> {
    return this.http.get<BadgeResponse>(`${this.base}/${id}`, { headers: this.getHeaders() });
  }

  create(payload: BadgeRequest): Observable<BadgeResponse> {
    return this.http.post<BadgeResponse>(this.base, payload, { headers: this.getHeaders() });
  }

  update(id: number, payload: BadgeRequest): Observable<BadgeResponse> {
    return this.http.put<BadgeResponse>(`${this.base}/${id}`, payload, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, { headers: this.getHeaders() });
  }
}