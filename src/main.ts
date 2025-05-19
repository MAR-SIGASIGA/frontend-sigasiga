import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './app/app.module';
import { AppConfigService } from './app/services/app-config.service';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

fetch('/assets/config.json')
.then(response => response.json())
.then(config => {
  const appConfig = new AppConfigService(null as any);
  (appConfig as any).config = config;
  console.log(config)

  if (config.production) {
    enableProdMode();
  }

  platformBrowserDynamic([
    { provide: AppConfigService, useValue: appConfig }
  ])
    .bootstrapModule(AppModule)
    .catch(err => console.error(err));
});