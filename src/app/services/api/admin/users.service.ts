import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from '../../../api/model/user';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private base = `${environment.apiUrl.replace(/\/$/, '')}/users`;

  constructor(private http: HttpClient) {}

  list(): Observable<User[]> { 
    return this.http.get<User[]>(this.base); 
  }
  
  get(id: number): Observable<User> { 
    return this.http.get<User>(`${this.base}/${id}`); 
  }
  
  create(payload: Partial<User>): Observable<User> { 
    return this.http.post<User>(this.base, payload); 
  }
  
  update(id: number, payload: Partial<User>): Observable<User> { 
    return this.http.put<User>(`${this.base}/${id}`, payload); 
  }
  
  delete(id: number): Observable<void> { 
    return this.http.delete<void>(`${this.base}/${id}`); 
  }
}