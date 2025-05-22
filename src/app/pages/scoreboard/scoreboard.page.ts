import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scoreboard',
  templateUrl: './scoreboard.page.html',
  styleUrls: ['./scoreboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ScoreboardPage {
  localScore = 0;
  visitanteScore = 0;
  localFouls = 0;
  visitanteFouls = 0;

  addPoints(team: 'local' | 'visitante', points: number) {
    if (team === 'local') {
      this.localScore += points;
    } else {
      this.visitanteScore += points;
    }
  }

  modifyFoul(team: 'local' | 'visitante', change: number) {
    if (team === 'local') {
      this.localFouls = Math.max(0, this.localFouls + change);
    } else {
      this.visitanteFouls = Math.max(0, this.visitanteFouls + change);
    }
  }
}