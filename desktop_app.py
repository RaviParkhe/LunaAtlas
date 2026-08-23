import os
import sys
import threading
import time
import webbrowser
import urllib.request
import json
import subprocess
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

def wait_for_server(timeout=12.0):
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

    print("[*] Waiting for backend compute engine readiness...")
    if not wait_for_server(timeout=12.0):
        print("[!] Server startup taking longer than expected. Continuing...")

    print(f"[+] Workstation engine ready! Launching UI at {URL} ...")

    # Try launching in native App Mode via Chromium/Edge or default browser
    launched = False
    try:
        # Launch in native app window mode using Microsoft Edge (standard on Windows 10/11)
        subprocess.Popen(["cmd.exe", "/c", "start", "msedge", f"--app={URL}", "--window-size=1480,920"], shell=True)
        launched = True
    except Exception:
        pass

    if not launched:
        try:
            # Fallback to Chrome app mode
            subprocess.Popen(["cmd.exe", "/c", "start", "chrome", f"--app={URL}", "--window-size=1480,920"], shell=True)
            launched = True
        except Exception:
            pass

    if not launched:
        # Fallback to default web browser
        webbrowser.open(URL)

    print(f"\n[✓] LunaAtlas Workstation is active at: {URL}")
    print("[*] Press Ctrl+C in this terminal to stop the server.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[*] Shutting down LunaAtlas workstation.")

if __name__ == "__main__":
    launch_desktop()
