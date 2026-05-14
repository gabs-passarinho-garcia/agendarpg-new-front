import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';
import { environment } from '../environments/environment';

/**
 * Initializes Grafana Faro for frontend observability.
 * Captures Logs (console, errors), Traces (XHR/Fetch), and Metrics (Web Vitals).
 */
export const initFaro = () => {
  // SSR Check: Faro is a browser-only SDK
  if (typeof window === 'undefined') {
    return null;
  }

  const faroUrl = environment.faroUrl;

  if (!faroUrl) {
    console.debug('Faro URL not defined. Skipping telemetry initialization.');
    return null;
  }

  return initializeFaro({
    url: faroUrl,
    app: {
      name: 'agendarpg-frontend',
      version: '1.0.0',
      environment: environment.production ? 'production' : 'development',
    },
    instrumentations: [
      // Standard instrumentations for logs, errors, and web vitals (metrics)
      ...getWebInstrumentations({
        captureConsole: true,
        // captureConsoleDisabledLevels: [] // Can be used to customize log levels
      }),

      // Tracing instrumentation for capturing distributed traces
      new TracingInstrumentation({
        instrumentationOptions: {
          // Propagate trace context to our API to correlate frontend and backend traces
          propagateTraceHeaderCorsUrls: [environment.apiUrl],
        },
      }),
    ],
  });
};
