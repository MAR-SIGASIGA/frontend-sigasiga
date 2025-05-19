import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppConfigService } from '../services/app-config.service';
import io from 'socket.io-client';

interface ClientImage {
  clientId: string;
  imageUrl: string;
  active: boolean;
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false
})
export class Tab3Page implements OnInit, OnDestroy {

  clientImages = new Map<string, ClientImage>();
  socket: any;
  finalVideoUrl: string | null = null;

  constructor(private configService: AppConfigService) {}

  ngOnInit() {
    const sio_url = this.configService.apiSioUrl
        this.socket = io(
          sio_url,{
      transports: ['websocket']
    });
    this.socket.on('47f3okNyYJzs8an9JyjmUc-director_room', (data:any) => {
      this.handleSocketData(data);
    });
  }

  ngOnDestroy() {
    this.socket.removeListener('data');

    // Limpieza de blobs al salir del componente
    for (const img of this.clientImages.values()) {
      URL.revokeObjectURL(img.imageUrl);
    }
    this.clientImages.clear();
  }

  handleSocketData(data: any) {
    const incoming = data?.data?.clients_thumbnails_dict;
    const final_video_array_buffer = data?.data?.finalframe_thumbnail_dict?.frame;

    // Revocamos el blob anterior para evitar pérdidas de memoria
    if (this.finalVideoUrl) {
      URL.revokeObjectURL(this.finalVideoUrl);
    }
    if (final_video_array_buffer) {
      const blob = new Blob([final_video_array_buffer], { type: 'image/webp' });
      this.finalVideoUrl = URL.createObjectURL(blob);
    }

    // console.log('Incoming data:', incoming);
    if (!incoming) return;

    const activeClientIds = new Set<string>();

    for (const clientId in incoming) {
      const { frame, active } = incoming[clientId];
      const blob = new Blob([frame], { type: 'image/webp' });
      const imageUrl = frame ? URL.createObjectURL(blob) : '';

      activeClientIds.add(clientId);

      if (this.clientImages.has(clientId)) {
        const old = this.clientImages.get(clientId);
        URL.revokeObjectURL(old!.imageUrl);
      }

      this.clientImages.set(clientId, {
        clientId,
        imageUrl,
        active,
      });
    }

    // Eliminar los que ya no están
    for (const id of Array.from(this.clientImages.keys())) {
      if (!activeClientIds.has(id)) {
        const removed = this.clientImages.get(id);
        URL.revokeObjectURL(removed!.imageUrl);
        this.clientImages.delete(id);
      }
    }
  }

  clientImagesArray(): ClientImage[] {
    return Array.from(this.clientImages.values());
  }

  trackByClientId(index: number, item: ClientImage): string {
    return item.clientId;
  }
}

// @Component({
//   selector: 'app-tab3',
//   templateUrl: 'tab3.page.html',
//   styleUrls: ['tab3.page.scss'],
//   standalone: false
// })
// export class Tab3Page implements OnInit, OnDestroy {
//   videoSources: { id: string; frame: ArrayBuffer; active: boolean; url: string; activeUrl: string;}[] = [];
//   socket: any;
  

//   ngOnInit() {
//     // @ts-ignore
    
//     this.socket = io(
//       'http://192.168.54.4:8000',{
//       transports: ['websocket']
//     });

//     this.socket.on('T8m6BDc3sSC9BgEXmKYLU4-director_room', (message: any) => {
//       const data = message.data;

//       // Revocamos los blobs anteriores para evitar pérdidas de memoria
//       this.videoSources.forEach(v => URL.revokeObjectURL(v.url));

//       this.videoSources = Object.entries(data).map(([id, value]: [string, any]) => {
//         const blob = new Blob([value.frame], { type: 'image/webp' });
//         const url = URL.createObjectURL(blob);

//         const prev = this.videoSources.find(v => v.id === id);
//         const activeUrl = prev?.activeUrl || url;

//         return {
//           id,
//           frame: value.frame,
//           active: value.active,
//           url,
//           activeUrl
//         };
//       });
//     });
//   }

//   onImageLoad(id: string) {
//     const video = this.videoSources.find(v => v.id === id);
//     if (video && video.url !== video.activeUrl) {
//       video.activeUrl = video.url;
//     }
//   }

//   ngOnDestroy() {
//     if (this.socket) {
//       this.socket.disconnect();
//     }
//     this.videoSources.forEach(v => URL.revokeObjectURL(v.url));
//   }
// }
