import winston from 'winston';

const isProduction = process.env['NODE_ENV'] === 'production';

/**
 * Winston logger configuration.
 * Automatically instrumented by OpenTelemetry in instrumentation.ts.
 */
const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: isProduction
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.json() // OTLP Log Exporter likes structured JSON
      )
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, service, trace_id, span_id, ...meta }) => {
          const traceStr = trace_id ? ` [trace_id: ${trace_id}]` : '';
          const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
          return `[${timestamp}] ${level} [${service}]${traceStr}: ${message}${metaStr}`;
        })
      ),

  defaultMeta: { service: 'agendarpg-ssr' },
  transports: [
    new winston.transports.Console(),
  ],
});


export default logger;
