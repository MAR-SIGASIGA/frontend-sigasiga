import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../services/app-config.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl: string = '';

  constructor(
    private http: HttpClient,
    private configService: AppConfigService,
    private router: Router
  ) {
    this.apiUrl = this.configService.apiRestUrl;
  }

  loginWithEvent(sportId: number) {
    const url = `${this.apiUrl}/streaming/new_event/${sportId}`;
    return this.http.post<{ event_id: string; token: string }>(url, {});
  }
  
  // Guardar token y event_id juntos
  saveAuthData(token: string, eventId: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('event_id', eventId);
  }
  
  // Obtener token
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  
  // Obtener event id
  getEventId(): string | null {
    return localStorage.getItem('event_id');
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/start']);
  }
}
