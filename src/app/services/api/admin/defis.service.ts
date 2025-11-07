import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Defi } from '../../../api/model/defi';

@Injectable({ providedIn: 'root' })
export class DefisService {
  private base = `${environment.apiUrl.replace(/\/$/, '')}/admin/defis`;

  constructor(private http: HttpClient) {}

  list(): Observable<Defi[]> {
    return this.http.get<Defi[]>(this.base);
  }

  get(id: number): Observable<Defi> {
    return this.http.get<Defi>(`${this.base}/${id}`);
  }

  create(payload: Partial<Defi>): Observable<Defi> {
    return this.http.post<Defi>(this.base, payload);
  }

  update(id: number, payload: Partial<Defi>): Observable<Defi> {
    return this.http.put<Defi>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}