import cv2
import pytesseract
import requests
import time
import re
import base64
import threading

import os
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
API_URL = f"{BACKEND_URL}/vitals/external-input"
FRAME_URL = f"{BACKEND_URL}/scanner/frame/upload"

def extract_valid_bpm(text):
    matches = re.findall(r'\d+', text)
    for num in matches:
        try:
            bpm = int(num)
            if 50 <= bpm <= 160:
                return bpm
        except ValueError:
            continue
    return None

class OCRThread(threading.Thread):
    def __init__(self, roi_frame, roi_x1, roi_y1, result_callback):
        threading.Thread.__init__(self)
        self.roi_frame = roi_frame
        self.roi_x1 = roi_x1
        self.roi_y1 = roi_y1
        self.result_callback = result_callback

    def run(self):
        try:
            # 1. Convert to grayscale
            gray = cv2.cvtColor(self.roi_frame, cv2.COLOR_BGR2GRAY)
            
            # 2. Apply threshold: cv2.threshold with THRESH_BINARY
            _, thresh = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY)
            
            # 3. Upscale the ROI 3x before sending to Tesseract
            height, width = thresh.shape
            upscaled = cv2.resize(thresh, (width * 3, height * 3), interpolation=cv2.INTER_CUBIC)
            
            # 4. Apply slight blur to reduce noise: cv2.GaussianBlur kernel (1,1)
            blurred = cv2.GaussianBlur(upscaled, (1, 1), 0)
            
            # 5. Increase contrast using cv2.convertScaleAbs with alpha=2.0, beta=0
            final_roi = cv2.convertScaleAbs(blurred, alpha=2.0, beta=0)
            
            # Tesseract config: --psm 7, --oem 1 (LSTM), and numeric whitelist
            config = '--psm 7 --oem 1 -c tessedit_char_whitelist=0123456789'
            
            # Rotate ROI iteratively to catch mathematically flipped or angled watches
            orientations = [
                (final_roi, "Normal", True),
                (cv2.rotate(final_roi, cv2.ROTATE_180), "Upside Down", False),
                (cv2.rotate(final_roi, cv2.ROTATE_90_CLOCKWISE), "90 Right", False),
                (cv2.rotate(final_roi, cv2.ROTATE_90_COUNTERCLOCKWISE), "90 Left", False)
            ]
            
            best_bpm = None
            best_box = None
            
            for transformed_roi, orientation_name, can_draw_box in orientations:
                ocr_dict = pytesseract.image_to_data(transformed_roi, config=config, output_type=pytesseract.Output.DICT)
                
                # Raw Dump telemetry onto terminal pipeline instantly
                texts = [t.strip() for t in ocr_dict['text'] if t.strip()]
                if texts:
                    raw_text = " ".join(texts)
                    print(f"Raw OCR output ({orientation_name}): {raw_text}")
                
                for i in range(len(ocr_dict['text'])):
                    if int(ocr_dict['conf'][i]) > 30:
                        text = ocr_dict['text'][i]
                        bpm = extract_valid_bpm(text)
                        
                        if bpm is not None:
                            if can_draw_box:
                                scaled_w = ocr_dict['width'][i]
                                scaled_h = ocr_dict['height'][i]
                                scaled_x = ocr_dict['left'][i]
                                scaled_y = ocr_dict['top'][i]
                                
                                abs_x = int(scaled_x / 3) + self.roi_x1
                                abs_y = int(scaled_y / 3) + self.roi_y1
                                best_box = (abs_x, abs_y, int(scaled_w / 3), int(scaled_h / 3))
                            else:
                                # Inject generic center coordinate fallback for geometrically rotated strings
                                best_box = (self.roi_x1 + 20, self.roi_y1 + 20, 100, 50)
                            
                            best_bpm = bpm
                            break # Lock on first match
                            
                if best_bpm is not None:
                    break

            self.result_callback(best_bpm, best_box)
        except Exception as e:
            print(f"OCR Pipeline Fault: {e}")
            self.result_callback(None, None)

def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Fatal Error: Could not bind local OS web camera array.")
        return

    print("\n==================================")
    print("VitalWatch HIGH-SPEED Scanner")
    print("Threading Engine Active: 500ms intervals")
    print("Press Ctrl+C in terminal to abort.")
    print("==================================\n")

    last_scan_time = 0
    scan_interval = 0.5 # 500ms highly-responsive intervals
    
    last_frame_post = 0
    post_interval = 0.1 # Throttle visual POSTs to 10 FPS
    
    cached_box = None
    cached_bpm = None
    cached_time = 0
    
    last_posted_bpm = None
    
    # State flags mapped securely to prevent duplicate threads
    app_state = {
        'ocr_running': False,
        'result_ready': False,
        'new_bpm': None,
        'new_box': None
    }
    
    def on_ocr_complete(bpm, box):
        app_state['new_bpm'] = bpm
        app_state['new_box'] = box
        app_state['result_ready'] = True
        app_state['ocr_running'] = False

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        timestamp = time.time()
        render_frame = frame.copy()
        
        # Center 40% ROI bounds
        height, width, _ = frame.shape
        roi_x1 = int(width * 0.30)
        roi_x2 = int(width * 0.70)
        roi_y1 = int(height * 0.30)
        roi_y2 = int(height * 0.70)
        
        cv2.rectangle(render_frame, (roi_x1, roi_y1), (roi_x2, roi_y2), (255, 255, 255), 2)
        cv2.putText(render_frame, "SCAN TARGET", (roi_x1, roi_y1 - 10), cv2.FONT_HERSHEY_DUPLEX, 0.5, (255, 255, 255), 1)

        # Non-blocking Thread Resolution
        if app_state['result_ready']:
            app_state['result_ready'] = False
            bpm = app_state['new_bpm']
            box = app_state['new_box']
            
            if bpm is not None:
                cached_box = box
                cached_bpm = bpm
                cached_time = timestamp
                
                print(f"[OPTICAL LOCK] -> Heart rate detected: {bpm} BPM")
                
                # Enforce API throttling: only POST if >3 BPM variance or if it's the first lock!
                if last_posted_bpm is None or abs(bpm - last_posted_bpm) > 3:
                    try:
                        requests.post(API_URL, json={"heart_rate": bpm}, timeout=1.0)
                        last_posted_bpm = bpm
                    except requests.RequestException:
                        pass
            else:
                # Decay staled locks quickly
                if (timestamp - cached_time) > 4.0:
                    cached_box = None
                    cached_bpm = None
                    last_posted_bpm = None

        # Execute new threaded OCR task every 500ms
        if timestamp - last_scan_time >= scan_interval and not app_state['ocr_running']:
            last_scan_time = timestamp
            roi_frame = frame[roi_y1:roi_y2, roi_x1:roi_x2].copy() # Explicit vector clone for thread isolation
            
            app_state['ocr_running'] = True
            thread = OCRThread(roi_frame, roi_x1, roi_y1, on_ocr_complete)
            thread.daemon = True
            thread.start()

        # Render locks without tearing UX
        if cached_box is not None and cached_bpm is not None:
            x, y, w, h = cached_box
            cv2.rectangle(render_frame, (x, y), (x + w, y + h), (0, 255, 0), 3)
            cv2.putText(render_frame, f"LOCKED: {cached_bpm} BPM", (x, y - 12), cv2.FONT_HERSHEY_DUPLEX, 0.8, (0, 255, 0), 2)
        else:
            cv2.putText(render_frame, "Searching...", (20, 30), cv2.FONT_HERSHEY_DUPLEX, 0.6, (0, 200, 255), 1)

        # Upload scaled matrix back to UI
        if timestamp - last_frame_post >= post_interval:
            last_frame_post = timestamp
            small_frame = cv2.resize(render_frame, (500, 375))
            _, buffer = cv2.imencode('.jpg', small_frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
            frame_b64 = base64.b64encode(buffer).decode('utf-8')
            try:
                # Ultra-short timeout for web delivery so the OpenCV loop absolutely NEVER blocks mapping!
                requests.post(FRAME_URL, json={"frame": frame_b64}, timeout=0.05)
            except requests.RequestException:
                pass

    cap.release()

if __name__ == "__main__":
    main()
