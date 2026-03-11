/**
 * Toshka Barber — API Client v2
 * Swagger v2 + SignalR QueueHub
 */

const API_BASE = 'https://toshka.runasp.net';

// ─── Enums ─────────────────────────────────────────────────────────────────────
const BarberStatus = {
  Available: 0, Busy: 1, Break: 2,
  label: { 0:'متاح', 1:'مشغول', 2:'استراحة' },
  css:   { 0:'st-avail', 1:'st-busy', 2:'st-break' }
};
const BookingType = {
  Normal: 0, Vip: 1,
  label: { 0:'✂️ عادي', 1:'⭐ VIP' }
};
const DevicePlatform = { Unknown:0, Android:1, iOS:2 };

// ─── Session ───────────────────────────────────────────────────────────────────
const Session = {
  save(d) {
    localStorage.setItem('tk_token',  d.accessToken  ?? '');
    localStorage.setItem('tk_name',   d.fullName     ?? '');
    localStorage.setItem('tk_phone',  d.phoneNumber  ?? '');
    localStorage.setItem('tk_role',   d.role         ?? '');
    localStorage.setItem('tk_uid',    d.userId       ?? d.id ?? '');
    localStorage.setItem('tk_bid',    d.barberId     ?? '');
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
  clear() { ['tk_token','tk_name','tk_phone','tk_role','tk_uid','tk_bid'].forEach(k=>localStorage.removeItem(k)); },
  isLoggedIn() { return !!localStorage.getItem('tk_token'); },
  roleRoute()  {
    const r = localStorage.getItem('tk_role') ?? '';
    const inApps = window.location.pathname.includes('/apps/');
    if (inApps) return r==='Admin'?'admin.html':r==='Barber'?'barber.html':'customer.html';
    return r==='Admin'?'apps/admin.html':r==='Barber'?'apps/barber.html':'apps/customer.html';
  }
};

// ─── https ──────────────────────────────────────────────────────────────────────
async function https(method, path, body) {
  const h = { 'Content-Type':'application/json' };
  const t = Session.get().token;
  if (t) h['Authorization'] = `Bearer ${t}`;
  try {
    const res  = await fetch(API_BASE + path, { method, headers:h, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let d; try { d = JSON.parse(text); } catch { d = { success:res.ok, message:text }; }
    if (typeof d === 'object' && d !== null && 'success' in d) return d;
    return { success:res.ok, data:d, message: res.ok ? null : (d?.message ?? 'خطأ') };
  } catch { return { success:false, message:'networkError' }; }
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
const Auth = {
  sendOtp:  phone => https('POST', '/api/Auth/send-otp', { phoneNumber:phone }),
  register: body  => https('POST', '/api/Auth/register', body),
  login:    body  => https('POST', '/api/Auth/login',    body),
};

// ─── UserAccount ───────────────────────────────────────────────────────────────
const UserAccount = {
  create:         body => https('POST',  '/api/UserAccount', body),
  getMe:          ()   => https('GET',   '/api/UserAccount/me'),
  updateMe:       body => https('PATCH', '/api/UserAccount/me', body),
  changePassword: body => https('PATCH', '/api/UserAccount/me/change-password', body),
};

// ─── BarberAccount (GET + status only — no PATCH me) ───────────────────────────
const BarberAccount = {
  getMe:     ()     => https('GET',   '/api/BarberAccount/me'),
  setStatus: status => https('PATCH', '/api/BarberAccount/me/status', { status }),
};

// ─── Barbers (admin CRUD) ─────────────────────────────────────────────────────
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
  serveNext:    ()   => https('POST', '/api/Queue/barber/serve-next'),          // no barberId
  cancel:       ()   => https('POST', '/api/Queue/cancel'),                     // no entryId – uses JWT
  markDone:     id   => https('POST', `/api/Queue/${id}/mark-as-done`),
  addToService: id   => https('POST', `/api/Queue/${id}/add-to-service`),
  moveBack:     id   => https('POST', `/api/Queue/${id}/move-back`),
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
      .withUrl(`${API_BASE}/hubs/queue`, {
        accessTokenFactory: () => Session.get().token,
        skipNegotiation: false,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Wire up events
    this._conn.on('QueueUpdated',    (...a) => this._handlers['QueueUpdated']?.(...a));
    this._conn.on('PositionUpdated', (...a) => this._handlers['PositionUpdated']?.(...a));

    this._conn.onreconnected(() => {
      console.log('[SignalR] reconnected'); this._handlers['reconnected']?.();
    });

    try {
      await this._conn.start();
      console.log('[SignalR] connected');
    } catch(e) { console.warn('[SignalR] connect failed', e.message); }
  }

  async joinBarberGroup(barberId) {
    try { await this._conn?.invoke('JoinBarberGroup', barberId); } catch(e) { console.warn(e); }
  }
  async leaveBarberGroup(barberId) {
    try { await this._conn?.invoke('LeaveBarberGroup', barberId); } catch(e) {}
  }
  async joinUserGroup(userId) {
    try { await this._conn?.invoke('JoinUserGroup', userId); } catch(e) { console.warn(e); }
  }
  async disconnect() {
    try { await this._conn?.stop(); this._conn = null; } catch {}
  }
}

// ─── Error mapper ─────────────────────────────────────────────────────────────
function mapError(res) {
  const m = res?.message ?? '';
  const map = {
    networkError:           'خطأ في الاتصال. تحقق من الإنترنت.',
    PhoneAlreadyRegistered: 'رقم الهاتف مسجّل مسبقاً.',
    InvalidCredentials:     'رقم الهاتف أو كلمة المرور غير صحيحة.',
    OtpExpired:             'رمز التحقق منتهي الصلاحية أو غير صحيح.',
    Unauthorized:           'غير مصرح. سجّل الدخول مجدداً.',
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
