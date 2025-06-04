import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ApiSigasigaRestService } from 'src/app/services/api-sigasiga-rest.service';
//import modal config-time
import { ConfigTimeModalComponent } from '../../modals/config-time-modal/config-time-modal.component';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
// importar socket io service
import { SigasigaSocketioService } from '../../services/sigasiga-socketio.service';


@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.page.html',
  styleUrls: ['./scoreboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, CalendarModule, SliderModule, FormsModule, DatePickerModule, ButtonModule, DialogModule, IftaLabelModule, InputIconModule, InputTextModule, IconFieldModule]
})
export class ScoreboardPage {
  localTeam = 'nombre local';
  visitorTeam = 'nombre visitante';
  localScore = 0;
  visitanteScore = 0;
  localFouls = 0;
  visitanteFouls = 0;
  timerStatus = false;
  timer24Status = false;
  timer = "";
  milisecondstimer = ""
  timer24 = 0;
  value: Date = new Date();
  hour: number = 0;
  minute: number = 0;
  visible = false;
  localTeamInput = '';
  visitorTeamInput = '';
  visibleLocalModal = false;
  visibleVisitorModal = false;

  private eventId: string | null = null;
  private socketEventName: string | null = null;
  private scoreboardUpdateHandler = (data: any) => {
    if (data && data.data) {
      const data_dict = data.data;
      // console.log('Scoreboard update received:', data_dict);
      this.localTeam = data_dict.local_team;
      this.visitorTeam = data_dict.visitor_team;
      this.localScore = data_dict.local_points;
      this.visitanteScore = data_dict.visitor_points;
      this.timerStatus = data_dict.timer_status;
      this.timer = this.milisecondsToTime(data_dict.timer);
      this.visible = data_dict.visible;
    } else {
      // console.warn('Received scoreboard data in unexpected format:', data);
    }
  };


  constructor(private apiSigasigaRestService: ApiSigasigaRestService,
    private modalController: ModalController,
    private socketService: SigasigaSocketioService) {
   
  }

  ngOnInit() {
    this.eventId = localStorage.getItem('event_id');
    if (this.eventId) {
      this.socketEventName = `${this.eventId}-scoreboard_room`;
    } else {
      console.error('ScoreboardPage: event_id not found in localStorage. Socket updates will not be available.');
    }
    // Subscription will be handled by ionViewDidEnter
  }

  ionViewDidEnter() {
    if (this.socketEventName && this.scoreboardUpdateHandler) {
      this.socketService.on(this.socketEventName, this.scoreboardUpdateHandler);
      // console.log(`Scoreboard: Subscribed to ${this.socketEventName}`);
    }
  }

  ionViewWillLeave() {
    if (this.socketEventName && this.scoreboardUpdateHandler) {
      // This requires SigasigaSocketioService to have a public 'off' method.
      this.socketService.off(this.socketEventName, this.scoreboardUpdateHandler);
      // console.log(`Scoreboard: Unsubscribed from ${this.socketEventName}`);
    }
  }

  ngOnDestroy() {
    // Ensure cleanup if the component is completely destroyed.
    if (this.socketEventName && this.scoreboardUpdateHandler) {
      // This requires SigasigaSocketioService to have a public 'off' method.
      this.socketService.off(this.socketEventName, this.scoreboardUpdateHandler);
      // console.log(`Scoreboard: Unsubscribed from ${this.socketEventName} during ngOnDestroy`);
    }
  }

  showDialogLocal() {
    this.visibleLocalModal = !this.visibleLocalModal;
  }

  showDialogVisitor() {
    this.visibleVisitorModal = !this.visibleVisitorModal;
  }

  milisecondsToTime(miliseconds: number) {
    const minutes = Math.floor((miliseconds % 3600000) / 60000);
    const seconds = Math.floor((miliseconds % 60000) / 1000);
    const deciseconds = Math.floor((miliseconds % 1000) / 100);
    const time = `${minutes}:${seconds}.${deciseconds}`;
    return time;
  }

  toogleTimerStatus() {
    this.apiSigasigaRestService.toogleTimerStatus().subscribe((response) => {
      this.timerStatus = response.timer_status;
    });
  }
  
  async configTime() {
    const modal = await this.modalController.create({
      component: ConfigTimeModalComponent
    });

    modal.onDidDismiss().then((dataReturned) => {
      if (dataReturned !== null) {
        this.timer = dataReturned.data.time;
        this.milisecondstimer = dataReturned.data.milliseconds;
        // console.log(`Tiempo en milisegundos: ${this.milisecondstimer}`);
        this.apiSigasigaRestService.setTime(Number(this.milisecondstimer)).subscribe(
          (response: any) => {
            // console.log('Respuesta del servidor:', response);
            // Una vez completada la lógica, actualiza la página
          },
          error => {
            // console.error('Error al enviar la clave:', error);
          }
        );
      }
    });

    return await modal.present();
  }

  setTime(time: number) {
    this.apiSigasigaRestService.setTime(time).subscribe((response) => {
      // console.log(response);
    });
  }

  modifyPoints(team: string, points: number) {
    this.apiSigasigaRestService.modifyPoints(team, points).subscribe((response) => {
      // console.log(response);
    });
  }

  modifyFoul(team: 'local' | 'visitante', change: number) {
    if (team === 'local') {
      this.localFouls = Math.max(0, this.localFouls + change);
    } else {
      this.visitanteFouls = Math.max(0, this.visitanteFouls + change);
    }
  }

  saveLocalTeam() {
    this.apiSigasigaRestService.setTeam("local", this.localTeamInput).subscribe((response) => {
      // console.log(response);
    });
    this.localTeam = this.localTeamInput;
  }

  saveVisitorTeam() {
    this.apiSigasigaRestService.setTeam("visitor", this.visitorTeamInput).subscribe((response) => {
      console.log(response);
    });
    this.visitorTeam = this.visitorTeamInput;
  }
}