import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonSelect, IonSelectOption, IonRow, IonCol } from '@ionic/angular/standalone';
import { ApiSigasigaRestService, Sport } from '../../services/api-sigasiga-rest.service';
import { AuthService } from '../../auth/auth.service';
import { MessageService } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { EventLifecycleService } from '../../services/event-lifecycle.service';

@Component({
  selector: 'app-start',
  templateUrl: './start.page.html',
  styleUrls: ['./start.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, 
            IonToolbar, CommonModule, FormsModule,
            IonButton, IonSelect, IonSelectOption, 
            DropdownModule, ButtonModule, IonRow, IonCol]
})
export class StartPage implements OnInit {

  sports: Sport[] = [];
  selectedSport : Sport | null = null;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(private apiService: ApiSigasigaRestService, 
              private authService: AuthService, 
              private messageService: MessageService,
              private router: Router,
              private eventLifecycleService: EventLifecycleService) {}

  ngOnInit() {
    this.loadSports();
  }

  loadSports() {
    this.apiService.getSportsList().subscribe({
      next: (res) => {
        this.sports = res.sports;
        console.log(this.sports);
      },
      error: (err) => {
        this.errorMessage = 'Failed to load sports list.';
        console.error(err);
      }
    });
  }

  confirmSelection() {
    if (!this.selectedSport) {
      this.errorMessage = 'Please select a sport.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.authService.loginWithEvent(this.selectedSport.id).subscribe({
      next: (res) => {
        // Guardar token y event_id en localStorage
        localStorage.setItem('token', res.token);
        localStorage.setItem('event_id', res.event_id);
        this.isLoading = false;
        // Aquí podés redirigir a la siguiente página (por ejemplo tabs o home)
        this.messageService.add({
          severity: 'info',
          summary: 'Iniciando evento',
          detail: 'Evento ' + res.event_id + ' en creación.',
          life: 3000,
        });
        this.eventLifecycleService.startListening();
        this.router.navigate(['/tabs/settings']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Error al crear el evento. Consulte con el administrador.';
        console.error(err);
      }
    });
  }
}