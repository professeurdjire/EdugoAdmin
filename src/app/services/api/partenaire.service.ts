import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Partenaire } from '../../models/partenaire.model';
import { environment } from '../../../environments/environment';

export interface PartenaireResponse {
  content: Partenaire[]; // S'assurer que content est un tableau de Partenaire
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PartenaireService {
  private baseUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/partenaires`;

  constructor(private http: HttpClient) {}

  // // Get all partenaires with pagination and filters
  // getAll(
  //   page: number = 0,
  //   size: number = 10,
  //   sortBy: string = 'nom',
  //   sortDirection: string = 'asc',
  //   searchTerm: string = '',
  //   status: string = '',
  //   type: string = ''
  // ): Observable<PartenaireResponse> {
  //   let params = new HttpParams()
  //     .set('page', page.toString())
  //     .set('size', size.toString())
  //     .set('sortBy', sortBy)
  //     .set('sortDirection', sortDirection);

  //   if (searchTerm) {
  //     params = params.set('search', searchTerm);
  //   }

  //   if (status) {
  //     params = params.set('status', status);
  //   }

  //   if (type) {
  //     params = params.set('type', type);
  //   }

  //   return this.http.get<PartenaireResponse>(this.baseUrl, { params })
  //     .pipe(
  //       catchError(this.handleError)
  //     );
  // }
  // Dans PartenaireService - CORRIGER la méthode getAll
getAll(
  page: number = 0,
  size: number = 10,
  sortBy: string = 'nom',
  sortDirection: string = 'asc',
  searchTerm: string = '',
  status: string = '',
  type: string = ''
): Observable<PartenaireResponse> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('sort', `${sortBy},${sortDirection}`); // Format standard pour Spring

  if (searchTerm) {
    params = params.set('search', searchTerm);
  }

  if (status) {
    params = params.set('statut', status); // Corriger le nom du paramètre
  }

  if (type) {
    params = params.set('type', type);
  }

  console.log('Requête API Partenaires:', { 
    url: this.baseUrl, 
    params: params.toString() 
  });

  return this.http.get<PartenaireResponse>(this.baseUrl, { params })
    .pipe(
      tap(response => console.log('Réponse API Partenaires:', response)),
      catchError(this.handleError)
    );
}

  // Get a single partenaire by ID
  getById(id: number): Observable<Partenaire> {
    return this.http.get<ApiResponse<Partenaire>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Create a new partenaire
  create(partenaire: Partenaire): Observable<Partenaire> {
    return this.http.post<ApiResponse<Partenaire>>(this.baseUrl, partenaire)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Update an existing partenaire
  update(id: number, partenaire: Partenaire): Observable<Partenaire> {
    return this.http.put<ApiResponse<Partenaire>>(`${this.baseUrl}/${id}`, partenaire)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Delete a partenaire
  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  // Get partenaires statistics
  getStatistics(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/statistics`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // Export partenaires to Excel
  exportToExcel(filters: any = {}): Observable<Blob> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params = params.set(key, filters[key]);
      }
    });

    return this.http.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = error.error.message;
    } else {
      // Erreur côté serveur
      if (error.status === 400) {
        errorMessage = 'Données invalides fournies';
      } else if (error.status === 401) {
        errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
      } else if (error.status === 403) {
        errorMessage = 'Accès refusé';
      } else if (error.status === 404) {
        errorMessage = 'Partenaire non trouvé';
      } else if (error.status === 500) {
        errorMessage = 'Erreur interne du serveur';
      } else {
        errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    console.error('PartenaireService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}