import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ApiSigasigaRestService } from 'src/app/services/api-sigasiga-rest.service';
//import modal config-time
import { ConfigTimeModalComponent } from '../../modals/config-time-modal/config-time-modal.component';

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.page.html',
  styleUrls: ['./scoreboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ScoreboardPage {
  localTeam = '';
  visitorTeam = '';
  localScore = 0;
  visitanteScore = 0;
  localFouls = 0;
  visitanteFouls = 0;
  timerStatus = false;
  timer24Status = false;
  timer = "";
  milisecondstimer = ""
  timer24 = 0;


  constructor(private apiSigasigaRestService: ApiSigasigaRestService, private modalController: ModalController) {
    
  }

  toogleTimerStatus() {
    this.apiSigasigaRestService.toogleTimerStatus().subscribe((response) => {
      console.log(response);
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
        console.log(`Tiempo en milisegundos: ${this.milisecondstimer}`);
        this.apiSigasigaRestService.setTime(Number(this.milisecondstimer)).subscribe(
          (response: any) => {
            console.log('Respuesta del servidor:', response);
            // Una vez completada la lógica, actualiza la página
          },
          error => {
            console.error('Error al enviar la clave:', error);
          }
        );
      }
    });

    return await modal.present();
  }

  setTime(time: number) {
    this.apiSigasigaRestService.setTime(time).subscribe((response) => {
      console.log(response);
    });
  }

  modifyPoints(team: string, points: number) {
    this.apiSigasigaRestService.modifyPoints(team, points).subscribe((response) => {
      console.log(response);
    });
  }

  modifyFoul(team: 'local' | 'visitante', change: number) {
    if (team === 'local') {
      this.localFouls = Math.max(0, this.localFouls + change);
    } else {
      this.visitanteFouls = Math.max(0, this.visitanteFouls + change);
    }
  }
}