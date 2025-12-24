import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { AppConfigService } from '../../services/app-config.service';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ApiSigasigaRestService } from '../../services/api-sigasiga-rest.service';
import { Muxer, StreamTarget } from 'webm-muxer';

@Component({
  selector: 'app-broadcast',
  templateUrl: './broadcast.page.html',
  styleUrls: ['./broadcast.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class BroadcastPage implements OnDestroy {
  @ViewChild('video', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;

  // WebSocket
  private ws: WebSocket | null = null;
  
  // WebCodecs
  private encoder: VideoEncoder | null = null;
  private muxer: Muxer<StreamTarget> | null = null;
  private frameReader: ReadableStreamDefaultReader<VideoFrame> | null = null;
  private currentStream: MediaStream | null = null;
  
  // Control de streaming
  private isEncodingActive = false;
  private frameCount = 0;
  
  // Configuración
  private readonly KEYFRAME_INTERVAL = 10; // Keyframe cada 10 frames
  
  // Estado público para el template
  public isStreaming = false;
  public videoSourceName = '';
  public clientId = '';
  public defaultFacingMode: 'user' | 'environment' = 'user';
  public resolutionScale = 1.0;
  public qualityScale = 1.0;
  public user_mode_bps = 600000;
  public environment_mode_bps = 400000;
  public bps = this.user_mode_bps;

  // Dimensiones del video
  private videoWidth = 1280;
  private videoHeight = 720;
  private videoFrameRate = 25;

  constructor(
    private configService: AppConfigService,
    private apiSigasigaRestService: ApiSigasigaRestService
  ) {}

  async ionViewDidEnter() {
    if (!this.isStreaming) {
      await this.startCamera();
    }
  }

  ionViewWillLeave() {
    if (!this.isStreaming) {
      this.releaseCameraResources();
    }
  }

  ngOnDestroy() {
    this.cleanup();
  }

  // ============ GESTIÓN DE CÁMARA ============

  private releaseCameraResources() {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
    console.log('📷 Camera resources released');
  }

  async startCamera() {
    this.releaseCameraResources();
    try {
      this.videoWidth = Math.round(1280 * this.resolutionScale);
      this.videoHeight = Math.round(720 * this.resolutionScale);

      this.currentStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.videoWidth },
          height: { ideal: this.videoHeight },
          frameRate: { ideal: this.videoFrameRate },
          facingMode: this.defaultFacingMode
        },
        audio: false
      });

      // Obtener dimensiones reales del track
      const videoTrack = this.currentStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      this.videoWidth = settings.width || this.videoWidth;
      this.videoHeight = settings.height || this.videoHeight;
      
      console.log(`📷 Camera started: ${this.videoWidth}x${this.videoHeight}`);

      this.videoElement.nativeElement.srcObject = this.currentStream;
      await this.videoElement.nativeElement.play();
    } catch (err) {
      console.error('❌ Error accediendo a la cámara:', err);
    }
  }

  // ============ CONTROL DE STREAMING ============

  async toggleStream() {
    if (this.isStreaming) {
      this.stopStreaming();
    } else {
      await this.startStreaming();
    }
  }

  async startStreaming() {
    if (!this.currentStream || !this.currentStream.active) {
      console.error('❌ No hay stream de cámara activo');
      return;
    }

    // Verificar soporte de WebCodecs
    if (!('VideoEncoder' in window)) {
      console.error('❌ WebCodecs no soportado en este navegador');
      alert('Tu navegador no soporta WebCodecs. Usa Chrome/Edge actualizado.');
      return;
    }

    try {
      this.clientId = this.shortIdBase64();
      this.videoSourceName = this.clientId;
      
      // 1. Inicializar WebSocket
      await this.initializeWebSocket();
      
      // 2. Inicializar Muxer (con streaming)
      this.initializeMuxer();
      
      // 3. Inicializar Encoder
      await this.initializeEncoder();
      
      // 4. Iniciar loop de captura
      this.startEncodingLoop();
      
      this.isStreaming = true;
      console.log('🟢 Streaming iniciado con WebCodecs (modo streaming)');
      
    } catch (error) {
      console.error('❌ Error iniciando streaming:', error);
      this.cleanup();
    }
  }

  stopStreaming() {
    console.log('🔴 Deteniendo streaming...');
    this.cleanup();
    this.isStreaming = false;
  }

  private cleanup() {
    // Detener loop de encoding
    this.isEncodingActive = false;

    // Cerrar encoder
    if (this.encoder && this.encoder.state !== 'closed') {
      try {
        this.encoder.close();
      } catch (e) {
        console.warn('Error closing encoder:', e);
      }
    }
    this.encoder = null;

    // Cerrar frame reader
    if (this.frameReader) {
      this.frameReader.cancel().catch(() => {});
    }
    this.frameReader = null;

    // Finalizar muxer
    if (this.muxer) {
      try {
        this.muxer.finalize();
      } catch (e) {
        // Ignorar errores de finalización
      }
    }
    this.muxer = null;

    // Cerrar WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, 'Streaming stopped');
    }
    this.ws = null;

    // Reset contadores
    this.frameCount = 0;
  }

  // ============ WEBSOCKET ============

  private initializeWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const eventId = localStorage.getItem('event_id');
      const token = localStorage.getItem('token');

      if (!eventId || !token) {
        reject(new Error('Faltan credenciales (event_id o token)'));
        return;
      }

      const wsUrl = `${this.configService.apiWsUrl}/ws/stream?eventId=${eventId}&token=${token}&clientId=${this.clientId}`;
      
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        console.log('🟢 WebSocket conectado');
        resolve();
      };

      this.ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log('🔴 WebSocket cerrado:', event.code, event.reason);
        if (this.isStreaming) {
          this.stopStreaming();
        }
      };
    });
  }

  // ============ WEBM MUXER (STREAMING MODE) ============

  private initializeMuxer() {
    // Usar StreamTarget para enviar datos en tiempo real
    // El callback onData se llama cada vez que hay datos listos
    this.muxer = new Muxer({
      target: new StreamTarget({
        onData: (data: Uint8Array, position: number) => {
          // Enviar cada chunk inmediatamente al WebSocket
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
          }
        }
      }),
      video: {
        codec: 'V_VP8',
        width: this.videoWidth,
        height: this.videoHeight,
        frameRate: this.videoFrameRate,
      },
      type: 'webm',
      streaming: true, // ← IMPORTANTE: Modo streaming continuo
      firstTimestampBehavior: 'offset',
    });
    
    console.log(`📦 Muxer inicializado (streaming): ${this.videoWidth}x${this.videoHeight}`);
  }

  // ============ VIDEO ENCODER ============

  private async initializeEncoder() {
    // Configuración del encoder
    const config: VideoEncoderConfig = {
      codec: 'vp8',
      width: this.videoWidth,
      height: this.videoHeight,
      bitrate: this.bps,
      framerate: this.videoFrameRate,
    };

    // Verificar soporte del codec
    const support = await VideoEncoder.isConfigSupported(config);
    if (!support.supported) {
      throw new Error(`Codec VP8 no soportado con esta configuración`);
    }

    this.encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        this.handleEncodedChunk(chunk, metadata);
      },
      error: (error) => {
        console.error('❌ VideoEncoder error:', error);
        this.stopStreaming();
      }
    });

    this.encoder.configure(config);
    console.log(`🎬 VideoEncoder configurado: VP8 @ ${this.bps / 1000}kbps`);
  }

  private handleEncodedChunk(chunk: EncodedVideoChunk, metadata?: EncodedVideoChunkMetadata) {
    if (!this.muxer) return;

    try {
      // Añadir chunk al muxer - StreamTarget enviará automáticamente via onData
      this.muxer.addVideoChunk(chunk, metadata);
    } catch (error) {
      console.error('❌ Error añadiendo chunk al muxer:', error);
    }
  }

  // ============ LOOP DE CAPTURA ============

  private async startEncodingLoop() {
    if (!this.currentStream) return;

    const videoTrack = this.currentStream.getVideoTracks()[0];
    
    // Crear processor para obtener frames individuales
    // @ts-ignore - MediaStreamTrackProcessor es experimental
    const processor = new MediaStreamTrackProcessor({ track: videoTrack });
    this.frameReader = processor.readable.getReader();
    
    this.isEncodingActive = true;
    this.frameCount = 0;

    console.log('🎥 Loop de encoding iniciado');

    try {
      while (this.isEncodingActive && this.frameReader) {
        const { value: videoFrame, done } = await this.frameReader.read();
        
        if (done || !videoFrame) {
          console.log('📹 Frame reader terminado');
          break;
        }

        if (!this.encoder || this.encoder.state === 'closed') {
          videoFrame.close();
          break;
        }

        // Determinar si es keyframe (cada KEYFRAME_INTERVAL frames)
        const isKeyFrame = this.frameCount % this.KEYFRAME_INTERVAL === 0;
        
        try {
          this.encoder.encode(videoFrame, { keyFrame: isKeyFrame });
        } catch (encodeError) {
          console.error('Error encoding frame:', encodeError);
        }
        
        videoFrame.close(); // Liberar memoria
        this.frameCount++;
      }
    } catch (error) {
      console.error('❌ Error en loop de encoding:', error);
    } finally {
      console.log('🎥 Loop de encoding finalizado');
      if (this.isStreaming) {
        this.stopStreaming();
      }
    }
  }

  // ============ CONTROLES UI ============

  updateResolution(scale: number) {
    this.resolutionScale = scale;
    if (!this.isStreaming) {
      this.startCamera();
    }
  }

  updateQuality(scale: number) {
    this.qualityScale = scale;
  }

  rotateVideoSource(orientation: number) {
    if (!this.videoSourceName) return;
    this.apiSigasigaRestService.rotateVideoSource(this.videoSourceName, orientation).subscribe({
      next: (response) => console.log('✅ Video rotado'),
      error: (error) => console.error('❌ Error rotando video:', error)
    });
  }

  toggleFacingMode() {
    if (this.isStreaming) {
      console.warn('No se puede cambiar cámara mientras se transmite');
      return;
    }
    this.defaultFacingMode = this.defaultFacingMode === 'user' ? 'environment' : 'user';
    this.bps = this.defaultFacingMode === 'user' ? this.user_mode_bps : this.environment_mode_bps;
    this.startCamera();
  }

  private shortIdBase64(length = 8): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).slice(0, length);
  }
}
