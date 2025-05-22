import { Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SigasigaSocketioService {
  private socket: Socket;

  constructor(private configService: AppConfigService) {
    const sioUrl = this.configService.apiSioUrl;
    this.socket = io(sioUrl, { transports: ['websocket'] });
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket.on(event, callback);
  }

  emit(event: string, data?: any): void {
    this.socket.emit(event, data);
  }

  disconnect(): void {
    this.socket.disconnect();
  }
} 