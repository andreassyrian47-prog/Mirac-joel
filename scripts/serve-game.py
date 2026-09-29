"""Serve the self-contained game without npm or generated build dependencies."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import argparse
import json

ROOT = Path(__file__).resolve().parent.parent

class GameHandler(BaseHTTPRequestHandler):
    def do_HEAD(self):
        self.respond(head=True)

    def do_GET(self):
        self.respond()

    def respond(self, head=False):
        path = urlsplit(self.path).path
        if path in ('/', '/index.html', '/HELLBOUND.html'):
            try:
                body = (ROOT / 'HELLBOUND.html').read_bytes()
            except OSError:
                self.send_error(503, 'Game file unavailable')
                return
            content_type = 'text/html; charset=utf-8'
        elif path == '/health':
            version = json.loads((ROOT / 'package.json').read_text())['version']
            body = json.dumps({'status': 'ok', 'version': version,
                               'game_available': (ROOT / 'HELLBOUND.html').is_file()}).encode()
            content_type = 'application/json'
        elif path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        if not head:
            self.wfile.write(body)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=5173)
    args = parser.parse_args()
    if not (ROOT / 'HELLBOUND.html').is_file():
        raise SystemExit('HELLBOUND.html is missing. Run npm run standalone first.')
    server = ThreadingHTTPServer(('0.0.0.0', args.port), GameHandler)
    print(f'HELLBOUND game server listening on 0.0.0.0:{args.port}', flush=True)
    server.serve_forever()
