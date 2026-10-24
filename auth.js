/**
 * SurvivorCare AI - Secure Client-Side Authentication & Session Management
 * Implements Web Crypto PBKDF2 SHA-256, Password Strength Analysis,
 * Inactivity Auto-Lock, and Device Recognition.
 */
const Auth = {
  currentUser: null,
  lockTimeoutMinutes: 5,
  inactivityTimer: null,
  isLocked: false,

  // Initialize Auth state
  async init() {
    this.currentUser = DB.get(DB.KEYS.USER, null);
    this.resetInactivityTimer();
    this.setupActivityListeners();
    this.recordCurrentDeviceSession();
  },

  // Password Strength Evaluation Engine
  evaluatePasswordStrength(password) {
    if (!password) {
      return { score: 0, label: 'Empty', class: '', feedback: 'Please enter a password.' };
    }

    let score = 0;
    const tips = [];

    // Length check
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 15;
    if (password.length < 8) tips.push('Use at least 8 characters (12+ recommended).');

    // Variety checks
    if (/[a-z]/.test(password)) score += 10;
    else tips.push('Add lowercase letters.');

    if (/[A-Z]/.test(password)) score += 15;
    else tips.push('Add uppercase letters.');

    if (/[0-9]/.test(password)) score += 15;
    else tips.push('Add numbers.');

    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    else tips.push('Add special symbols (!@#$%^&*).');

    // Weak patterns deduction
    const commonPatterns = ['password', '123456', 'qwerty', 'survivor', 'admin', 'welcome'];
    const lower = password.toLowerCase();
    for (const pat of commonPatterns) {
      if (lower.includes(pat)) {
        score = Math.max(10, score - 30);
        tips.push('Avoid common words like "' + pat + '".');
        break;
      }
    }

    // Determine tier
    let label = 'Weak';
    let colorClass = 'weak';
    if (score >= 80) {
      label = 'Very Strong';
      colorClass = 'strong';
    } else if (score >= 60) {
      label = 'Good';
      colorClass = 'good';
    } else if (score >= 40) {
      label = 'Fair';
      colorClass = 'fair';
    }

    return {
      score: Math.min(100, score),
      label,
      class: colorClass,
      feedback: tips.length ? tips.join(' ') : 'Secure password.'
    };
  },

  // Cryptographic Helper: Buffer to Hex
  bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  // Cryptographic Helper: Hex to Buffer
  hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  },

  // PBKDF2 Password Hashing using Web Crypto API
  async hashPassword(password, saltHex = null) {
    const enc = new TextEncoder();
    let saltBytes;
    if (saltHex) {
      saltBytes = this.hexToBuffer(saltHex);
    } else {
      saltBytes = crypto.getRandomValues(new Uint8Array(16));
    }

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    return {
      salt: this.bufferToHex(saltBytes),
      hash: this.bufferToHex(derivedBits)
    };
  },

  // Register New Survivor Account
  async register(username, password, recoveryHint = '') {
    if (!username || username.trim().length < 3) {
      throw new Error('Please choose a username or pseudonym of at least 3 characters.');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long for safety.');
    }

    const strength = this.evaluatePasswordStrength(password);
    if (strength.score < 40) {
      throw new Error('Please choose a stronger password. ' + strength.feedback);
    }

    const { salt, hash } = await this.hashPassword(password);
    const user = {
      username: username.trim(),
      salt,
      hash,
      recoveryHint: recoveryHint.trim(),
      createdAt: new Date().toISOString(),
      discreetModeEnabled: false,
      autoLockMinutes: 5
    };

    DB.set(DB.KEYS.USER, user);
    this.currentUser = { username: user.username, discreetModeEnabled: user.discreetModeEnabled, autoLockMinutes: user.autoLockMinutes };
    this.recordCurrentDeviceSession();
    return this.currentUser;
  },

  // Login
  async login(username, password) {
    const stored = DB.get(DB.KEYS.USER, null);
    if (!stored) {
      throw new Error('No account found on this device. Please create a safe profile first.');
    }
    if (stored.username.toLowerCase() !== username.trim().toLowerCase()) {
      throw new Error('Invalid username or password.');
    }

    const { hash } = await this.hashPassword(password, stored.salt);
    if (hash !== stored.hash) {
      throw new Error('Invalid username or password. Please re-check.');
    }

    this.currentUser = {
      username: stored.username,
      discreetModeEnabled: Boolean(stored.discreetModeEnabled),
      autoLockMinutes: stored.autoLockMinutes || 5
    };
    this.isLocked = false;
    this.recordCurrentDeviceSession();
    this.resetInactivityTimer();
    return this.currentUser;
  },

  // Logout
  logout() {
    this.currentUser = null;
    this.isLocked = false;
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
  },

  // Auto-Lock Inactivity Handler
  resetInactivityTimer() {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    if (!this.currentUser) return;

    const timeoutMs = (this.currentUser.autoLockMinutes || 5) * 60 * 1000;
    this.inactivityTimer = setTimeout(() => {
      this.triggerAutoLock();
    }, timeoutMs);
  },

  triggerAutoLock() {
    if (!this.currentUser) return;
    this.isLocked = true;
    if (window.App && typeof window.App.showLockScreen === 'function') {
      window.App.showLockScreen();
    }
  },

  setupActivityListeners() {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(evt => {
      window.addEventListener(evt, () => {
        if (!this.isLocked) {
          this.resetInactivityTimer();
        }
      }, { passive: true });
    });
  },

  // Active Sessions & Device Recognition (Truthful Implementation)
  getDeviceInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    if (ua.includes('Edg/')) browser = 'Microsoft Edge';
    else if (ua.includes('Chrome/')) browser = 'Google Chrome';
    else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';

    let os = 'Unknown OS';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    // Unique per-device storage ID
    let deviceId = localStorage.getItem('survivorcare_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('survivorcare_device_id', deviceId);
    }

    return {
      deviceId,
      browser,
      os,
      screen: `${window.screen.width}x${window.screen.height}`
    };
  },

  recordCurrentDeviceSession() {
    const info = this.getDeviceInfo();
    const sessions = DB.get(DB.KEYS.SESSIONS, []);
    const now = new Date().toISOString();

    const existingIdx = sessions.findIndex(s => s.deviceId === info.deviceId);
    if (existingIdx >= 0) {
      sessions[existingIdx].lastActive = now;
      sessions[existingIdx].browser = info.browser;
      sessions[existingIdx].os = info.os;
      sessions[existingIdx].isCurrent = true;
    } else {
      sessions.push({
        id: 'sess_' + Date.now(),
        deviceId: info.deviceId,
        browser: info.browser,
        os: info.os,
        screen: info.screen,
        loginTime: now,
        lastActive: now,
        isCurrent: true
      });
    }

    // Mark others as not current
    sessions.forEach(s => {
      if (s.deviceId !== info.deviceId) s.isCurrent = false;
    });

    DB.set(DB.KEYS.SESSIONS, sessions);
    return sessions;
  },

  getActiveSessions() {
    return DB.get(DB.KEYS.SESSIONS, []);
  },

  revokeSession(sessionId) {
    let sessions = this.getActiveSessions();
    const info = this.getDeviceInfo();
    const target = sessions.find(s => s.id === sessionId);
    if (target && target.deviceId === info.deviceId) {
      sessions = sessions.filter(s => s.id !== sessionId);
      DB.set(DB.KEYS.SESSIONS, sessions);
      this.logout();
      return { loggedOutCurrent: true };
    }
    sessions = sessions.filter(s => s.id !== sessionId);
    DB.set(DB.KEYS.SESSIONS, sessions);
    return { loggedOutCurrent: false };
  }
};
