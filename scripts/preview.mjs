import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve('out');
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const port = Number(process.env.PORT || 4182);
const contentTypes = {
  '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8',
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname !== basePath && !url.pathname.startsWith(basePath + '/')) {
      response.writeHead(404).end();
      return;
    }

    const pathname = decodeURIComponent(url.pathname.slice(basePath.length));
    let file = resolve(root, '.' + (pathname || '/'));
    if (file !== root && !file.startsWith(root + sep)) {
      response.writeHead(404).end();
      return;
    }
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': contentTypes[extname(file)] || 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404).end('Page not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log('Preview at http://127.0.0.1:' + port + basePath + '/');
});
