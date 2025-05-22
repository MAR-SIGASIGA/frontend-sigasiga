import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-join-event',
  standalone: true,
  template: '<p>Un momento...</p>',
})
export class JoinEventComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const eventId = params['event_id'];

      if (token) {
        localStorage.setItem('token', token);
      }

      if (eventId) {
        localStorage.setItem('event_id', eventId);
      }

      // Redirigir al área principal de la app, ej: tabs/transmit
      this.router.navigate(['/tabs/settings']);
    });
  }
}
