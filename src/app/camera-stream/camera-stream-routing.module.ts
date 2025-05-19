import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CameraStreamPage } from './camera-stream.page';

const routes: Routes = [
  {
    path: '',
    component: CameraStreamPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CameraStreamPageRoutingModule {}
