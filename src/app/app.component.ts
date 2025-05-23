import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
//importar event lifecycle service
import { EventLifecycleService } from './services/event-lifecycle.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, ToastModule],
  providers: [],
})
export class AppComponent {
  constructor(private eventLifecycleService: EventLifecycleService) {
    this.enableDarkTheme();
  }

  enableDarkTheme() {
    document.body.classList.add('dark');
  }

  ngOnInit() {
    const eventId = localStorage.getItem('event_id');
    if (eventId) {
      this.eventLifecycleService.startListening();
    }
  }
}
