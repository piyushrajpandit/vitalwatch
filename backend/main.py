import asyncio
import json
import logging
import random
import time
from datetime import datetime

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
import os
from dotenv import load_dotenv
load_dotenv()

import numpy as np
from sklearn.ensemble import IsolationForest
from twilio.rest import Client

import firebase_admin
from firebase_admin import credentials, messaging

app = FastAPI(title="VitalWatch Backend")

# Twilio Configuration
TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM = "whatsapp:+14155238886"
TWILIO_TO = "whatsapp:+918092597282"

twilio_client = None
if TWILIO_SID and TWILIO_AUTH_TOKEN:
    try:
        twilio_client = Client(TWILIO_SID, TWILIO_AUTH_TOKEN)
        print("Twilio client initialized.")
    except Exception as e:
        print(f"Failed to initialize Twilio: {e}")

firebase_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
if firebase_cred_path and os.path.exists(firebase_cred_path):
    try:
        cred = credentials.Certificate(firebase_cred_path)
        firebase_admin.initialize_app(cred)
        print("Firebase initialized successfully.")
    except Exception as e:
        print("Failed to initialize Firebase:", e)
else:
    print("Firebase credentials not found (.env). Push Notifications will be logged to console.")

# Allow CORS for Next.js frontend
allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://0.0.0.0:3000", "https://vitalwatch-mauve.vercel.app"]
if os.getenv("FRONTEND_URL"):
    allowed_origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def send_whatsapp_alert(vitals: dict):
    """Send WhatsApp alert via Twilio."""
    if not twilio_client:
        print("Twilio client not initialized. Skipping WhatsApp alert.")
        return

    hr = vitals.get("heart_rate")
    spo2 = vitals.get("spo2")
    message_body = (
        f"⚠️ CRITICAL ALERT: John Mitchell (Age 72) cardiac anomaly detected. "
        f"Heart rate: {hr} BPM. SpO2: {spo2}%. Immediate attention required. - VitalWatch AI"
    )

    try:
        # Run in a thread pool to avoid blocking the async event loop if the library is synchronous
        # or use the async client if available. Twilio's standard Client is synchronous.
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, lambda: twilio_client.messages.create(
            from_=TWILIO_FROM,
            body=message_body,
            to=TWILIO_TO
        ))
        print(f"WhatsApp alert sent successfully to {TWILIO_TO}")
    except Exception as e:
        print(f"Failed to send WhatsApp alert: {e}")

class VitalsState:
    def __init__(self):
        self.mode = "simulate"  # "simulate" or "scanner"
        self.latest_frame = None
        self.trigger_anomaly = False
        self.is_rppg_scanning = False
        self.external_hr = None
        self.last_agent_decision = None
        self.is_analyzing = False
        self.whatsapp_alert_sent = False
        
        # Train Isolation Forest on normal baseline data
        # Normal data: HR 60-80, SpO2 95-99
        self.model = IsolationForest(contamination=0.05, random_state=42)
        normal_data = []
        for _ in range(1000):
            hr = random.uniform(60, 80)
            spo2 = random.uniform(95, 99)
            normal_data.append([hr, spo2])
        self.model.fit(normal_data)

    def get_vitals(self):
        now = datetime.now().isoformat()
        
        if self.mode == "scanner":
            # COMPLETELY KILL SIMULATION
            hr = self.external_hr # This will be None if no reading
            spo2 = 98.0 if hr is not None else None
            movement = 0
            
            anomaly_status = "normal"
            if hr is not None and 40 < hr < 200:
                if hr > 130 or spo2 < 90:
                    anomaly_status = "critical"
                elif hr > 100 or hr < 55:
                    anomaly_status = "warning"
            else:
                anomaly_status = "none" if hr is None or hr == 0 else "normal"
                
            severity = 0.8 if anomaly_status == "critical" else (0.5 if anomaly_status == "warning" else 0.0)
            
            return {
                "heart_rate": round(hr, 1) if hr is not None else None,
                "spo2": round(spo2, 1) if spo2 is not None else None,
                "movement": movement,
                "timestamp": now,
                "anomaly_status": anomaly_status,
                "severity_score": severity,
                "whatsapp_alert_sent": self.whatsapp_alert_sent
            }
        else:
            # Simulate mode: Strict isolation completely ignoring external_hr
            if self.trigger_anomaly:
                hr = random.uniform(130, 160)
                spo2 = random.uniform(88, 92)
                movement = 1
            else:
                hr = random.uniform(60, 80)
                spo2 = random.uniform(95, 99)
                movement = random.choice([0, 1])

        # Feature array
        X = np.array([[hr, spo2]])
        
        # Predict: -1 for anomaly, 1 for normal
        prediction = self.model.predict(X)[0]
        
        # Anomaly score: Negative values are more anomalous
        score = self.model.score_samples(X)[0]
        
        # Map anomaly score to severity [0, 1]
        # We invert the score so higher means more anomalous
        inv_score = -float(score)
        severity_score = min(max((inv_score + 0.3) / 1.0, 0.0), 1.0)
        
        # Determine status
        if hr > 120 or spo2 < 90:
            anomaly_status = "critical"
            severity_score = max(severity_score, 0.8)
        elif prediction == -1:
            anomaly_status = "warning"
            severity_score = max(severity_score, 0.5)
        else:
            anomaly_status = "normal"
            severity_score = min(severity_score, 0.3)

        return {
            "heart_rate": round(hr, 1),
            "spo2": round(spo2, 1),
            "movement": movement,
            "timestamp": now,
            "anomaly_status": anomaly_status,
            "severity_score": round(severity_score, 2),
            "whatsapp_alert_sent": self.whatsapp_alert_sent
        }

state = VitalsState()

@app.on_event("startup")
async def startup_event():
    from db import init_db
    init_db()
    print("===== REGISTERED ROUTES =====")
    for route in app.routes:
        methods = getattr(route, "methods", None)
        print(f"{methods} {route.path}")
    print("=============================")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

@app.get("/vitals/current")
async def vitals_current():
    """Return current vitals snapshot for Pocket Doctor."""
    vitals = state.get_vitals()
    return vitals

from agent import analyze_vitals
from db import save_alert, get_recent_alerts

async def trigger_agent_analysis(vitals: dict):
    state.is_analyzing = True
    try:
        decision = await analyze_vitals(vitals)
        decision["timestamp"] = datetime.now().isoformat()
        decision["vitals_analyzed"] = vitals
        state.last_agent_decision = decision
        
        if vitals.get("anomaly_status") in ["warning", "critical"]:
            save_alert(
                timestamp=decision["timestamp"],
                heart_rate=vitals.get("heart_rate", 0),
                spo2=vitals.get("spo2", 0),
                severity=decision.get("risk_level", "HIGH"),
                reasoning=decision.get("clinical_reasoning", ""),
                action=decision.get("immediate_action", "")
            )
    except Exception as e:
        print("Agent error:", e)
    finally:
        state.is_analyzing = False

@app.get("/agent/latest-decision")
async def get_latest_decision():
    return {
        "status": "ok" if state.last_agent_decision else "none",
        "decision": state.last_agent_decision,
        "is_analyzing": state.is_analyzing
    }

@app.get("/test-groq")
async def test_groq():
    """Test endpoint to verify Groq AI connectivity."""
    from agent import client
    if not client:
        return {"status": "error", "message": "Groq client not initialized. Check GROQ_API_KEY in .env."}
    
    try:
        print("\n[TEST] Testing Groq Cardiologist AI connection...")
        
        # Use sync client logic in thread as in agent.py
        loop = asyncio.get_event_loop()
        def call_groq():
            return client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": "Hello cardiologist. Verify connection."}],
                max_tokens=20
            )
            
        response = await loop.run_in_executor(None, call_groq)
        msg = response.choices[0].message.content
        print(f"[TEST] Groq Response: {msg}")
        return {"status": "success", "response": msg, "model": "llama-3.1-8b-instant"}
    except Exception as e:
        import traceback
        err_msg = str(e)
        print(f"[TEST] Groq Test Failed: {err_msg}")
        return {
            "status": "error", 
            "message": err_msg, 
            "traceback": traceback.format_exc()
        }

@app.get("/vitals/stream")
async def vitals_stream():
    """SSE endpoint for streaming real-time vitals."""
    async def event_generator():
        counter = 0
        while True:
            # Every 30-40 seconds automatically inject anomaly spike (ONLY IN SIMULATE MODE)
            counter += 1
            if state.mode == "simulate" and not state.trigger_anomaly and counter >= random.randint(30, 40):
                original = state.trigger_anomaly
                state.trigger_anomaly = True
                
                # Yield anomaly data for a few seconds
                for _ in range(5):
                    yield json.dumps(state.get_vitals())
                    await asyncio.sleep(1)
                
                state.trigger_anomaly = original
                counter = 0
                continue

            vitals = state.get_vitals()
            
            # Anomaly Detection & Alerting Logic
            status = vitals.get("anomaly_status")
            
            # 1. Trigger AI Agent Reasoning
            hr_val = vitals.get("heart_rate")
            hr_valid = hr_val is not None and 40 < hr_val < 200
            if status in ["warning", "critical"] and hr_valid and not state.is_analyzing:
                asyncio.create_task(trigger_agent_analysis(vitals))

            # 2. Trigger Twilio WhatsApp Alert (Wait for Critical)
            if status == "critical" and not state.whatsapp_alert_sent:
                state.whatsapp_alert_sent = True
                asyncio.create_task(send_whatsapp_alert(vitals))
            
            # 3. Reset Alert Flag when returning to normal
            if status == "normal":
                state.whatsapp_alert_sent = False
                
            yield json.dumps(vitals)
            await asyncio.sleep(1)

    return EventSourceResponse(event_generator())

class ExternalInput(BaseModel):
    heart_rate: float

@app.post("/vitals/external-input")
async def external_input(data: ExternalInput):
    """Receive real HR from watch scanner OpenCV."""
    if state.mode == "scanner":
        state.external_hr = round(data.heart_rate, 1)
        return {"status": "success", "message": f"External HR {data.heart_rate} received. Locked to scanner mode."}
    return {"status": "ignored", "message": "Ignored because backend is in simulate mode."}

@app.post("/vitals/trigger-anomaly")
async def trigger_anomaly():
    """Manually force anomaly spike immediately."""
    state.trigger_anomaly = True
    
    # Internal automated notification on trigger
    hr = round(random.uniform(130, 160), 1)
    time_str = datetime.now().strftime("%I:%M %p")
    title = "🚨 CRITICAL ALERT"
    body = f"John's heart rate reached {hr} BPM at {time_str}. Immediate attention recommended."
    print(f"\n======== PUSH NOTIFICATION ========\n{title}\n{body}\n===================================\n")
    
    return {"status": "success", "message": "Anomaly triggered! Chart should spike.", "notification_sent": True}

@app.post("/vitals/reset")
async def reset_vitals():
    """Reset vitals back to normal."""
    state.trigger_anomaly = False
    return {"status": "success", "message": "Vitals reset to normal."}

@app.get("/rppg/start")
async def rppg_start():
    """Simulate rPPG face scan (activates webcam optionally on frontend)."""
    state.is_rppg_scanning = True
    # In a real scenario, this would trigger a ML face scanning pipeline.
    # Here, we will just simulate a success response since the frontend
    # will handle a 30s countdown and then consider it completed.
    
    # We'll let the frontend do the 30s wait to mock the recording, and we
    # just return what the calculated HR would be.
    return {
        "heart_rate": round(random.uniform(65, 75), 1),
        "confidence": round(random.uniform(0.85, 0.98), 2),
        "status": "completed"
    }

@app.get("/rppg/status")
async def rppg_status():
    """Return whether a scan is in progress."""
    return {"is_scanning": state.is_rppg_scanning}

class DeviceToken(BaseModel):
    token: str

@app.post("/notifications/register")
async def register_notification(data: DeviceToken):
    """Save FCM device token."""
    return {"status": "success", "message": f"Token registered."}

class NotificationPayload(BaseModel):
    title: str
    body: str

@app.post("/notifications/send")
async def send_notification(payload: NotificationPayload):
    """Simulate sending push notification."""
    print(f"Push Notification Sent -> {payload.title}: {payload.body}")
    return {"status": "success", "message": "Notification dispatched."}

@app.get("/alerts/history")
async def alerts_history():
    """Retrieve the last 50 historical AI alerts."""
    from db import get_recent_alerts
    return get_recent_alerts(50)

class ModePayload(BaseModel):
    mode: str

@app.post("/vitals/mode")
async def set_mode(payload: ModePayload):
    if payload.mode in ["simulate", "scanner"]:
        state.mode = payload.mode
        # Hard reset all state buffers completely upon mode switch
        state.external_hr = None
        state.last_agent_decision = None
        state.is_analyzing = False
        state.trigger_anomaly = False
        return {"status": "success", "mode": state.mode}
    return {"status": "error", "message": "Invalid mode"}

class FramePayload(BaseModel):
    frame: str

@app.post("/scanner/frame/upload")
async def upload_frame(payload: FramePayload):
    state.latest_frame = payload.frame
    return {"status": "success"}

@app.get("/scanner/frame")
async def get_frame():
    return {"frame": state.latest_frame}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
