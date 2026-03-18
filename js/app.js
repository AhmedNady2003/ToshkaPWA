'use strict';

// ── State ──────────────────────────────────────────────────────────────────────
const state = {
  phone:        '',
  tempToken:    '',    // من الـ Backend بعد verify-otp لو جديد
  resendSecs:   0,
  resendTimer:  null,
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const $   = id  => document.getElementById(id);
const $$  = sel => document.querySelectorAll(sel);

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $(id)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(id, msg) {
  const el = $(id); if (!el) return;
  el.textContent = msg;
  el.classList.add('visible');
}
function clearError(id) {
  const el = $(id); if (!el) return;
  el.textContent = '';
  el.classList.remove('visible');
}

function setLoading(btnId, on) {
  const b = $(btnId); if (!b) return;
  b.classList.toggle('loading', on);
  b.disabled = on;
}

function showToast(msg, dur = 2800) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

const isValidPhone = p => /^(010|011|012|015)\d{8}$/.test(p.trim());

// ── OTP Timer ─────────────────────────────────────────────────────────────────
function startResendTimer() {
  state.resendSecs = 45;
  clearInterval(state.resendTimer);
  const btn = $('btn-resend');
  if (btn) btn.disabled = true;
  updateResendBtn();
  state.resendTimer = setInterval(() => {
    state.resendSecs--;
    updateResendBtn();
    if (state.resendSecs <= 0) {
      clearInterval(state.resendTimer);
      const b = $('btn-resend'); if (b) b.disabled = false;
    }
  }, 1000);
}
function updateResendBtn() {
  const btn = $('btn-resend'); if (!btn) return;
  btn.textContent = state.resendSecs > 0
    ? `إعادة إرسال (${state.resendSecs}ث)`
    : 'إعادة الإرسال';
}

// ── OTP Boxes ─────────────────────────────────────────────────────────────────
function initOtpBoxes() {
  const boxes = $$('.otp-input');
  boxes.forEach((inp, i) => {
    inp.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/g, '');
      // لو نسخ 6 أرقام دفعة واحدة
      if (val.length > 1) {
        [...val.slice(0, 6)].forEach((ch, j) => {
          if (boxes[j]) {
            boxes[j].value = ch;
            boxes[j].closest('.otp-box').classList.add('filled');
          }
        });
        boxes[Math.min(5, val.length - 1)].focus();
        return;
      }
      e.target.value = val;
      e.target.closest('.otp-box').classList.toggle('filled', !!val);
      if (val && boxes[i + 1]) boxes[i + 1].focus();
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !e.target.value && boxes[i - 1]) {
        boxes[i - 1].focus();
        boxes[i - 1].closest('.otp-box').classList.remove('filled');
      }
    });
  });
}

function getOtp() {
  return [...$$('.otp-input')].map(i => i.value).join('');
}
function clearOtpBoxes() {
  $$('.otp-input').forEach(i => {
    i.value = '';
    i.closest('.otp-box').classList.remove('filled');
  });
  $$('.otp-input')[0]?.focus();
}

// ── Photo Upload ──────────────────────────────────────────────────────────────
function initPhoto() {
  const inp = $('photo-input'), wrap = $('photo-wrap'), img = $('photo-preview');
  if (!inp || !wrap) return;
  wrap.addEventListener('click', () => inp.click());
  inp.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      img.src = ev.target.result;
      img.style.display = 'block';
      wrap.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  });
}

// ── STEP 1: إرسال OTP ─────────────────────────────────────────────────────────
async function handleSendOtp() {
  clearError('phone-error');
  const phone = $('phone-input').value.trim();
  if (!isValidPhone(phone)) {
    showError('phone-error', 'أدخل رقم موبايل مصري صحيح (01x xxxx xxxx)');
    return;
  }
  state.phone = phone;
  setLoading('btn-send-otp', true);

  // ── DEV MODE: تخطي الـ OTP وإرسال 000000 تلقائياً ──────────────────────
  const res = await ToshkaAPI.Auth.verifyOtp(phone, '000000');
  setLoading('btn-send-otp', false);

  if (!res?.success) {
    showError('phone-error', mapError(res));
    return;
  }

  if (res.exists) {
    Session.save(res);
    showToast('✅ مرحباً بعودتك!');
    setTimeout(() => window.location.href = Session.roleRoute(), 700);
  } else {
    state.tempToken = res.tempToken;
    showScreen('screen-profile');
    setTimeout(() => $('profile-name')?.focus(), 300);
  }
}

// ── STEP 2: التحقق من OTP → verify-otp ───────────────────────────────────────
async function handleVerifyOtp() {
  clearError('otp-error');
  const otp = getOtp();
  if (otp.length < 6) {
    showError('otp-error', 'أدخل الرمز المكوّن من 6 أرقام كاملاً');
    return;
  }
  setLoading('btn-verify-otp', true);

  const res = await ToshkaAPI.Auth.verifyOtp(state.phone, otp);
  setLoading('btn-verify-otp', false);

  if (!res?.success) {
    showError('otp-error', mapError(res));
    return;
  }

  if (res.exists) {
    // ── عنده حساب → دخول مباشر ────────────────────────────────────────────
    Session.save(res);   // res فيه accessToken, fullName, role, ...
    showToast('✅ مرحباً بعودتك!');
    setTimeout(() => window.location.href = Session.roleRoute(), 700);
  } else {
    // ── جديد → استكمال البيانات ────────────────────────────────────────────
    state.tempToken = res.tempToken;
    showScreen('screen-profile');
    setTimeout(() => $('profile-name')?.focus(), 300);
  }
}

// ── إعادة إرسال OTP ────────────────────────────────────────────────────────────
async function handleResend() {
  clearOtpBoxes();
  clearError('otp-error');
  setLoading('btn-verify-otp', true);

  const res = await ToshkaAPI.Auth.sendOtp(state.phone);
  setLoading('btn-verify-otp', false);

  if (res?.success) { startResendTimer(); showToast('✅ تم إرسال رمز جديد'); }
  else showError('otp-error', mapError(res));
}

// ── STEP 3: استكمال البيانات → complete-profile ────────────────────────────────
async function handleCompleteProfile() {
  clearError('profile-error');
  const name  = $('profile-name').value.trim();
  const email = $('profile-email').value.trim();

  if (!name) { showError('profile-error', 'الاسم مطلوب'); return; }

  setLoading('btn-complete', true);

  const res = await ToshkaAPI.Auth.completeProfile({
    tempToken: state.tempToken,
    fullName:  name,
    email:     email || null,
  });

  setLoading('btn-complete', false);

  if (res?.success) {
    Session.save(res);   // res فيه accessToken, fullName, role, ...
    showToast('✅ تم إنشاء حسابك بنجاح!');
    setTimeout(() => window.location.href = Session.roleRoute(), 700);
  } else {
    showError('profile-error', mapError(res));
  }
}

// ── Lang toggle ───────────────────────────────────────────────────────────────
function bindLang() {
  $$('.lang-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      i18n.toggle();
      btn.textContent = i18n.t('switchLang');
    })
  );
}

// ── Bind Events ───────────────────────────────────────────────────────────────
function bindEvents() {
  // Step 1
  $('btn-send-otp')?.addEventListener('click', handleSendOtp);
  $('phone-input')?.addEventListener('keydown', e => e.key === 'Enter' && handleSendOtp());

  // Step 2
  $('btn-verify-otp')?.addEventListener('click', handleVerifyOtp);
  $('btn-resend')?.addEventListener('click', handleResend);
  $('btn-back-phone')?.addEventListener('click', () => {
    clearOtpBoxes(); clearError('otp-error');
    showScreen('screen-phone');
  });

  // Step 3
  $('btn-complete')?.addEventListener('click', handleCompleteProfile);
  $('profile-name')?.addEventListener('keydown', e => e.key === 'Enter' && $('profile-email')?.focus());
  $('profile-email')?.addEventListener('keydown', e => e.key === 'Enter' && handleCompleteProfile());

  bindLang();
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (Session.isLoggedIn()) {
    window.location.href = Session.roleRoute();
    return;
  }
  initOtpBoxes();
  initPhoto();
  bindEvents();

  if ('serviceWorker' in navigator)
    navigator.serviceWorker.register('/sw.js').catch(() => {});
});
