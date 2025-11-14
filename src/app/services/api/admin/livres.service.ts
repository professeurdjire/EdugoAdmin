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
create(livre: Partial<Livre>, document: File, image?: File): Observable<Livre> {
  const formData = new FormData();

  // JSON du livre en tant que partie 'livre'
  formData.append(
    'livre',
    new Blob([JSON.stringify(livre)], { type: 'application/json' })
  );

  // Fichier principal
  formData.append('document', document);

  // Image optionnelle
  if (image) {
    formData.append('image', image);
  }

  // Angular gère automatiquement Content-Type multipart/form-data
  return this.http.post<Livre>(this.base, formData).pipe(
    catchError(this.handleError)
  );
}


updateWithFiles(id: number, livreData: any, document?: File, image?: File): Observable<Livre> {
  const formData = new FormData();
  formData.append('livre', new Blob([JSON.stringify(livreData)], { type: 'application/json' }));
  if (document) formData.append('document', document);
  if (image) formData.append('image', image);
  return this.http.put<Livre>(`${this.base}/${id}`, formData);
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