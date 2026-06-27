import urllib.request
import json
import urllib.error

API_KEY = "rnd_83fDjKYROqTGDjlbTen0F0rLBcn9"
SERVICE_ID = "srv-d8q3budckfvc73ds5sg0"
OWNER_ID = "tea-cvohksjuibrs73br9cug"

req = urllib.request.Request(
    f"https://api.render.com/v1/logs?ownerId={OWNER_ID}&resource={SERVICE_ID}&limit=100&direction=backward",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Accept": "application/json"
    }
)

try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        res = json.loads(resp.read().decode())
        logs = res.get("logs", [])
        print(f"=== Retrieved {len(logs)} log entries ===")
        # Print logs in forward order so they read chronologically
        for entry in reversed(logs):
            msg = entry.get("message", entry.get("text", ""))
            print(msg)
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.read().decode()}")
except Exception as e:
    print(f"Error: {e}")
