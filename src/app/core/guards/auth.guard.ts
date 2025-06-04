import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

export const authGuard: CanActivateFn = (
  route,
  state
): 
  | Observable<boolean | UrlTree>
  | Promise<boolean | UrlTree>
  | boolean
  | UrlTree => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    // Aquí podrías añadir lógica para verificar la expiración del token si tienes una librería para decodificar JWT.
    // Ejemplo (conceptual, necesitarías una función real `isTokenExpired`):
    // if (isTokenExpired(token)) {
    //   console.warn('AuthGuard: Token expirado.');
    //   localStorage.removeItem('token');
    //   localStorage.removeItem('event_id');
    //   return router.createUrlTree(['/start']);
    // }
    return true; // Token existe (y opcionalmente, no está expirado)
  } else {
    console.warn('AuthGuard: No hay token. Redirigiendo a /start...');
    // No hay token, redirigir a la página de login/inicio
    return router.createUrlTree(['/start']);
  }
}; 