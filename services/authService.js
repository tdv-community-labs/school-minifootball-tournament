/**
 * TDV Community Labs - Vahid Ekosistem Profili və SSO Xidməti (Unified Ecosystem SSO)
 * TDV Sports (Futbol Turniri) üçün Vahid Sessiya və İdentifikasiya İdarəedicisi
 * Yalnız qeydiyyatdan keçmiş istifadəçilər daxil ola bilər.
 * 1 Portalda daxil olduqda bütün digər portallarda (E-School, Sports, Hub, Games, Mafia) avtomatik aktiv qalır.
 */

const SESSION_KEY = 'tdv_ecosystem_session_v1';
const BROKER_URL = 'https://tdv-community-hubs.vercel.app/sso-broker.html';

export const DEFAULT_SEEDED_USERS = [
  {
    userId: 'tdv-seed-orxan',
    username: 'orxan',
    fullName: 'Orxan Əliyev',
    grade: 10,
    schoolClass: '10A',
    role: 'player',
    pin: '1000',
    avatar: '⚽'
  },
  {
    userId: 'tdv-seed-murad',
    username: 'murad',
    fullName: 'Murad Məmmədov',
    grade: 11,
    schoolClass: '11B',
    role: 'player',
    pin: '1100',
    avatar: '⚡'
  },
  {
    userId: 'tdv-seed-elvin',
    username: 'elvin_coach',
    fullName: 'Elvin Müəllim',
    grade: 0,
    schoolClass: 'Məşqçi',
    role: 'coach',
    pin: '2026',
    avatar: '👨‍🏫'
  },
  {
    userId: 'tdv-seed-admin',
    username: 'admin',
    fullName: 'TDV İnzibatçı',
    grade: 0,
    schoolClass: 'Rəhbərlik',
    role: 'admin',
    pin: 'admin2026',
    avatar: '👑'
  }
];

let brokerIframe = null;
let brokerReady = false;
const brokerQueue = [];

function getOrCreateBroker() {
  if (typeof window === 'undefined') return null;
  if (brokerIframe) return brokerIframe;

  try {
    brokerIframe = document.createElement('iframe');
    brokerIframe.src = BROKER_URL;
    brokerIframe.style.display = 'none';
    brokerIframe.style.position = 'absolute';
    brokerIframe.style.width = '0';
    brokerIframe.style.height = '0';
    brokerIframe.style.border = '0';
    brokerIframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(brokerIframe);

    window.addEventListener('message', (e) => {
      if (!e.origin.includes('vercel.app') && !e.origin.includes('localhost')) return;
      if (e.data && e.data.type === 'TDV_SSO_BROKER_READY') {
        brokerReady = true;
        while (brokerQueue.length) {
          const fn = brokerQueue.shift();
          try { fn(); } catch(err) {}
        }
      }
    });
  } catch(e) {
    console.warn('[SSO Broker] Başladıla bilmədi:', e);
  }
  return brokerIframe;
}

function sendToBroker(msg) {
  if (typeof window === 'undefined') return;
  getOrCreateBroker();
  const send = () => {
    if (brokerIframe && brokerIframe.contentWindow) {
      brokerIframe.contentWindow.postMessage(msg, '*');
    }
  };
  if (brokerReady) {
    send();
  } else {
    brokerQueue.push(send);
    setTimeout(send, 800);
  }
}

export const authService = {
  listeners: new Set(),

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  notify(session) {
    this.listeners.forEach(fn => {
      try { fn(session); } catch(e) {}
    });
  },

  /**
   * Qeydiyyatdan keçmiş bütün istifadəçiləri qaytarır (əgər yoxdursa ilkin baza toxumlarını qeyd edir)
   */
  getRegisteredUsers() {
    if (typeof window === 'undefined') return DEFAULT_SEEDED_USERS;
    try {
      const raw = localStorage.getItem('tdv_registered_users_v1');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch(e) {}
    try {
      localStorage.setItem('tdv_registered_users_v1', JSON.stringify(DEFAULT_SEEDED_USERS));
    } catch(e) {}
    return DEFAULT_SEEDED_USERS;
  },

  /**
   * İstifadəçi adı və ya tam ada görə bazada axtarış aparır
   */
  findUser(query) {
    if (!query) return null;
    const clean = query.trim().toLowerCase();
    const users = this.getRegisteredUsers();
    return users.find(u =>
      (u.username && u.username.toLowerCase() === clean) ||
      (u.fullName && u.fullName.toLowerCase() === clean)
    ) || null;
  },

  /**
   * Cari aktiv vahid profili oxuyur.
   */
  getSession() {
    if (typeof window === 'undefined') return null;

    // 1. URL parametrlərindən SSO biletini yoxla
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ssoTicket = urlParams.get('sso_ticket');
      if (ssoTicket) {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(ssoTicket))));
        if (decoded && (decoded.username || decoded.userId)) {
          const sessionData = {
            ...decoded,
            expiresAt: decoded.expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000)
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
          
          // URL-i təmizlə
          urlParams.delete('sso_ticket');
          const newSearch = urlParams.toString();
          const cleanUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
          
          sendToBroker({ type: 'TDV_SSO_SET', session: sessionData, users: this.getRegisteredUsers() });
          this.updateOutboundLinks(sessionData);
          return sessionData;
        }
      }
    } catch (e) {
      console.warn('⚠️ [SSO] Keçid bileti oxunarkən xəta:', e);
    }

    // 2. localStorage-də mövcud vahid sessiyanı yoxla
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.expiresAt && session.expiresAt > Date.now()) {
          // VACİB TƏMİZLƏMƏ: Əgər bu köhnə/keşdə qalmış 'ADMIN00' və s. qeydiyyatda olmayan xəyal hesabdırsa, dərhal sil!
          const userExists = this.findUser(session.username);
          if (!userExists) {
            console.warn(`[SSO] Qeydiyyatda olmayan köhnə keş profili tapıldı (${session.username}), silinir və brokerdən yenilənir...`);
            localStorage.removeItem(SESSION_KEY);
            this.syncFromBroker();
            return null;
          }
          this.updateOutboundLinks(session);
          return session;
        } else if (session) {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (e) {}

    // 3. Əgər yerli yaddaşda yoxdursa, mərkəzi brokerdən avtomatik soruş
    this.syncFromBroker();
    return null;
  },

  syncFromBroker() {
    if (typeof window === 'undefined') return;
    const reqId = 'sync_sport_' + Math.random().toString(36).slice(2);

    const handler = (e) => {
      if (!e.origin.includes('vercel.app') && !e.origin.includes('localhost')) return;
      if (e.data && e.data.type === 'TDV_SSO_DATA' && e.data.requestId === reqId) {
        window.removeEventListener('message', handler);
        // İstifadəçi siyahısını birləşdir
        if (e.data.users && Array.isArray(e.data.users) && e.data.users.length > 0) {
          const currentUsers = this.getRegisteredUsers();
          const userMap = new Map();
          currentUsers.forEach(u => { if (u && u.username) userMap.set(u.username.toLowerCase(), u); });
          e.data.users.forEach(u => { if (u && u.username) userMap.set(u.username.toLowerCase(), u)); });
          const merged = Array.from(userMap.values());
          try {
            localStorage.setItem('tdv_registered_users_v1', JSON.stringify(merged));
          } catch(err) {}
        }
        
        // Aktiv sessiyanı qəbul et və müqayisə et
        if (e.data.session) {
          const currentRaw = localStorage.getItem(SESSION_KEY);
          let shouldUpdate = false;
          if (!currentRaw) {
            shouldUpdate = true;
          } else {
            try {
              const currentObj = JSON.parse(currentRaw);
              const currentValid = this.findUser(currentObj.username);
              // Əgər cari lokal hesab bazada yoxdursa (məs: köhnə ADMIN00), dərhal brokerdəki yeni hesabla əvəzlə!
              if (!currentValid) {
                shouldUpdate = true;
              } else if (currentObj.username !== e.data.session.username) {
                // Fərqli hesab daxil olubsa və broker sessiyası daha yenidirsə
                if (e.data.session.createdAt && (!currentObj.createdAt || e.data.session.createdAt >= currentObj.createdAt)) {
                  shouldUpdate = true;
                }
              }
            } catch(err) {
              shouldUpdate = true;
            }
          }

          if (shouldUpdate) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(e.data.session));
            this.updateOutboundLinks(e.data.session);
            this.notify(e.data.session);
          }
        } else {
          // Əgər brokerdə sessiya yoxdursa, amma lokaldakı hesab qeydiyyatsızdırsa, sil
          const currentRaw = localStorage.getItem(SESSION_KEY);
          if (currentRaw) {
            try {
              const currentObj = JSON.parse(currentRaw);
              if (!this.findUser(currentObj.username)) {
                localStorage.removeItem(SESSION_KEY);
                this.updateOutboundLinks(null);
                this.notify(null);
              }
            } catch(err) {}
          }
        }
      }
    };
    window.addEventListener('message', handler);

    sendToBroker({ type: 'TDV_SSO_GET', requestId: reqId });
  },

  /**
   * Tək Vahid Profil ilə Daxilolma - QEYDİYYAT VƏ ŞİFRƏ YOXLAMASI İLƏ
   */
  login(username, teamClass = '10A', pin = '', role = 'player') {
    const trimmed = (username || '').trim();
    if (!trimmed) throw new Error('Zəhmət olmasa istifadəçi adınızı və ya adınızı daxil edin.');

    // 1. Qeydiyyat yoxlaması
    const user = this.findUser(trimmed);
    if (!user) {
      throw new Error(`⚠️ '${trimmed}' adlı qeydiyyatdan keçmiş istifadəçi tapılmadı! Yalnız qeydiyyatdan keçmiş istifadəçilər daxil ola bilər. Zəhmət olmasa 'Qeydiyyat' bölməsindən profil yaradın.`);
    }

    // 2. PIN / Şifrə yoxlaması
    const cleanPin = pin ? String(pin).trim() : (typeof teamClass === 'string' && /^\d{4}$/.test(teamClass) ? teamClass : '');
    if (user.pin && user.pin.trim() !== '') {
      if (!cleanPin || cleanPin !== user.pin.trim()) {
        throw new Error('❌ Daxil edilmiş PIN kod və ya şifrə yanlışdır!');
      }
    }

    const cleanClass = user.schoolClass || (typeof teamClass === 'string' && !/^\d{4}$/.test(teamClass) ? teamClass : '10A');
    const grade = user.grade || (cleanClass.match(/\d+/) ? Number(cleanClass.match(/\d+/)[0]) : 10);
    const finalRole = user.role || role || (cleanClass === 'Məşqçi' ? 'coach' : 'player');
    const avatar = user.avatar || (finalRole === 'coach' ? '👨‍🏫' : '⚽');

    const session = {
      userId: user.userId || ('tdv-usr-' + Date.now().toString(36)),
      username: user.username,
      fullName: user.fullName || user.username,
      grade: grade,
      schoolClass: cleanClass,
      role: finalRole,
      avatar: avatar,
      ecosystem: {
        eschool: { active: true, grade: grade },
        sports: { team: cleanClass, role: finalRole },
        games: { nickname: user.username },
        mafia: { tier: 'TIER_1', roleTitle: finalRole === 'coach' ? 'Məşqçi' : 'Klub Oyunçusu' }
      },
      token: 'tdv_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      sendToBroker({ type: 'TDV_SSO_SET', session: session, users: this.getRegisteredUsers() });
      this.updateOutboundLinks(session);
      this.notify(session);
    } catch (e) {}

    return session;
  },

  /**
   * Yeni Vahid Profil Qeydiyyatı (Bütün portallara 1 tək profil)
   */
  register({ fullName, username, teamClass = '10A', pin = '', avatar = '⚽', role = 'player' }) {
    const trimmedUser = (username || '').trim();
    const trimmedName = (fullName || '').trim() || trimmedUser;
    if (!trimmedUser) throw new Error('Zəhmət olmasa istifadəçi adı daxil edin.');
    if (!trimmedName) throw new Error('Zəhmət olmasa ad və soyadınızı daxil edin.');

    const cleanPin = String(pin || '').trim();
    if (!cleanPin) {
      throw new Error('Zəhmət olmasa hesabınız üçün 4 rəqəmli PIN kod və ya şifrə təyin edin.');
    }

    // Təkrarlanan istifadəçi adı yoxlaması
    const existing = this.findUser(trimmedUser);
    if (existing) {
      throw new Error(`⚠️ '${trimmedUser}' istifadəçi adı artıq qeydiyyatdan keçib! Zəhmət olmasa 'Daxil Ol' bölməsinə keçin və ya fərqli ad seçin.`);
    }

    const cleanClass = teamClass || '10A';
    const gradeMatch = cleanClass.match(/\d+/);
    const grade = gradeMatch ? Number(gradeMatch[0]) : 10;
    const finalRole = role || (cleanClass === 'Məşqçi' ? 'coach' : 'player');
    const finalAvatar = avatar || (finalRole === 'coach' ? '👨‍🏫' : '⚽');

    const newUser = {
      userId: 'tdv-usr-' + Date.now().toString(36),
      username: trimmedUser,
      fullName: trimmedName,
      grade: grade,
      schoolClass: cleanClass,
      role: finalRole,
      avatar: finalAvatar,
      pin: cleanPin,
      createdAt: Date.now()
    };

    const session = {
      userId: newUser.userId,
      username: trimmedUser,
      fullName: trimmedName,
      grade: grade,
      schoolClass: cleanClass,
      role: finalRole,
      avatar: finalAvatar,
      ecosystem: {
        eschool: { active: true, grade: grade },
        sports: { team: cleanClass, role: finalRole },
        games: { nickname: trimmedUser },
        mafia: { tier: 'TIER_1', roleTitle: finalRole === 'coach' ? 'Məşqçi' : 'Klub Oyunçusu' }
      },
      token: 'tdv_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
    };

    try {
      const regUsers = this.getRegisteredUsers();
      regUsers.push(newUser);
      localStorage.setItem('tdv_registered_users_v1', JSON.stringify(regUsers));
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      sendToBroker({ type: 'TDV_SSO_SET', session: session, users: regUsers });
      this.updateOutboundLinks(session);
      this.notify(session);
    } catch (e) {}

    return session;
  },

  loginWithDemo(type = 'player-10a') {
    if (type === 'player-11b') {
      return this.login('murad', '11B', '1100', 'player');
    }
    if (type === 'coach') {
      return this.login('elvin_coach', 'Məşqçi', '2026', 'coach');
    }
    if (type === 'admin') {
      return this.login('admin', 'Rəhbərlik', 'admin2026', 'admin');
    }
    return this.login('orxan', '10A', '1000', 'player');
  },

  logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
      sendToBroker({ type: 'TDV_SSO_LOGOUT' });
      this.updateOutboundLinks(null);
      this.notify(null);
    } catch (e) {}
  },

  createSsoTicket(session) {
    if (!session) return '';
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(session))));
    } catch (e) {
      return '';
    }
  },

  updateOutboundLinks(session) {
    if (typeof document === 'undefined') return;
    const ticket = session ? this.createSsoTicket(session) : '';
    const selector = 'a[href*="vercel.app"]';
    document.querySelectorAll(selector).forEach(link => {
      const base = link.getAttribute('data-base-href') || link.href.split('?')[0];
      link.setAttribute('data-base-href', base);
      if (ticket) {
        link.href = base + (base.endsWith('/') ? '' : '/') + '?sso_ticket=' + encodeURIComponent(ticket);
      } else {
        link.href = base;
      }
    });
  }
};
