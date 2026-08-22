import os
import sys
import threading
import time
import webbrowser
import uvicorn

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

PORT = 8050

def start_server():
    from backend.main import app
    uvicorn.run(app, host="127.0.0.1", port=PORT, log_level="warning")

def launch_desktop():
    print("=" * 70)
    print("   LUNA-ASTRA — LUNAR HABITAT AI DECISION SUPPORT WORKSTATION")
    print("   NSIC Software Track (SW02)")
    print("=" * 70)
    print(f"[*] Starting embedded compute engine on http://127.0.0.1:{PORT} ...")

    # Start FastAPI server thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(1.2)

    # Launch in browser or pywebview
    url = f"http://127.0.0.1:{PORT}"
    try:
        import webview
        print("[*] Launching native aerospace desktop workstation window via PyWebview...")
        window = webview.create_window(
            title="LunaAstra — Lunar Habitat Decision Support Workstation",
            url=url,
            width=1480,
            height=920,
            min_size=(1100, 720),
            background_color="#050811"
        )
        webview.start()
    except Exception as e:
        print(f"[*] PyWebview fallback ({e}). Launching in browser workstation view...")
        webbrowser.open(url)
        print(f"[+] Workstation is live at: {url}")
        print("[*] Press Ctrl+C to stop.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down LunaAstra workstation.")

if __name__ == "__main__":
    launch_desktop()
