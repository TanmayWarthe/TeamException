"""Performance Analytics Dashboard."""

import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import database as db
import auth_utils as auth
from ui_utils import apply_global_css

st.set_page_config(page_title="IntervueX – Dashboard", page_icon="📊", layout="wide")
auth.require_auth()
apply_global_css()

# ── Page-level styles ─────────────────────────────────────────────────────────
st.markdown("""
<style>
.metric-card {
    background: #fff;
    border-radius: 16px;
    padding: 22px 16px;
    text-align: center;
    border: 1px solid #E2E8F0;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    transition: transform .2s ease, box-shadow .2s ease;
    min-height: 130px;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    gap: 6px;
}
.metric-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(79,70,229,.1); }
.metric-value { font-family:'Syne',sans-serif; font-size:2rem; font-weight:800; color:#4F46E5; line-height:1; }
.metric-label { font-size:.72rem; color:#94A3B8; font-weight:600; text-transform:uppercase; letter-spacing:.07em; }
.section-title { font-family:'Syne',sans-serif; font-size:1.15rem; font-weight:700; color:#0F172A; margin:1.5rem 0 .75rem; }
</style>
""", unsafe_allow_html=True)

# ── Data ──────────────────────────────────────────────────────────────────────
user_id = st.session_state.user_id
analytics = db.get_user_analytics(user_id)
stats = analytics["stats"]

total            = int(stats.get("total", 0) or 0)
completed        = int(stats.get("completed", 0) or 0)
avg_overall      = float(stats.get("avg_overall", 0) or 0)
avg_tech         = float(stats.get("avg_technical", 0) or 0)
avg_comm         = float(stats.get("avg_communication", 0) or 0)
avg_reasoning    = float(stats.get("avg_reasoning", 0) or 0)
avg_ps           = float(stats.get("avg_problem_solving", 0) or 0)
total_violations = int(stats.get("total_violations", 0) or 0)

# ── Header ────────────────────────────────────────────────────────────────────
st.markdown('<p class="main-header" style="font-size:2rem">📊 Analytics Dashboard</p>', unsafe_allow_html=True)
st.markdown('<p class="sub-header">Track your interview performance trends and skill progression.</p>', unsafe_allow_html=True)

# ── KPI cards ─────────────────────────────────────────────────────────────────
METRICS = [
    (total,            "Total Sessions"),
    (completed,        "Completed"),
    (f"{avg_overall:.0f}", "Avg Overall"),
    (f"{avg_tech:.0f}",    "Avg Technical"),
    (f"{avg_comm:.0f}",    "Avg Communication"),
    (total_violations, "Tab Violations"),
]
cols = st.columns(6)
for col, (val, label) in zip(cols, METRICS):
    with col:
        st.markdown(
            f'<div class="metric-card">'
            f'<div class="metric-value">{val}</div>'
            f'<div class="metric-label">{label}</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

st.markdown("---")

if not analytics["trend"]:
    st.info("✨ Complete some interview sessions to see your performance analytics here!")
    st.stop()

# ── Shared Plotly layout helper ───────────────────────────────────────────────
PLOT_BASE = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="DM Sans, sans-serif", color="#475569"),
    margin=dict(t=30, b=30, l=20, r=20),
)
TYPE_COLORS = {"dsa": "#818CF8", "hr": "#F472B6", "technical": "#34D399"}
DIFF_COLORS = {"easy": "#34D399", "medium": "#FBBF24", "hard": "#EF4444"}

# ── Score trend ───────────────────────────────────────────────────────────────
st.markdown('<p class="section-title">📈 Score Trend Over Time</p>', unsafe_allow_html=True)
df_trend = pd.DataFrame(analytics["trend"])
fig_trend = go.Figure()
for col_name, color, width, size in [
    ("overall_score",       "#818CF8", 3, 8),
    ("technical_score",     "#34D399", 2, 6),
    ("communication_score", "#F472B6", 2, 6),
]:
    fig_trend.add_trace(go.Scatter(
        x=list(range(1, len(df_trend) + 1)),
        y=df_trend[col_name],
        mode="lines+markers",
        name=col_name.replace("_score", "").title(),
        line=dict(color=color, width=width),
        marker=dict(size=size, color=color),
    ))
fig_trend.update_layout(
    **PLOT_BASE,
    height=380,
    xaxis_title="Session #",
    yaxis=dict(range=[0, 100], title="Score", gridcolor="#F1F5F9"),
    xaxis=dict(gridcolor="#F1F5F9"),
    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
)
st.plotly_chart(fig_trend, use_container_width=True)

# ── Two-column charts ─────────────────────────────────────────────────────────
c1, c2 = st.columns(2)
by_type = analytics.get("by_type", [])

with c1:
    st.markdown('<p class="section-title">📊 Sessions by Type</p>', unsafe_allow_html=True)
    if by_type:
        df_t = pd.DataFrame(by_type)
        fig = px.bar(df_t, x="session_type", y="count", color="session_type",
                     color_discrete_map=TYPE_COLORS)
        fig.update_layout(**PLOT_BASE, height=320, showlegend=False,
                          yaxis=dict(gridcolor="#F1F5F9"),
                          xaxis=dict(gridcolor="#F1F5F9"))
        fig.update_traces(marker_line_width=0)
        st.plotly_chart(fig, use_container_width=True)

with c2:
    st.markdown('<p class="section-title">🎯 Avg Score by Type</p>', unsafe_allow_html=True)
    if by_type:
        df_ts = pd.DataFrame(by_type)
        fig = px.bar(df_ts, x="session_type", y="avg_score", color="session_type",
                     color_discrete_map=TYPE_COLORS)
        fig.update_layout(**PLOT_BASE, height=320, showlegend=False,
                          yaxis=dict(range=[0, 100], gridcolor="#F1F5F9"),
                          xaxis=dict(gridcolor="#F1F5F9"))
        fig.update_traces(marker_line_width=0)
        st.plotly_chart(fig, use_container_width=True)

# ── Difficulty breakdown ──────────────────────────────────────────────────────
st.markdown('<p class="section-title">🏋️ Performance by Difficulty</p>', unsafe_allow_html=True)
by_diff = analytics.get("by_difficulty", [])
if by_diff:
    df_diff = pd.DataFrame(by_diff)
    fig = px.bar(df_diff, x="difficulty", y="avg_score", color="difficulty",
                 color_discrete_map=DIFF_COLORS, text="count")
    fig.update_layout(**PLOT_BASE, height=320,
                      yaxis=dict(range=[0, 100], gridcolor="#F1F5F9"),
                      xaxis=dict(gridcolor="#F1F5F9"))
    fig.update_traces(texttemplate="%{text} sessions", textposition="outside",
                      marker_line_width=0)
    st.plotly_chart(fig, use_container_width=True)

# ── Radar ─────────────────────────────────────────────────────────────────────
st.markdown('<p class="section-title">🕸️ Skills Radar</p>', unsafe_allow_html=True)
radar_cats   = ["Technical", "Communication", "Reasoning", "Problem Solving", "Overall"]
radar_values = [avg_tech, avg_comm, avg_reasoning, avg_ps, avg_overall]

fig_radar = go.Figure()
fig_radar.add_trace(go.Scatterpolar(
    r=radar_values + [radar_values[0]],
    theta=radar_cats + [radar_cats[0]],
    fill="toself",
    line=dict(color="#818CF8", width=2),
    fillcolor="rgba(129,140,248,0.15)",
))
fig_radar.update_layout(
    **PLOT_BASE,
    height=420,
    polar=dict(
        bgcolor="rgba(0,0,0,0)",
        radialaxis=dict(visible=True, range=[0, 100], gridcolor="#E2E8F0", tickfont=dict(size=10)),
        angularaxis=dict(gridcolor="#E2E8F0"),
    ),
)
st.plotly_chart(fig_radar, use_container_width=True)