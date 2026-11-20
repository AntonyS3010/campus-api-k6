"""Sirve la app aislada en un puerto libre y propaga el resultado real de k6."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
import os
import subprocess
import sys

root = Path(__file__).resolve().parent.parent
handler = partial(SimpleHTTPRequestHandler, directory=str(root / 'public'))
with ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
    Thread(target=server.serve_forever, daemon=True).start()
    try:
        result = subprocess.run([os.environ.get('K6_BIN', 'k6'), 'run', str(root / 'tests/api.js')],
            env={**os.environ, 'BASE_URL': f'http://127.0.0.1:{server.server_port}'}, cwd=root)
    finally:
        server.shutdown()
    sys.exit(result.returncode)
