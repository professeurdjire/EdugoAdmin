import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Matiere } from '../../../api/model/matiere';

@Injectable({ providedIn: 'root' })
export class MatieresService {
  private base = `${environment.apiUrl.replace(/\/$/, '')}/matieres`;

  constructor(private http: HttpClient) {}

  list(): Observable<Matiere[]> {
    return this.http.get<Matiere[]>(this.base);
  }

  get(id: number): Observable<Matiere> {
    return this.http.get<Matiere>(`${this.base}/${id}`);
  }

  create(payload: Partial<Matiere>): Observable<Matiere> {
    return this.http.post<Matiere>(this.base, payload);
  }

  update(id: number, payload: Partial<Matiere>): Observable<Matiere> {
    return this.http.put<Matiere>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}