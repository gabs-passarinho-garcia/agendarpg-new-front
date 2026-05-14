import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from '@opentelemetry/semantic-conventions';

/**
 * OpenTelemetry initialization for the Node.js SSR environment.
 * Captures Traces, Metrics, and Logs.
 */

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'agendarpg-ssr',
  [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env['NODE_ENV'] || 'development',
});

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
  }),
  logRecordProcessor: new SimpleLogRecordProcessor(new OTLPLogExporter()),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Captures HTTP, Hono (via fetch/http), and many common Node.js libraries
      '@opentelemetry/instrumentation-fs': { enabled: true },
      '@opentelemetry/instrumentation-winston': { 
        enabled: true,
        // This ensures trace context (traceId, spanId) is injected into Winston logs
      },
    }),
  ],

});

try {
  sdk.start();
  console.log('OpenTelemetry initialized (Traces, Metrics, Logs)');
} catch (error) {
  console.error('Error initializing OpenTelemetry', error);
}

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry terminated'))
    .catch((error) => console.error('Error terminating OpenTelemetry', error))
    .finally(() => process.exit(0));
});
