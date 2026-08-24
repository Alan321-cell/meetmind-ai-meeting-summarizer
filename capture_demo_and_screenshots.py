"""
Automated UI Screenshot and Video Walkthrough Capture for MeetMind.
Uses Playwright to navigate the application, seed/interact with meetings, and capture screenshots & video.
"""
import os
import sys
import time
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_DIR = Path(__file__).resolve().parent
SCREENSHOT_DIR = BASE_DIR / "docs" / "screenshots"
VIDEO_DIR = BASE_DIR / "docs" / "video_temp"
FINAL_VIDEO_DIR = BASE_DIR / "docs"

SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
VIDEO_DIR.mkdir(parents=True, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

def run_capture():
    print("[*] Launching Playwright automation...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH if os.path.exists(CHROME_PATH) else None,
            headless=True
        )

        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            record_video_dir=str(VIDEO_DIR),
            record_video_size={"width": 1440, "height": 900}
        )

        page = context.new_page()

        print("[*] Navigating to MeetMind UI (http://127.0.0.1:8000)...")
        page.goto("http://127.0.0.1:8000", wait_until="networkidle")
        time.sleep(2)

        # 1. Capture Dashboard Screenshot
        print("[*] Capturing 01_dashboard.png...")
        page.screenshot(path=str(SCREENSHOT_DIR / "01_dashboard.png"), full_page=False)

        # 2. Open Upload Modal & Capture
        print("[*] Opening Upload Modal...")
        page.click("text=Upload Audio")
        time.sleep(1)
        print("[*] Capturing 02_upload_modal.png...")
        page.screenshot(path=str(SCREENSHOT_DIR / "02_upload_modal.png"))

        # Close modal
        page.click("text=Cancel")
        time.sleep(0.5)

        # 3. Create/Click Demo Meeting
        print("[*] Triggering Demo Meeting...")
        page.click("text=Try Demo Meeting")
        page.wait_for_selector("text=Executive Intelligence Summary", timeout=10000)
        time.sleep(1.5)

        # 4. Capture Meeting Summary View
        print("[*] Capturing 03_meeting_summary.png...")
        page.screenshot(path=str(SCREENSHOT_DIR / "03_meeting_summary.png"), full_page=False)

        # 5. Switch to Decisions Tab & Capture
        print("[*] Switching to Decisions Tab...")
        page.click("button:has-text('Decisions')")
        time.sleep(1)
        print("[*] Capturing 04_decisions.png...")
        page.screenshot(path=str(SCREENSHOT_DIR / "04_decisions.png"))

        # 6. Switch to Action Items Tab & Toggle Task & Capture
        print("[*] Switching to Action Items Tab...")
        page.click("button:has-text('Action Items')")
        time.sleep(1)
        print("[*] Toggling first action item completion...")
        action_checkbox = page.locator(".glass-card").first
        if action_checkbox:
            action_checkbox.click()
            time.sleep(0.8)
        print("[*] Capturing 05_action_items.png...")
        page.screenshot(path=str(SCREENSHOT_DIR / "05_action_items.png"))

        # 7. Switch to Topics Tab & Capture
        print("[*] Switching to Topics Tab...")
        page.click("button:has-text('Topics')")
        time.sleep(1)
        print("[*] Capturing 06_discussion_topics.png...")
        page.screenshot(path=str(SCREENSHOT_DIR / "06_discussion_topics.png"))

        # 8. Switch to Full Transcript Tab & Capture
        print("[*] Switching to Full Transcript Tab...")
        page.click("button:has-text('Full Transcript')")
        time.sleep(1)
        print("[*] Capturing 07_transcript_dialogue.png...")
        page.screenshot(path=str(SCREENSHOT_DIR / "07_transcript_dialogue.png"))

        # 9. Return to Dashboard to finalize video recording
        print("[*] Navigating back to Dashboard...")
        page.click("text=Back to Dashboard")
        time.sleep(2)

        # Close context and save video
        context.close()
        browser.close()

        # Rename recorded video
        video_files = list(VIDEO_DIR.glob("*.webm"))
        if video_files:
            latest_video = video_files[0]
            target_video = FINAL_VIDEO_DIR / "meetmind_demo_walkthrough.webm"
            shutil.move(str(latest_video), str(target_video))
            print(f"[+] Saved demo video to: {target_video}")
            shutil.rmtree(str(VIDEO_DIR), ignore_errors=True)

        print("[+] All screenshots & demo video captured successfully!")

if __name__ == "__main__":
    run_capture()
