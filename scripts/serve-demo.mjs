import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distRoot = resolve(projectRoot, 'dist');
const basePath = '/FineFatigue';
const port = Number(process.env.DEMO_PORT || 4174);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = createServer((request, response) => {
  const requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
  if (requestPath !== basePath && !requestPath.startsWith(`${basePath}/`)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  const relativePath = requestPath.slice(basePath.length) || '/';
  const filePath = resolve(distRoot, `.${normalize(relativePath)}`);
  if (relative(distRoot, filePath).startsWith('..')) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  const targetPath = existsSync(filePath) && statSync(filePath).isFile() ? filePath : join(distRoot, 'index.html');
  if (!existsSync(targetPath)) {
    response.writeHead(500);
    response.end('Run npm run build:demo first');
    return;
  }

  response.writeHead(200, { 'Content-Type': contentTypes[extname(targetPath)] || 'application/octet-stream' });
  createReadStream(targetPath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`FineFatigue Demo preview: http://127.0.0.1:${port}${basePath}/`);
});
