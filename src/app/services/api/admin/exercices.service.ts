import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Exercice } from '../../../api/model/exercice';

@Injectable({ providedIn: 'root' })
export class ExercicesService {
  private base = `${environment.apiUrl.replace(/\/$/, '')}/admin/exercices`;

  constructor(private http: HttpClient) {}

  list(): Observable<Exercice[]> {
    return this.http.get<Exercice[]>(this.base);
  }

  get(id: number): Observable<Exercice> {
    return this.http.get<Exercice>(`${this.base}/${id}`);
  }

  create(payload: Partial<Exercice>): Observable<Exercice> {
    return this.http.post<Exercice>(this.base, payload);
  }

  update(id: number, payload: Partial<Exercice>): Observable<Exercice> {
    return this.http.put<Exercice>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}