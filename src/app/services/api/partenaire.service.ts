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

    // Accepter soit un PartenaireResponse direct, soit un ApiResponse<PartenaireResponse>
    return this.http.get<any>(this.baseUrl, { params })
      .pipe(
        tap(resp => console.log('Réponse brute API Partenaires:', resp)),
        map((resp: any): PartenaireResponse => {
          // Cas 1 : enveloppe { data: { content, totalElements, ... } }
          if (resp && resp.data && resp.data.content) {
            return resp.data as PartenaireResponse;
          }

          // Cas 2 : réponse déjà au format PartenaireResponse
          if (resp && resp.content) {
            return resp as PartenaireResponse;
          }

          // Cas 3 : tableau simple de partenaires
          if (Array.isArray(resp)) {
            const content = resp as Partenaire[];
            return {
              content,
              totalElements: content.length,
              totalPages: 1,
              size: content.length,
              number: 0,
              first: true,
              last: true,
              empty: content.length === 0
            } as PartenaireResponse;
          }

          // Fallback : aucune donnée exploitable
          return {
            content: [],
            totalElements: 0,
            totalPages: 1,
            size: 0,
            number: 0,
            first: true,
            last: true,
            empty: true
          } as PartenaireResponse;
        }),
        tap(page => console.log('Réponse normalisée Partenaires:', page)),
        catchError(this.handleError)
      );
  }

  // Get a single partenaire by ID
  getById(id: number): Observable<Partenaire> {
    return this.http.get<any>(`${this.baseUrl}/${id}`)
      .pipe(
        map(response => {
          // Si la réponse est directement un Partenaire
          if (response && (response.nom || response.id)) {
            return response as Partenaire;
          }
          // Si la réponse est encapsulée dans {data: ...}
          if (response && response.data) {
            return response.data as Partenaire;
          }
          // Sinon, retourner la réponse telle quelle
          return response as Partenaire;
        }),
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