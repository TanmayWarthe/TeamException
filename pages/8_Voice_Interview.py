"""Voice Interview — IntervueX. Full-screen split layout."""

import os, sys, socket, threading
from pathlib import Path
import streamlit as st
import streamlit.components.v1 as components
from dotenv import load_dotenv

st.set_page_config(
    page_title="Voice Interview – IntervueX",
    page_icon="🎙️",
    layout="wide",
)
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ui_utils import apply_global_css
import auth_utils as auth

auth.require_auth()
apply_global_css()

# Hide ALL Streamlit chrome so the iframe fills the page
st.markdown("""
<style>
  #MainMenu, header, footer, [data-testid="stToolbar"],
  [data-testid="stDecoration"], [data-testid="stStatusWidget"] { display: none !important; }
  .block-container { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
  section[data-testid="stMain"] > div { padding: 0 !important; }
  iframe { display: block; border: none; }
</style>
""", unsafe_allow_html=True)

_raw = os.getenv("VAPI_PUBLIC_KEY", "") or ""
VAPI_PUBLIC_KEY = _raw.strip().strip('"').strip("'")
VAPI_PORT = 8503

WIDGET_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*  { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; font-family: 'Inter', sans-serif; background: #F9FAFB; overflow: hidden; }

/* ── Root layout ── */
.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* ════════════════════════════
   LEFT PANEL
════════════════════════════ */
.left {
  width: 280px;
  flex-shrink: 0;
  background: #FFFFFF;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 20px;
  gap: 16px;
  overflow-y: auto;
}

.avatar {
  width: 84px; height: 84px;
  border-radius: 50%;
  background: #111827;
  display: flex; align-items: center; justify-content: center;
  font-size: 38px;
  flex-shrink: 0;
  transition: box-shadow 0.2s;
}
.avatar.active {
  box-shadow: 0 0 0 3px #FFFFFF, 0 0 0 5px #111827;
}

.agent-name { font-size: 0.938rem; font-weight: 700; color: #111827; text-align: center; }
.agent-role { font-size: 0.72rem; color: #9CA3AF; text-align: center; margin-top: 2px; }

.pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  background: #F9FAFB;
  font-size: 0.72rem; font-weight: 500; color: #374151;
}
.pill .dot { width: 6px; height: 6px; border-radius: 50%; background: #D1D5DB; flex-shrink: 0; }
.pill.live .dot { background: #111827; }
.pill.live { border-color: #111827; color: #111827; }

.sep { width: 100%; border: none; border-top: 1px solid #E5E7EB; flex-shrink: 0; }

.btn-col { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.btn {
  width: 100%; padding: 9px 0;
  border-radius: 6px; border: none;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem; font-weight: 500;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.btn:disabled { opacity: 0.38; cursor: not-allowed; }
.btn-start { background: #111827; color: #FFF; }
.btn-end   { background: #FFF; color: #374151; border: 1px solid #D1D5DB; }

.tips-block { width: 100%; }
.tips-title {
  font-size: 0.625rem; font-weight: 600; color: #9CA3AF;
  text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px;
}
.tip-item { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 8px; }
.tip-icon { font-size: 0.813rem; flex-shrink: 0; margin-top: 1px; }
.tip-text  { font-size: 0.72rem; color: #6B7280; line-height: 1.5; }

/* ════════════════════════════
   RIGHT PANEL
════════════════════════════ */
.right {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  overflow: hidden;
  min-width: 0;
}

.t-bar {
  padding: 12px 20px;
  border-bottom: 1px solid #E5E7EB;
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
}
.t-bar-label {
  font-size: 0.688rem; font-weight: 600; color: #9CA3AF;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.t-live {
  font-size: 0.625rem; font-weight: 600;
  display: flex; align-items: center; gap: 5px;
  color: #9CA3AF;
}
.t-live .dot { width: 5px; height: 5px; border-radius: 50%; background: #D1D5DB; }
.t-live.on    { color: #111827; }
.t-live.on .dot { background: #111827; }

/* Scrollable message area — fills remaining height */
.t-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

/* Empty state */
.empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  height: 100%;
  gap: 10px; text-align: center;
}
.empty-icon { font-size: 2rem; color: #E5E7EB; }
.empty-text { font-size: 0.813rem; color: #9CA3AF; max-width: 220px; line-height: 1.6; }

/* Message rows */
.row     { display: flex; align-items: flex-start; gap: 10px; }
.row.you { flex-direction: row-reverse; }

.av {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; flex-shrink: 0; margin-top: 18px;
}
.av.ai  { background: #111827; color: #FFF; }
.av.you { background: #E5E7EB; color: #374151; }

.grp   { display: flex; flex-direction: column; gap: 3px; max-width: 74%; }
.spk   {
  font-size: 0.625rem; font-weight: 600; color: #9CA3AF;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.row.you .spk { text-align: right; }

.bub {
  padding: 9px 13px;
  font-size: 0.813rem; line-height: 1.6;
  border-radius: 8px;
  word-break: break-word;
}
.bub.ai  { background: #F3F4F6; color: #111827; border: 1px solid #E5E7EB; border-radius: 0 8px 8px 8px; }
.bub.you { background: #111827; color: #F9FAFB; border-radius: 8px 0 8px 8px; }

/* Error bar */
#errBar {
  padding: 8px 20px;
  font-size: 0.75rem; color: #991B1B;
  background: #FEF2F2; border-top: 1px solid #FECACA;
  display: none; flex-shrink: 0;
}

/* Scrollbar */
.t-scroll::-webkit-scrollbar { width: 4px; }
.t-scroll::-webkit-scrollbar-track { background: transparent; }
.t-scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }
</style>
</head>
<body>
<div class="layout">

  <!-- LEFT -->
  <div class="left">
    <div class="avatar" id="av">🤖</div>
    <div>
      <div class="agent-name">Alex</div>
      <div class="agent-role">AI Interviewer &bull; DSA &amp; HR</div>
    </div>
    <div class="pill" id="pill">
      <span class="dot"></span>
      <span id="pillTxt">Ready to start</span>
    </div>
    <hr class="sep"/>
    <div class="btn-col">
      <button class="btn btn-start" id="startBtn" onclick="startInterview()">🎙️ Start Interview</button>
      <button class="btn btn-end"   id="stopBtn"  onclick="stopInterview()" disabled>⏹ End Session</button>
    </div>
    <hr class="sep"/>
    <div class="tips-block">
      <div class="tips-title">Tips</div>
      <div class="tip-item"><span class="tip-icon">🌐</span><span class="tip-text">Use Chrome or Edge for best mic support</span></div>
      <div class="tip-item"><span class="tip-icon">🎯</span><span class="tip-text">Think out loud — Alex values your reasoning</span></div>
      <div class="tip-item"><span class="tip-icon">⭐</span><span class="tip-text">HR answers: use STAR (Situation · Task · Action · Result)</span></div>
      <div class="tip-item"><span class="tip-icon">✋</span><span class="tip-text">Click End Session when done to close cleanly</span></div>
    </div>
  </div>

  <!-- RIGHT -->
  <div class="right">
    <div class="t-bar">
      <span class="t-bar-label">Live Transcript</span>
      <span class="t-live" id="tLive"><span class="dot"></span><span id="tLiveTxt">Waiting</span></span>
    </div>

    <div class="t-scroll" id="tScroll">
      <div class="empty" id="emptyState">
        <div class="empty-icon">💬</div>
        <div class="empty-text">Transcript will appear here once your session starts.</div>
      </div>
    </div>

    <div id="errBar"></div>
  </div>

</div>
<script type="module">
import Vapi from 'https://esm.sh/@vapi-ai/web@latest';
const KEY = '%%VAPI_KEY%%';
let vapi = null, active = false;
const $ = id => document.getElementById(id);

function setStatus(txt, on) {
  $('pillTxt').textContent = txt;
  $('pill').className  = 'pill' + (on ? ' live' : '');
  $('tLive').className = 't-live' + (on ? ' on' : '');
  $('tLiveTxt').textContent = on ? 'Live' : 'Waiting';
  $('av').className = 'avatar' + (on ? ' active' : '');
}

function showErr(msg) {
  const b = $('errBar');
  b.style.display = 'block';
  b.textContent = '⚠️ ' + msg;
  setStatus('Error', false);
  $('startBtn').disabled = false;
  $('stopBtn').disabled  = true;
  active = false;
}

function addLine(role, text) {
  if (!text) return;
  const empty = $('emptyState');
  if (empty) empty.remove();
  const isAI = role === 'assistant';

  const row = document.createElement('div');
  row.className = 'row' + (isAI ? '' : ' you');

  const av = document.createElement('div');
  av.className = 'av ' + (isAI ? 'ai' : 'you');
  av.textContent = isAI ? '🤖' : '🧑';

  const grp = document.createElement('div');
  grp.className = 'grp';

  const spk = document.createElement('div');
  spk.className = 'spk';
  spk.textContent = isAI ? 'Alex' : 'You';

  const bub = document.createElement('div');
  bub.className = 'bub ' + (isAI ? 'ai' : 'you');
  bub.textContent = text;

  grp.appendChild(spk);
  grp.appendChild(bub);
  row.appendChild(av);
  row.appendChild(grp);
  $('tScroll').appendChild(row);
  $('tScroll').scrollTop = $('tScroll').scrollHeight;
}

async function startInterview() {
  if (!KEY) { showErr('VAPI_PUBLIC_KEY not set. Edit .env and restart.'); return; }
  $('startBtn').disabled = true;
  $('errBar').style.display = 'none';
  setStatus('Connecting…', false);
  try {
    vapi = new Vapi(KEY);
    vapi.on('call-start', () => {
      active = true;
      setStatus('Live', true);
      $('stopBtn').disabled = false;
      $('tScroll').innerHTML = '';
    });
    vapi.on('call-end', () => {
      active = false;
      setStatus('Session ended', false);
      $('startBtn').disabled = false;
      $('stopBtn').disabled  = true;
    });
    vapi.on('error', e => showErr(e?.message ?? e?.error?.message ?? 'Error — check console (F12)'));
    vapi.on('message', m => { if (m?.type === 'transcript') addLine(m.role, m.transcript); });
    vapi.on('speech-start', () => { if (active) setStatus('Alex is speaking…', true); });
    vapi.on('speech-end',   () => { if (active) setStatus('Listening…', true); });
    await vapi.start({
      transcriber: { provider: 'deepgram', model: 'nova-2', language: 'en-US' },
      model: {
        provider: 'openai', model: 'gpt-4o-mini', temperature: 0.7,
        messages: [{ role: 'system', content: `You are Alex, a senior technical interviewer.
Conduct structured interviews: 1) Brief warm welcome. 2) 2–3 DSA questions. 3) 1–2 HR questions. 4) Professional close.
Be professional, concise, and encouraging. Keep responses under 60 words unless explaining a solution.` }]
      },
      voice: { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM' },
      name: 'IntervueX Voice Interviewer',
      firstMessage: "Hi, I'm Alex, your interviewer today. We'll cover DSA and HR questions. Take your time. Ready to begin?"
    });
  } catch (e) { showErr(e.message || 'Could not start. Check console (F12).'); }
}

function stopInterview() {
  if (vapi && active) { setStatus('Ending…', false); vapi.stop(); }
}
window.startInterview = startInterview;
window.stopInterview  = stopInterview;
</script>
</body>
</html>"""


def _find_free_port(preferred):
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind(("localhost", preferred))
            return preferred
    except OSError:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("localhost", 0))
            return s.getsockname()[1]


def _start_server(key, port):
    import http.server, socketserver
    html = WIDGET_HTML.replace("%%VAPI_KEY%%", key).encode()

    class H(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(html)))
            self.send_header("X-Frame-Options", "ALLOWALL")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(html)
        def log_message(self, *_): pass

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("localhost", port), H) as httpd:
        httpd.serve_forever()


if "vapi_server_started" not in st.session_state:
    port = _find_free_port(VAPI_PORT)
    st.session_state.vapi_actual_port = port
    threading.Thread(target=_start_server, args=(VAPI_PUBLIC_KEY, port), daemon=True).start()
    st.session_state.vapi_server_started = True

_port = st.session_state.get("vapi_actual_port", VAPI_PORT)

# Use viewport height minus sidebar to fill screen
components.iframe(f"http://localhost:{_port}", height=900, scrolling=False)