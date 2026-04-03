import os
import json
import asyncio
import traceback
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Verify initialization exactly as requested
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

async def analyze_vitals(vitals: dict) -> dict:
    if not client:
        # Fallback simulation
        await asyncio.sleep(1.5)
        hr = vitals.get("heart_rate", 0)
        spo2 = vitals.get("spo2", 0)
        
        return {
            "risk_level": "CRITICAL" if hr > 120 or spo2 < 90 else "HIGH",
            "clinical_reasoning": f"Acute physiological distress indicated by HR {hr} and SpO2 {spo2}%. Patterns suggest potential myocardial ischemia given the patient's hypertensive history.",
            "immediate_action": "Initiate emergency medical services dispatch and notify cardiac care unit.",
            "confidence_score": 0.85
        }

    try:
        # Wrap sync call in thread to avoid blocking FastAPI event loop
        loop = asyncio.get_event_loop()
        
        def call_groq():
            return client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a senior cardiologist AI. Patient: John Mitchell, Age 72. 
                        Baseline: HR 72, SpO2 97%. History: Hypertension, living alone.
                        
                        Respond ONLY in valid JSON with these exact fields:
                        - risk_level: (CRITICAL/HIGH/MEDIUM/LOW)
                        - clinical_reasoning: (2 sentences explaining the physiological risk)
                        - immediate_action: (Specific medical intervention or emergency step)
                        - confidence_score: (Number 0-1)"""
                    },
                    {
                        "role": "user",
                        "content": f"Current vitals: {json.dumps(vitals)}. Anomaly detected by Isolation Forest. Provide clinical assessment."
                    }
                ],
                max_tokens=500,
                temperature=0.2,
                response_format={"type": "json_object"}
            )

        response = await loop.run_in_executor(None, call_groq)
        result = response.choices[0].message.content
        return json.loads(result.strip())
        
    except Exception as e:
        # Standardized error logging as requested
        print(f"GROQ ERROR: {type(e).__name__}: {str(e)}")
        return None
