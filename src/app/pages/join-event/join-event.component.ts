import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
//importar auth service
import { AuthService } from '../../auth/auth.service';
@Component({
  selector: 'app-join-event',
  standalone: true,
  template: '<p>Un momento...</p>',
})
export class JoinEventComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.authService.saveAuthData(params['token'], params['event_id']);
      const token = params['token'];
      const eventId = params['event_id'];

      if (token && eventId) {
        this.authService.saveAuthData(token, eventId);
      }

      // Redirigir al área principal de la app, ej: tabs/transmit
      this.router.navigate(['/tabs/settings']);
    });
  }
}
