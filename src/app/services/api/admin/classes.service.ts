import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Classe } from '../../../api/model/classe';

@Injectable({ providedIn: 'root' })
export class ClassesService {
  // Le backend a un context path /api, donc les URLs doivent être /api/api/...
  private base = `${environment.apiUrl}/api/classes`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${JSON.parse(token)}`);
    }
    
    return headers;
  }

  list(): Observable<Classe[]> {
    return this.http.get<Classe[]>(this.base, { headers: this.getHeaders() });
  }

  get(id: number): Observable<Classe> {
    return this.http.get<Classe>(`${this.base}/${id}`, { headers: this.getHeaders() });
  }

  create(payload: Partial<Classe>): Observable<Classe> {
    return this.http.post<Classe>(this.base, payload, { headers: this.getHeaders() });
  }

  update(id: number, payload: Partial<Classe>): Observable<Classe> {
    return this.http.put<Classe>(`${this.base}/${id}`, payload, { headers: this.getHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, { headers: this.getHeaders() });
  }
}