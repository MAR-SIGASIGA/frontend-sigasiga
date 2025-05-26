import { Component, Input } from '@angular/core';
import { LoadingController, ModalController, IonicModule } from '@ionic/angular';
import { ApiSigasigaRestService } from  '../../services/api-sigasiga-rest.service';
import { AppConfigService } from '../../services/app-config.service';
import { ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { HttpErrorResponse } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-participants-modal',
  templateUrl: './participants-modal.component.html',
  styleUrls: ['./participants-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ToastModule, ButtonModule]
})
export class ParticipantsModalComponent {
  @Input() participants: any;
  expandedParticipantId: string | null = null;
  constructor(private modalCtrl: ModalController, 
    private apiSigasigaRestService: ApiSigasigaRestService, 
    private configService: AppConfigService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private messageService: MessageService) {}  

  close() {
    this.modalCtrl.dismiss();
  }

  getToken(): string {
    return localStorage.getItem('token') ?? '';
  }

  viewDetails(p: any) {
    this.expandedParticipantId = this.expandedParticipantId === p.user_id ? null : p.user_id;
  }

  getRestUrl(): string {
    return this.configService.apiRestUrl;
  }

  async addParticipant() {
    const loading = await this.loadingController.create({
      message: 'Cargando participantes...',
      spinner: 'crescent',
    });
  
    await loading.present();
  
    try {
      const response = await firstValueFrom(this.apiSigasigaRestService.addNewParticipant());
      // console.log('response', response);
      const participant = {user_id: response?.user_id,
        join_url: response?.join_url,
      };
      this.participants.push(participant);
      this.messageService.add({severity:'success', summary: 'Participante añadido', detail: response.message });

    } catch (error) {
      console.error('Error al añadir participante:', error);
      if (error instanceof HttpErrorResponse) {
        // console.log('errorMessage', error.error.error);
        this.messageService.add({severity:'error', summary: 'Error', detail: error.error.error });
      }
      // Mostrar alerta, toast, etc.
    } finally {
      await loading.dismiss();
    }
  }
  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Opcional: mostrar toast o alert
      this.messageService.add({
        severity: 'info',
        summary: 'Copiado al portapapeles',
        life: 3000,
      });
      // console.log('Copiado al portapapeles');
    }).catch(err => {
      // console.error('Error al copiar', err);
    });
  }
}