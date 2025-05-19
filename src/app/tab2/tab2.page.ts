import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-tab2',
  template: `
    <video #videoElement autoplay playsinline></video>
    <div>
      <button (click)="toggleStream()">
        {{ isStreaming ? 'Stop' : 'Start' }} Stream
      </button>
      <select [(ngModel)]="resolution">
        <option value="1.0">100%</option>
        <option value="0.75">75%</option>
        <option value="0.5">50%</option>
        <option value="0.25">25%</option>
      </select>
    </div>
  `,
  standalone: false,
})
export class Tab2Page implements OnInit, OnDestroy {
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  isStreaming = false;
  resolution = 1.0;

  async toggleStream() {
    if (this.isStreaming) {
      this.stopStream();
    } else {
      await this.startStream();
    }
  }

  private async startStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });

      // Sin servidores STUN
      this.peerConnection = new RTCPeerConnection();

      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.sendOfferToServer(offer);

      this.isStreaming = true;
    } catch (error) {
      console.error('Error iniciando stream:', error);
    }
  }

  private stopStream() {
    this.localStream?.getTracks().forEach(track => track.stop());
    this.peerConnection?.close();
    this.isStreaming = false;
  }

  private sendOfferToServer(offer: RTCSessionDescriptionInit) {
    fetch('https://api-sigasiga-webrtc.sigasiga.walry.cloud/webrtc/offer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ offer })
    });
  }

  ngOnDestroy() {
    this.stopStream();
  }
}