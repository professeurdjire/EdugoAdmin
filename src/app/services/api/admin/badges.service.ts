import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BadgeResponse } from '../../../api/model/badgeResponse';
import { BadgeRequest } from '../../../api/model/badgeRequest';

@Injectable({ providedIn: 'root' })
export class BadgesService {
  private base = `${environment.apiUrl.replace(/\/$/, '')}/api/badges`;

  constructor(private http: HttpClient) {}

  list(): Observable<BadgeResponse[]> {
    return this.http.get<BadgeResponse[]>(this.base);
  }

  get(id: number): Observable<BadgeResponse> {
    return this.http.get<BadgeResponse>(`${this.base}/${id}`);
  }

  create(payload: BadgeRequest): Observable<BadgeResponse> {
    return this.http.post<BadgeResponse>(this.base, payload);
  }

  update(id: number, payload: BadgeRequest): Observable<BadgeResponse> {
    return this.http.put<BadgeResponse>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}