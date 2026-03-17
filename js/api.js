/**
 * Toshka Salon — API Client v3
 * Flow: send-otp → verify-otp → complete-profile (if new)
 */

const API_BASE = 'https://toshka.runasp.net';

// ─── Enums ────────────────────────────────────────────────────────────────────
const BarberStatus = {
  Available: 0, Break: 1, Closed: 2,
  // Backend: 0=Available, 1=Break(استراحة), 2=NotAvailable(مغلق)
  label: { 0:'متاح', 1:'استراحة', 2:'مغلق' },
  css:   { 0:'st-avail', 1:'st-break', 2:'st-offlin' }
};
const BookingType = {
  Normal: 0, Vip: 1,
  label: { 0:'✂️ عادي', 1:'⭐ VIP' }
};
const DevicePlatform = { Unknown:0, Android:1, iOS:2 };

// ─── Session ──────────────────────────────────────────────────────────────────
const Session = {
  save(d) {
    // يقبل res مباشرة (accessToken في الـ root أو في data)
    const src = d.data ?? d;
    localStorage.setItem('tk_token',  src.accessToken  ?? '');
    localStorage.setItem('tk_name',   src.fullName     ?? '');
    localStorage.setItem('tk_phone',  src.phoneNumber  ?? '');
    localStorage.setItem('tk_role',   src.role         ?? '');
    localStorage.setItem('tk_uid',    src.userId       ?? src.id ?? '');
    localStorage.setItem('tk_bid',    src.barberId     ?? '');
  },
  get() {
    return {
      token:    localStorage.getItem('tk_token')  || '',
      name:     localStorage.getItem('tk_name')   || '',
      phone:    localStorage.getItem('tk_phone')  || '',
      role:     localStorage.getItem('tk_role')   || '',
      userId:   localStorage.getItem('tk_uid')    || '',
      barberId: localStorage.getItem('tk_bid')    || '',
    };
  },
  clear() {
    ['tk_token','tk_name','tk_phone','tk_role','tk_uid','tk_bid']
      .forEach(k => localStorage.removeItem(k));
  },
  isLoggedIn() { return !!localStorage.getItem('tk_token'); },
  roleRoute() {
    const r = localStorage.getItem('tk_role') ?? '';
    const inApps = window.location.pathname.includes('/apps/');
    if (inApps) return r==='Admin'?'admin.html':r==='Barber'?'barber.html':'customer.html';
    return r==='Admin'?'apps/admin.html':r==='Barber'?'apps/barber.html':'apps/customer.html';
  }
};

// ─── HTTP ─────────────────────────────────────────────────────────────────────
async function https(method, path, body) {
  const h = { 'Content-Type': 'application/json' };
  const t = Session.get().token;
  if (t) h['Authorization'] = `Bearer ${t}`;
  try {
    const res = await fetch(API_BASE + path, {
      method, headers: h,
      body: body ? JSON.stringify(body) : undefined
    });
    // توكن منتهي → رجّع لصفحة الدخول
    if (res.status === 401) {
      Session.clear();
      const inApps = window.location.pathname.includes('/apps/');
      window.location.href = inApps ? '../index.html' : 'index.html';
      return { success: false, message: 'Unauthorized' };
    }
    const text = await res.text();
    let d; try { d = JSON.parse(text); } catch { d = { success: res.ok, message: text }; }
    if (typeof d === 'object' && d !== null && 'success' in d) return d;
    return { success: res.ok, data: d, message: res.ok ? null : (d?.message ?? 'خطأ') };
  } catch { return { success: false, message: 'networkError' }; }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
const Auth = {
  // الخطوة 1: إرسال OTP
  sendOtp: phone =>
    https('POST', '/api/Auth/send-otp', { phoneNumber: phone }),

  // الخطوة 2: التحقق من OTP
  // Response A (عنده حساب): { success, exists:true,  accessToken, fullName, role, ... }
  // Response B (جديد):      { success, exists:false, tempToken }
  verifyOtp: (phone, code) =>
    https('POST', '/api/Auth/verify-otp', { phoneNumber: phone, otpCode: code }),

  // الخطوة 3: استكمال البيانات (للجدد فقط)
  completeProfile: body =>
    https('POST', '/api/Auth/complete-profile', body),
};

// ─── UserAccount ──────────────────────────────────────────────────────────────
const UserAccount = {
  create:         body => https('POST',  '/api/UserAccount', body),
  getMe:          ()   => https('GET',   '/api/UserAccount/me'),
  updateMe:       body => https('PATCH', '/api/UserAccount/me', body),
  changePassword: body => https('PATCH', '/api/UserAccount/me/change-password', body),
};

// ─── BarberAccount ────────────────────────────────────────────────────────────
const BarberAccount = {
  getMe:     ()     => https('GET',   '/api/BarberAccount/me'),
  setStatus: status => https('PATCH', '/api/BarberAccount/me/status', { status }),
};

// ─── Barbers ──────────────────────────────────────────────────────────────────
const Barbers = {
  getAll:  ()   => https('GET',    '/api/Barbers'),
  getById: id   => https('GET',    `/api/Barbers/${id}`),
  create:  body => https('POST',   '/api/Barbers', body),
  delete:  id   => https('DELETE', `/api/Barbers/${id}`),
};

// ─── Queue ────────────────────────────────────────────────────────────────────
const Queue = {
  book:         body => https('POST', '/api/Queue/book', body),
  getEntries:   ()   => https('GET',  '/api/Queue/queue-entries'),
  myPosition:   ()   => https('GET',  '/api/Queue/my-position'),
  serveNext:    ()   => https('POST', '/api/Queue/barber/serve-next'),
  cancel:       ()   => https('POST', '/api/Queue/cancel'),
  markDone:     id   => https('POST', `/api/Queue/${id}/mark-as-done`),
  addToService: id   => https('POST', `/api/Queue/${id}/add-to-service`),
  moveBack:     id   => https('POST', `/api/Queue/${id}/move-back`),
  addWalkIn:    body => https('POST', '/api/Queue/add-book', body),
};

// ─── Ratings ──────────────────────────────────────────────────────────────────
const Ratings = {
  create:    body => https('POST', '/api/Ratings', body),
  getBarber: bid  => https('GET',  `/api/Ratings/barber/${bid}`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
const Notifications = {
  getAll:      (p=1, s=20) => https('GET',   `/api/Notifications?page=${p}&pageSize=${s}`),
  markAllRead: ()          => https('PATCH',  '/api/Notifications/mark-all-read'),
  regToken:    body        => https('POST',   '/api/Notifications/device-token', body),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
const Admin = {
  register: body => https('POST', '/api/Admin/register', body),
};

// ─── SignalR Hub ──────────────────────────────────────────────────────────────
class QueueSignalR {
  constructor() { this._conn = null; this._handlers = {}; }
  on(event, fn) { this._handlers[event] = fn; return this; }
  async connect() {
    if (typeof signalR === 'undefined') return console.warn('SignalR not loaded');
    if (this._conn) return;
    this._conn = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/queue`, { accessTokenFactory: () => Session.get().token })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
    this._conn.on('QueueUpdated',    (...a) => this._handlers['QueueUpdated']?.(...a));
    this._conn.on('PositionUpdated', (...a) => this._handlers['PositionUpdated']?.(...a));
    this._conn.onreconnected(() => this._handlers['reconnected']?.());
    try { await this._conn.start(); } catch(e) { console.warn('[SignalR]', e.message); }
  }
  async joinBarberGroup(id)  { try { await this._conn?.invoke('JoinBarberGroup', id); } catch {} }
  async leaveBarberGroup(id) { try { await this._conn?.invoke('LeaveBarberGroup', id); } catch {} }
  async joinUserGroup(id)    { try { await this._conn?.invoke('JoinUserGroup', id); } catch {} }
  async disconnect()         { try { await this._conn?.stop(); this._conn = null; } catch {} }
}

// ─── Error mapper ─────────────────────────────────────────────────────────────
function mapError(res) {
  const m = res?.message ?? '';
  const map = {
    networkError:  'خطأ في الاتصال. تحقق من الإنترنت.',
    OtpExpired:    'رمز التحقق غير صحيح أو منتهي الصلاحية. اطلب رمزاً جديداً.',
    SessionExpired:'انتهت صلاحية الجلسة. أعد التحقق من رقمك.',
    Unauthorized:  'غير مصرح. سجّل الدخول مجدداً.',
  };
  return map[m] || m || 'حدث خطأ، حاول مجدداً.';
}

// ─── Exports ──────────────────────────────────────────────────────────────────
window.ToshkaAPI    = { Auth, UserAccount, BarberAccount, Barbers, Queue, Ratings, Notifications, Admin };
window.Session      = Session;
window.BarberStatus = BarberStatus;
window.BookingType  = BookingType;
window.DevicePlatform = DevicePlatform;
window.QueueSignalR = QueueSignalR;
window.mapError     = mapError;
