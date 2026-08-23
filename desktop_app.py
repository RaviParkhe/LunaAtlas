import os
import sys
import threading
import time
import webbrowser
import urllib.request
import json
import uvicorn

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

PORT = 8050
URL = f"http://127.0.0.1:{PORT}"

def is_server_running():
    try:
        with urllib.request.urlopen(f"{URL}/api/health", timeout=0.8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("status") == "healthy"
    except Exception:
        return False

def start_server():
    from backend.main import app
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")

def wait_for_server(timeout=10.0):
    start = time.time()
    while time.time() - start < timeout:
        if is_server_running():
            return True
        time.sleep(0.2)
    return False

def launch_desktop():
    print("=" * 70)
    print("   LUNAATLAS — LUNAR HABITAT AI DECISION SUPPORT WORKSTATION")
    print("   Aerospace Decision Support System")
    print("=" * 70)

    if not is_server_running():
        print(f"[*] Starting embedded compute engine on {URL} ...")
        server_thread = threading.Thread(target=start_server, daemon=True)
        server_thread.start()
    else:
        print(f"[+] Existing compute engine detected on {URL}.")

    print("[*] Verifying backend engine health...")
    if not wait_for_server(timeout=10.0):
        print("[!] Warning: Server startup took longer than expected. Proceeding...")

    try:
        import webview
        print("[*] Launching native aerospace desktop workstation window via PyWebview...")
        window = webview.create_window(
            title="LunaAtlas — Lunar Habitat Decision Support Workstation",
            url=URL,
            width=1480,
            height=920,
            min_size=(1100, 720),
            background_color="#0e131d"
        )
        webview.start()
    except Exception as e:
        print(f"[*] PyWebview fallback ({e}). Launching in default browser...")
        webbrowser.open(URL)
        print(f"[+] Workstation is live at: {URL}")
        print("[*] Press Ctrl+C to stop.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down LunaAtlas workstation.")

if __name__ == "__main__":
    launch_desktop()
