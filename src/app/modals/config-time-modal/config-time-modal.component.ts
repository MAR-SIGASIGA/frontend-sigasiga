import { Component, Input, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-config-time-modal',
  templateUrl: './config-time-modal.component.html',
  styleUrls: ['./config-time-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ToastModule]
})
export class ConfigTimeModalComponent implements OnInit {
  minutes: number = 0;
  seconds: number = 0;
  decimas: number = 0;
  minutesString: string = "";
  secondsString: string = "";
  decimasString: string = "";

  minutesOptions: number[] = Array.from({ length: 60 }, (_, i) => i);
  secondsOptions: number[] = Array.from({ length: 60 }, (_, i) => i);
  decimasOptions: number[] = Array.from({ length: 10 }, (_, i) => i);

  constructor(private modalController: ModalController) {}

  ngOnInit() {}

  dismiss() {
    this.modalController.dismiss();
  }

  saveTime() {
    if (this.minutes<10) {
      this.minutesString = `0${this.minutes}`
    }
    else {
      this.minutesString = `${this.minutes}`
    }
    if (this.seconds<10) {
      this.secondsString = `0${this.seconds}`
    }
    else {
      this.secondsString = `${this.seconds}`
    }
    const formattedTime = `${this.minutesString}:${this.secondsString}.${this.decimas}`;
    const totalMilliseconds = this.convertToMilliseconds(this.minutes, this.seconds, this.decimas);
    this.modalController.dismiss({
      time: formattedTime,
      milliseconds: totalMilliseconds
    });
  }
  
  convertToMilliseconds(minutes: number, seconds: number, decimas: number): number {
    const minutesInMilliseconds = minutes * 60 * 1000;
    const secondsInMilliseconds = seconds * 1000;
    const decimasInMilliseconds = decimas * 100;
    return minutesInMilliseconds + secondsInMilliseconds + decimasInMilliseconds;
  }
}
