// src/app/services/event-lifecycle.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SigasigaSocketioService } from './sigasiga-socketio.service';

@Injectable({
  providedIn: 'root'
})
export class EventLifecycleService {

  private eventId: string | null = null;
  private isListening = false;

  constructor(
    private socketService: SigasigaSocketioService,
    private messageService: MessageService,
    private router: Router
  ) {}

  startListening() {
    if (this.isListening) return;

    this.eventId = localStorage.getItem('event_id');
    console.log("🟢 EventLifecycleService: startListening");
    console.log('eventId', this.eventId);
    if (!this.eventId) return;

    this.isListening = true;

    this.socketService.on(`${this.eventId}-config_room-stop_event`, (data: any) => {
      console.log("🟢 EventLifecycleService: stop_event");
      this.messageService.add({
        severity: 'warn',
        summary: 'Evento finalizado por el usuario',
        detail: '',
        life: 3000
      });

      setTimeout(() => {
        this.socketService.disconnect();
        localStorage.removeItem('token');
        localStorage.removeItem('event_id');
        this.isListening = false;
      }, 3000);
      window.location.href = '/start';
    });
  }

  stopListening() {
    this.socketService.disconnect();
    this.isListening = false;
  }
}
