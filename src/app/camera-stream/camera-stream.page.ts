// import { Component, ElementRef, ViewChild } from '@angular/core';

// @Component({
//   selector: 'app-camera-stream',
//   templateUrl: './camera-stream.page.html',
//   styleUrls: ['./camera-stream.page.scss'],
//   standalone: false
// })
// export class CameraStreamPage {
//   @ViewChild('video', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;

//   private peerConnection!: RTCPeerConnection;
//   private dataChannel!: RTCDataChannel;
//   private ws!: WebSocket;
//   private captureInterval: any;

//   public isStreaming = false;
//   public resolutionScale = 1.0;
//   public qualityScale = 1.0;

//   constructor() {}

//   async ionViewDidEnter() {
//     await this.startCamera();
//   }

//   async startCamera() {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       this.videoElement.nativeElement.srcObject = stream;
//       this.videoElement.nativeElement.play();
//     } catch (err) {
//       console.error('❌ Error accediendo a la cámara:', err);
//     }
//   }

//   toggleStream() {
//     if (this.isStreaming) {
//       this.stopStreaming();
//     } else {
//       this.startStreaming();
//     }
//     this.isStreaming = !this.isStreaming;
//   }

//   startStreaming() {
//     const eventId = 'evento1';
//     const sourceId = 'source1';
//     const wsUrl = `wss://api-sigasiga-webrtc.sigasiga.walry.cloud/?eventId=${eventId}&sourceId=${sourceId}`;

//     this.ws = new WebSocket(wsUrl);
//     this.peerConnection = new RTCPeerConnection();

//     this.dataChannel = this.peerConnection.createDataChannel('frames');
//     this.dataChannel.onopen = () => {
//       console.log('🟢 Canal de datos abierto');
//       this.sendFramesLoop();
//     };

//     this.ws.onmessage = async (msg) => {
//       const data = JSON.parse(msg.data);
//       if (data.sdp) {
//         await this.peerConnection.setRemoteDescription(data.sdp);
//       } else if (data.candidate) {
//         await this.peerConnection.addIceCandidate(data.candidate);
//       }
//     };

//     this.peerConnection.onicecandidate = (event) => {
//       if (event.candidate && this.ws.readyState === WebSocket.OPEN) {
//         this.ws.send(JSON.stringify({ candidate: event.candidate }));
//       }
//     };

//     this.ws.onopen = async () => {
//       const offer = await this.peerConnection.createOffer();
//       await this.peerConnection.setLocalDescription(offer);
//       this.ws.send(JSON.stringify({ sdp: offer }));
//     };
//   }

//   stopStreaming() {
//     clearInterval(this.captureInterval);
//     this.peerConnection?.close();
//     this.ws?.close();
//     console.log('🔴 Transmisión detenida');
//   }

//   sendFramesLoop() {
//     const video = this.videoElement.nativeElement;
//     const canvas = document.createElement('canvas');

//     this.captureInterval = setInterval(() => {
//       const videoWidth = video.videoWidth;
//       const videoHeight = video.videoHeight;
//       canvas.width = videoWidth * this.resolutionScale;
//       canvas.height = videoHeight * this.resolutionScale;

//       const ctx = canvas.getContext('2d');
//       if (!ctx) return;

//       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//       const dataUrl = canvas.toDataURL('image/jpeg', this.qualityScale); // Calidad entre 0 y 1

//       if (this.dataChannel?.readyState === 'open') {
//         this.dataChannel.send(dataUrl);
//         console.log(dataUrl)
//       }
//     }, 35); // Cada 500ms
//   }

//   updateResolution(scale: number) {
//     this.resolutionScale = scale;
//     console.log(`📐 Resolución ajustada: ${scale * 100}%`);
//   }

//   updateQuality(scale: number) {
//     this.qualityScale = scale;
//     console.log(`🎨 Calidad ajustada: ${scale * 100}%`);
//   }
// }
import { Component, ElementRef, ViewChild } from '@angular/core';
import { AppConfigService } from '../services/app-config.service';
@Component({
  selector: 'app-camera-stream',
  templateUrl: './camera-stream.page.html',
  styleUrls: ['./camera-stream.page.scss'],
  standalone: false
})
export class CameraStreamPage {
  @ViewChild('video', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;

  private ws!: WebSocket;
  private mediaRecorder!: MediaRecorder;
  public isStreaming = false;

  public resolutionScale = 1.0;
  public qualityScale = 1.0;

  constructor(private configService: AppConfigService) {}

  async ionViewDidEnter() {
    await this.startCamera();
  }

  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 * this.resolutionScale },
          height: { ideal: 720 * this.resolutionScale },
          frameRate: { ideal: 25 }
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
    const eventId = '47f3okNyYJzs8an9JyjmUc';
    const sourceId = 'source1';
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc0NzU0MDU1NywianRpIjoiMTUyZGMxYzYtODViOC00Y2UzLTk2MTMtZmEzODA4YTg0ZjMxIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjY2MTY4MzJlLTRmN2UtNDZkMC04Y2FiLTkzODRlMzgwNzQzMyIsIm5iZiI6MTc0NzU0MDU1NywiZXhwIjoxNzQ3NTU0OTU3LCJjbGFpbXMiOnsicm9sZSI6ImNyZWF0b3IiLCJldmVudF9pZCI6IjQ3ZjNva055WUp6czhhbjlKeWptVWMifX0.OnMv0TjDx0MHPf5SknXajwb_46Zg8xZUDSRJtDLFrqE';
    const wsUrl = this.configService.apiWsUrl + `/ws/stream?eventId=${eventId}&sourceId=${sourceId}&token=${token}`
    console.log(wsUrl)

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

      this.mediaRecorder.start(1000); // Enviar un chunk cada 300ms

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
    console.log(`📐 Resolución ajustada: ${scale * 100}%`);
  }

  updateQuality(scale: number) {
    this.qualityScale = scale;
    console.log(`🎨 Calidad ajustada: ${scale * 100}%`);
    // IMPORTANTE: qualityScale no se aplica a MediaRecorder directamente,
    // pero podés usarlo si hacés compresión manual más adelante (ej: canvas.toBlob)
  }
}