import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Classe } from '../../../api/model/classe';

@Injectable({ providedIn: 'root' })
export class ClassesService {
  private base = `${environment.apiUrl.replace(/\/$/, '')}/classes`;

  constructor(private http: HttpClient) {}

  list(): Observable<Classe[]> {
    return this.http.get<Classe[]>(this.base);
  }

  get(id: number): Observable<Classe> {
    return this.http.get<Classe>(`${this.base}/${id}`);
  }

  create(payload: Partial<Classe>): Observable<Classe> {
    return this.http.post<Classe>(this.base, payload);
  }

  update(id: number, payload: Partial<Classe>): Observable<Classe> {
    return this.http.put<Classe>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}