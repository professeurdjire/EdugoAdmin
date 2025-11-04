import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Niveau } from '../../../models/niveau.model';

@Injectable({ providedIn: 'root' })
export class NiveauxService {
  private base = `${environment.apiUrl.replace(/\/$/, '')}/admin/niveaux`;

  constructor(private http: HttpClient) {}

  list(): Observable<Niveau[]> {
    return this.http.get<Niveau[]>(this.base);
  }

  get(id: number): Observable<Niveau> {
    return this.http.get<Niveau>(`${this.base}/${id}`);
  }

  create(payload: Partial<Niveau>): Observable<Niveau> {
    return this.http.post<Niveau>(this.base, payload);
  }

  update(id: number, payload: Partial<Niveau>): Observable<Niveau> {
    return this.http.put<Niveau>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
