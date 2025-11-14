import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Exercice } from '../../../api/model/exercice';

@Injectable({ providedIn: 'root' })
export class ExercicesService {
  // Le backend a un context path /api, donc les URLs doivent être /api/api/...
  private base = `${environment.apiUrl.replace(/\/$/, '')}/api/admin/exercices`;

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

  // Création multipart: JSON + fichiers
  createWithFiles(exercice: any, document: File, image?: File): Observable<Exercice> {
    const formData = new FormData();
    formData.append('exercice', new Blob([JSON.stringify(exercice)], { type: 'application/json' }));
    formData.append('document', document);
    if (image) formData.append('image', image);
    return this.http.post<Exercice>(this.base, formData);
  }

  update(id: number, payload: Partial<Exercice>): Observable<Exercice> {
    return this.http.put<Exercice>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}