/* ================================================================
   auth-modal.js  — AçıqTəhsil
   Features:
     • Email/password login + register
     • Enter key submits active form
     • Google sign-in (login + register tabs)
     • Forgot password (sends reset email via Firebase)
     • Nav user widget with bell notification + avatar
     • window.AT public API for other scripts
   ================================================================ */

import { registerUser, loginUser, loginWithGoogle, resetPassword,
         logoutUser, onAuthChange, getUserProfile, markNotified }
  from "./firebase-config.js";

// ── CSS ───────────────────────────────────────────────────────
const css = `
:root{
  --at-green:#1a3d2b;--at-orange:#e8671a;--at-bg:#f5f2eb;
  --at-card:#fff;--at-border:#d4ddc8;--at-muted:#7a7060;
  --at-text:#1a1a1a;
}
#at-overlay{
  display:none;position:fixed;inset:0;z-index:9999;
  background:rgba(0,0,0,.48);backdrop-filter:blur(5px);
  align-items:center;justify-content:center;padding:16px;
}
#at-overlay.open{display:flex}
#at-modal{
  background:var(--at-bg);border-radius:22px;
  width:min(430px,100%);padding:2.2rem 2rem 2rem;
  box-shadow:0 28px 80px rgba(0,0,0,.25);
  position:relative;animation:atUp .32s cubic-bezier(.22,1,.36,1) both;
}
@keyframes atUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
/* logo */
.at-logo{display:flex;align-items:center;gap:.65rem;justify-content:center;margin-bottom:1.4rem}
.at-logo span{font-family:'Arvo',serif;font-size:1.25rem;font-weight:700;color:var(--at-green)}
/* heading */
#at-modal h2{font-family:'Arvo',serif;font-size:1.35rem;font-weight:700;color:var(--at-green);
  text-align:center;margin-bottom:.25rem}
.at-sub{text-align:center;color:var(--at-muted);font-size:.86rem;margin-bottom:1.4rem}
/* tabs */
.at-tabs{display:flex;gap:.4rem;background:#ede9df;border-radius:10px;padding:4px;margin-bottom:1.4rem}
.at-tab{flex:1;text-align:center;padding:.48rem;border-radius:7px;cursor:pointer;font-size:.86rem;
  font-weight:600;color:var(--at-muted);transition:all .2s;border:none;background:none;font-family:inherit}
.at-tab.active{background:#fff;color:var(--at-green);box-shadow:0 2px 8px rgba(0,0,0,.08)}
/* messages */
.at-err{background:#fde8e8;color:#c0392b;border-radius:8px;padding:.6rem .85rem;
  font-size:.84rem;margin-bottom:.8rem;display:none;line-height:1.45}
.at-ok{background:#e6f4ea;color:#1a3d2b;border-radius:8px;padding:.6rem .85rem;
  font-size:.84rem;margin-bottom:.8rem;display:none;line-height:1.45}
/* fields */
.at-field{display:flex;flex-direction:column;gap:.3rem;margin-bottom:.9rem}
.at-field label{font-size:.78rem;font-weight:600;color:var(--at-text)}
.at-field input{border:1.5px solid var(--at-border);border-radius:9px;padding:.72rem .95rem;
  font-size:.9rem;font-family:inherit;color:var(--at-text);background:#fff;
  transition:border-color .2s;outline:none}
.at-field input:focus{border-color:var(--at-green)}
/* main button */
.at-btn{width:100%;background:var(--at-orange);color:#fff;border:none;
  padding:.85rem;border-radius:10px;font-weight:700;font-size:.94rem;cursor:pointer;
  margin-top:.3rem;transition:background .2s,transform .12s;font-family:inherit}
.at-btn:hover{background:#d96e1a;transform:translateY(-1px)}
.at-btn:disabled{background:#ccc;transform:none;cursor:not-allowed}
/* divider */
.at-divider{display:flex;align-items:center;gap:.7rem;margin:.9rem 0}
.at-divider::before,.at-divider::after{content:'';flex:1;height:1px;background:var(--at-border)}
.at-divider span{font-size:.78rem;color:var(--at-muted);white-space:nowrap}
/* google button */
.at-google-btn{
  width:100%;display:flex;align-items:center;justify-content:center;gap:.7rem;
  background:#fff;border:1.5px solid var(--at-border);border-radius:10px;
  padding:.75rem;cursor:pointer;font-size:.9rem;font-weight:600;color:var(--at-text);
  font-family:inherit;transition:border-color .2s,box-shadow .2s;
}
.at-google-btn:hover{border-color:#4285f4;box-shadow:0 2px 12px rgba(66,133,244,.15)}
.at-google-btn svg{width:18px;height:18px;flex-shrink:0}
/* forgot password link */
.at-forgot{display:block;text-align:right;font-size:.79rem;color:var(--at-green);
  cursor:pointer;margin-top:-.5rem;margin-bottom:.7rem;text-decoration:underline;
  background:none;border:none;font-family:inherit;}
.at-forgot:hover{color:var(--at-orange)}
/* back link */
.at-back{display:inline-flex;align-items:center;gap:.3rem;font-size:.82rem;
  color:var(--at-muted);cursor:pointer;border:none;background:none;margin-bottom:1rem;
  font-family:inherit;padding:0}
.at-back:hover{color:var(--at-green)}
/* close */
.at-close{position:absolute;top:14px;right:16px;background:none;border:none;
  font-size:1.35rem;cursor:pointer;color:var(--at-muted);line-height:1;padding:2px}
/* nav widget */
#at-nav-widget{display:flex;align-items:center;gap:.9rem}
#at-bell-wrap{position:relative;cursor:pointer}
#at-bell{font-size:1.3rem;color:rgba(255,255,255,.8)}
#at-badge{
  position:absolute;top:-4px;right:-5px;
  background:#e53935;color:#fff;font-size:.6rem;font-weight:700;
  width:16px;height:16px;border-radius:50%;display:none;
  align-items:center;justify-content:center;
  border:2px solid #1a2744;
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
  background:linear-gradient(135deg,#1a3d2b,#e8671a);
  display:flex;align-items:center;justify-content:center;
  color:#fff;font-weight:700;font-size:.88rem;cursor:pointer;position:relative;
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
/* snackbar */
#at-snack{
  display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
  background:#1a3d2b;color:#fff;padding:.9rem 1.7rem;border-radius:14px;
  font-size:.9rem;font-weight:600;z-index:9998;
  box-shadow:0 8px 30px rgba(0,0,0,.2);white-space:nowrap;
}
.at-nav-login-btn{
  background:var(--accent,#e8a020);color:#1a2744;
  padding:.45rem 1.1rem;border-radius:6px;font-weight:700;font-size:.88rem;
  border:none;cursor:pointer;transition:background .2s;
}
.at-nav-login-btn:hover{background:#f5c842;}
`;
const style = document.createElement("style");
style.textContent = css;
document.head.appendChild(style);

// Arvo font for logo
const font = document.createElement("link");
font.rel = "stylesheet";
font.href = "https://fonts.googleapis.com/css2?family=Arvo:wght@400;700&display=swap";
document.head.appendChild(font);

// ── Modal HTML ────────────────────────────────────────────────
const GOOGLE_SVG = `<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.1-6.1C34.46 3.14 29.5 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.11 5.52C12.46 13.67 17.76 9.5 24 9.5z"/><path fill="#4285F4" d="M46.14 24.5c0-1.64-.15-3.22-.42-4.74H24v8.98h12.46c-.54 2.9-2.17 5.36-4.62 7.02l7.1 5.52C43.22 37.56 46.14 31.5 46.14 24.5z"/><path fill="#FBBC05" d="M10.75 28.26A14.55 14.55 0 0 1 9.5 24c0-1.48.25-2.91.7-4.26l-7.11-5.52A22.94 22.94 0 0 0 1 24c0 3.7.88 7.2 2.44 10.28l7.31-6.02z"/><path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.5-4.94l-7.1-5.52C28.54 38.24 26.4 39 24 39c-6.24 0-11.54-4.17-13.44-9.74l-7.31 6.02C6.83 43.38 14.74 47 24 47z"/></svg>`;

document.body.insertAdjacentHTML("beforeend", `
<div id="at-overlay">
  <div id="at-modal">
    <button class="at-close" id="at-close-btn" aria-label="Bağla">✕</button>
    <div class="at-logo">
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="#1a3d2b"/>
        <path d="M8 30 L20 10 L32 30" stroke="#e8671a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M12 24 L28 24" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="20" cy="10" r="2.5" fill="#e8671a"/>
      </svg>
      <span>AciqTehsil</span>
    </div>

    <div id="at-err" class="at-err"></div>
    <div id="at-ok"  class="at-ok"></div>

    <!-- ── TAB BAR (hidden on forgot-pw screen) ── -->
    <div class="at-tabs" id="at-tabs-bar">
      <button class="at-tab active" id="at-tab-login"   onclick="AT._switchTab('login')">Daxil ol</button>
      <button class="at-tab"        id="at-tab-reg"     onclick="AT._switchTab('register')">Qeydiyyat</button>
    </div>

    <!-- ── LOGIN FORM ── -->
    <div id="at-login-form">
      <div class="at-field"><label>E-poçt</label><input type="email"    id="at-l-email" placeholder="email@example.com"/></div>
      <div class="at-field"><label>Şifrə</label> <input type="password" id="at-l-pass"  placeholder="••••••••"/></div>
      <button class="at-forgot" onclick="AT._switchTab('forgot')">Şifrəni unutdunuz?</button>
      <button class="at-btn" id="at-login-btn" onclick="AT._doLogin()">Daxil ol</button>
      <div class="at-divider"><span>və ya</span></div>
      <button class="at-google-btn" onclick="AT._doGoogle()">${GOOGLE_SVG} Google ilə daxil ol</button>
    </div>

    <!-- ── REGISTER FORM ── -->
    <div id="at-reg-form" style="display:none">
      <div class="at-field"><label>Ad Soyad</label><input type="text"     id="at-r-name"  placeholder="Adınız Soyadınız"/></div>
      <div class="at-field"><label>E-poçt</label>  <input type="email"    id="at-r-email" placeholder="email@example.com"/></div>
      <div class="at-field"><label>Şifrə</label>   <input type="password" id="at-r-pass"  placeholder="Minimum 6 simvol"/></div>
      <button class="at-btn" id="at-reg-btn" onclick="AT._doRegister()">Qeydiyyatdan keç</button>
      <div class="at-divider"><span>və ya</span></div>
      <button class="at-google-btn" onclick="AT._doGoogle()">${GOOGLE_SVG} Google ilə qeydiyyat</button>
    </div>

    <!-- ── FORGOT PASSWORD FORM ── -->
    <div id="at-forgot-form" style="display:none">
      <button class="at-back" onclick="AT._switchTab('login')">← Geri qayıt</button>
      <h2 style="margin-bottom:.3rem">Şifrəni sıfırla</h2>
      <p class="at-sub">E-poçt ünvanınızı daxil edin. Şifrə sıfırlama linki göndərəcəyik.</p>
      <div class="at-field"><label>E-poçt</label><input type="email" id="at-fp-email" placeholder="email@example.com"/></div>
      <button class="at-btn" id="at-fp-btn" onclick="AT._doReset()">Sıfırlama linki göndər</button>
    </div>
  </div>
</div>
<div id="at-snack"></div>
`);

// ── Nav widget ────────────────────────────────────────────────
function injectNavWidget() {
  const slot = document.getElementById("at-nav-slot");
  if (!slot) return;
  slot.innerHTML = `
    <div id="at-nav-widget">
      <div id="at-logged-out">
        <button class="at-nav-login-btn" onclick="AT.openModal()">Daxil ol</button>
      </div>
      <div id="at-logged-in" style="display:none;align-items:center;gap:.9rem">
        <div id="at-bell-wrap" onclick="AT._toggleNotif()">
          <span id="at-bell">🔔</span>
          <div id="at-badge">1</div>
          <div id="at-notif-drop">
            <div class="at-notif-item">🎉 Hesabınız uğurla aktivləşdirildi!</div>
          </div>
        </div>
        <div style="position:relative">
          <div id="at-avatar" onclick="AT._toggleUserDrop()">?</div>
          <div id="at-user-drop">
            <span class="at-drop-item" id="at-user-name-label" style="font-weight:700;cursor:default"></span>
            <hr class="at-drop-sep">
            <a class="at-drop-item" href="profil.html" style="text-decoration:none">👤 Profil</a>
            <span class="at-drop-item" onclick="AT._logout()">🚪 Çıxış</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
injectNavWidget();

// ── State ─────────────────────────────────────────────────────
let _currentUser   = null;
let _pendingCallback = null;

// ── Auth state observer ───────────────────────────────────────
onAuthChange(async (user) => {
  _currentUser = user;
  const loggedIn  = document.getElementById("at-logged-in");
  const loggedOut = document.getElementById("at-logged-out");
  const avatar    = document.getElementById("at-avatar");
  const badge     = document.getElementById("at-badge");
  const nameLabel = document.getElementById("at-user-name-label");

  if (user) {
    if (loggedIn)  loggedIn.style.display  = "flex";
    if (loggedOut) loggedOut.style.display = "none";
    const profile = await getUserProfile(user.uid).catch(() => null);
    const name    = profile?.displayName || user.displayName || user.email;
    if (avatar)    avatar.textContent    = name.charAt(0).toUpperCase();
    if (nameLabel) nameLabel.textContent = name;
    if (profile && !profile.notified && badge) badge.classList.add("show");
    closeModal();
    if (_pendingCallback) { _pendingCallback(); _pendingCallback = null; }
  } else {
    if (loggedIn)  loggedIn.style.display  = "none";
    if (loggedOut) loggedOut.style.display = "flex";
  }
});

// ── Modal open / close ────────────────────────────────────────
function openModal(tab = "login") {
  document.getElementById("at-overlay").classList.add("open");
  switchTab(tab);
  clearMessages();
}
function closeModal() {
  document.getElementById("at-overlay").classList.remove("open");
}
document.getElementById("at-close-btn").addEventListener("click", closeModal);
document.getElementById("at-overlay").addEventListener("click", e => {
  if (e.target === document.getElementById("at-overlay")) closeModal();
});

// ── Tab switch ────────────────────────────────────────────────
function switchTab(tab) {
  const isForgot  = tab === "forgot";
  const isLogin   = tab === "login";

  document.getElementById("at-login-form").style.display  = isLogin   ? "block" : "none";
  document.getElementById("at-reg-form").style.display    = tab === "register" ? "block" : "none";
  document.getElementById("at-forgot-form").style.display = isForgot  ? "block" : "none";
  document.getElementById("at-tabs-bar").style.display    = isForgot  ? "none"  : "flex";

  document.getElementById("at-tab-login").classList.toggle("active", isLogin);
  document.getElementById("at-tab-reg").classList.toggle("active",   tab === "register");
  clearMessages();

  // Focus first input in the active form
  const focusMap = { login: "at-l-email", register: "at-r-name", forgot: "at-fp-email" };
  setTimeout(() => document.getElementById(focusMap[tab])?.focus(), 80);
}

// ── Messages ──────────────────────────────────────────────────
function clearMessages() {
  ["at-err","at-ok"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = "none"; el.textContent = ""; }
  });
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

// ── Enter key support ─────────────────────────────────────────
// Any keydown inside the modal — if Enter pressed, submit the active form
document.getElementById("at-modal").addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const active = ["at-login-form","at-reg-form","at-forgot-form"]
    .find(id => document.getElementById(id).style.display !== "none");
  if (active === "at-login-form")  { e.preventDefault(); doLogin();   }
  if (active === "at-reg-form")    { e.preventDefault(); doRegister(); }
  if (active === "at-forgot-form") { e.preventDefault(); doReset();   }
});

// ── Login ─────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById("at-l-email").value.trim();
  const pass  = document.getElementById("at-l-pass").value;
  if (!email || !pass) { showErr("Zəhmət olmasa bütün sahələri doldurun."); return; }
  const btn = document.getElementById("at-login-btn");
  btn.disabled = true; btn.textContent = "Yüklənir...";
  try {
    const user = await loginUser(email, pass);
    if (!user.emailVerified) {
      showErr("E-poçtunuzu təsdiqləyin. Zəhmət olmasa gələn qutunuzu yoxlayın.");
      await logoutUser();
    }
  } catch (e) {
    showErr({
      "auth/user-not-found":    "Bu e-poçt ilə hesab tapılmadı.",
      "auth/wrong-password":    "Şifrə yanlışdır.",
      "auth/invalid-email":     "E-poçt formatı düzgün deyil.",
      "auth/invalid-credential":"E-poçt və ya şifrə yanlışdır.",
      "auth/too-many-requests": "Çox sayda cəhd. Bir az gözləyin."
    }[e.code] || "Xəta: " + e.message);
  } finally {
    btn.disabled = false; btn.textContent = "Daxil ol";
  }
}

// ── Register ──────────────────────────────────────────────────
async function doRegister() {
  const name  = document.getElementById("at-r-name").value.trim();
  const email = document.getElementById("at-r-email").value.trim();
  const pass  = document.getElementById("at-r-pass").value;
  if (!name || !email || !pass) { showErr("Zəhmət olmasa bütün sahələri doldurun."); return; }
  if (pass.length < 6)          { showErr("Şifrə minimum 6 simvol olmalıdır."); return; }
  const btn = document.getElementById("at-reg-btn");
  btn.disabled = true; btn.textContent = "Qeydiyyat...";
  try {
    await registerUser(email, pass, name);
    await logoutUser();
    showOk("✅ Qeydiyyat uğurlu! " + email + " ünvanına təsdiq e-poçtu göndərildi. E-poçtunuzu təsdiqləyib daxil ola bilərsiniz.");
  } catch (e) {
    showErr({
      "auth/email-already-in-use": "Bu e-poçt artıq qeydiyyatdan keçib.",
      "auth/invalid-email":        "E-poçt formatı düzgün deyil.",
      "auth/weak-password":        "Şifrə çox zəifdir."
    }[e.code] || "Xəta: " + e.message);
  } finally {
    btn.disabled = false; btn.textContent = "Qeydiyyatdan keç";
  }
}

// ── Google sign-in / sign-up ──────────────────────────────────
async function doGoogle() {
  clearMessages();
  try {
    await loginWithGoogle();
    // onAuthChange fires → closes modal + runs pendingCallback automatically
  } catch (e) {
    if (e.code === "auth/popup-closed-by-user") return; // user cancelled — silent
    showErr({
      "auth/popup-blocked": "Popup bloklandı. Brauzerdə popup-lara icazə verin.",
      "auth/cancelled-popup-request": ""
    }[e.code] || "Google xətası: " + e.message);
  }
}

// ── Forgot password ───────────────────────────────────────────
async function doReset() {
  const email = document.getElementById("at-fp-email").value.trim();
  if (!email) { showErr("Zəhmət olmasa e-poçt ünvanını daxil edin."); return; }
  const btn = document.getElementById("at-fp-btn");
  btn.disabled = true; btn.textContent = "Göndərilir...";
  try {
    await resetPassword(email);
    showOk("✅ Şifrə sıfırlama linki " + email + " ünvanına göndərildi. E-poçtunuzu yoxlayın.");
    document.getElementById("at-fp-email").value = "";
  } catch (e) {
    showErr({
      "auth/user-not-found": "Bu e-poçt ilə hesab tapılmadı.",
      "auth/invalid-email":  "E-poçt formatı düzgün deyil."
    }[e.code] || "Xəta: " + e.message);
  } finally {
    btn.disabled = false; btn.textContent = "Sıfırlama linki göndər";
  }
}

// ── Logout ────────────────────────────────────────────────────
async function doLogout() {
  await logoutUser();
  document.getElementById("at-user-drop").classList.remove("open");
}

// ── Notification drop ─────────────────────────────────────────
function toggleNotif() {
  const drop  = document.getElementById("at-notif-drop");
  const badge = document.getElementById("at-badge");
  drop.classList.toggle("open");
  if (drop.classList.contains("open") && _currentUser) {
    badge.classList.remove("show");
    markNotified(_currentUser.uid).catch(() => {});
  }
  document.getElementById("at-user-drop").classList.remove("open");
}

// ── User drop ─────────────────────────────────────────────────
function toggleUserDrop() {
  document.getElementById("at-user-drop").classList.toggle("open");
  document.getElementById("at-notif-drop").classList.remove("open");
}

// Close dropdowns on outside click
document.addEventListener("click", e => {
  if (!e.target.closest("#at-bell-wrap"))
    document.getElementById("at-notif-drop")?.classList.remove("open");
  if (!e.target.closest("#at-avatar") && !e.target.closest("#at-user-drop"))
    document.getElementById("at-user-drop")?.classList.remove("open");
});

// ── Snackbar ──────────────────────────────────────────────────
function showSnack(msg) {
  const el = document.getElementById("at-snack");
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = "none"; }, 3500);
}

// ── requireLogin ──────────────────────────────────────────────
function requireLogin(callback) {
  if (_currentUser) { callback(); return; }
  _pendingCallback = callback;
  showSnack("🔒 Bu bölməyə daxil olmaq üçün hesabınıza girin");
  openModal("login");
}

// ── Public API ────────────────────────────────────────────────
window.AT = {
  openModal,
  closeModal,
  requireLogin,
  get currentUser() { return _currentUser; },
  _switchTab:     switchTab,
  _doLogin:       doLogin,
  _doRegister:    doRegister,
  _doGoogle:      doGoogle,
  _doReset:       doReset,
  _logout:        doLogout,
  _toggleNotif:   toggleNotif,
  _toggleUserDrop:toggleUserDrop,
  showSnack,
};

window.dispatchEvent(new Event("at-ready"));
