'use strict';

const state = {
  screen: 'login', step: 1,
  phone: '', otp: '', password: '', fullName: '', profileImageUrl: null,
  resendSecs: 0, resendTimer: null,
};

const $  = id  => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  i18n.apply();
  $$('.screen').forEach(s => s.classList.remove('active'));
  $(`screen-${state.screen}`)?.classList.add('active');
  state.screen === 'register' ? renderRegister() : renderLogin();
  $$('.lang-btn').forEach(b => b.textContent = i18n.t('switchLang'));
}

function renderLogin() {
  $('login-title').textContent    = i18n.t('loginTitle');
  $('login-sub').textContent      = i18n.t('loginSubtitle');
  $('login-phone-lbl').textContent = i18n.t('phoneLabel');
  $('login-phone').placeholder    = i18n.t('phonePlaceholder');
  $('login-pass-lbl').textContent  = i18n.t('passLabel');
  $('login-btn').querySelector('.btn-text').textContent = i18n.t('loginBtn');
  $('no-account-txt').textContent  = i18n.t('noAccount');
  $('go-register').textContent     = i18n.t('registerNow');
}

function renderRegister() {
  // Progress circles
  for (let i = 1; i <= 4; i++) {
    const c = $(`step-${i}`), l = $(`line-${i}`);
    c.classList.remove('active','done');
    if (i < state.step)  c.classList.add('done');
    if (i === state.step) c.classList.add('active');
    if (l) l.classList.toggle('done', i < state.step);
  }
  $$('.step-content').forEach(s => s.classList.remove('active'));
  $(`step-content-${state.step}`)?.classList.add('active');
  showStepButtons(state.step);

  const txt = (arKey, enKey) => i18n.isArabic() ? i18n.t(arKey) : i18n.t(enKey || arKey);

  if (state.step === 1) {
    $('s1-title').textContent    = i18n.t('phoneTitle');
    $('s1-sub').textContent      = i18n.t('phoneSubtitle');
    $('s1-label').textContent    = i18n.t('phoneLabel');
    $('s1-phone').placeholder    = i18n.t('phonePlaceholder');
    $('btn-send').querySelector('.btn-text').textContent = i18n.t('sendCode');
  }
  if (state.step === 2) {
    $('s2-title').textContent  = i18n.t('otpTitle');
    $('s2-sub').textContent    = i18n.t('otpSubtitle');
    $('s2-no-otp').textContent = i18n.t('didntReceive');
    $('btn-verify').querySelector('.btn-text').textContent = i18n.t('confirmCode');
    updateResendBtn();
  }
  if (state.step === 3) {
    $('s3-title').textContent    = i18n.t('passTitle');
    $('s3-sub').textContent      = i18n.t('passSubtitle');
    $('s3-p-label').textContent  = i18n.t('passLabel');
    $('s3-cp-label').textContent = i18n.t('confirmPassLabel');
    $('s3-pass').placeholder = $('s3-cpass').placeholder = i18n.t('passPh');
    $('btn-pass').querySelector('.btn-text').textContent = i18n.t('continueBtn');
  }
  if (state.step === 4) {
    $('s4-title').textContent      = i18n.t('profileTitle');
    $('s4-sub').textContent        = i18n.t('profileSubtitle');
    $('s4-name-lbl').textContent   = i18n.t('nameLabel');
    $('s4-name').placeholder       = i18n.t('namePh');
    $('photo-label').textContent   = i18n.t('addPhoto');
    $('btn-create').querySelector('.btn-text').textContent = i18n.t('createAccount');
    $('btn-skip').querySelector('.btn-text').textContent   = i18n.t('skipPhoto');
  }
  $('have-account-txt').textContent = i18n.t('haveAccount');
  $('go-login').textContent         = i18n.t('signInNow');
}

function showStepButtons(step) {
  ['btn-send','btn-verify','btn-pass','btn-create','btn-skip']
    .forEach(id => { const el=$(id); if(el) el.style.display='none'; });
  const map = { 1:['btn-send'], 2:['btn-verify'], 3:['btn-pass'], 4:['btn-create','btn-skip'] };
  (map[step]||[]).forEach(id => { const el=$(id); if(el) el.style.display='flex'; });
}

// ── Navigation ────────────────────────────────────────────────────────────────
function goTo(screen)  { state.screen=screen; state.step=1; clearAllErrors(); render(); }
function goToStep(s)   { state.step=s; clearAllErrors(); render(); window.scrollTo({top:0,behavior:'smooth'}); }

// ── Errors ────────────────────────────────────────────────────────────────────
function showError(id, msg) {
  const realId = id==='reg-error' ? `reg-error-${state.step}` : id;
  const el = $(realId); if(!el) return;
  el.textContent = i18n.t(msg) || msg;
  el.classList.add('visible');
}
function clearError(id) {
  const el = $(id); if(el){ el.textContent=''; el.classList.remove('visible'); }
}
function clearAllErrors() {
  for(let i=1;i<=4;i++) clearError(`reg-error-${i}`);
  clearError('login-error');
}

// ── Loading ───────────────────────────────────────────────────────────────────
function setLoading(btnId, on) { const b=$(btnId); if(!b) return; b.classList.toggle('loading',on); b.disabled=on; }

// ── Validation ────────────────────────────────────────────────────────────────
const isValidPhone = p => /^(010|011|012|015)\d{8}$/.test(p.trim());

// ── OTP timer ─────────────────────────────────────────────────────────────────
function startResendTimer() {
  state.resendSecs = 45;
  clearInterval(state.resendTimer);
  $('btn-resend').disabled = true;
  updateResendBtn();
  state.resendTimer = setInterval(() => {
    state.resendSecs--;
    updateResendBtn();
    if (state.resendSecs <= 0) { clearInterval(state.resendTimer); $('btn-resend').disabled = false; }
  }, 1000);
}
function updateResendBtn() {
  const btn = $('btn-resend'); if(!btn) return;
  btn.textContent = state.resendSecs > 0
    ? i18n.t('resendTimer').replace('{s}', state.resendSecs)
    : i18n.t('resendNow');
}

// ── OTP boxes ─────────────────────────────────────────────────────────────────
function initOtp() {
  const boxes = $$('.otp-input');
  boxes.forEach((inp, i) => {
    inp.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/g,'');
      if (val.length > 1) {
        [...val.slice(0,6)].forEach((ch,j) => { if(boxes[j]){boxes[j].value=ch; boxes[j].closest('.otp-box').classList.add('filled');} });
        boxes[Math.min(5,val.length-1)].focus(); return;
      }
      e.target.value = val;
      e.target.closest('.otp-box').classList.toggle('filled', !!val);
      if (val && boxes[i+1]) boxes[i+1].focus();
    });
    inp.addEventListener('keydown', e => {
      if (e.key==='Backspace' && !e.target.value && boxes[i-1]) {
        boxes[i-1].focus();
        boxes[i-1].closest('.otp-box').classList.remove('filled');
      }
    });
  });
}
const getOtp = () => [...$$('.otp-input')].map(i=>i.value).join('');
function clearOtp() { $$('.otp-input').forEach(i=>{i.value='';i.closest('.otp-box').classList.remove('filled');}); $$('.otp-input')[0]?.focus(); }

// ── Password strength ─────────────────────────────────────────────────────────
function updateStrength(v) {
  const fill = $('strength-fill'); if(!fill) return;
  let s=0;
  if(v.length>=8) s++; if(/[A-Z]/.test(v)) s++; if(/[0-9]/.test(v)) s++; if(/[^A-Za-z0-9]/.test(v)) s++;
  fill.style.width = `${(s/4)*100}%`;
  fill.style.background = s<=1?'#DC3545':s===2?'#FFC107':s===3?'#28A745':'#D4AF37';
}

// ── Photo upload ──────────────────────────────────────────────────────────────
function initPhoto() {
  const inp=$('photo-input'), wrap=$('photo-wrap'), img=$('photo-preview');
  wrap.addEventListener('click', ()=>inp.click());
  inp.addEventListener('change', e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{ img.src=ev.target.result; img.style.display='block'; wrap.classList.add('has-image'); state.profileImageUrl=ev.target.result; };
    reader.readAsDataURL(file);
  });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, dur=2800) {
  const t=$('toast'); t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),dur);
}

// ── STEP 1: Send OTP ──────────────────────────────────────────────────────────
async function handleSendOtp() {
  clearAllErrors();
  const phone = $('s1-phone').value.trim();
  if (!isValidPhone(phone)) { showError('reg-error','invalidPhone'); return; }
  state.phone = phone;
  setLoading('btn-send', true);

  const res = await ToshkaAPI.Auth.sendOtp(phone);
  setLoading('btn-send', false);

  if (res?.success) {
    goToStep(2); startResendTimer();
    setTimeout(()=>$$('.otp-input')[0]?.focus(), 300);
  } else {
    showError('reg-error', mapError(res));
  }
}

// ── STEP 2: Verify OTP ────────────────────────────────────────────────────────
function handleVerifyOtp() {
  const otp = getOtp();
  if (otp.length < 6) { showError('reg-error','invalidOtp'); return; }
  state.otp = otp;
  goToStep(3);
  setTimeout(()=>$('s3-pass')?.focus(), 300);
}

async function handleResend() {
  clearOtp();
  setLoading('btn-verify', true);
  const res = await ToshkaAPI.Auth.sendOtp(state.phone);
  setLoading('btn-verify', false);
  if (res?.success) { startResendTimer(); showToast('✅ تم إرسال رمز جديد'); }
  else showError('reg-error', mapError(res));
}

// ── STEP 3: Password ──────────────────────────────────────────────────────────
function handleSetPassword() {
  clearAllErrors();
  const pass = $('s3-pass').value, cpass = $('s3-cpass').value;
  if (!pass)           { showError('reg-error','fieldRequired'); return; }
  if (pass.length < 8) { showError('reg-error','passTooShort');  return; }
  if (pass !== cpass)  { showError('reg-error','passMismatch');  return; }
  state.password = pass;
  goToStep(4);
  setTimeout(()=>$('s4-name')?.focus(), 300);
}

// ── STEP 4: Create Account ────────────────────────────────────────────────────
async function handleCreateAccount(skipPhoto=false) {
  clearAllErrors();
  const name = $('s4-name').value.trim();
  if (!name) { showError('reg-error','fieldRequired'); return; }
  state.fullName = name;
  setLoading(skipPhoto ? 'btn-skip' : 'btn-create', true);

  const res = await ToshkaAPI.Auth.register({
    phoneNumber:     state.phone,
    otpCode:         state.otp,
    fullName:        state.fullName,
    password:        state.password,
    profileImageUrl: skipPhoto ? null : state.profileImageUrl
  });

  setLoading(skipPhoto ? 'btn-skip' : 'btn-create', false);
  if (res?.success && res.data) {
    Session.save(res.data);
    showToast('✅ تم إنشاء الحساب بنجاح');
    setTimeout(()=>window.location.href = Session.roleRoute(), 800);
  } else {
    showError('reg-error', mapError(res));
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────
async function handleLogin() {
  clearAllErrors();
  const phone = $('login-phone').value.trim();
  const pass  = $('login-pass').value;
  if (!isValidPhone(phone)) { showError('login-error','invalidPhone'); return; }
  if (!pass)                 { showError('login-error','fieldRequired'); return; }

  setLoading('login-btn', true);
  const res = await ToshkaAPI.Auth.login({ phoneNumber: phone, password: pass });
  setLoading('login-btn', false);

  if (res?.success && res.data) {
    Session.save(res.data);
    showToast('✅ تم تسجيل الدخول');
    setTimeout(()=>window.location.href = Session.roleRoute(), 800);
  } else {
    showError('login-error', mapError(res));
  }
}

// ── Bindings ──────────────────────────────────────────────────────────────────
function bindEvents() {
  $$('.lang-btn').forEach(btn => btn.addEventListener('click', ()=>{ i18n.toggle(); render(); }));
  $('go-register')?.addEventListener('click', ()=>goTo('register'));
  $('go-login')?.addEventListener('click',    ()=>goTo('login'));

  $('login-btn')?.addEventListener('click', handleLogin);
  $('login-phone')?.addEventListener('keydown', e=>e.key==='Enter'&&$('login-pass')?.focus());
  $('login-pass')?.addEventListener('keydown',  e=>e.key==='Enter'&&handleLogin());
  $('login-eye')?.addEventListener('click', ()=>{
    const i=$('login-pass'); i.type=i.type==='password'?'text':'password';
    $('login-eye').innerHTML = i.type==='password' ? EYE_SHOW : EYE_HIDE;
  });

  $('btn-send')?.addEventListener('click', handleSendOtp);
  $('s1-phone')?.addEventListener('keydown', e=>e.key==='Enter'&&handleSendOtp());

  $('btn-verify')?.addEventListener('click', handleVerifyOtp);
  $('btn-resend')?.addEventListener('click', handleResend);

  $('btn-pass')?.addEventListener('click', handleSetPassword);
  $('s3-pass')?.addEventListener('input', e=>updateStrength(e.target.value));
  $('s3-eye')?.addEventListener('click', ()=>{
    const i=$('s3-pass'); i.type=i.type==='password'?'text':'password';
    $('s3-eye').innerHTML = i.type==='password' ? EYE_SHOW : EYE_HIDE;
  });

  $('btn-create')?.addEventListener('click', ()=>handleCreateAccount(false));
  $('btn-skip')?.addEventListener('click',   ()=>handleCreateAccount(true));
}

const EYE_SHOW = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_HIDE = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>`;

document.addEventListener('DOMContentLoaded', () => {
  if (Session.isLoggedIn()) { window.location.href = Session.roleRoute(); return; }
  initOtp(); initPhoto(); bindEvents(); render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
});
