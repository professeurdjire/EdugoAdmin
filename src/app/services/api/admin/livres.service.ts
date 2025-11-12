import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Livre } from '../../../api/model/livre';

@Injectable({ providedIn: 'root' })
export class LivresService {
  private base = `${environment.apiUrl}/api/admin/livres`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = error.error.message;
    } else {
      // Erreur côté serveur
      errorMessage = `Erreur ${error.status}: ${error.message}`;
    }
    
    console.error('LivresService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  list(): Observable<Livre[]> { 
    return this.http.get<Livre[]>(this.base).pipe(
      catchError(this.handleError)
    );
  }

  get(id: number): Observable<Livre> { 
    return this.http.get<Livre>(`${this.base}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  create(payload: Partial<Livre>): Observable<Livre> { 
    return this.http.post<Livre>(this.base, payload).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, payload: Partial<Livre>): Observable<Livre> { 
    return this.http.put<Livre>(`${this.base}/${id}`, payload).pipe(
      catchError(this.handleError)
    );
  }

  delete(id: number): Observable<void> { 
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

// Dans LivresService
uploadFichier(livreId: number, fichier: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', fichier);
  return this.http.post(`${this.base}/${livreId}/upload-fichier`, formData);
}

uploadImage(livreId: number, image: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', image);
  return this.http.post(`${this.base}/${livreId}/upload-image`, formData);
}

// Optionnel - si vous voulez garder l'ancienne méthode
uploadWithFiles(formData: FormData): Observable<Livre> {
  return this.http.post<Livre>(this.base, formData);
}
}