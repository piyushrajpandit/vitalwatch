# VitalWatch
A real-time elderly cardiac anomaly detection system with instant mobile alerts.

## Project Architecture
- **Backend:** Python FastAPI with Scikit-learn Isolation Forest, Server-Sent Events (SSE).
- **Frontend:** Next.js 14, Tailwind CSS, Recharts for real-time visualization.
- **Notification:** Firebase SDK integrated placeholders.

## Requirements
- Mac / Linux / Windows
- Python 3.9+
- Node.js 20+

## Running the Backend
In a terminal, navigate to the `VitalWatch/backend` folder:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
The backend will be available at `http://localhost:8000`.

## Running the Frontend
In another terminal, navigate to the `VitalWatch/frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
The frontend dashboard will be available at `http://localhost:3000`.

## Demo Flow
1. Open the frontend dashboard `http://localhost:3000`. 
2. Wait a few seconds to see normal vitals streaming in.
3. Click the **"Start Scan"** button on the rPPG Face Scan panel. A 30s countdown will show.
4. Observe the live charts updating via Server-Sent Events.
5. Click the big red **"TRIGGER ANOMALY"** button to inject a severe heart rate and SpO2 drop anomaly.
6. Notice the Application reacts:
   - Status changes to CRITICAL
   - Badge pulses red, dashboard borders flush red
   - Anomaly Alert spawns on the right feed
   - A mockup critical banner appears on the top
   - A mock Push Notification is processed by the Server and logged
7. Click **"RESET TO NORMAL"** to clear constraints and stabilize the vitals.

Enjoy the live demo!
