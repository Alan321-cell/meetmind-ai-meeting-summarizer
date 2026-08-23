"""
MeetMind — AI Meeting Summarizer Launch Script
Provides single-command startup for backend server and local services.
"""
import sys
import subprocess
import os
from pathlib import Path

def main():
    print("=" * 70)
    print(" 🚀 Starting MeetMind — AI Meeting Summarizer")
    print("=" * 70)

    base_dir = Path(__file__).resolve().parent
    backend_dir = base_dir / "backend"

    # Locate Python interpreter
    venv_python = backend_dir / "venv" / "Scripts" / "python.exe"
    if not venv_python.exists():
        venv_python = backend_dir / "venv" / "bin" / "python"
    
    python_exec = str(venv_python) if venv_python.exists() else sys.executable

    print(f"[*] Base Directory: {base_dir}")
    print(f"[*] Python Runtime: {python_exec}")
    print(f"[*] Backend Server: http://127.0.0.1:8000")
    print(f"[*] Interactive API Docs: http://127.0.0.1:8000/docs")
    print(f"[*] Frontend Web UI: http://localhost:5173 (Dev) or http://127.0.0.1:8000 (Production)")
    print("=" * 70)

    # Launch uvicorn
    cmd = [
        python_exec,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--reload"
    ]

    try:
        subprocess.run(cmd, cwd=str(backend_dir))
    except KeyboardInterrupt:
        print("\n[+] MeetMind backend server stopped.")

if __name__ == "__main__":
    main()
