"""Interview Session History and Feedback Reports page."""

import streamlit as st
import json
import plotly.graph_objects as go
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
import database as db
import auth_utils as auth
from user_memory import get_memory_context_for_ai

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

st.set_page_config(page_title="IntervueX - Session History", page_icon="📜", layout="wide")

# Require authentication
auth.require_auth()

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from ui_utils import apply_global_css
apply_global_css()

st.markdown("""
<style>
    /* History page cards -- uses tokens from ui_utils.py */
    .report-card {
        background: var(--card-bg) !important;
        border-radius: 16px;
        padding: 24px;
        margin: 15px 0;
        border: 1px solid var(--card-border);
    }
    .score-circle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        font-size: 1.5rem;
        font-weight: 700;
        color: white;
    }
    .trend-up { color: #34D399; }
    .trend-down { color: #EF4444; }
    .trend-flat { color: #9CA3AF; }
    .aggregate-card {
        background: var(--card-bg) !important;
        border-radius: 16px;
        padding: 20px;
        border: 1px solid var(--card-border);
        text-align: center;
    }
</style>
""", unsafe_allow_html=True)

if not st.session_state.get("user_id"):
    st.warning("Please sign in from the home page to view your history.")
    st.stop()

user_id = st.session_state.user_id

st.markdown("## 📜 Interview History & Feedback Reports")

# ── Refresh Controls ──────────────────────────────────────────────────────────
col_title, col_refresh = st.columns([4, 1])
with col_refresh:
    if st.button("🔄 Refresh Data", use_container_width=True,
                 help="Fetch latest scores from the database"):
        # Clear any cached data and force fresh fetch
        st.session_state.pop("_history_selected_idx", None)
        st.rerun()

st.markdown("---")

# ── Fix completed sessions that have 0 scores (fallback recalculation) ────────
try:
    fixed_count = db.fix_zero_scores_for_completed_sessions(user_id)
    if fixed_count > 0:
        st.toast(f"Recalculated scores for {fixed_count} session(s) from question data.")
except Exception:
    pass  # Function may not exist in older database.py versions

# ── Fetch fresh session data ──────────────────────────────────────────────────
sessions = db.get_user_sessions(user_id)

if not sessions:
    st.info("No interview sessions yet. Start an interview to see your history here!")
    st.stop()

# ── Helper: safely format a score ─────────────────────────────────────────────
def _safe_score(val, default=0.0):
    """Ensure a score value is a proper float."""
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

# ── Aggregate Overview ────────────────────────────────────────────────────────
completed_sessions = [s for s in sessions if s["status"] == "completed"]
in_progress_sessions = [s for s in sessions if s["status"] == "in_progress"]

st.markdown("### 📊 Performance Overview")

if completed_sessions:
    avg_overall = sum(_safe_score(s["overall_score"]) for s in completed_sessions) / len(completed_sessions)
    avg_technical = sum(_safe_score(s["technical_score"]) for s in completed_sessions) / len(completed_sessions)
    avg_comm = sum(_safe_score(s["communication_score"]) for s in completed_sessions) / len(completed_sessions)
    avg_reasoning = sum(_safe_score(s["reasoning_score"]) for s in completed_sessions) / len(completed_sessions)
    avg_ps = sum(_safe_score(s["problem_solving_score"]) for s in completed_sessions) / len(completed_sessions)
    best_overall = max(_safe_score(s["overall_score"]) for s in completed_sessions)

    col1, col2, col3, col4, col5, col6 = st.columns(6)
    with col1:
        st.metric("Total Sessions", len(sessions))
    with col2:
        st.metric("Completed", len(completed_sessions))
    with col3:
        st.metric("Avg Overall", f"{avg_overall:.0f}/100")
    with col4:
        st.metric("Avg Technical", f"{avg_technical:.0f}/100")
    with col5:
        st.metric("Avg Communication", f"{avg_comm:.0f}/100")
    with col6:
        st.metric("Best Score", f"{best_overall:.0f}/100")

    # ── Score Trend Chart ─────────────────────────────────────────────────────
    if len(completed_sessions) >= 2:
        # Sort by date ascending for trend
        sorted_completed = sorted(completed_sessions, key=lambda s: s["started_at"])

        fig_trend = go.Figure()
        dates = [s["started_at"][:16] for s in sorted_completed]
        fig_trend.add_trace(go.Scatter(
            x=dates,
            y=[_safe_score(s["overall_score"]) for s in sorted_completed],
            mode="lines+markers",
            name="Overall",
            line=dict(color="#818CF8", width=3),
            marker=dict(size=8),
        ))
        fig_trend.add_trace(go.Scatter(
            x=dates,
            y=[_safe_score(s["technical_score"]) for s in sorted_completed],
            mode="lines+markers",
            name="Technical",
            line=dict(color="#34D399", width=2),
            marker=dict(size=6),
        ))
        fig_trend.add_trace(go.Scatter(
            x=dates,
            y=[_safe_score(s["communication_score"]) for s in sorted_completed],
            mode="lines+markers",
            name="Communication",
            line=dict(color="#FBBF24", width=2),
            marker=dict(size=6),
        ))
        fig_trend.update_layout(
            title="Score Trend Across Sessions",
            xaxis_title="Session Date",
            yaxis_title="Score",
            yaxis=dict(range=[0, 105]),
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            height=350,
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        )
        st.plotly_chart(fig_trend, use_container_width=True)

else:
    st.info("Complete at least one interview to see your performance overview.")

if in_progress_sessions:
    st.warning(f"You have {len(in_progress_sessions)} interview(s) still in progress. "
               "Scores will appear once the interview is completed.")

st.markdown("---")

# ── Session Selector ──────────────────────────────────────────────────────────
# Check if we should show a specific session
view_session_id = st.session_state.get("view_session_id")

session_options = {}
for s in sessions:
    icon = "💻" if s["session_type"] == "dsa" else "🤝" if s["session_type"] == "hr" else "⚙️"
    score = _safe_score(s["overall_score"])
    if s["status"] == "completed":
        status = "✅"
        score_text = f"Score: {score:.0f}"
    elif s["status"] == "in_progress":
        status = "🟡"
        score_text = "In Progress"
    else:
        status = "⚪"
        score_text = "Abandoned"
    label = f"{icon} {s['session_type'].upper()} - {s['started_at'][:16]} {status} ({score_text})"
    session_options[label] = s["id"]

# Find default selection -- use view_session_id only once, then clear it
default_idx = 0
if view_session_id:
    for i, (label, sid) in enumerate(session_options.items()):
        if sid == view_session_id:
            default_idx = i
            break
    # Clear so future reruns (e.g. delete memory) don't force-reset selection
    st.session_state.pop("view_session_id", None)

# Restore previously selected session across reruns
if "_history_selected_idx" not in st.session_state:
    st.session_state["_history_selected_idx"] = default_idx

if view_session_id:  # honour incoming navigation request this run
    st.session_state["_history_selected_idx"] = default_idx

selected_label = st.selectbox(
    "Select a session to view:",
    options=list(session_options.keys()),
    index=st.session_state["_history_selected_idx"],
    key="history_session_selector",
)
# Keep index in sync so reruns don't reset the choice
st.session_state["_history_selected_idx"] = list(session_options.keys()).index(selected_label)
selected_session_id = session_options[selected_label]

# ── Load session data (always fresh from DB) ─────────────────────────────────
# Use the safe version if available, fallback to standard
try:
    session = db.get_session_with_safe_scores(selected_session_id)
except AttributeError:
    session = db.get_session(selected_session_id)

questions = db.get_session_questions(selected_session_id)
chat_messages = db.get_chat_messages(selected_session_id)
violations = db.get_tab_violations(selected_session_id)

if not session:
    st.error("Session not found.")
    st.stop()

# Ensure scores are safe floats
for key in ("overall_score", "technical_score", "communication_score",
             "reasoning_score", "problem_solving_score"):
    session[key] = _safe_score(session.get(key))

# Parse feedback if needed
feedback = session.get("feedback")
if feedback is None:
    try:
        feedback = json.loads(session.get("feedback_json", "{}") or "{}")
    except (json.JSONDecodeError, TypeError):
        feedback = {}

# ── If completed session has 0 overall score, try to recalculate live ─────────
if session["status"] == "completed" and session["overall_score"] == 0 and questions:
    try:
        recalc = db.recalculate_session_scores_from_questions(selected_session_id)
        if recalc and recalc["overall_score"] > 0:
            for key, val in recalc.items():
                session[key] = val
            # Persist the recalculated scores
            db.update_session_scores(
                session_id=selected_session_id,
                overall=recalc["overall_score"],
                technical=recalc["technical_score"],
                communication=recalc["communication_score"],
                reasoning=recalc["reasoning_score"],
                problem_solving=recalc["problem_solving_score"],
                feedback=feedback,
            )
            st.toast("Scores recalculated from question-level data.")
    except Exception:
        pass

# ── Session Overview ──────────────────────────────────────────────────────────
st.markdown("### 📋 Session Overview")

if session["status"] == "in_progress":
    st.warning("This session is still in progress. Scores will be finalized when the interview is completed.")

col1, col2, col3, col4, col5 = st.columns(5)
score_items = [
    ("overall_score", "Overall"),
    ("technical_score", "Technical"),
    ("communication_score", "Communication"),
    ("reasoning_score", "Reasoning"),
    ("problem_solving_score", "Problem Solving"),
]

for col, (key, label) in zip([col1, col2, col3, col4, col5], score_items):
    with col:
        score = _safe_score(session[key])
        if session["status"] == "in_progress":
            color = "#6B7280"  # gray for in-progress
        else:
            color = "#34D399" if score >= 70 else "#FBBF24" if score >= 50 else "#EF4444"
        st.markdown(f"""
        <div style="text-align:center;">
            <div class="score-circle" style="background:{color};margin:auto;">{score:.0f}</div>
            <p style="color:#9CA3AF;margin-top:8px;">{label}</p>
        </div>
        """, unsafe_allow_html=True)

# Session details
st.markdown("---")
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.markdown(f"**Type:** {session['session_type'].upper()}")
with col2:
    st.markdown(f"**Difficulty:** {session.get('difficulty', 'N/A').title()}")
with col3:
    status_text = "Completed ✅" if session["status"] == "completed" else "In Progress 🟡" if session["status"] == "in_progress" else "Abandoned ⚪"
    st.markdown(f"**Status:** {status_text}")
with col4:
    v_count = session.get("tab_violations", 0) or 0
    v_color = "#EF4444" if v_count > 0 else "#34D399"
    st.markdown(f"**Tab Violations:** <span style='color:{v_color};font-weight:700;'>{v_count}</span>", unsafe_allow_html=True)

# Radar chart for this session
st.markdown("---")
st.markdown("### 🕸️ Performance Radar")

fig_radar = go.Figure()
categories = ["Technical", "Communication", "Reasoning", "Problem Solving", "Overall"]
values = [
    _safe_score(session["technical_score"]),
    _safe_score(session["communication_score"]),
    _safe_score(session["reasoning_score"]),
    _safe_score(session["problem_solving_score"]),
    _safe_score(session["overall_score"]),
]
fig_radar.add_trace(go.Scatterpolar(
    r=values + [values[0]],
    theta=categories + [categories[0]],
    fill="toself",
    line=dict(color="#818CF8", width=2),
    fillcolor="rgba(129, 140, 248, 0.2)",
))
fig_radar.update_layout(
    polar=dict(radialaxis=dict(visible=True, range=[0, 100]), bgcolor="rgba(0,0,0,0)"),
    paper_bgcolor="rgba(0,0,0,0)",
    height=400,
)
st.plotly_chart(fig_radar, use_container_width=True)

# Executive Summary
if feedback:
    st.markdown("---")
    st.markdown("### 📝 Detailed Feedback Report")

    exec_summary = feedback.get("executive_summary", "")
    if exec_summary:
        st.info(f"**Executive Summary:** {exec_summary}")

    readiness = feedback.get("interview_readiness", "")
    if readiness:
        readiness_colors = {
            "ready": "#34D399",
            "almost_ready": "#FBBF24",
            "needs_preparation": "#EF4444",
        }
        r_color = readiness_colors.get(readiness, "#9CA3AF")
        st.markdown(f"**Interview Readiness:** <span style='color:{r_color};font-weight:700;font-size:1.2rem;'>{readiness.replace('_', ' ').title()}</span>", unsafe_allow_html=True)

    detailed = feedback.get("detailed_feedback", {})
    if detailed:
        col1, col2 = st.columns(2)
        with col1:
            if detailed.get("technical_skills"):
                st.markdown("**🔧 Technical Skills**")
                st.markdown(detailed["technical_skills"])

            if detailed.get("problem_solving"):
                st.markdown("**🧩 Problem Solving**")
                st.markdown(detailed["problem_solving"])

        with col2:
            if detailed.get("communication"):
                st.markdown("**💬 Communication**")
                st.markdown(detailed["communication"])

        st.markdown("---")
        col1, col2, col3 = st.columns(3)
        with col1:
            st.markdown("**✅ Areas of Strength**")
            for s in detailed.get("areas_of_strength", []):
                st.markdown(f"- {s}")
        with col2:
            st.markdown("**📈 Areas for Improvement**")
            for i in detailed.get("areas_for_improvement", []):
                st.markdown(f"- {i}")
        with col3:
            st.markdown("**📚 Recommended Topics to Study**")
            for t in detailed.get("recommended_topics_to_study", []):
                st.markdown(f"- {t}")

    recommendation = feedback.get("recommendation", "")
    if recommendation:
        st.markdown("---")
        st.markdown(f"**🎯 Recommendation:** {recommendation}")

    integrity = feedback.get("integrity_note", "")
    if integrity:
        st.markdown(f"**🔒 Integrity Note:** {integrity}")

# Questions breakdown
if questions:
    st.markdown("---")
    st.markdown("### 📝 Question-by-Question Breakdown")

    for q in questions:
        q_text = q.get("question_text", "Question")
        display_text = q_text[:100] + "..." if len(q_text) > 100 else q_text
        with st.expander(f"Q{q['question_number']}: {display_text}"):
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Code Score", f"{_safe_score(q['code_correctness_score']):.0f}/100")
            with col2:
                st.metric("Approach Score", f"{_safe_score(q['approach_score']):.0f}/100")
            with col3:
                st.metric("Communication", f"{_safe_score(q['communication_score']):.0f}/100")

            if q.get("candidate_code"):
                st.markdown("**Your Code:**")
                st.code(q["candidate_code"], language="python")

            if q.get("candidate_response_text"):
                st.markdown(f"**Your Explanation:** {q['candidate_response_text']}")

            if q.get("voice_transcript"):
                st.markdown(f"**Voice Transcript:** {q['voice_transcript']}")

            if q.get("ai_analysis"):
                try:
                    analysis = json.loads(q["ai_analysis"]) if isinstance(q["ai_analysis"], str) else q["ai_analysis"]
                    st.markdown(f"**AI Feedback:** {analysis.get('overall_feedback', '')}")

                    # Follow-ups
                    follow_ups = q.get("follow_up_questions", [])
                    if follow_ups:
                        st.markdown("**Follow-up Questions:**")
                        for fu in follow_ups:
                            st.markdown(f"- {fu}")

                    # Solutions
                    solutions = q.get("suggested_solutions", [])
                    if solutions:
                        st.markdown("**Suggested Solutions:**")
                        for sol in solutions:
                            if isinstance(sol, dict):
                                st.markdown(f"**{sol.get('approach', '')}:** {sol.get('description', '')}")
                                if sol.get("code"):
                                    st.code(sol["code"], language="python")
                except (json.JSONDecodeError, TypeError):
                    pass

# Chat log
if chat_messages:
    st.markdown("---")
    st.markdown("### 💬 Full Conversation Log")
    with st.expander("View full conversation"):
        for msg in chat_messages:
            role_icon = "🤖" if msg["role"] == "interviewer" else "👤" if msg["role"] == "candidate" else "ℹ️"
            role_label = msg["role"].title()
            st.markdown(f"**{role_icon} {role_label}** ({msg['timestamp'][:19]})")
            st.markdown(msg["content"])
            st.markdown("---")

# Tab violations
if violations:
    st.markdown("---")
    st.markdown("### ⚠️ Tab Violation Log")
    for v in violations:
        st.warning(f"**{v['violation_type']}** at {v['violation_time']}: {v.get('details', 'Tab switch detected')}")

# Webcam Proctoring Violations
proctor_violations = db.get_proctoring_violations(selected_session_id)
if proctor_violations:
    st.markdown("---")
    st.markdown("### 📹 Webcam Proctoring Violations")
    violation_type_icons = {
        "no_face": "👻",
        "multiple_faces": "👥",
        "looking_away": "👀",
        "other": "⚠️",
    }
    for pv in proctor_violations:
        icon = violation_type_icons.get(pv["violation_type"], "⚠️")
        label = pv["violation_type"].replace("_", " ").title()
        st.warning(f"{icon} **{label}** at {pv['violation_time'][:19]} -- {pv.get('detail', '')}")

# Interview Recording Playback
recording_events = db.get_recording_events(selected_session_id)
if recording_events:
    st.markdown("---")
    st.markdown("### 🎬 Interview Recording Playback")
    st.markdown("Replay the interview timeline: conversations, code snapshots, and AI analysis.")

    # Group events into a timeline
    with st.expander("▶️ Play Interview Timeline", expanded=False):
        for idx, event in enumerate(recording_events):
            data = event["event_data"]
            etype = event["event_type"]
            ts = event["timestamp"][:19] if event.get("timestamp") else ""

            if etype == "conversation":
                role = data.get("role", "unknown")
                content = data.get("content", "")
                if role == "interviewer":
                    st.markdown(f"""
                    <div style="background:var(--primary-light);border-left:4px solid var(--secondary);padding:12px;border-radius:8px;margin:8px 0;">
                        <small style="color:var(--text-muted);">{ts}</small><br>
                        <strong>🤖 Interviewer:</strong> {content[:500]}
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    st.markdown(f"""
                    <div style="background:#F0FDF4;border-left:4px solid var(--accent-green-light);padding:12px;border-radius:8px;margin:8px 0;">
                        <small style="color:var(--text-muted);">{ts}</small><br>
                        <strong>👤 Candidate:</strong> {content[:500]}
                    </div>
                    """, unsafe_allow_html=True)

            elif etype == "code_snapshot":
                code_text = data.get("code", "")
                q_num = data.get("question_number", "?")
                explanation = data.get("explanation", "")
                st.markdown(f"""
                <div style="background:#FFF7ED;border-left:4px solid var(--accent-yellow);padding:12px;border-radius:8px;margin:8px 0;">
                    <small style="color:var(--text-muted);">{ts}</small><br>
                    <strong>💻 Code Snapshot (Q{q_num})</strong>
                </div>
                """, unsafe_allow_html=True)
                if code_text:
                    st.code(code_text, language="python")
                if explanation:
                    st.markdown(f"*Explanation:* {explanation[:300]}")

            elif etype == "analysis":
                analysis = data.get("analysis", {})
                q_num = data.get("question_number", "?")
                if isinstance(analysis, dict):
                    score = analysis.get("overall_score", analysis.get("relevance_score", "N/A"))
                    fb = analysis.get("overall_feedback", analysis.get("feedback", ""))
                    st.markdown(f"""
                    <div style="background:#FDF2F8;border-left:4px solid var(--accent-pink);padding:12px;border-radius:8px;margin:8px 0;">
                        <small style="color:var(--text-muted);">{ts}</small><br>
                        <strong>📊 AI Analysis (Q{q_num})</strong> -- Score: {score}<br>
                        {fb[:300]}
                    </div>
                    """, unsafe_allow_html=True)

    st.info(f"📝 Total recording events: {len(recording_events)}")

# User Memory Section
st.markdown("---")
st.markdown("### 🧠 AI Memory (What the AI Remembers About You)")
st.markdown("The AI interviewer remembers facts you share across sessions to personalize your experience.")

user_memories = db.get_user_memories(user_id)
if user_memories:
    category_icons = {
        "personal": "👤",
        "skill": "💻",
        "preference": "⭐",
        "interview_style": "🎯",
        "general": "📝",
    }

    # Group by category
    mem_by_cat = {}
    for m in user_memories:
        cat = m.get("category", "general")
        if cat not in mem_by_cat:
            mem_by_cat[cat] = []
        mem_by_cat[cat].append(m)

    for cat, items in mem_by_cat.items():
        icon = category_icons.get(cat, "📝")
        st.markdown(f"**{icon} {cat.replace('_', ' ').title()}**")
        for item in items:
            col1, col2, col3 = st.columns([2, 3, 1])
            with col1:
                st.markdown(f"`{item['memory_key']}`")
            with col2:
                st.markdown(item["memory_value"])
            with col3:
                if st.button("🗑️", key=f"del_mem_{item['id']}",
                             help="Delete this memory"):
                    db.delete_user_memory(user_id, item["memory_key"])
                    st.rerun()
else:
    st.info("No memories yet. The AI will start remembering facts you share during interviews.")
