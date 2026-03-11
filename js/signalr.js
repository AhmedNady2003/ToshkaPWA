/**
 * Toshka — SignalR QueueHub Client
 * Hub route  : /hubs/queue
 *
 * Client → Server (Hub methods):
 *   JoinBarberGroup(barberId: string)
 *   LeaveBarberGroup(barberId: string)
 *   JoinUserGroup(userId: string)
 *
 * Server → Client (events):
 *   QueueUpdated(barberId: string)
 *   PositionUpdated({ position: int, peopleBefore: int })
 */
class ToshkaHub {
  constructor() {
    this._conn     = null;
    this._handlers = {};
    this._barber   = null;
    this._user     = null;
    this.connected = false;
  }

  on(ev, fn)   { (this._handlers[ev] ??= []).push(fn); return this; }
  off(ev)      { delete this._handlers[ev]; return this; }
  _emit(ev, ...a) { (this._handlers[ev] ?? []).forEach(fn => fn(...a)); }

  async connect() {
    if (!window.signalR) { console.warn('[Hub] signalR SDK not loaded'); return; }
    const token = Session.get().token;
    if (!token) { console.warn('[Hub] No token — skip'); return; }

    this._conn = new signalR.HubConnectionBuilder()
      .withUrl(`${window.API_BASE ?? 'http://localhost:5000'}/hubs/queue`, {
        accessTokenFactory: () => Session.get().token,
      })
      .withAutomaticReconnect([2000, 4000, 8000, 16000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    /* ── Server → Client ── */
    // Barber receives when queue changes
    this._conn.on('QueueUpdated', barberId => {
      console.log('[Hub] QueueUpdated', barberId);
      this._emit('queueUpdated', barberId);
    });
    // Customer receives their position update
    this._conn.on('PositionUpdated', data => {
      console.log('[Hub] PositionUpdated', data);
      this._emit('positionUpdated', data);  // { position, peopleBefore }
    });

    /* ── Lifecycle ── */
    this._conn.onreconnecting(() => {
      this.connected = false;
      this._setDots('orange');
      this._emit('reconnecting');
    });
    this._conn.onreconnected(async () => {
      this.connected = true;
      this._setDots('green');
      this._emit('reconnected');
      await this._rejoin();
    });
    this._conn.onclose(() => {
      this.connected = false;
      this._setDots('red');
      this._emit('disconnected');
    });

    try {
      await this._conn.start();
      this.connected = true;
      this._setDots('green');
      this._emit('connected');
      console.log('[Hub] ✅ Connected to QueueHub');
    } catch (e) {
      this._setDots('red');
      this._emit('error', e);
      console.warn('[Hub] Connection failed:', e.message);
    }
  }

  /* ── Group methods — mirror Hub exactly ── */
  async joinBarberGroup(barberId) {
    this._barber = String(barberId);
    if (!this.connected) return;
    try { await this._conn.invoke('JoinBarberGroup', this._barber); }
    catch (e) { console.warn('[Hub] JoinBarberGroup:', e.message); }
  }
  async leaveBarberGroup(barberId) {
    this._barber = null;
    if (!this.connected) return;
    try { await this._conn.invoke('LeaveBarberGroup', String(barberId)); }
    catch (e) { console.warn('[Hub] LeaveBarberGroup:', e.message); }
  }
  async joinUserGroup(userId) {
    this._user = String(userId);
    if (!this.connected) return;
    try { await this._conn.invoke('JoinUserGroup', this._user); }
    catch (e) { console.warn('[Hub] JoinUserGroup:', e.message); }
  }

  async _rejoin() {
    if (this._barber) await this.joinBarberGroup(this._barber);
    if (this._user)   await this.joinUserGroup(this._user);
  }

  _setDots(color) {
    const colors = {green:'var(--green)', orange:'var(--orange)', red:'var(--red)'};
    const titles = {green:'متصل — تحديث لحظي', orange:'جاري إعادة الاتصال...', red:'انقطع الاتصال'};
    document.querySelectorAll('.rt-dot').forEach(d => {
      d.style.background = colors[color] ?? colors.orange;
      d.title = titles[color] ?? '';
    });
  }

  async disconnect() {
    if (this._conn) { try { await this._conn.stop(); } catch {} }
    this.connected = false;
  }
}

window.hub = new ToshkaHub();
