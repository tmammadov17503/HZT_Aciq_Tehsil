/* ================================================================
   auth-modal.js  –  drop into every page with:
   <script type="module" src="auth-modal.js"></script>
   This script:
     1. Injects the modal HTML + styles
     2. Injects the nav user-widget (bell + avatar)
     3. Exports window.AT = { requireLogin, currentUser }
   ================================================================ */

import { registerUser, loginUser, logoutUser, onAuthChange,
         getUserProfile, markNotified }
  from "./firebase-config.js";

// ── Inject CSS ────────────────────────────────────────────────
const css = `
:root{
  --at-green:#1d5c3e;--at-orange:#f07d24;--at-bg:#faf8f2;
  --at-card:#fff;--at-border:#e8e2d6;--at-muted:#7a7060;
  --at-text:#1a1a1a;
}
/* ── Modal overlay ── */
#at-overlay{
  display:none;position:fixed;inset:0;z-index:9999;
  background:rgba(0,0,0,.45);backdrop-filter:blur(4px);
  align-items:center;justify-content:center;
}
#at-overlay.open{display:flex}
#at-modal{
  background:var(--at-bg);border-radius:20px;
  width:min(440px,92vw);padding:2.4rem 2.2rem;
  box-shadow:0 24px 80px rgba(0,0,0,.22);
  position:relative;animation:atSlideUp .35s cubic-bezier(.22,1,.36,1) both;
}
@keyframes atSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
#at-modal .at-logo{display:flex;align-items:center;gap:.7rem;justify-content:center;margin-bottom:1.6rem}
#at-modal .at-logo img{width:36px;height:36px}
#at-modal .at-logo span{font-family:'Arvo',serif;font-size:1.3rem;font-weight:700;color:var(--at-green)}
#at-modal h2{font-family:'Arvo',serif;font-size:1.4rem;font-weight:700;color:var(--at-green);
  text-align:center;margin-bottom:.3rem}
#at-modal .at-sub{text-align:center;color:var(--at-muted);font-size:.88rem;margin-bottom:1.6rem}
.at-tabs{display:flex;gap:.5rem;background:#ede9df;border-radius:10px;padding:4px;margin-bottom:1.6rem}
.at-tab{flex:1;text-align:center;padding:.5rem;border-radius:7px;cursor:pointer;font-size:.88rem;
  font-weight:600;color:var(--at-muted);transition:all .2s;border:none;background:none}
.at-tab.active{background:#fff;color:var(--at-green);box-shadow:0 2px 8px rgba(0,0,0,.08)}
.at-field{display:flex;flex-direction:column;gap:.35rem;margin-bottom:1rem}
.at-field label{font-size:.8rem;font-weight:600;color:var(--at-text)}
.at-field input{border:1.5px solid var(--at-border);border-radius:9px;padding:.75rem 1rem;
  font-size:.92rem;font-family:inherit;color:var(--at-text);background:#fff;
  transition:border-color .2s;outline:none}
.at-field input:focus{border-color:var(--at-green)}
.at-btn{width:100%;background:var(--at-orange);color:#fff;border:none;
  padding:.9rem;border-radius:10px;font-weight:700;font-size:.97rem;cursor:pointer;
  margin-top:.4rem;transition:background .2s,transform .15s;font-family:inherit}
.at-btn:hover{background:#d96e1a;transform:translateY(-1px)}
.at-btn:disabled{background:#ccc;transform:none;cursor:not-allowed}
.at-err{background:#fde8e8;color:#c0392b;border-radius:8px;padding:.65rem .9rem;
  font-size:.85rem;margin-bottom:.8rem;display:none}
.at-ok{background:#e6f4ea;color:#1d5c3e;border-radius:8px;padding:.65rem .9rem;
  font-size:.85rem;margin-bottom:.8rem;display:none}
.at-close{position:absolute;top:14px;right:16px;background:none;border:none;
  font-size:1.4rem;cursor:pointer;color:var(--at-muted);line-height:1}
#at-overlay .at-sep{text-align:center;color:var(--at-muted);font-size:.8rem;margin:.8rem 0}
/* ── Nav user widget ── */
#at-nav-widget{display:flex;align-items:center;gap:.9rem}
#at-bell-wrap{position:relative;cursor:pointer}
#at-bell{font-size:1.3rem;color:rgba(255,255,255,.8)}
#at-badge{
  position:absolute;top:-4px;right:-5px;
  background:#e53935;color:#fff;font-size:.6rem;font-weight:700;
  width:16px;height:16px;border-radius:50%;display:none;
  align-items:center;justify-content:center;
  border:2px solid var(--at-green,#0a1628);
}
#at-badge.show{display:flex}
#at-notif-drop{
  display:none;position:absolute;top:calc(100% + 10px);right:-10px;
  width:240px;background:#fff;border-radius:12px;
  box-shadow:0 8px 32px rgba(0,0,0,.15);padding:.8rem;z-index:200;
}
#at-notif-drop.open{display:block}
.at-notif-item{font-size:.82rem;color:#1a1a1a;padding:.55rem .7rem;border-radius:8px;
  background:#f4f6fb;margin-bottom:.4rem;line-height:1.5}
#at-avatar{
  width:36px;height:36px;border-radius:50%;
  background:linear-gradient(135deg,#1d5c3e,#f07d24);
  display:flex;align-items:center;justify-content:center;
  color:#fff;font-weight:700;font-size:.88rem;cursor:pointer;
  position:relative;
}
#at-user-drop{
  display:none;position:absolute;top:calc(100% + 10px);right:0;
  width:180px;background:#fff;border-radius:12px;
  box-shadow:0 8px 32px rgba(0,0,0,.15);padding:.6rem;z-index:200;
}
#at-user-drop.open{display:block}
.at-drop-item{display:block;padding:.6rem .9rem;font-size:.88rem;color:#1a1a1a;
  border-radius:8px;cursor:pointer;transition:background .15s}
.at-drop-item:hover{background:#f4f6fb}
.at-drop-sep{border:none;border-top:1px solid #eee;margin:.3rem 0}
/* login prompt snackbar */
#at-snack{
  display:none;position:fixed;bottom:30px;left:50%;transform:translateX(-50%);
  background:#1d5c3e;color:#fff;padding:1rem 1.8rem;border-radius:14px;
  font-size:.92rem;font-weight:600;z-index:9998;
  box-shadow:0 8px 30px rgba(0,0,0,.2);white-space:nowrap;
  animation:atSnackIn .3s ease;
}
@keyframes atSnackIn{from{opacity:0;transform:translateX(-50%) translateY(20px)}
  to{opacity:1;transform:translateX(-50%) translateY(0)}}
`;
const style = document.createElement("style");
style.textContent = css;
document.head.appendChild(style);

// Google font Arvo for modal logo
const font = document.createElement("link");
font.rel = "stylesheet";
font.href = "https://fonts.googleapis.com/css2?family=Arvo:wght@400;700&display=swap";
document.head.appendChild(font);

// ── Inject modal HTML ─────────────────────────────────────────
const modalHTML = `
<div id="at-overlay">
  <div id="at-modal">
    <button class="at-close" id="at-close-btn">✕</button>
    <div class="at-logo">
      <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#1d5c3e"/>
        <path d="M8 30 L20 10 L32 30" stroke="#f07d24" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M12 24 L28 24" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="20" cy="10" r="2.5" fill="#f07d24"/>
      </svg>
      <span>AciqTehsil</span>
    </div>
    <h2 id="at-modal-title">Xoş gəldiniz</h2>
    <p class="at-sub" id="at-modal-sub">Davam etmək üçün daxil olun</p>
    <div class="at-tabs">
      <button class="at-tab active" id="at-tab-login" onclick="AT._switchTab('login')">Daxil ol</button>
      <button class="at-tab" id="at-tab-reg" onclick="AT._switchTab('register')">Qeydiyyat</button>
    </div>
    <div id="at-err" class="at-err"></div>
    <div id="at-ok" class="at-ok"></div>
    <!-- Login form -->
    <div id="at-login-form">
      <div class="at-field"><label>E-poçt</label><input type="email" id="at-l-email" placeholder="email@example.com"/></div>
      <div class="at-field"><label>Şifrə</label><input type="password" id="at-l-pass" placeholder="••••••••"/></div>
      <button class="at-btn" id="at-login-btn" onclick="AT._doLogin()">Daxil ol</button>
    </div>
    <!-- Register form -->
    <div id="at-reg-form" style="display:none">
      <div class="at-field"><label>Ad Soyad</label><input type="text" id="at-r-name" placeholder="Adınız Soyadınız"/></div>
      <div class="at-field"><label>E-poçt</label><input type="email" id="at-r-email" placeholder="email@example.com"/></div>
      <div class="at-field"><label>Şifrə</label><input type="password" id="at-r-pass" placeholder="Minimum 6 simvol"/></div>
      <button class="at-btn" id="at-reg-btn" onclick="AT._doRegister()">Qeydiyyatdan keç</button>
    </div>
  </div>
</div>
<div id="at-snack"></div>
`;
document.body.insertAdjacentHTML("beforeend", modalHTML);

// ── Inject nav widget (into element with id="at-nav-slot") ────
function injectNavWidget() {
  const slot = document.getElementById("at-nav-slot");
  if (!slot) return;
  slot.innerHTML = `
    <div id="at-nav-widget">
      <!-- Logged-out state -->
      <div id="at-logged-out">
        <button class="at-nav-login-btn" onclick="AT.openModal()">Daxil ol</button>
      </div>
      <!-- Logged-in state -->
      <div id="at-logged-in" style="display:none;align-items:center;gap:.9rem">
        <div id="at-bell-wrap" onclick="AT._toggleNotif()">
          <span id="at-bell">🔔</span>
          <div id="at-badge">1</div>
          <div id="at-notif-drop">
            <div class="at-notif-item" id="at-notif-text">🎉 Hesabınız uğurla aktivləşdirildi!</div>
          </div>
        </div>
        <div style="position:relative">
          <div id="at-avatar" onclick="AT._toggleUserDrop()">?</div>
          <div id="at-user-drop">
            <span class="at-drop-item" id="at-user-name-label" style="font-weight:700;cursor:default"></span>
            <hr class="at-drop-sep">
            <span class="at-drop-item" onclick="AT._logout()">🚪 Çıxış</span>
          </div>
        </div>
      </div>
    </div>
  `;
  // Add the login button style
  const s = document.createElement("style");
  s.textContent = `.at-nav-login-btn{background:var(--accent,#e8a020);color:#0a1628;
    padding:.45rem 1.1rem;border-radius:6px;font-weight:700;font-size:.88rem;
    border:none;cursor:pointer;transition:background .2s;}
    .at-nav-login-btn:hover{background:#f5c842;}`;
  document.head.appendChild(s);
}
injectNavWidget();

// ── State ─────────────────────────────────────────────────────
let _currentUser = null;
let _pendingCallback = null;

// ── Auth state listener ───────────────────────────────────────
onAuthChange(async (user) => {
  _currentUser = user;
  const loggedIn = document.getElementById("at-logged-in");
  const loggedOut = document.getElementById("at-logged-out");
  const avatar = document.getElementById("at-avatar");
  const badge = document.getElementById("at-badge");
  const nameLabel = document.getElementById("at-user-name-label");

  if (user) {
    if (loggedIn) { loggedIn.style.display = "flex"; }
    if (loggedOut) { loggedOut.style.display = "none"; }
    // Set avatar initial
    const profile = await getUserProfile(user.uid).catch(() => null);
    const name = profile?.displayName || user.email;
    const initial = name.charAt(0).toUpperCase();
    if (avatar) avatar.textContent = initial;
    if (nameLabel) nameLabel.textContent = name;
    // Notification: show badge if not yet notified
    if (profile && !profile.notified && badge) {
      badge.classList.add("show");
    }
    // Close modal
    closeModal();
    // Run pending callback
    if (_pendingCallback) { _pendingCallback(); _pendingCallback = null; }
  } else {
    if (loggedIn) { loggedIn.style.display = "none"; }
    if (loggedOut) { loggedOut.style.display = "flex"; }
  }
});

// ── Modal open/close ──────────────────────────────────────────
function openModal(tab = "login") {
  document.getElementById("at-overlay").classList.add("open");
  AT._switchTab(tab);
  clearMessages();
}
function closeModal() {
  document.getElementById("at-overlay").classList.remove("open");
}
document.getElementById("at-close-btn").addEventListener("click", closeModal);
document.getElementById("at-overlay").addEventListener("click", (e) => {
  if (e.target === document.getElementById("at-overlay")) closeModal();
});

// ── Tab switch ────────────────────────────────────────────────
function switchTab(tab) {
  const isLogin = tab === "login";
  document.getElementById("at-login-form").style.display = isLogin ? "block" : "none";
  document.getElementById("at-reg-form").style.display = isLogin ? "none" : "block";
  document.getElementById("at-tab-login").classList.toggle("active", isLogin);
  document.getElementById("at-tab-reg").classList.toggle("active", !isLogin);
  clearMessages();
}

function clearMessages() {
  const err = document.getElementById("at-err");
  const ok = document.getElementById("at-ok");
  if (err) { err.style.display = "none"; err.textContent = ""; }
  if (ok) { ok.style.display = "none"; ok.textContent = ""; }
}
function showErr(msg) {
  const el = document.getElementById("at-err");
  el.textContent = msg; el.style.display = "block";
  document.getElementById("at-ok").style.display = "none";
}
function showOk(msg) {
  const el = document.getElementById("at-ok");
  el.textContent = msg; el.style.display = "block";
  document.getElementById("at-err").style.display = "none";
}

// ── Login ─────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById("at-l-email").value.trim();
  const pass = document.getElementById("at-l-pass").value;
  if (!email || !pass) { showErr("Zəhmət olmasa bütün sahələri doldurun."); return; }
  const btn = document.getElementById("at-login-btn");
  btn.disabled = true; btn.textContent = "Yüklənir...";
  try {
    const user = await loginUser(email, pass);
    if (!user.emailVerified) {
      showErr("E-poçtunuzu təsdiqləyin. Zəhmət olmasa e-poçtunuzu yoxlayın.");
      await logoutUser(); // force sign out until verified
    }
  } catch (e) {
    const msgs = {
      "auth/user-not-found": "Bu e-poçt ilə hesab tapılmadı.",
      "auth/wrong-password": "Şifrə yanlışdır.",
      "auth/invalid-email": "E-poçt formatı düzgün deyil.",
      "auth/invalid-credential": "E-poçt və ya şifrə yanlışdır.",
      "auth/too-many-requests": "Çox sayda cəhd. Bir az gözləyin."
    };
    showErr(msgs[e.code] || "Xəta baş verdi: " + e.message);
  } finally {
    btn.disabled = false; btn.textContent = "Daxil ol";
  }
}

// ── Register ──────────────────────────────────────────────────
async function doRegister() {
  const name = document.getElementById("at-r-name").value.trim();
  const email = document.getElementById("at-r-email").value.trim();
  const pass = document.getElementById("at-r-pass").value;
  if (!name || !email || !pass) { showErr("Zəhmət olmasa bütün sahələri doldurun."); return; }
  if (pass.length < 6) { showErr("Şifrə minimum 6 simvol olmalıdır."); return; }
  const btn = document.getElementById("at-reg-btn");
  btn.disabled = true; btn.textContent = "Qeydiyyat...";
  try {
    await registerUser(email, pass, name);
    // sign out until email verified
    await logoutUser();
    showOk("✅ Qeydiyyat uğurlu! " + email + " ünvanına təsdiq e-poçtu göndərildi. Zəhmət olmasa e-poçtunuzu təsdiqləyin.");
  } catch (e) {
    const msgs = {
      "auth/email-already-in-use": "Bu e-poçt artıq qeydiyyatdan keçib.",
      "auth/invalid-email": "E-poçt formatı düzgün deyil.",
      "auth/weak-password": "Şifrə çox zəifdir."
    };
    showErr(msgs[e.code] || "Xəta: " + e.message);
  } finally {
    btn.disabled = false; btn.textContent = "Qeydiyyatdan keç";
  }
}

// ── Logout ────────────────────────────────────────────────────
async function doLogout() {
  await logoutUser();
  closeUserDrop();
}

// ── Notification drop ─────────────────────────────────────────
function toggleNotif() {
  const drop = document.getElementById("at-notif-drop");
  const badge = document.getElementById("at-badge");
  drop.classList.toggle("open");
  // mark as read
  if (drop.classList.contains("open") && _currentUser) {
    badge.classList.remove("show");
    markNotified(_currentUser.uid).catch(() => {});
  }
  // close user drop
  document.getElementById("at-user-drop").classList.remove("open");
}

// ── User drop ─────────────────────────────────────────────────
function toggleUserDrop() {
  document.getElementById("at-user-drop").classList.toggle("open");
  document.getElementById("at-notif-drop").classList.remove("open");
}
function closeUserDrop() {
  document.getElementById("at-user-drop").classList.remove("open");
}

// Close drops on outside click
document.addEventListener("click", (e) => {
  if (!e.target.closest("#at-bell-wrap")) {
    document.getElementById("at-notif-drop")?.classList.remove("open");
  }
  if (!e.target.closest("#at-avatar") && !e.target.closest("#at-user-drop")) {
    document.getElementById("at-user-drop")?.classList.remove("open");
  }
});

// ── Snackbar ──────────────────────────────────────────────────
function showSnack(msg) {
  const el = document.getElementById("at-snack");
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 3500);
}

// ── requireLogin helper ───────────────────────────────────────
function requireLogin(callback) {
  if (_currentUser) { callback(); }
  else {
    _pendingCallback = callback;
    showSnack("🔒 Bu bölməyə daxil olmaq üçün hesabınıza girin");
    openModal("login");
  }
}

// ── Public API ────────────────────────────────────────────────
window.AT = {
  openModal,
  closeModal,
  requireLogin,
  get currentUser() { return _currentUser; },
  _switchTab: switchTab,
  _doLogin: doLogin,
  _doRegister: doRegister,
  _logout: doLogout,
  _toggleNotif: toggleNotif,
  _toggleUserDrop: toggleUserDrop,
  showSnack,
};

// Signal that AT is ready for non-module scripts
window.dispatchEvent(new Event("at-ready"));
