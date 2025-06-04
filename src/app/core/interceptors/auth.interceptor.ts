import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn } from '@angular/common/http';
import { inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SigasigaSocketioService } from '../../services/sigasiga-socketio.service'; // Ajusta la ruta si es necesario

export const authInterceptor: HttpInterceptorFn = (
  req,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const ngZone = inject(NgZone);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // Usar NgZone.run para asegurar que la navegación se ejecute dentro de la zona de Angular
        ngZone.run(() => {
          console.warn('AuthInterceptor: Token inválido o expirado. Código:', error.status);
          
          // Intentar desconectar el socket
          try {
            console.log('AuthInterceptor: Socket desconectado.');
          } catch (socketError) {
            console.error('AuthInterceptor: Error al desconectar el socket:', socketError);
          }

          // Limpiar localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('event_id');
          // Considera localStorage.clear() para una limpieza total si es apropiado

          console.log('AuthInterceptor: localStorage limpiado. Redirigiendo a /start...');
          // Redirigir a la página de inicio/login
          router.navigate(['/start']).then(navigated => {
            if (navigated) {
              console.log('AuthInterceptor: Redirección a /start exitosa.');
            } else {
              console.error('AuthInterceptor: Falló la redirección a /start.');
            }
          }).catch(navError => {
            console.error('AuthInterceptor: Error durante la navegación a /start:', navError);
          });
        });
      }
      return throwError(() => error);
    })
  );
}; 