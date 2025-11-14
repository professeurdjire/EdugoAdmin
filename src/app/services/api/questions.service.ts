import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QuestionType {
  id: number;
  libelle: 'QCU' | 'QCM' | 'VRAI_FAUX' | 'APPARIEMENT' | string;
}

export interface ReponseOption {
  libelle: string;
  estCorrecte: boolean;
}

export interface CreateQuestionRequest {
  quizId?: number;
  exerciceId?: number;
  challengeId?: number;
  defiId?: number;
  enonce: string;
  points?: number;
  type: 'QCU' | 'QCM' | 'VRAI_FAUX' | 'APPARIEMENT';
  reponses: ReponseOption[];
}

export interface QuestionResponse {
  id: number;
  enonce: string;
  points: number;
  type: string;
  reponses: ReponseOption[];
}

@Injectable({ providedIn: 'root' })
export class QuestionsService {
  private base = `${environment.apiUrl.replace(/\/$/, '')}/api/questions`;
  private typesUrl = `${environment.apiUrl.replace(/\/$/, '')}/api/type-questions`;

  constructor(private http: HttpClient) {}

  getTypes(): Observable<QuestionType[]> {
    return this.http.get<QuestionType[]>(this.typesUrl);
    
  }

  createQuestion(payload: CreateQuestionRequest): Observable<QuestionResponse> {
    return this.http.post<QuestionResponse>(this.base, payload);
  }

  listByQuiz(quizId: number): Observable<QuestionResponse[]> {
    return this.http.get<QuestionResponse[]>(`${this.base}/by-quiz/${quizId}`);
  }

  listByExercice(exerciceId: number): Observable<QuestionResponse[]> {
    return this.http.get<QuestionResponse[]>(`${this.base}/by-exercices/${exerciceId}`);
  }

  listByChallenge(challengeId: number): Observable<QuestionResponse[]> {
    return this.http.get<QuestionResponse[]>(`${this.base}/by-challenges/${challengeId}`);
  }

  listByDefi(defiId: number): Observable<QuestionResponse[]> {
    return this.http.get<QuestionResponse[]>(`${this.base}/by-defis/${defiId}`);
  }
}
