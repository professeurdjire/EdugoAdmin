import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Quiz } from '../../../api/model/quiz';

@Injectable({ providedIn: 'root' })
export class QuizService {
  // Le backend a un context path /api, donc les URLs doivent être /api/api/...
  private base = `${environment.apiUrl.replace(/\/$/, '')}/api/admin/quizzes`;

  constructor(private http: HttpClient) {}

  list(): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(this.base);
  }

  get(id: number): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.base}/${id}`);
  }

  create(payload: Partial<Quiz>): Observable<Quiz> {
    return this.http.post<Quiz>(this.base, payload);
  }

  update(id: number, payload: Partial<Quiz>): Observable<Quiz> {
    return this.http.put<Quiz>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}