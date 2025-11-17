// langues.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Langue } from '../../../api/model/langue';

@Injectable({ 
  providedIn: 'root'  // ✅ Assurez-vous que cette ligne est présente
})
export class LanguesService {  // ✅ Assurez-vous que c'est bien 'export class'
  private base = `${environment.apiUrl}/api/admin/langues`;

  constructor(private http: HttpClient) {}

  list(): Observable<Langue[]> { 
    return this.http.get<Langue[]>(this.base); 
  }

  get(id: number): Observable<Langue> { 
    return this.http.get<Langue>(`${this.base}/${id}`); 
  }

  create(payload: Partial<Langue>): Observable<Langue> { 
    return this.http.post<Langue>(this.base, payload); 
  }

  update(id: number, payload: Partial<Langue>): Observable<Langue> { 
    return this.http.put<Langue>(`${this.base}/${id}`, payload); 
  }

  delete(id: number): Observable<void> { 
    return this.http.delete<void>(`${this.base}/${id}`); 
  }
}