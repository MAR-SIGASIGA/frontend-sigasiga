import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  private peerConnection!: RTCPeerConnection;
  private dataChannel!: RTCDataChannel;
  private ws!: WebSocket;
  private captureInterval: any;

  constructor() {}

  ngOnInit() {
    this.initCamera();
    this.connectWebRTC('evento123', 'source123'); // Cambiá los valores si querés
  }

  async initCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.nativeElement.srcObject = stream;
      this.videoElement.nativeElement.play();
    } catch (error) {
      console.error("❌ No se pudo acceder a la cámara:", error);
    }
  }

  connectWebRTC(eventId: string, sourceId: string) {
    const wsUrl = `wss://api-sigasiga-webrtc.sigasiga.walry.cloud/?eventId=${eventId}&sourceId=${sourceId}`;
    this.ws = new WebSocket(wsUrl);
    this.peerConnection = new RTCPeerConnection();

    this.dataChannel = this.peerConnection.createDataChannel('frames');
    this.dataChannel.onopen = () => {
      console.log('🟢 Canal de datos abierto');
      this.startSendingFrames();
    };

    this.ws.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);
      if (data.sdp) {
        await this.peerConnection.setRemoteDescription(data.sdp);
      } else if (data.candidate) {
        await this.peerConnection.addIceCandidate(data.candidate);
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.ws.send(JSON.stringify({ candidate: event.candidate }));
      }
    };

    this.peerConnection.createOffer().then(async (offer) => {
      await this.peerConnection.setLocalDescription(offer);
      this.ws.send(JSON.stringify({ sdp: offer }));
    });

    this.ws.onclose = () => {
      console.warn("🔌 Conexión WebSocket cerrada");
      clearInterval(this.captureInterval);
    };

    this.ws.onerror = (err) => {
      console.error("❌ Error en WebSocket:", err);
    };
  }

  startSendingFrames() {
    const canvas = document.createElement('canvas');
    const video = this.videoElement.nativeElement;
    canvas.width = 320;
    canvas.height = 240;

    this.captureInterval = setInterval(() => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL('image/jpeg', 0.7);
      if (this.dataChannel.readyState === 'open') {
        this.dataChannel.send(dataURL);
      }
    }, 500);
  }
}