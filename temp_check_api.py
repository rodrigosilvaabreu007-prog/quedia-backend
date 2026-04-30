import urllib.request
import traceback

url = 'https://us-central1-quedia-backend.cloudfunctions.net/api/eventos'
try:
    with urllib.request.urlopen(url, timeout=20) as r:
        print('STATUS', r.status)
        print('HEADERS', r.getheaders())
        body = r.read(1000)
        print(body.decode('utf-8', errors='replace'))
except Exception:
    traceback.print_exc()
