import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from './app-config.service';

export interface Sport {  
  id: number;
  name: string;
  // Puedes agregar más campos si quieres usarlos en la UI
}

@Injectable({
  providedIn: 'root'
})
export class ApiSigasigaRestService {
  private get baseUrl(): string {
    return this.configService.apiRestUrl; // Make sure apiRestUrl is defined in AppConfigService
  }

  constructor(
    private http: HttpClient,
    private configService: AppConfigService
  ) {}

  createEvent(sport_id: number): Observable<any> {
    const url = `${this.baseUrl}/streaming/new_event/${sport_id}`;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(url, {}, { headers });
  }

  getSportsList() {
    return this.http.get<{ sports: Sport[] }>(`${this.baseUrl}/streaming/sports_list`);
  }

  selectVideoSource(clientId: string): Observable<any> {
    const url = `${this.baseUrl}/streaming/video_source_select`;
    const body = { video_source_name: clientId };
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(url, body, { headers });
  }

  toogleRtmpStatus(): Observable<any> {
    const url = `${this.baseUrl}/streaming/toogle_rtmp_status`;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(url, {}, { headers });
  }

  addNewParticipant(): Observable<any> {
    const url = `${this.baseUrl}/config/add_new_participant`;
    const domain = window.location.host;
    const protocol = window.location.protocol;
    const web_domain = protocol + "//" + domain;
    const body = { web_url: web_domain };
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(url, body, { headers });
  }

  getParticipant(user_id: string): Observable<any> {    
    const url = `${this.baseUrl}/config/participant/${user_id}`;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get(url, { headers });
  }

  getParticipantList(): Observable<any> {
    console.log("getParticipantList");
    const url = `${this.baseUrl}/config/participant_list`;
    const token = localStorage.getItem('token');
    console.log(token);
    console.log("getParticipantList");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    console.log(headers);
    return this.http.get(url, { headers });
  }

  setRtmpKey(rtmp_key: string): Observable<any> {
    const url = `${this.baseUrl}/config/set_rtmp_key`;
    const body = { rtmp_key: rtmp_key };
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(url, body, { headers });
  }

  modifyPoints(team: string, points: number): Observable<any> {
    const url = `${this.baseUrl}/scoreboard/modify_points`; 
    const body = { team: team, points: points };
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(url, body, { headers });
  }

  setTeam(team: string, team_name: string): Observable<any> {
    const url = `${this.baseUrl}/scoreboard/set_team`;
    const body = { team: team, team_name: team_name };
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(url, body, { headers });
  }

  setTime(time: number): Observable<any> {
    const url = `${this.baseUrl}/scoreboard/set_time/${time}`;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(url, {}, { headers });  
  }

  setTime24(time: number): Observable<any> {
    const url = `${this.baseUrl}/scoreboard/set_time24/${time}`;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(url, {}, { headers });
  }
  
  toogleTimerStatus(): Observable<any> {  
    const url = `${this.baseUrl}/scoreboard/toogle_timer_status`;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(url, {}, { headers });
  }

  toogleTimer24Status(): Observable<any> {
    const url = `${this.baseUrl}/scoreboard/toogle_timer24_status`;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.post(url, {}, { headers });
  }
}