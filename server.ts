import './src/instrumentation';
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import { Hono } from 'hono';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, resolve } from 'node:path';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import bootstrap from './src/main.server';
import logger from './src/logger';

interface ServerPaths {
  readonly browserDistFolder: string;
  readonly indexHtml: string;
}

/**
 * Resolves the Angular server and browser distribution paths from this bundle.
 */
function resolveServerPaths(): ServerPaths {
  const currentDir = dirname(fileURLToPath(import.meta.url));

  // Se estivermos na Vercel ou rodando da raiz, precisamos apontar para a pasta dist
  // Se estivermos rodando de dentro da dist, o '../browser' padrão funciona.
  const isRunningFromDist = currentDir.includes(join('dist', 'agendarpd-new-front', 'server'));

  const browserDistFolder = isRunningFromDist
    ? resolve(currentDir, '../browser')
    : resolve(currentDir, 'dist/agendarpd-new-front/browser');

  const indexHtml = isRunningFromDist
    ? join(currentDir, 'index.server.html')
    : join(currentDir, 'dist/agendarpd-new-front/server/index.server.html');

  return {
    browserDistFolder,
    indexHtml,
  };
}

/**
 * Returns true when the URL points to a static asset instead of an Angular route.
 */
function isStaticAssetPath(pathname: string): boolean {
  return /\.[^/]+$/.test(pathname);
}

/**
 * Resolves a browser asset path while preventing directory traversal.
 */
function resolveBrowserAssetPath(browserDistFolder: string, pathname: string): string | null {
  const relativePath = decodeURIComponent(pathname).replace(/^\/+/, '');
  const filePath = normalize(join(browserDistFolder, relativePath));

  return filePath.startsWith(browserDistFolder) ? filePath : null;
}

/**
 * Sends a browser bundle asset through Node's HTTP response API.
 */
async function sendBrowserAsset(
  browserDistFolder: string,
  pathname: string,
  response: ServerResponse,
): Promise<void> {
  const filePath = resolveBrowserAssetPath(browserDistFolder, pathname);

  if (!filePath) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=UTF-8' });
    response.end('Not Found');
    return;
  }

  const file = Bun.file(filePath);

  if (!(await file.exists())) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=UTF-8' });
    response.end('Not Found');
    return;
  }

  response.writeHead(200, {
    'content-type': file.type || 'application/octet-stream',
    'content-length': file.size,
  });
  response.end(Buffer.from(await file.arrayBuffer()));
}

// The Hono app is exported so that it can be used by serverless Functions.
export function app(): Hono {
  const server = new Hono();
  const { browserDistFolder, indexHtml } = resolveServerPaths();
  const commonEngine = new CommonEngine();

  // Logger middleware - "Percepção" para ver as requisições
  server.use('*', async (c, next) => {
    logger.info(`[${c.req.method}] ${c.req.url}`);
    await next();
  });

  // All routes are handled by this middleware
  server.get('*', async (c) => {
    const requestUrl = c.req.url;
    const url = new URL(requestUrl);

    try {
      // 1. Check if it's a static asset (correção de path traversal incluída)
      if (isStaticAssetPath(url.pathname)) {
        const filePath = resolveBrowserAssetPath(browserDistFolder, url.pathname);

        if (!filePath) return c.text('Not Found', 404);

        const file = Bun.file(filePath);
        if (!(await file.exists())) return c.text('Not Found', 404);

        return c.body(await file.arrayBuffer(), 200, {
          'content-type': file.type || 'application/octet-stream',
        });
      }

      // 2. Render Angular SSR
      const html = await commonEngine.render({
        bootstrap,
        documentFilePath: indexHtml,
        url: requestUrl,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
      });

      return c.html(html);
    } catch (err) {
      logger.error('Hono SSR/Asset Error', { error: err, url: requestUrl });
      return c.text('Internal Server Error', 500);
    }
  });

  return server;
}

function run(): void {
  const port = Number(process.env['SSR_PORT'] || 4000);
  const { browserDistFolder, indexHtml } = resolveServerPaths();
  const commonEngine = new CommonEngine();

  logger.info(`Bun Hono server listening on http://localhost:${port}`);

  createServer((request: IncomingMessage, response: ServerResponse) => {
    void handleNodeRequest(request, response, commonEngine, indexHtml, browserDistFolder);
  }).listen(port);
}

/**
 * Handles SSR and static assets using Node's HTTP API while still running on Bun.
 */
async function handleNodeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  commonEngine: CommonEngine,
  indexHtml: string,
  browserDistFolder: string,
): Promise<void> {
  const host = request.headers.host ?? `localhost:${process.env['SSR_PORT'] || 4000}`;
  const requestUrl = new URL(request.url ?? '/', `http://${host}`).toString();

  logger.info(`[${request.method ?? 'GET'}] ${requestUrl}`);

  try {
    const url = new URL(requestUrl);

    if (isStaticAssetPath(url.pathname)) {
      await sendBrowserAsset(browserDistFolder, url.pathname, response);
      return;
    }

    const html = await commonEngine.render({
      bootstrap,
      documentFilePath: indexHtml,
      url: requestUrl,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: '/' }],
    });

    response.writeHead(200, { 'content-type': 'text/html; charset=UTF-8' });
    response.end(html);
  } catch (error: unknown) {
    logger.error('Node HTTP handler error', { error, url: requestUrl });
    response.writeHead(500, { 'content-type': 'text/plain; charset=UTF-8' });
    response.end('Internal Server Error');
  }
}

// Only run the standalone server if this file is the main entry point.
// "Porque dele, e por meio dele, e para ele são todas as coisas." — Romanos 11:36
if (import.meta.main) {
  run();
}

