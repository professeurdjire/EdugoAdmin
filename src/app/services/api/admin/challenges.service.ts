import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Challenge } from '../../../api/model/challenge';

@Injectable({ providedIn: 'root' })
export class ChallengesService {
  // Le backend a un context path /api, donc les URLs doivent être /api/api/...
  private base = `${environment.apiUrl.replace(/\/$/, '')}/api/admin/challenges`;

  constructor(private http: HttpClient) {}

  list(): Observable<Challenge[]> {
    return this.http.get<Challenge[]>(this.base);
  }

  get(id: number): Observable<Challenge> {
    return this.http.get<Challenge>(`${this.base}/${id}`);
  }

  create(payload: Partial<Challenge>): Observable<Challenge> {
    return this.http.post<Challenge>(this.base, payload);
  }

  update(id: number, payload: Partial<Challenge>): Observable<Challenge> {
    return this.http.put<Challenge>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}