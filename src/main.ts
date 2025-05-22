import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app/app.routes';

import { AppConfigService } from './app/services/app-config.service';
import { APP_INITIALIZER } from '@angular/core';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { MessageService } from 'primeng/api';

// Ionicons setup
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';


// Inicializador para configuración de la app
export function initApp(appConfig: AppConfigService) {
  return () => {
    addIcons(allIcons);
    return appConfig.loadConfig();
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
    provideIonicAngular(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
    { provide: MessageService, useClass: MessageService },
    AppConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [AppConfigService],
      multi: true,
    },
  ]
});
