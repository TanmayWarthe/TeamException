"""Voice Interview — IntervueX. Left: Alex controls. Right: Live transcript."""

import os, sys, socket, threading
import streamlit as st
import streamlit.components.v1 as components
from dotenv import load_dotenv

st.set_page_config(page_title="Voice Interview – IntervueX", page_icon="🎙️", layout="wide")
load_dotenv()

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from ui_utils import apply_global_css
import auth_utils as auth

auth.require_auth()
apply_global_css()

_raw = os.getenv("VAPI_PUBLIC_KEY", "") or ""
VAPI_PUBLIC_KEY = _raw.strip().strip('"').strip("'")
VAPI_PORT = 8503

st.markdown('<p class="page-title">Voice Interview</p>', unsafe_allow_html=True)
st.markdown('<p class="page-subtitle">Speak with Alex, your AI interviewer, in real time.</p>', unsafe_allow_html=True)

if not VAPI_PUBLIC_KEY:
    st.error("⚠️ `VAPI_PUBLIC_KEY` is not set. Add it to `.env` and restart Streamlit.")
with st.expander("Environment check", expanded=not VAPI_PUBLIC_KEY):
    if VAPI_PUBLIC_KEY:
        st.success(f"✅ Key set ({len(VAPI_PUBLIC_KEY)} chars, starts with `{VAPI_PUBLIC_KEY[:8]}…`)")
    else:
        st.error("❌ Key missing.")
        st.code("VAPI_PUBLIC_KEY=pk_live_your_key_here", language="bash")

st.divider()

WIDGET_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:'Inter',sans-serif;background:#F9FAFB;}

.layout{
  display:flex;
  height:100vh;
  overflow:hidden;
}

/* ── LEFT PANEL ── */
.left{
  width:300px;
  flex-shrink:0;
  background:#FFFFFF;
  border-right:1px solid #E5E7EB;
  display:flex;
  flex-direction:column;
  align-items:center;
  padding:32px 20px;
  gap:18px;
  overflow-y:auto;
}

.avatar-wrap{
  width:88px; height:88px;
  border-radius:50%;
  background:#111827;
  display:flex; align-items:center; justify-content:center;
  font-size:40px; flex-shrink:0;
}
.avatar-wrap.active{
  box-shadow:0 0 0 4px #E5E7EB, 0 0 0 6px #111827;
}

.agent-name { font-size:0.938rem; font-weight:700; color:#111827; text-align:center; }
.agent-role { font-size:0.75rem; color:#9CA3AF; text-align:center; margin-top:2px; }

.status-pill{
  display:inline-flex; align-items:center; gap:7px;
  padding:6px 16px;
  border:1px solid #E5E7EB;
  border-radius:6px;
  background:#F9FAFB;
  font-size:0.75rem; font-weight:500; color:#374151;
}
.s-dot{ width:6px; height:6px; border-radius:50%; background:#D1D5DB; flex-shrink:0; }
.s-dot.on{ background:#111827; }

.divider{ width:100%; border:none; border-top:1px solid #E5E7EB; }

.btn-row{ display:flex; flex-direction:column; gap:8px; width:100%; }
.btn{
  width:100%; padding:9px 0;
  border-radius:6px; border:none;
  font-family:'Inter',sans-serif;
  font-size:0.813rem; font-weight:500;
  cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:6px;
}
.btn:disabled{ opacity:.38; cursor:not-allowed; }
.btn-primary{ background:#111827; color:#FFFFFF; }
.btn-secondary{ background:#FFFFFF; color:#374151; border:1px solid #D1D5DB; }

.info-block{ width:100%; }
.info-label{
  font-size:0.625rem; font-weight:600; color:#9CA3AF;
  text-transform:uppercase; letter-spacing:0.07em; margin-bottom:8px;
}
.info-item{
  display:flex; align-items:flex-start; gap:7px;
  margin-bottom:7px;
}
.info-icon{ font-size:0.875rem; flex-shrink:0; margin-top:1px; }
.info-text{ font-size:0.75rem; color:#6B7280; line-height:1.5; }

/* ── RIGHT PANEL ── */
.right{
  flex:1;
  display:flex;
  flex-direction:column;
  background:#FFFFFF;
  overflow:hidden;
}

.t-topbar{
  padding:12px 20px;
  border-bottom:1px solid #E5E7EB;
  display:flex; align-items:center; justify-content:space-between;
  flex-shrink:0;
}
.t-topbar-label{
  font-size:0.688rem; font-weight:600; color:#9CA3AF;
  text-transform:uppercase; letter-spacing:0.07em;
}
.t-live-badge{
  font-size:0.625rem; font-weight:600; color:#9CA3AF;
  display:flex; align-items:center; gap:5px;
}
.t-live-badge .dot{ width:5px; height:5px; border-radius:50%; background:#D1D5DB; }
.t-live-badge.on .dot{ background:#111827; }
.t-live-badge.on{ color:#111827; }

.t-messages{
  flex:1;
  overflow-y:auto;
  padding:20px;
  display:flex;
  flex-direction:column;
  gap:14px;
}

.empty{
  flex:1;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  gap:10px; text-align:center; padding:40px;
}
.empty-icon{ font-size:2rem; color:#D1D5DB; }
.empty-text{ font-size:0.813rem; color:#9CA3AF; max-width:240px; line-height:1.6; }

/* Message rows */
.row{ display:flex; align-items:flex-start; gap:10px; }
.row.you{ flex-direction:row-reverse; }

.av{
  width:30px; height:30px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; flex-shrink:0; margin-top:2px;
}
.av.ai { background:#111827; color:#FFF; }
.av.you{ background:#E5E7EB; color:#374151; }

.msg-group{ display:flex; flex-direction:column; gap:3px; max-width:75%; }
.msg-speaker{
  font-size:0.625rem; font-weight:600; color:#9CA3AF;
  text-transform:uppercase; letter-spacing:0.05em;
}
.row.you .msg-speaker{ text-align:right; }

.bubble{
  padding:9px 13px;
  font-size:0.813rem; line-height:1.6;
  border-radius:8px;
}
.bubble.ai {
  background:#F3F4F6; color:#111827;
  border:1px solid #E5E7EB;
  border-radius:0 8px 8px 8px;
}
.bubble.you{
  background:#111827; color:#F9FAFB;
  border-radius:8px 0 8px 8px;
}

#errMsg{
  margin:0 20px 12px;
  font-size:0.75rem; color:#991B1B;
  background:#FEF2F2; border:1px solid #FECACA;
  border-radius:6px; padding:9px 13px;
  display:none;
}

.t-messages::-webkit-scrollbar{ width:4px; }
.t-messages::-webkit-scrollbar-track{ background:transparent; }
.t-messages::-webkit-scrollbar-thumb{ background:#E5E7EB; border-radius:4px; }
</style>
</head>
<body>
<div class="layout">

  <!-- ── LEFT ── -->
  <div class="left">

    <div class="avatar-wrap" id="avatarWrap">🤖</div>

    <div>
      <div class="agent-name">Alex</div>
      <div class="agent-role">AI Interviewer &bull; DSA &amp; HR</div>
    </div>

    <div class="status-pill" id="pill">
      <span class="s-dot" id="sDot"></span>
      <span id="sText">Ready to start</span>
    </div>

    <hr class="divider"/>

    <div class="btn-row">
      <button class="btn btn-primary"   id="startBtn" onclick="startInterview()">🎙️ Start Interview</button>
      <button class="btn btn-secondary" id="stopBtn"  onclick="stopInterview()" disabled>⏹ End Session</button>
    </div>

    <hr class="divider"/>

    <div class="info-block">
      <div class="info-label">Tips</div>
      <div class="info-item">
        <span class="info-icon">🌐</span>
        <span class="info-text">Use Chrome or Edge for best microphone support</span>
      </div>
      <div class="info-item">
        <span class="info-icon">🎯</span>
        <span class="info-text">Think out loud on DSA — Alex values your reasoning</span>
      </div>
      <div class="info-item">
        <span class="info-icon">⭐</span>
        <span class="info-text">For HR questions, use STAR: Situation · Task · Action · Result</span>
      </div>
      <div class="info-item">
        <span class="info-icon">✋</span>
        <span class="info-text">Click End Session when done to close cleanly</span>
      </div>
    </div>

  </div>

  <!-- ── RIGHT ── -->
  <div class="right">

    <div class="t-topbar">
      <span class="t-topbar-label">Live Transcript</span>
      <span class="t-live-badge" id="liveBadge">
        <span class="dot"></span>
        <span id="liveText">Waiting</span>
      </span>
    </div>

    <div class="t-messages" id="tMessages">
      <div class="empty" id="emptyState">
        <div class="empty-icon">💬</div>
        <div class="empty-text">Transcript will appear here once your session starts. Start the interview and speak — Alex will respond.</div>
      </div>
    </div>

    <div id="errMsg"></div>

  </div>

</div>

<script type="module">
import Vapi from 'https://esm.sh/@vapi-ai/web@latest';
const KEY = '%%VAPI_KEY%%';
let vapi = null, active = false;
const $ = id => document.getElementById(id);

function setStatus(text, isOn) {
  $('sText').textContent = text;
  $('sDot').className  = 's-dot' + (isOn ? ' on' : '');
  $('liveBadge').className = 't-live-badge' + (isOn ? ' on' : '');
  $('liveText').textContent = isOn ? 'Live' : 'Waiting';
  $('avatarWrap').className = 'avatar-wrap' + (isOn ? ' active' : '');
}

function showErr(msg) {
  const el = $('errMsg');
  el.style.display = 'block';
  el.textContent = '⚠️ ' + msg;
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
  const row   = document.createElement('div');
  row.className = 'row' + (isAI ? '' : ' you');

  const av = document.createElement('div');
  av.className = 'av ' + (isAI ? 'ai' : 'you');
  av.textContent = isAI ? '🤖' : '🧑';

  const grp = document.createElement('div');
  grp.className = 'msg-group';

  const spk = document.createElement('div');
  spk.className = 'msg-speaker';
  spk.textContent = isAI ? 'Alex' : 'You';

  const bub = document.createElement('div');
  bub.className = 'bubble ' + (isAI ? 'ai' : 'you');
  bub.textContent = text;

  grp.appendChild(spk);
  grp.appendChild(bub);
  row.appendChild(av);
  row.appendChild(grp);

  $('tMessages').appendChild(row);
  $('tMessages').scrollTop = $('tMessages').scrollHeight;
}

async function startInterview() {
  if (!KEY) { showErr('VAPI_PUBLIC_KEY not set. Edit .env and restart.'); return; }
  $('startBtn').disabled = true;
  $('errMsg').style.display = 'none';
  setStatus('Connecting…', false);

  try {
    vapi = new Vapi(KEY);

    vapi.on('call-start', () => {
      active = true;
      setStatus('Live', true);
      $('stopBtn').disabled = false;
      $('tMessages').innerHTML = '';
    });

    vapi.on('call-end', () => {
      active = false;
      setStatus('Session ended', false);
      $('startBtn').disabled = false;
      $('stopBtn').disabled  = true;
    });

    vapi.on('error', e => {
      showErr(e?.message ?? e?.error?.message ?? (typeof e === 'string' ? e : 'Error — check console (F12)'));
    });

    vapi.on('message', m => {
      if (m?.type === 'transcript') addLine(m.role, m.transcript);
    });

    vapi.on('speech-start', () => { if (active) setStatus('Alex is speaking…', true); });
    vapi.on('speech-end',   () => { if (active) setStatus('Listening…', true); });

    await vapi.start({
      transcriber: { provider: 'deepgram', model: 'nova-2', language: 'en-US' },
      model: {
        provider: 'openai', model: 'gpt-4o-mini', temperature: 0.7,
        messages: [{ role: 'system', content: `You are Alex, a senior technical interviewer.
Conduct structured interviews: 1) Brief warm welcome. 2) 2–3 DSA questions (arrays, trees, graphs, DP, sorting, hashing). 3) 1–2 HR questions (teamwork, conflict, achievements). 4) Professional close.
Be professional, concise, and encouraging. Keep responses under 60 words unless explaining a solution.` }]
      },
      voice: { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM' },
      name: 'IntervueX Voice Interviewer',
      firstMessage: "Hi, I'm Alex, your interviewer today. We'll cover DSA and HR questions. Take your time. Ready to begin?"
    });

  } catch (e) {
    showErr(e.message || 'Could not start. Check console (F12).');
  }
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

components.iframe(f"http://localhost:{_port}", height=600, scrolling=False)