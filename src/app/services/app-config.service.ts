import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: any;

  constructor(private http: HttpClient) {}

  loadConfig() {
    return this.http
      .get('/assets/config.json')
      .toPromise()
      .then(config => {
        this.config = config;
      });
  }

  get configValue() {
    return this.config;
  }

  get apiWsUrl() {
    return this.config?.apiWsUrl;
  }

  get apiSioUrl() {
    return this.config?.apiSioUrl;
  }

  get apiRestUrl() {
    return this.config?.apiRestUrl;
  }
}
