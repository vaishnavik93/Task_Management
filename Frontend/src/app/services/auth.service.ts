import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  
  currentUser = signal<any | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadUser();
  }

  private loadUser() {
    const token = localStorage.getItem('token');
    if (token) {
      this.currentUser.set({
        token,
        userId: parseInt(localStorage.getItem('userId') || '0'),
        username: localStorage.getItem('username'),
        email: localStorage.getItem('email'),
        role: localStorage.getItem('role')
      });
    }
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'Admin';
  }

  getCurrentUser() {
    return this.currentUser();
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  register(user: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, user).pipe(
      tap(res => this.handleAuth(res))
    );
  }

  private handleAuth(res: any) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('userId', res.userId.toString());
    localStorage.setItem('username', res.username);
    localStorage.setItem('email', res.email);
    localStorage.setItem('role', res.role);
    
    this.currentUser.set({
      token: res.token,
      userId: res.userId,
      username: res.username,
      email: res.email,
      role: res.role
    });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }
}
