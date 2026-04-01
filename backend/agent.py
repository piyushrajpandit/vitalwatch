import os
import json
import asyncio
import traceback
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

client = AsyncGroq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

async def analyze_vitals(vitals: dict) -> dict:
    if not client:
        # Fallback simulation for demonstration without API key
        await asyncio.sleep(1.5)  # simulated network latency
        hr = vitals.get("heart_rate", 0)
        spo2 = vitals.get("spo2", 0)
        
        status = "critical" if hr > 120 or spo2 < 90 else "high" if hr > 100 else "medium"
        
        return {
            "risk_level": status,
            "reasoning": f"Vitals show an acute deviation from baseline with HR at {hr} BPM and SpO2 at {spo2}%. This represents a serious cardiac event considering his history of hypertension.",
            "action": "Dispatch emergency notification to registered family members and queue automated call to local emergency services.",
            "message": f"Alert: Acutely elevated heart rate ({hr} BPM) detected.",
            "should_alert": True
        }

    try:
        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": """You are VitalWatch AI Agent — an autonomous health monitoring agent for elderly patients. You monitor vitals, reason about risk, and decide on interventions.
                    
Patient: John Mitchell, 72 years old, living alone, history of hypertension.
Baseline: heart rate 72 BPM, SpO2 97%

Respond ONLY in valid JSON with these fields:
- risk_level: low/medium/high/critical
- reasoning: your thought process (2-3 sentences)
- action: what you decided to do
- message: human readable alert message
- should_alert: true/false"""
                },
                {
                    "role": "user",
                    "content": f"Analyze these vitals: {json.dumps(vitals)}"
                }
            ],
            max_tokens=500,
            temperature=0.3
        )
        
        result = response.choices[0].message.content
        
        # Extract JSON from potential markdown blocks
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0]
        elif "```" in result:
            result = result.split("```")[1].split("```")[0]
            
        return json.loads(result.strip())
        
    except Exception as e:
        print(f"Groq API failed with exception: {str(e)}")
        print("====== FULL EXCEPTION TRACEBACK ======")
        print(traceback.format_exc())
        print("======================================")
        return {
            "risk_level": "critical",
            "reasoning": "Failed to reach AI API. Safely assuming critical state due to alert threshold being breached.",
            "action": "Fallback alert triggered.",
            "message": "AI Analysis unavailable. Check vitals manually.",
            "should_alert": True
        }
