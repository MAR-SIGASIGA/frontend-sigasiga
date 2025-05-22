import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { LoadingController, ModalController } from '@ionic/angular';
import { ParticipantsModalComponent } from '../../modals/participants-modal/participants-modal.component'; // ajusta la ruta si es diferente
import { ApiSigasigaRestService } from '../../services/api-sigasiga-rest.service';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ToastModule],
})
export class SettingsPage implements OnInit {
  participants_list: any;
  rtmpKey: string = '';
  youtubeToggle: boolean = false;

  constructor(private modalCtrl: ModalController, 
    private loadingController: LoadingController,
    private apiSigasigaRestService: ApiSigasigaRestService) {}

  ngOnInit() {
  }

  async openParticipantsModal() {
    const loading = await this.loadingController.create({
      message: 'Cargando participantes...',
      spinner: 'crescent',
    });
  
    await loading.present();
  
    try {
      const response = await firstValueFrom(this.apiSigasigaRestService.getParticipantList());
      const participants_list = response?.participants;
  
      const modal = await this.modalCtrl.create({
        component: ParticipantsModalComponent,
        cssClass: 'full-modal',
        componentProps: {
          participants: participants_list
        }
      });
  
      await modal.present();
    } catch (error) {
      console.error('Error al obtener participantes:', error);
      // Mostrar alerta, toast, etc.
    } finally {
      await loading.dismiss();
    }
  }

  enviarRTMPKey() {
    console.log('RTMP Key:', this.rtmpKey);
    // tu lógica para enviar la key
  }
  
  toggleYoutube() {
    console.log('YouTube activado:', this.youtubeToggle);
    // tu lógica para habilitar/deshabilitar transmisión
  }
}
