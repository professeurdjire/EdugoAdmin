import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface EleveProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  photoProfil: string | null;
  telephone: number | null;
  ville: string | null;
  classeId: number | null;
  classeNom: string | null;
  niveauId: number | null;
  niveauNom: string | null;
  pointAccumule: number | null;
  role: 'ELEVE' | 'ADMIN';
}

@Injectable({ providedIn: 'root' })
export class AdminEleveService {
  private baseUrl = `${environment.apiUrl}/api/admin/eleves`;

  constructor(private http: HttpClient) {}

  listEleves(): Observable<EleveProfile[]> {
    return this.http.get<EleveProfile[]>(this.baseUrl);
  }
}
