import { Component, ElementRef, ViewChild, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AppConfigService } from '../../services/app-config.service';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ApiSigasigaRestService } from '../../services/api-sigasiga-rest.service';

interface StreamingState {
  isActive: boolean;
  reconnectAttempts: number;
  lastChunkTime: number;
  adaptiveBitrate: number;
}

@Component({
  selector: 'app-broadcast',
  templateUrl: './broadcast.page.html',
  styleUrls: ['./broadcast.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BroadcastPage implements OnDestroy {
  @ViewChild('video', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;

  // 🔧 Estados optimizados
  private ws?: WebSocket;
  private mediaRecorder?: MediaRecorder;
  private currentStream?: MediaStream;
  private streamingState: StreamingState = {
    isActive: false,
    reconnectAttempts: 0,
    lastChunkTime: 0,
    adaptiveBitrate: 600000
  };

  // 🔧 Configuración adaptativa
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private readonly CHUNK_INTERVAL_MS = 1000; // Optimizado a 1s
  private readonly BITRATE_ADAPTATION_THRESHOLD = 5; // Ajustar bitrate cada 5 chunks
  private chunkCounter = 0;

  // Public properties para el template
  public isStreaming = false;
  public videoSourceName = '';
  public clientId = '';
  public defaultFacingMode: 'user' | 'environment' = 'user';
  public resolutionScale = 1.0;
  public qualityScale = 1.0;
  public user_mode_bps = 600000;
  public environment_mode_bps = 400000;
  public bps = this.user_mode_bps;

  constructor(
    private configService: AppConfigService, 
    private apiSigasigaRestService: ApiSigasigaRestService,
    private cdr: ChangeDetectorRef
  ) {}

  async ionViewDidEnter() {
    await this.initializeCamera();
  }

  async ionViewWillLeave() {
    await this.cleanup();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  // 🔧 OPTIMIZACIÓN: Gestión completa de recursos
  private async cleanup(): Promise<void> {
    try {
      // Detener streaming
      if (this.streamingState.isActive) {
        this.stopStreaming();
      }

      // Liberar MediaStream
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        this.currentStream = undefined;
      }

      // Limpiar video element
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = null;
        this.videoElement.nativeElement.pause();
      }

      // Cerrar WebSocket
      if (this.ws) {
        this.ws.close(1000, 'Component destroyed');
        this.ws = undefined;
      }

      // Reset estado
      this.streamingState = {
        isActive: false,
        reconnectAttempts: 0,
        lastChunkTime: 0,
        adaptiveBitrate: this.bps
      };

    } catch (error) {
      console.error('❌ Error durante cleanup:', error);
    }
  }

  // 🔧 OPTIMIZACIÓN: Inicialización segura de cámara
  private async initializeCamera(): Promise<void> {
    try {
      // Limpiar stream anterior si existe
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
      }

      // Obtener nuevo stream
      this.currentStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 * this.resolutionScale },
          height: { ideal: 720 * this.resolutionScale },
          frameRate: { ideal: 25 },
          facingMode: this.defaultFacingMode
        },
        audio: false
      });

      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.currentStream;
        await this.videoElement.nativeElement.play();
      }

      this.cdr.markForCheck();
    } catch (error) {
      console.error('❌ Error inicializando cámara:', error);
      throw error;
    }
  }

  // 🔧 OPTIMIZACIÓN: WebSocket con gestión completa de estados
  private initializeWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const eventId = localStorage.getItem('event_id');
      const token = localStorage.getItem('token');
      
      if (!eventId || !token) {
        reject(new Error('Faltan credenciales'));
        return;
      }

      this.clientId = this.shortIdBase64();
      this.videoSourceName = this.clientId;
      
      const wsUrl = `${this.configService.apiWsUrl}/ws/stream?eventId=${eventId}&token=${token}&clientId=${this.clientId}`;

      try {
        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = 'arraybuffer';

        // Timeout para conexión
        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('🟢 WebSocket conectado');
          this.streamingState.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log('🔴 WebSocket cerrado:', event.code, event.reason);
          
          // Auto-reconexión si no fue intencional
          if (event.code !== 1000 && this.streamingState.isActive) {
            this.handleReconnection();
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  // 🔧 OPTIMIZACIÓN: Reconexión inteligente
  private async handleReconnection(): Promise<void> {
    if (this.streamingState.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      this.forceStopStreaming();
      return;
    }

    this.streamingState.reconnectAttempts++;
    const delay = Math.pow(2, this.streamingState.reconnectAttempts) * 1000; // Backoff exponencial

    console.log(`🔄 Reintentando conexión en ${delay}ms (intento ${this.streamingState.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.initializeWebSocket();
        this.startMediaRecorder();
      } catch (error) {
        console.error('❌ Error en reconexión:', error);
        this.handleReconnection();
      }
    }, delay);
  }

  // 🔧 OPTIMIZACIÓN: MediaRecorder adaptativo
  private startMediaRecorder(): void {
    if (!this.currentStream || !this.ws) return;

    try {
      // Bitrate adaptativo basado en modo de cámara
      const adaptiveBitrate = this.calculateAdaptiveBitrate();
      
      const options = {
        mimeType: 'video/webm; codecs=vp8',
        videoBitsPerSecond: adaptiveBitrate
      };

      this.mediaRecorder = new MediaRecorder(this.currentStream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
          this.handleChunkSend(event.data);
        }
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('❌ MediaRecorder error:', error);
        this.handleMediaRecorderError();
      };

      this.mediaRecorder.start(this.CHUNK_INTERVAL_MS);
      console.log(`🎥 MediaRecorder iniciado - Bitrate: ${adaptiveBitrate}bps`);

    } catch (error) {
      console.error('❌ Error iniciando MediaRecorder:', error);
      throw error;
    }
  }

  // 🔧 OPTIMIZACIÓN: Bitrate adaptativo
  private calculateAdaptiveBitrate(): number {
    const baseBitrate = this.defaultFacingMode === 'user' ? this.user_mode_bps : this.environment_mode_bps;
    
    // Ajustar basado en resolución y calidad
    return Math.floor(baseBitrate * this.resolutionScale * this.qualityScale);
  }

  // 🔧 OPTIMIZACIÓN: Envío inteligente de chunks
  private handleChunkSend(data: Blob): void {
    const now = performance.now();
    this.streamingState.lastChunkTime = now;
    this.chunkCounter++;

    try {
      this.ws?.send(data);

      // Adaptación de bitrate cada N chunks
      if (this.chunkCounter % this.BITRATE_ADAPTATION_THRESHOLD === 0) {
        this.adaptBitrateIfNeeded();
      }

    } catch (error) {
      console.error('❌ Error enviando chunk:', error);
    }
  }

  // 🔧 OPTIMIZACIÓN: Adaptación dinámica de bitrate
  private adaptBitrateIfNeeded(): void {
    // Lógica simple: si hay lag en WebSocket, reducir bitrate
    if (this.ws?.bufferedAmount && this.ws.bufferedAmount > 64 * 1024) { // 64KB buffer
      this.streamingState.adaptiveBitrate = Math.max(
        this.streamingState.adaptiveBitrate * 0.8, 
        200000 // Mínimo 200kbps
      );
      console.log(`📉 Bitrate reducido a: ${this.streamingState.adaptiveBitrate}bps`);
    }
  }

  // 🔧 OPTIMIZACIÓN: Manejo de errores de MediaRecorder
  private handleMediaRecorderError(): void {
    console.error('❌ MediaRecorder falló, reintentando...');
    
    setTimeout(() => {
      if (this.streamingState.isActive && this.currentStream) {
        this.startMediaRecorder();
      }
    }, 2000);
  }

  // 🔧 OPTIMIZACIÓN: Toggle streaming seguro
  async toggleStream(): Promise<void> {
    try {
      if (this.streamingState.isActive) {
        this.stopStreaming();
      } else {
        await this.startStreaming();
      }
    } catch (error) {
      console.error('❌ Error en toggle stream:', error);
    }
  }

  // 🔧 OPTIMIZACIÓN: Inicio de streaming robusto
  private async startStreaming(): Promise<void> {
    try {
      if (!this.currentStream) {
        await this.initializeCamera();
      }

      await this.initializeWebSocket();
      this.startMediaRecorder();

      this.streamingState.isActive = true;
      this.isStreaming = true;
      this.cdr.markForCheck();

      console.log('🟢 Streaming iniciado correctamente');

    } catch (error) {
      console.error('❌ Error iniciando streaming:', error);
      this.forceStopStreaming();
      throw error;
    }
  }

  // 🔧 OPTIMIZACIÓN: Parada segura
  private stopStreaming(): void {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Streaming stopped by user');
      }

      this.streamingState.isActive = false;
      this.isStreaming = false;
      this.cdr.markForCheck();

      console.log('🔴 Streaming detenido');

    } catch (error) {
      console.error('❌ Error deteniendo streaming:', error);
    }
  }

  // 🔧 OPTIMIZACIÓN: Parada forzada en caso de error
  private forceStopStreaming(): void {
    this.streamingState.isActive = false;
    this.isStreaming = false;
    this.mediaRecorder = undefined;
    this.ws = undefined;
    this.cdr.markForCheck();
  }

  // 🔧 OPTIMIZACIÓN: Cambio de cámara eficiente
  async toggleFacingMode(): Promise<void> {
    if (this.streamingState.isActive) return; // No cambiar durante streaming

    try {
      this.defaultFacingMode = this.defaultFacingMode === 'user' ? 'environment' : 'user';
      this.bps = this.defaultFacingMode === 'user' ? this.user_mode_bps : this.environment_mode_bps;
      
      await this.initializeCamera();
      this.cdr.markForCheck();

    } catch (error) {
      console.error('❌ Error cambiando cámara:', error);
    }
  }

  // Métodos existentes optimizados
  updateResolution(scale: number): void {
    this.resolutionScale = Math.max(0.25, Math.min(2.0, scale));
    this.cdr.markForCheck();
  }

  updateQuality(scale: number): void {
    this.qualityScale = Math.max(0.1, Math.min(1.0, scale));
    this.cdr.markForCheck();
  }

  rotateVideoSource(orientation: number): void {
    if (!this.videoSourceName) return;

    this.apiSigasigaRestService.rotateVideoSource(this.videoSourceName, orientation)
      .subscribe({
        next: (response) => console.log('✅ Video rotado:', response),
        error: (error) => console.error('❌ Error rotando video:', error)
      });
  }

  private shortIdBase64(length = 8): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).slice(0, length);
  }
} 