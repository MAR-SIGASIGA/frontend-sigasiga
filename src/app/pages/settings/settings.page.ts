import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { LoadingController, ModalController } from '@ionic/angular';
import { ParticipantsModalComponent } from '../../modals/participants-modal/participants-modal.component'; // ajusta la ruta si es diferente
import { ApiSigasigaRestService } from '../../services/api-sigasiga-rest.service';
import { async, firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Router } from '@angular/router';
import { SigasigaSocketioService } from '../../services/sigasiga-socketio.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ToastModule, ConfirmPopupModule, ButtonModule, ToggleSwitchModule, ConfirmDialogModule],
  providers: [ConfirmationService, MessageService]
})
export class SettingsPage implements OnInit {
  participants_list: any;
  rtmpKey: string = '';
  rtmpKeyInput: string = '';
  rtmpToogle: boolean = false;

  constructor(private modalCtrl: ModalController, 
    private loadingController: LoadingController,
    private apiSigasigaRestService: ApiSigasigaRestService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router,
    private socketService: SigasigaSocketioService) {}

  ngOnInit() {
    const eventId = localStorage.getItem('event_id');
    this.apiSigasigaRestService.getRtmpInfo().subscribe((response) => {
      this.rtmpKey = response.rtmp_key;
      this.rtmpToogle = response.rtmp_status;
      console.log(response);
    });
    this.socketService.on(`${eventId}-config_room-rtmp_status`, (data: any) => {
      console.log(data);
      this.rtmpToogle = data.data.status;
      this.rtmpKey = data.data.rtmp_key;
      console.log(this.rtmpToogle);
    });
    this.socketService.on(`${eventId}-config_room-stop_event`, (data: any) => {
      console.log(data);

      this.messageService.add({ severity: 'warn', summary: 'Evento finalizado por el usuario', detail: '', life: 3000 });
      setTimeout(() => {
        this.socketService.disconnect();
        localStorage.removeItem('token');
        localStorage.removeItem('event_id');
        this.router.navigate(['/start']);
      }, 3000);
    });
  }
  
  isRtmpToogleEnabled() {
    return this.rtmpKey != '';
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
    console.log('RTMP Key:', this.rtmpKeyInput);
    this.rtmpKey = this.rtmpKeyInput;
    this.apiSigasigaRestService.setRtmpKey(this.rtmpKey).subscribe((response) => {
      this.messageService.add({ severity: 'success', summary: 'RTMP Key actualizada', detail: '', life: 3000 });
    });
    // tu lógica para enviar la key
  }
  
  toogleRtmp() {
    console.log('YouTube activado:', this.rtmpToogle);
    this.apiSigasigaRestService.toogleRtmpStatus().subscribe((response) => {
      if (response.status) {
        this.messageService.add({ severity: 'info', summary: 'RTMP activado', detail: '', life: 3000 });
      } else {
        this.messageService.add({ severity: 'contrast', summary: 'RTMP desactivado', detail: '', life: 3000 });
      }
      this.rtmpToogle = response.status;
    });
  }

  stopEvent(event: Event) {
    this.confirmationService.confirm({
        header: 'Finalizar Evento',
        target: event.target as EventTarget,
        message: '¿Estás seguro de querer finalizar el evento?\n\nEsta acción no se puede deshacer.',
        icon: 'pi pi-exclamation-triangle',
        rejectButtonProps: {
            label: 'Cancelar',
            severity: 'secondary',
            outlined: true
        },
        acceptButtonProps: {
            label: 'Finalizar',
            severity: 'danger'
        },
        accept: () => {
            try {
              this.apiSigasigaRestService.stopEvent().subscribe((response) => {
                  
                    localStorage.removeItem('token');
                    localStorage.removeItem('event_id');
                    this.router.navigate(['/start']);
              });
            } catch (error) {
              console.error('Error al finalizar el evento:', error);
            }
            this.messageService.add({ severity: 'info', summary: 'Confirmado', detail: 'Evento finalizado', life: 3000 });
        },
        reject: () => {
            this.messageService.add({ severity: 'warn', summary: 'Cancelado', detail: 'Acción cancelada', life: 3000 });
        }
    });
}
}
