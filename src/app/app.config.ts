import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const APP_BR_DATE_FORMATS = {
  parse: {
    dateInput: 'dd/MM/yyyy'
  },
  display: {
    dateInput: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    },
    monthYearLabel: {
      month: 'short',
      year: 'numeric'
    },
    dateA11yLabel: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    },
    monthYearA11yLabel: {
      month: 'long',
      year: 'numeric'
    }
  }
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(),
    provideAnimationsAsync(),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    provideNativeDateAdapter(APP_BR_DATE_FORMATS)
  ]
};
