import streamlit as st

def apply_global_css():
    st.markdown("""
<style>
    /* ============================================================
       IntervueX – Unified Design Token System
       All colors live here as CSS custom properties.
       Pages reference var(--token) — never raw hex values.
    ============================================================ */
    :root {
        /* Brand */
        --primary:            #4F46E5;
        --primary-hover:      #4338CA;
        --primary-light:      #EEF2FF;
        --secondary:          #818CF8;
        --purple:             #7C3AED;

        /* Accents */
        --accent-pink:        #EC4899;
        --accent-green:       #10B981;
        --accent-green-light: #34D399;
        --accent-yellow:      #FBBF24;

        /* Status */
        --danger:             #EF4444;

        /* Neutral */
        --text-muted:         #9CA3AF;
        --card-bg:            #ffffff;
        --card-border:        rgba(128, 128, 128, 0.15);

        /* Gradients */
        --brand-gradient: linear-gradient(135deg, var(--primary), var(--purple), var(--accent-pink));
    }

    /* ── Typography ── */
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

    html, body, [class*="css"] {
        font-family: 'Outfit', sans-serif !important;
    }

    /* ── Layout ── */
    .block-container {
        max-width: 100% !important;
        padding-left: 3rem !important;
        padding-right: 3rem !important;
    }

    /* ── Sidebar ── */
    [data-testid="stSidebar"] {
        border-right: 1px solid rgba(128, 128, 128, 0.1);
    }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar            { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track      { background: transparent; }
    ::-webkit-scrollbar-thumb      { background: rgba(128, 128, 128, 0.25); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover{ background: rgba(128, 128, 128, 0.4); }

    /* ── Buttons ── */
    .stButton > button {
        background-color: var(--primary) !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 12px !important;
        font-weight: 600 !important;
        padding: 0.6rem 1.5rem !important;
        transition: all 0.2s ease !important;
        letter-spacing: 0.5px !important;
    }
    .stButton > button:hover {
        background-color: var(--primary-hover) !important;
        transform: scale(1.02);
    }

    /* ── File Uploader ── */
    [data-testid="stFileUploader"] section {
        border: 2px dashed var(--primary) !important;
        background-color: var(--primary-light) !important;
        border-radius: 12px;
    }
    [data-testid="stFileUploader"] button {
        background-color: var(--primary) !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
    }
    [data-testid="stFileUploader"] button:hover {
        background-color: var(--primary-hover) !important;
    }
    [data-testid="stFileUploaderDropzone"] svg,
    .st-emotion-cache-1gulkj5,
    .st-emotion-cache-1wmy9hl,
    .st-emotion-cache-5z2nqc,
    .st-emotion-cache-13m7zcc svg {
        color: var(--primary) !important;
        fill: var(--primary) !important;
    }

    /* ── Fixed Logo (top-left) ── */
    .fixed-logo {
        position: fixed;
        top: 20px;
        left: 65px;
        font-size: 1.5rem;
        font-weight: 800;
        background: var(--brand-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        z-index: 999999;
        pointer-events: none;
    }

    /* ── Sidebar Toggle Button ── */
    [data-testid="collapsedControl"] {
        top: 50vh !important;
        transform: translateY(-50%) !important;
        background-color: var(--primary) !important;
        color: white !important;
        border-radius: 0 8px 8px 0 !important;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
        z-index: 999999 !important;
    }
    [title="Collapse sidebar"] {
        position: fixed !important;
        top: 50vh !important;
        transform: translateY(-50%) !important;
        background-color: var(--primary) !important;
        color: white !important;
        border-radius: 8px 0 0 8px !important;
        z-index: 999999 !important;
        right: 0 !important;
    }
</style>
<div class="fixed-logo">IntervueX</div>
    """, unsafe_allow_html=True)
