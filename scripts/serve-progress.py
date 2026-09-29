from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
import mimetypes
ROOT=Path(__file__).resolve().parent.parent
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  path=urlsplit(self.path).path
  f=ROOT/'HELLBOUND.html' if path=='/game' else ROOT/'progress'/('index.html' if path=='/' else path.lstrip('/'))
  if not f.resolve().is_relative_to(ROOT) or not f.is_file():self.send_error(404);return
  data=f.read_bytes();self.send_response(200);self.send_header('Content-Type',mimetypes.guess_type(str(f))[0] or 'application/octet-stream');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
ThreadingHTTPServer(('0.0.0.0',8080),Handler).serve_forever()
