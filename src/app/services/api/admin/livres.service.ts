import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Livre } from '../../../api/model/livre';

@Injectable({ providedIn: 'root' })
export class LivresService {
  // Le backend a un context path /api, donc les URLs doivent être /api/api/...
  private base = `${environment.apiUrl.replace(/\/$/, '')}/api/admin/livres`;

  constructor(private http: HttpClient) {}

  list(): Observable<Livre[]> { return this.http.get<Livre[]>(this.base); }
  get(id: number): Observable<Livre> { return this.http.get<Livre>(`${this.base}/${id}`); }
  create(payload: Partial<Livre>): Observable<Livre> { return this.http.post<Livre>(this.base, payload); }
  update(id: number, payload: Partial<Livre>): Observable<Livre> { return this.http.put<Livre>(`${this.base}/${id}`, payload); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
}
