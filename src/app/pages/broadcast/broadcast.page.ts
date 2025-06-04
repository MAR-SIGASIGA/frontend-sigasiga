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
  public user_mode_bps = 600000; // 600kbps
  public environment_mode_bps = 400000; // 400kbps
  public bps = this.user_mode_bps;

  constructor(private configService: AppConfigService, 
    private apiSigasigaRestService: ApiSigasigaRestService) {}

  async ionViewDidEnter() {
    // Only (re)start the camera if we are not currently streaming.
    // If streaming, we assume the camera and MediaRecorder are active and should not be disturbed.
    if (!this.isStreaming) {
      await this.startCamera();
    }
  }

  ionViewWillLeave() {
    if (!this.isStreaming) {
      this.releaseCameraResources();
    }
    // If streaming, video and audio capture continues in background (desired)
  }

  private releaseCameraResources() {
    if (this.videoElement?.nativeElement.srcObject) {
      const stream = this.videoElement.nativeElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.videoElement.nativeElement.srcObject = null;
      console.log('📷 Camera resources released');
    }
    // Ensure mediaRecorder is stopped if it's active and tied to these resources
    // This is a safeguard; typically, if !isStreaming, mediaRecorder should be inactive.
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      console.log('MediaRecorder stopped due to camera resource release.');
    }
  }

  async startCamera() {
    this.releaseCameraResources(); // Ensure old resources are freed
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 * this.resolutionScale },
          height: { ideal: 720 * this.resolutionScale },
          frameRate: { ideal: 25 },
          facingMode: this.defaultFacingMode
        },
        audio: false
      });

      this.videoElement.nativeElement.srcObject = stream;
      this.videoElement.nativeElement.play().catch(e => console.error("Error playing video:", e));
    } catch (err) {
      console.error('❌ Error accediendo a la cámara:', err);
    }
  }

  toggleStream() {
    if (this.isStreaming) {
      this.stopStreaming();
      this.isStreaming = false;
    } else {
      // Optimistically set isStreaming to true.
      // startStreaming() will set it to false if it fails.
      this.isStreaming = true;
      this.startStreaming();
    }
    // Removed: this.isStreaming = !this.isStreaming; as state is now managed within branches.
  }

  startStreaming() {
    this.clientId = this.shortIdBase64();
    this.videoSourceName = this.clientId;
    const eventId = localStorage.getItem('event_id');
    const token = localStorage.getItem('token');
    const wsUrl = this.configService.apiWsUrl + `/ws/stream?eventId=${eventId}&token=${token}&clientId=${this.clientId}`
    
    this.ws = new WebSocket(wsUrl);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      console.log('🟢 WebSocket abierto, iniciando grabación');

      const stream = this.videoElement.nativeElement.srcObject as MediaStream;
      if (!stream || !stream.active) {
          console.error("❌ Cannot start streaming: Camera stream is not available or not active.");
          this.ws.close(); // This will trigger ws.onclose, which handles isStreaming state
          return;
      }

      // Safeguard: stop any previous recorder instance
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
      }
      
      const options = { mimeType: 'video/webm; codecs=vp9' , videoBitsPerSecond: this.bps};

      try {
        this.mediaRecorder = new MediaRecorder(stream, options);

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(event.data);
          }
        };

        this.mediaRecorder.onerror = (event) => {
            console.error("MediaRecorder error:", event);
            if(this.isStreaming) {
              // Perform a full stop, which includes closing WebSocket and stopping recorder.
              this.stopStreaming(); 
              this.isStreaming = false; // Ensure state is correct
            }
        };

        this.mediaRecorder.start(750); // Enviar un chunk cada 750ms
      } catch (e) {
        console.error("Error creating MediaRecorder:", e);
        this.ws.close(); // This will trigger ws.onclose
        return;
      }
    };

    this.ws.onerror = (event) => {
      console.error("WebSocket error:", event);
      if (this.isStreaming) {
        this.stopStreamingInternals(); 
        this.isStreaming = false;
      }
    };

    this.ws.onclose = (event) => {
      console.log("WebSocket closed.", event.code, event.reason);
      if (this.isStreaming) { 
        this.stopStreamingInternals();
        this.isStreaming = false;
        console.log("Streaming stopped due to WebSocket closure.");
      }
    };
  }

  private stopStreamingInternals() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      console.log('MediaRecorder stopped internally.');
    }
  }

  stopStreaming() {
    // stopStreamingInternals will handle mediaRecorder
    this.stopStreamingInternals(); 
    
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED && this.ws.readyState !== WebSocket.CLOSING) {
      this.ws.close();
    }
    console.log('🔴 Transmisión detenida');
    // this.isStreaming is managed by toggleStream or error handlers now.
  }

  updateResolution(scale: number) {
    this.resolutionScale = scale;
    if (!this.isStreaming) {
      this.startCamera();
    } else {
      console.log("Resolution changed. Will apply when camera restarts (e.g., after stopping/starting stream or changing facing mode).");
    }
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
    if (this.isStreaming) {
      console.warn("Cannot change camera while streaming. Please stop the stream first.");
      // Optionally, show a toast to the user.
      return;
    }
    this.defaultFacingMode = this.defaultFacingMode === 'user' ? 'environment' : 'user';
    this.bps = this.defaultFacingMode === 'user' ? this.user_mode_bps : this.environment_mode_bps;
    this.startCamera(); // Restart camera to apply new facing mode
  }
}