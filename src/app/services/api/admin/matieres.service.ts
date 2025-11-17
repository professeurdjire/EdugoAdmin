import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Matiere } from '../../../api/model/matiere';

@Injectable({ providedIn: 'root' })
export class MatieresService {
  // Le backend a un context path /api, donc les URLs doivent être /api/api/...
  private base = `${environment.apiUrl}/matieres`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${JSON.parse(token)}`);
    }
    
    return headers;
  }

  list(): Observable<Matiere[]> {
    return this.http.get<Matiere[]>(this.base, { headers: this.getHeaders() });
  }

  get(id: number): Observable<Matiere> {
    return this.http.get<Matiere>(`${this.base}/${id}`, { headers: this.getHeaders() });
  }

  create(payload: Partial<Matiere>): Observable<Matiere> {
    return this.http.post<Matiere>(this.base, payload, { headers: this.getHeaders() });
  }

  update(id: number, payload: Partial<Matiere>): Observable<Matiere> {
    return this.http.put<Matiere>(`${this.base}/${id}`, payload, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, { headers: this.getHeaders() });
  }
}