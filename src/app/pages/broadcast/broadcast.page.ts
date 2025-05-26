import { Component, ElementRef, ViewChild } from '@angular/core';
import { AppConfigService } from '../../services/app-config.service';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ApiSigasigaRestService } from '../../services/api-sigasiga-rest.service';

@Component({
  selector: 'app-broadcast',
  templateUrl: './broadcast.page.html',
  styleUrls: ['./broadcast.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class BroadcastPage {
  @ViewChild('video', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;

  private ws!: WebSocket;
  private mediaRecorder!: MediaRecorder;
  public isStreaming = false;
  public videoSourceName = '';
  public clientId = '';
  public defaultFacingMode = 'user';
  public resolutionScale = 1.0;
  public qualityScale = 1.0;

  constructor(private configService: AppConfigService, 
    private apiSigasigaRestService: ApiSigasigaRestService) {}

  async ionViewDidEnter() {
    await this.startCamera();
  }

  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 * this.resolutionScale },
          height: { ideal: 720 * this.resolutionScale },
          frameRate: { ideal: 25 },
          facingMode: 'user'
        },
        audio: false
      });

      this.videoElement.nativeElement.srcObject = stream;
      this.videoElement.nativeElement.play();
    } catch (err) {
      console.error('❌ Error accediendo a la cámara:', err);
    }
  }

  toggleStream() {
    if (this.isStreaming) {
      this.stopStreaming();
    } else {
      this.startStreaming();
    }
    this.isStreaming = !this.isStreaming;
  }

  startStreaming() {
    this.clientId = this.shortIdBase64();
    this.videoSourceName = this.clientId;
    const eventId = localStorage.getItem('event_id');
    const token = localStorage.getItem('token');
    const wsUrl = this.configService.apiWsUrl + `/ws/stream?eventId=${eventId}&token=${token}&clientId=${this.clientId}`
    // console.log(wsUrl)

    // const wsUrl = `wss://api-sigasiga-ws.dev.sigasiga.walry.cloud/ws/stream?eventId=${eventId}&sourceId=${sourceId}&token=${token}`;

    this.ws = new WebSocket(wsUrl);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      console.log('🟢 WebSocket abierto, iniciando grabación');

      const stream = this.videoElement.nativeElement.srcObject as MediaStream;
      const options = { mimeType: 'video/webm; codecs=vp9' , videoBitsPerSecond: 600000}; // 1.25 Mbps

      
      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(event.data);
        }
      };

      this.mediaRecorder.start(500); // Enviar un chunk cada 300ms

    };
  }

  stopStreaming() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.ws?.close();
    console.log('🔴 Transmisión detenida');
  }

  updateResolution(scale: number) {
    this.resolutionScale = scale;
    // console.log(`📐 Resolución ajustada: ${scale * 100}%`);
  }

  updateQuality(scale: number) {
    this.qualityScale = scale;
    // console.log(`🎨 Calidad ajustada: ${scale * 100}%`);
    // IMPORTANTE: qualityScale no se aplica a MediaRecorder directamente,
    // pero podés usarlo si hacés compresión manual más adelante (ej: canvas.toBlob)
  }

  rotateVideoSource(orientation: number) {
    this.apiSigasigaRestService.rotateVideoSource(this.videoSourceName, orientation).subscribe((response) => {
      // console.log(response);
    });
  }

  shortIdBase64(length = 8) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).slice(0, length);
  }

  toggleFacingMode() {
    this.defaultFacingMode = this.defaultFacingMode === 'user' ? 'environment' : 'user';
    this.restartCamera();
  }

  restartCamera() {
    if (this.isStreaming) {
      this.stopStreaming();
      this.startCamera();
      this.startStreaming();
    }
    else {
      this.startCamera();
    }
  }
  
}