import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "vitalwatch.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            heart_rate REAL NOT NULL,
            spo2 REAL NOT NULL,
            severity TEXT NOT NULL,
            agent_reasoning TEXT,
            agent_action TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_alert(timestamp: str, heart_rate: float, spo2: float, severity: str, reasoning: str, action: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO alerts (timestamp, heart_rate, spo2, severity, agent_reasoning, agent_action)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (timestamp, heart_rate, spo2, severity, reasoning, action))
    conn.commit()
    conn.close()

def get_recent_alerts(limit: int = 50):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?
    ''', (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
