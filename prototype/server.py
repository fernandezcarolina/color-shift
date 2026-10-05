"""Local server for the Color Shift web prototype.

Serves this folder and adds GET /api/photos?count=N, which fetches random
Unsplash photos server-side so the access key never reaches the browser.
It mirrors Matt's /api/photos route (same query pool, same utm credit links)
and stands in for the Vercel function the iOS app will use.

Run:  python3 server.py   then open http://localhost:8642
Key:  UNSPLASH_ACCESS_KEY in prototype/.env (git-ignored) or the environment.
"""

import json
import os
import random
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
PORT = 8642

# Matt's pool: /photos/random with no query returns a narrow curated set,
# so rotating through varied queries forces palette breadth.
QUERIES = [
    "nature", "architecture", "abstract", "texture", "city", "landscape",
    "portrait", "street", "minimal", "ocean", "mountain", "forest",
    "desert", "sky", "neon", "vintage", "food", "macro", "wildlife",
    "interior", "fashion", "art", "industrial", "graffiti", "flower",
    "space", "night", "rain", "fog", "sunset", "snow", "autumn",
    "reflection", "shadow", "bokeh", "pattern", "travel", "coffee",
    "music", "sport", "vehicle", "technology", "plant", "bird",
]
UTM = "utm_source=color_shift_prototype&utm_medium=referral"


def load_key():
    if os.environ.get("UNSPLASH_ACCESS_KEY"):
        return os.environ["UNSPLASH_ACCESS_KEY"]
    env = HERE / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            if line.startswith("UNSPLASH_ACCESS_KEY="):
                return line.split("=", 1)[1].strip()
    return None


def with_utm(url):
    return f"{url}{'&' if '?' in url else '?'}{UTM}"


def fetch_one(query, key):
    url = "https://api.unsplash.com/photos/random?orientation=landscape&query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Client-ID {key}", "Accept-Version": "v1"})
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            p = json.load(res)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None
    if isinstance(p, list):
        p = p[0] if p else None
    if not p:
        return None
    return {
        "id": p["id"],
        "url": p["urls"]["regular"],
        "color": p.get("color") or "#888888",
        "photographer": p["user"]["name"],
        "photographerUrl": with_utm(p["user"]["links"]["html"]),
        "photoUrl": with_utm(p["links"]["html"]),
        "alt": p.get("alt_description") or "Unsplash photo",
    }


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(HERE), **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/api/photos":
            return super().do_GET()
        key = load_key()
        if not key:
            return self.send_json(500, {"error": "UNSPLASH_ACCESS_KEY is missing (prototype/.env)"})
        params = urllib.parse.parse_qs(parsed.query)
        count = max(1, min(30, int(params.get("count", ["10"])[0] or 10)))
        queries = random.sample(QUERIES, count)
        with ThreadPoolExecutor(max_workers=6) as pool:
            photos = [p for p in pool.map(lambda q: fetch_one(q, key), queries) if p]
        if not photos:
            return self.send_json(502, {"error": "No photos returned (rate limit or network)"})
        self.send_json(200, photos)

    def send_json(self, status, body):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def send_head(self):
        # Never serve the key file, even if someone asks for it by name.
        if Path(urllib.parse.urlparse(self.path).path).name.startswith(".env"):
            self.send_error(404)
            return None
        return super().send_head()


if __name__ == "__main__":
    print(f"Color Shift prototype on http://localhost:{PORT}")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
