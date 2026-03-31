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
import numpy as np
from sklearn.ensemble import IsolationForest

import firebase_admin
from firebase_admin import credentials, messaging

app = FastAPI(title="VitalWatch Backend")

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://0.0.0.0:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VitalsState:
    def __init__(self):
        self.trigger_anomaly = False
        self.is_rppg_scanning = False
        
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
        
        if self.trigger_anomaly:
            # Anomaly reading
            hr = random.uniform(130, 160)
            spo2 = random.uniform(88, 92)
            movement = 1
        else:
            # Normal reading
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
            "severity_score": round(severity_score, 2)
        }

state = VitalsState()

@app.on_event("startup")
async def startup_event():
    print("===== REGISTERED ROUTES =====")
    for route in app.routes:
        methods = getattr(route, "methods", None)
        print(f"{methods} {route.path}")
    print("=============================")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

@app.get("/vitals/stream")
async def vitals_stream():
    """SSE endpoint for streaming real-time vitals."""
    async def event_generator():
        counter = 0
        while True:
            # Every 30-40 seconds automatically inject anomaly spike
            counter += 1
            if not state.trigger_anomaly and counter >= random.randint(30, 40):
                # We could set a short automatic spike here, but to give the user control
                # We'll just generate the initial trigger and let it revert after 5s
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
            yield json.dumps(vitals)
            await asyncio.sleep(1)

    return EventSourceResponse(event_generator())

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
