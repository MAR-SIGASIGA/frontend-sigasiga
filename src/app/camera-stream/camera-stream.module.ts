import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CameraStreamPageRoutingModule } from './camera-stream-routing.module';

import { CameraStreamPage } from './camera-stream.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CameraStreamPageRoutingModule
  ],
  declarations: [CameraStreamPage]
})
export class CameraStreamPageModule {}
