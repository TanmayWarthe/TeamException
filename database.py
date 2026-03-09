"""SQLite database module for Interview Simulation System."""

import sqlite3
import json
import os
import hashlib
import secrets
from contextlib import contextmanager
from datetime import datetime, timedelta
from typing import Optional

DB_PATH = os.environ.get("DB_PATH", "interview_system.db")


@contextmanager
def get_db():
    """Context manager for database connections — auto-closes on exit."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# Keep legacy name for backward compat
def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Initialize all database tables."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Migrate existing users table if needed
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        if columns and "password_hash" not in columns:
            cursor.executescript("""
                ALTER TABLE users ADD COLUMN password_hash TEXT;
                ALTER TABLE users ADD COLUMN salt TEXT;
                ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;
                ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
            """)

        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                salt TEXT,
                is_active INTEGER DEFAULT 1,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS resumes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                raw_text TEXT,
                skills_json TEXT DEFAULT '[]',
                experience_json TEXT DEFAULT '[]',
                education_json TEXT DEFAULT '[]',
                summary TEXT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS interview_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_type TEXT NOT NULL CHECK(session_type IN ('dsa', 'hr', 'technical')),
                status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress', 'completed', 'abandoned')),
                difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy', 'medium', 'hard')),
                topic TEXT,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP,
                overall_score REAL DEFAULT 0,
                technical_score REAL DEFAULT 0,
                communication_score REAL DEFAULT 0,
                reasoning_score REAL DEFAULT 0,
                problem_solving_score REAL DEFAULT 0,
                feedback_json TEXT DEFAULT '{}',
                tab_violations INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS interview_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                question_number INTEGER NOT NULL,
                question_text TEXT NOT NULL,
                question_type TEXT DEFAULT 'coding',
                difficulty TEXT DEFAULT 'medium',
                candidate_response_text TEXT,
                candidate_code TEXT,
                voice_transcript TEXT,
                ai_analysis TEXT,
                code_correctness_score REAL DEFAULT 0,
                approach_score REAL DEFAULT 0,
                communication_score REAL DEFAULT 0,
                follow_up_questions_json TEXT DEFAULT '[]',
                suggested_solutions_json TEXT DEFAULT '[]',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
            );

            CREATE TABLE IF NOT EXISTS tab_violations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                violation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                violation_type TEXT DEFAULT 'tab_switch',
                details TEXT,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
            );

            CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('interviewer', 'candidate', 'system')),
                content TEXT NOT NULL,
                message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'code', 'audio_transcript')),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
            );

            CREATE TABLE IF NOT EXISTS interview_recordings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                event_type TEXT NOT NULL CHECK(event_type IN ('code_snapshot', 'conversation', 'audio_clip', 'analysis', 'question_start')),
                event_data TEXT NOT NULL DEFAULT '{}',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
            );

            CREATE TABLE IF NOT EXISTS user_memory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                memory_key TEXT NOT NULL,
                memory_value TEXT NOT NULL,
                category TEXT DEFAULT 'general' CHECK(category IN ('general', 'preference', 'skill', 'personal', 'interview_style')),
                source_session_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (source_session_id) REFERENCES interview_sessions(id),
                UNIQUE(user_id, memory_key)
            );

            CREATE TABLE IF NOT EXISTS proctoring_violations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id INTEGER NOT NULL,
                violation_type TEXT NOT NULL CHECK(violation_type IN ('no_face', 'multiple_faces', 'looking_away', 'other')),
                detail TEXT,
                violation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
            );

            CREATE TABLE IF NOT EXISTS auth_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                token_type TEXT DEFAULT 'session' CHECK(token_type IN ('session', 'refresh', 'api')),
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1,
                device_info TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_id INTEGER,
                action TEXT NOT NULL,
                action_type TEXT DEFAULT 'general' CHECK(action_type IN ('general', 'authentication', 'interview', 'resume', 'violation', 'system')),
                details TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
            );

            CREATE INDEX IF NOT EXISTS idx_auth_tokens_user    ON auth_tokens(user_id);
            CREATE INDEX IF NOT EXISTS idx_auth_tokens_token   ON auth_tokens(token);
            CREATE INDEX IF NOT EXISTS idx_activity_logs_user  ON activity_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_activity_logs_sess  ON activity_logs(session_id);
            CREATE INDEX IF NOT EXISTS idx_activity_logs_time  ON activity_logs(created_at);
            CREATE INDEX IF NOT EXISTS idx_sessions_user       ON interview_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_questions_session   ON interview_questions(session_id);
            CREATE INDEX IF NOT EXISTS idx_chat_session        ON chat_messages(session_id);
        """)


# ── Utility ───────────────────────────────────────────────────────────────────

def hash_password(password: str, salt: str = None) -> tuple:
    if salt is None:
        salt = secrets.token_hex(32)
    pwd_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), 100_000
    )
    return pwd_hash.hex(), salt


def verify_password(password: str, pwd_hash: str, salt: str) -> bool:
    new_hash, _ = hash_password(password, salt)
    return new_hash == pwd_hash


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def _rows(cursor) -> list:
    return [dict(r) for r in cursor.fetchall()]


def _parse_json_fields(d: dict, fields: dict) -> dict:
    """Parse JSON string fields into Python objects."""
    for field, default in fields.items():
        raw = d.get(field)
        try:
            d[field.replace("_json", "")] = json.loads(raw) if raw else default
        except (json.JSONDecodeError, TypeError):
            d[field.replace("_json", "")] = default
    return d


# ── User Operations ───────────────────────────────────────────────────────────

def create_user(name: str, email: str, password: str = None) -> int:
    pwd_hash, salt = hash_password(password) if password else (None, None)
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT OR IGNORE INTO users (name, email, password_hash, salt) VALUES (?, ?, ?, ?)",
            (name, email, pwd_hash, salt),
        )
        if cur.lastrowid == 0:
            cur.execute("SELECT id FROM users WHERE email = ?", (email,))
            return cur.fetchone()["id"]
        return cur.lastrowid


def get_user_by_email(email: str) -> Optional[dict]:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = ?", (email,))
        row = cur.fetchone()
        return dict(row) if row else None


def get_user(user_id: int) -> Optional[dict]:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        return dict(row) if row else None


# ── Authentication ────────────────────────────────────────────────────────────

def authenticate_user(email: str, password: str) -> Optional[dict]:
    user = get_user_by_email(email)
    if not user or not user.get("password_hash") or not user.get("salt"):
        return None
    if verify_password(password, user["password_hash"], user["salt"]):
        with get_db() as conn:
            conn.execute(
                "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
                (user["id"],),
            )
        return user
    return None


def create_auth_token(user_id: int, token_type: str = "session",
                      expires_in_hours: int = 24, device_info: str = None) -> str:
    token = generate_token()
    expires_at = datetime.now() + timedelta(hours=expires_in_hours)
    with get_db() as conn:
        conn.execute(
            "INSERT INTO auth_tokens (user_id, token, token_type, expires_at, device_info) VALUES (?,?,?,?,?)",
            (user_id, token, token_type, expires_at, device_info),
        )
    return token


def verify_auth_token(token: str) -> Optional[dict]:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT t.*, u.* FROM auth_tokens t
               JOIN users u ON t.user_id = u.id
               WHERE t.token = ? AND t.is_active = 1 AND t.expires_at > CURRENT_TIMESTAMP""",
            (token,),
        )
        row = cur.fetchone()
        if row:
            conn.execute(
                "UPDATE auth_tokens SET last_used = CURRENT_TIMESTAMP WHERE token = ?",
                (token,),
            )
        return dict(row) if row else None


def invalidate_auth_token(token: str):
    with get_db() as conn:
        conn.execute("UPDATE auth_tokens SET is_active = 0 WHERE token = ?", (token,))


def invalidate_user_tokens(user_id: int, token_type: str = None):
    with get_db() as conn:
        if token_type:
            conn.execute(
                "UPDATE auth_tokens SET is_active = 0 WHERE user_id = ? AND token_type = ?",
                (user_id, token_type),
            )
        else:
            conn.execute(
                "UPDATE auth_tokens SET is_active = 0 WHERE user_id = ?", (user_id,)
            )


def get_user_active_tokens(user_id: int) -> list:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """SELECT * FROM auth_tokens
               WHERE user_id = ? AND is_active = 1 AND expires_at > CURRENT_TIMESTAMP
               ORDER BY created_at DESC""",
            (user_id,),
        )
        return _rows(cur)


def update_user_password(user_id: int, new_password: str):
    pwd_hash, salt = hash_password(new_password)
    with get_db() as conn:
        conn.execute(
            "UPDATE users SET password_hash = ?, salt = ? WHERE id = ?",
            (pwd_hash, salt, user_id),
        )


# ── Activity Logs ─────────────────────────────────────────────────────────────

def log_activity(user_id: int, action: str, action_type: str = "general",
                 details: str = None, session_id: int = None,
                 ip_address: str = None, user_agent: str = None) -> int:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO activity_logs
               (user_id, session_id, action, action_type, details, ip_address, user_agent)
               VALUES (?,?,?,?,?,?,?)""",
            (user_id, session_id, action, action_type, details, ip_address, user_agent),
        )
        return cur.lastrowid


def get_user_activity_logs(user_id: int, limit: int = 100, action_type: str = None) -> list:
    with get_db() as conn:
        cur = conn.cursor()
        if action_type:
            cur.execute(
                "SELECT * FROM activity_logs WHERE user_id=? AND action_type=? ORDER BY created_at DESC LIMIT ?",
                (user_id, action_type, limit),
            )
        else:
            cur.execute(
                "SELECT * FROM activity_logs WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
                (user_id, limit),
            )
        return _rows(cur)


def get_session_activity_logs(session_id: int) -> list:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM activity_logs WHERE session_id=? ORDER BY created_at ASC",
            (session_id,),
        )
        return _rows(cur)


# ── Resume ────────────────────────────────────────────────────────────────────

def save_resume(user_id: int, filename: str, raw_text: str, skills: list,
                experience: list, education: list, summary: str) -> int:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO resumes
               (user_id, filename, raw_text, skills_json, experience_json, education_json, summary)
               VALUES (?,?,?,?,?,?,?)""",
            (user_id, filename, raw_text, json.dumps(skills), json.dumps(experience),
             json.dumps(education), summary),
        )
        return cur.lastrowid


def get_latest_resume(user_id: int) -> Optional[dict]:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM resumes WHERE user_id=? ORDER BY uploaded_at DESC LIMIT 1",
            (user_id,),
        )
        row = cur.fetchone()
    if not row:
        return None
    result = dict(row)
    result["skills"] = json.loads(result.get("skills_json") or "[]")
    result["experience"] = json.loads(result.get("experience_json") or "[]")
    result["education"] = json.loads(result.get("education_json") or "[]")
    return result


# ── Interview Sessions ────────────────────────────────────────────────────────

def create_session(user_id: int, session_type: str, difficulty: str = "medium",
                   topic: str = None) -> int:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO interview_sessions (user_id, session_type, difficulty, topic) VALUES (?,?,?,?)",
            (user_id, session_type, difficulty, topic),
        )
        return cur.lastrowid


def get_session(session_id: int) -> Optional[dict]:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM interview_sessions WHERE id=?", (session_id,))
        row = cur.fetchone()
    if not row:
        return None
    result = dict(row)
    result["feedback"] = json.loads(result.get("feedback_json") or "{}")
    return result


def update_session_scores(session_id: int, overall: float, technical: float,
                          communication: float, reasoning: float,
                          problem_solving: float, feedback: dict):
    with get_db() as conn:
        conn.execute(
            """UPDATE interview_sessions
               SET overall_score=?, technical_score=?, communication_score=?,
                   reasoning_score=?, problem_solving_score=?, feedback_json=?,
                   status='completed', ended_at=CURRENT_TIMESTAMP
               WHERE id=?""",
            (overall, technical, communication, reasoning, problem_solving,
             json.dumps(feedback), session_id),
        )


def complete_session(session_id: int):
    with get_db() as conn:
        conn.execute(
            "UPDATE interview_sessions SET status='completed', ended_at=CURRENT_TIMESTAMP WHERE id=?",
            (session_id,),
        )


def get_user_sessions(user_id: int, limit: int = 50) -> list:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM interview_sessions WHERE user_id=? ORDER BY started_at DESC LIMIT ?",
            (user_id, limit),
        )
        return _rows(cur)


def increment_tab_violations(session_id: int, violation_type: str = "tab_switch",
                             details: str = ""):
    with get_db() as conn:
        conn.execute(
            "INSERT INTO tab_violations (session_id, violation_type, details) VALUES (?,?,?)",
            (session_id, violation_type, details),
        )
        conn.execute(
            "UPDATE interview_sessions SET tab_violations = tab_violations + 1 WHERE id=?",
            (session_id,),
        )


def get_tab_violations(session_id: int) -> list:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM tab_violations WHERE session_id=? ORDER BY violation_time",
            (session_id,),
        )
        return _rows(cur)


# ── Questions ─────────────────────────────────────────────────────────────────

def save_question(session_id: int, question_number: int, question_text: str,
                  question_type: str = "coding", difficulty: str = "medium") -> int:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO interview_questions
               (session_id, question_number, question_text, question_type, difficulty)
               VALUES (?,?,?,?,?)""",
            (session_id, question_number, question_text, question_type, difficulty),
        )
        return cur.lastrowid


def update_question_response(question_id: int, candidate_response_text: str = None,
                             candidate_code: str = None, voice_transcript: str = None,
                             ai_analysis: str = None, code_correctness_score: float = 0,
                             approach_score: float = 0, communication_score: float = 0,
                             follow_up_questions: list = None, suggested_solutions: list = None):
    with get_db() as conn:
        conn.execute(
            """UPDATE interview_questions
               SET candidate_response_text=?, candidate_code=?, voice_transcript=?,
                   ai_analysis=?, code_correctness_score=?, approach_score=?,
                   communication_score=?, follow_up_questions_json=?, suggested_solutions_json=?
               WHERE id=?""",
            (candidate_response_text, candidate_code, voice_transcript, ai_analysis,
             code_correctness_score, approach_score, communication_score,
             json.dumps(follow_up_questions or []), json.dumps(suggested_solutions or []),
             question_id),
        )


def get_session_questions(session_id: int) -> list:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM interview_questions WHERE session_id=? ORDER BY question_number",
            (session_id,),
        )
        rows = _rows(cur)
    for d in rows:
        d["follow_up_questions"] = json.loads(d.get("follow_up_questions_json") or "[]")
        d["suggested_solutions"] = json.loads(d.get("suggested_solutions_json") or "[]")
    return rows


# ── Chat Messages ─────────────────────────────────────────────────────────────

def save_chat_message(session_id: int, role: str, content: str,
                      message_type: str = "text") -> int:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO chat_messages (session_id, role, content, message_type) VALUES (?,?,?,?)",
            (session_id, role, content, message_type),
        )
        return cur.lastrowid


def get_chat_messages(session_id: int) -> list:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM chat_messages WHERE session_id=? ORDER BY timestamp",
            (session_id,),
        )
        return _rows(cur)


# ── Analytics ─────────────────────────────────────────────────────────────────

def get_user_analytics(user_id: int) -> dict:
    with get_db() as conn:
        cur = conn.cursor()

        cur.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
                AVG(CASE WHEN status='completed' THEN overall_score END) as avg_overall,
                AVG(CASE WHEN status='completed' THEN technical_score END) as avg_technical,
                AVG(CASE WHEN status='completed' THEN communication_score END) as avg_communication,
                AVG(CASE WHEN status='completed' THEN reasoning_score END) as avg_reasoning,
                AVG(CASE WHEN status='completed' THEN problem_solving_score END) as avg_problem_solving,
                SUM(tab_violations) as total_violations
            FROM interview_sessions WHERE user_id=?
        """, (user_id,))
        stats = dict(cur.fetchone())

        cur.execute("""
            SELECT session_type, COUNT(*) as count,
                   AVG(CASE WHEN status='completed' THEN overall_score END) as avg_score
            FROM interview_sessions WHERE user_id=? GROUP BY session_type
        """, (user_id,))
        by_type = _rows(cur)

        cur.execute("""
            SELECT id, session_type, overall_score, technical_score, communication_score, started_at
            FROM interview_sessions
            WHERE user_id=? AND status='completed' ORDER BY started_at
        """, (user_id,))
        trend = _rows(cur)

        cur.execute("""
            SELECT difficulty, COUNT(*) as count,
                   AVG(CASE WHEN status='completed' THEN overall_score END) as avg_score
            FROM interview_sessions WHERE user_id=? GROUP BY difficulty
        """, (user_id,))
        by_difficulty = _rows(cur)

    return {"stats": stats, "by_type": by_type, "trend": trend, "by_difficulty": by_difficulty}


# ── Recording Events ──────────────────────────────────────────────────────────

def save_recording_event(session_id: int, event_type: str, event_data: dict) -> int:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO interview_recordings (session_id, event_type, event_data) VALUES (?,?,?)",
            (session_id, event_type, json.dumps(event_data)),
        )
        return cur.lastrowid


def get_recording_events(session_id: int) -> list:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM interview_recordings WHERE session_id=? ORDER BY timestamp ASC",
            (session_id,),
        )
        rows = _rows(cur)
    for d in rows:
        d["event_data"] = json.loads(d.get("event_data") or "{}")
    return rows


# ── User Memory ───────────────────────────────────────────────────────────────

def save_user_memory(user_id: int, memory_key: str, memory_value: str,
                     category: str = "general", source_session_id: int = None):
    with get_db() as conn:
        conn.execute(
            """INSERT INTO user_memory (user_id, memory_key, memory_value, category, source_session_id)
               VALUES (?,?,?,?,?)
               ON CONFLICT(user_id, memory_key)
               DO UPDATE SET memory_value=excluded.memory_value,
                             updated_at=CURRENT_TIMESTAMP,
                             source_session_id=excluded.source_session_id""",
            (user_id, memory_key, memory_value, category, source_session_id),
        )


def get_user_memories(user_id: int, category: str = None) -> list:
    with get_db() as conn:
        cur = conn.cursor()
        if category:
            cur.execute(
                "SELECT * FROM user_memory WHERE user_id=? AND category=? ORDER BY updated_at DESC",
                (user_id, category),
            )
        else:
            cur.execute(
                "SELECT * FROM user_memory WHERE user_id=? ORDER BY updated_at DESC",
                (user_id,),
            )
        return _rows(cur)


def delete_user_memory(user_id: int, memory_key: str):
    with get_db() as conn:
        conn.execute(
            "DELETE FROM user_memory WHERE user_id=? AND memory_key=?",
            (user_id, memory_key),
        )


def get_user_memory_summary(user_id: int) -> str:
    memories = get_user_memories(user_id)
    if not memories:
        return ""
    return "\n".join(f"- {m['memory_key']}: {m['memory_value']}" for m in memories)


# ── Proctoring ────────────────────────────────────────────────────────────────

def save_proctoring_violation(session_id: int, violation_type: str, detail: str = "") -> int:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO proctoring_violations (session_id, violation_type, detail) VALUES (?,?,?)",
            (session_id, violation_type, detail),
        )
        return cur.lastrowid


def get_proctoring_violations(session_id: int) -> list:
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM proctoring_violations WHERE session_id=? ORDER BY violation_time",
            (session_id,),
        )
        return _rows(cur)


# Auto-init on import
init_db()