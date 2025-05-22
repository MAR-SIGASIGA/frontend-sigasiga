import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AppConfigService } from '../../services/app-config.service';
import { SigasigaSocketioService } from '../../services/sigasiga-socketio.service';
import { ApiSigasigaRestService } from '../../services/api-sigasiga-rest.service';
import { FormsModule } from '@angular/forms';


interface ClientImage {
  clientId: string;
  active: boolean;
  frameBlob: Blob | null | undefined;  // Permite null o undefined
  isLoading?: boolean; // Indicador de carga
}

@Component({
  selector: 'app-management',
  templateUrl: './management.page.html',
  styleUrls: ['./management.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ManagementPage implements OnInit, OnDestroy, AfterViewInit {

  clientImages = new Map<string, ClientImage>();

  @ViewChild('finalVideoCanvas') finalVideoCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChildren('clientCanvas') clientCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;
  private clientCanvasMap = new Map<string, HTMLCanvasElement>();

  constructor(
    private configService: AppConfigService,
    private socketService: SigasigaSocketioService,
    private apiSigasigaRestService: ApiSigasigaRestService
  ) {}

  ngOnInit() {
    const eventId = localStorage.getItem('event_id');
    this.socketService.on(`${eventId}-director_room`, (data: any) => {
      this.handleSocketData(data);
    });
  }

  ngAfterViewInit() {
    this.clientCanvases.changes.subscribe(() => this.updateClientCanvasMap());
    this.updateClientCanvasMap();
  }

  ngOnDestroy() {
    this.clientImages.clear();
  }

  private updateClientCanvasMap() {
    const clients = this.clientImagesArray();
    this.clientCanvasMap.clear();
    this.clientCanvases.forEach((canvasRef, index) => {
      const client = clients[index];
      if (client) {
        this.clientCanvasMap.set(client.clientId, canvasRef.nativeElement);
      }
    });
  }

  async handleSocketData(data: any) {
    const incoming = data?.data?.clients_thumbnails_dict;
    const final_video_array_buffer = data?.data?.finalframe_thumbnail_dict?.frame;

    if (final_video_array_buffer && this.finalVideoCanvas) {
      const blob = new Blob([final_video_array_buffer], { type: 'image/webp' });
      await this.drawBlobInCanvas(this.finalVideoCanvas.nativeElement, blob);
    }

    if (!incoming) return;

    const activeClientIds = new Set<string>();

    for (const clientId in incoming) {
      const { frame, active } = incoming[clientId];
      const frameBlob = frame ? new Blob([frame], { type: 'image/webp' }) : null;

      activeClientIds.add(clientId);

      // Si el frame es null, marcar como en carga
      this.clientImages.set(clientId, {
        clientId,
        active,
        frameBlob,
        isLoading: !frame  // Si el frame es null, mostramos spinner
      });
    }

    // Eliminar clientes inactivos
    for (const id of Array.from(this.clientImages.keys())) {
      if (!activeClientIds.has(id)) {
        this.clientImages.delete(id);
      }
    }

    this.updateClientCanvasMap();

    // Dibujar frames en sus canvas
    for (const [clientId, clientData] of this.clientImages) {
      const canvas = this.clientCanvasMap.get(clientId);
      if (canvas && clientData.frameBlob) {
        await this.drawBlobInCanvas(canvas, clientData.frameBlob);
      }
    }
  }

  private async drawBlobInCanvas(canvas: HTMLCanvasElement, blob: Blob) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const bitmap = await createImageBitmap(blob);
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
    } catch (error) {
      console.error('Error dibujando frame en canvas:', error);
    }
  }

  clientImagesArray(): ClientImage[] {
    return Array.from(this.clientImages.values());
  }

  trackByClientId(index: number, item: ClientImage): string {
    return item.clientId;
  }

  toggleVideoSource(clientId: string, isActive: boolean) {
    console.log(`Cliente ${clientId} está ${isActive ? 'activo' : 'inactivo'}`);
    
    // Aquí puedes agregar la lógica que quieras ejecutar cuando se cambie el estado del toggle
    // Por ejemplo, podrías emitir un evento, hacer una solicitud HTTP o actualizar algún estado global.
  
    // Si deseas hacer alguna acción con el cliente, puedes acceder a la imagen del cliente
    const client = this.clientImages.get(clientId);
    if (client) {
      // Aquí puedes modificar el cliente en base a la acción
      const token = localStorage.getItem('token');
      const url = this.configService.apiRestUrl + "/streaming/video_source_select"
      const body = {"video_source_name": clientId}
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const options = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      };
      fetch(url, options)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
      client.active = isActive;  // Esto ya está vinculado automáticamente por [(ngModel)]
      
      // Otras acciones que quieras hacer cuando cambie el estado del toggle
    }
  }
  
}