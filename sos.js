/**
 * SurvivorCare AI / SheCare AI - SOS Emergency Alert System
 * Manages trusted emergency contacts, native SMS/tel dispatch, truthful status reporting,
 * and an offline Web Audio distress siren. Never falsely claims message delivery.
 */
const SOS = {
  audioCtx: null,
  sirenOscillator: null,
  sirenInterval: null,
  isSirenPlaying: false,

  // Validate Trusted Contact Info
  validateContact(contact) {
    if (!contact) {
      return { valid: false, error: 'Contact information is required.' };
    }
    const name = (contact.name || '').trim();
    const phone = (contact.phone || '').trim().replace(/[^0-9+]/g, '');

    if (!name || name.length < 2) {
      return { valid: false, error: 'Please enter a valid contact name or advocate title.' };
    }
    if (!phone || phone.length < 7) {
      return { valid: false, error: 'Please enter a valid telephone number with country code (e.g. +92... or +91... or +1...).' };
    }
    return { valid: true, error: null, cleanPhone: phone };
  },

  // Format SOS Distress Message with survivor authorization for location
  generateDistressMessage(contactName = 'Trusted Contact', customNote = '', includeCoords = false, coords = null) {
    let msg = `EMERGENCY ALERT: This is an urgent distress notification sent via SheCare AI. I need your immediate assistance or safe check-in.`;
    if (customNote && customNote.trim().length > 0) {
      msg += ` Note: ${customNote.trim()}`;
    }
    // Only include location if survivor gave explicit permission
    if (includeCoords && coords && coords.latitude && coords.longitude) {
      msg += ` Approximate location (Authorized by survivor): https://maps.google.com/?q=${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`;
    }
    msg += ` [Sent: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]`;
    return msg;
  },

  // Native Device SMS Dispatch (Truthful device handover)
  dispatchViaDeviceSms(phone, message) {
    const check = this.validateContact({ name: 'Recipient', phone });
    if (!check.valid) {
      throw new Error(check.error);
    }
    const cleanPhone = check.cleanPhone;
    const encodedBody = encodeURIComponent(message);
    
    // Construct SMS URI (compatible with iOS, Android, and desktop messaging clients)
    const smsUrl = `sms:${cleanPhone}?body=${encodedBody}`;
    
    // Truthful log record: Opening the app is NOT confirmation of delivery
    const log = {
      id: 'sos_' + Date.now(),
      timestamp: new Date().toISOString(),
      channel: 'Device SMS App Handshake',
      contactPhone: cleanPhone,
      status: 'OPENED_IN_MESSAGING_APP',
      statusText: 'Opened native SMS composer. You must tap Send to transmit. Cellular carrier coverage required.',
      truthfulNote: 'Opening SMS app does not confirm cellular delivery.'
    };
    DB.saveSosLog(log);

    // Handover to OS
    window.location.href = smsUrl;
    return log;
  },

  // Native Phone Call Dispatch
  dispatchViaPhoneCall(phone) {
    const check = this.validateContact({ name: 'Recipient', phone });
    if (!check.valid) {
      throw new Error(check.error);
    }
    const cleanPhone = check.cleanPhone;
    const telUrl = `tel:${cleanPhone}`;

    const log = {
      id: 'sos_' + Date.now(),
      timestamp: new Date().toISOString(),
      channel: 'Device Phone Dialer',
      contactPhone: cleanPhone,
      status: 'DIALER_OPENED',
      statusText: 'Opened native phone dialer for immediate calling.',
      truthfulNote: 'Call placement depends on local carrier connection.'
    };
    DB.saveSosLog(log);

    window.location.href = telUrl;
    return log;
  },

  // Backend / Server Webhook Dispatch (With Truthful Network Status)
  async dispatchViaServer(contactPhone, message) {
    const check = this.validateContact({ name: 'Recipient', phone: contactPhone });
    if (!check.valid) {
      throw new Error(check.error);
    }
    const cleanPhone = check.cleanPhone;

    const log = {
      id: 'sos_' + Date.now(),
      timestamp: new Date().toISOString(),
      channel: 'Server SMS Gateway',
      contactPhone: cleanPhone,
      status: 'PENDING_NETWORK',
      statusText: 'Attempting connection with dispatch gateway...',
      truthfulNote: 'Remote delivery cannot be guaranteed without active network connection.'
    };

    try {
      // Check online status first
      if (!navigator.onLine) {
        log.status = 'FAILED_OFFLINE';
        log.statusText = 'Failed: Device is offline. No internet connection available.';
        DB.saveSosLog(log);
        return log;
      }

      const res = await fetch('/api/sos/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, message })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        log.status = 'FAILED_SERVER_ERROR';
        log.statusText = 'Failed: Dispatch server returned error (' + (errData.error || res.status) + ').';
      } else {
        const data = await res.json();
        log.status = data.status || 'DISPATCHED_TO_CARRIER';
        log.statusText = data.message || 'Alert successfully accepted by carrier gateway.';
      }
    } catch (err) {
      // Backend not running or unreachable
      log.status = 'FAILED_UNREACHABLE';
      log.statusText = 'Server unreachable (Offline mode). Remote message not sent. Please use Native SMS or Phone dialer.';
    }

    DB.saveSosLog(log);
    return log;
  },

  // Audio Distress Siren (Pure Web Audio API - 100% Offline)
  startSiren() {
    if (this.isSirenPlaying) return;

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) {
        alert('Web Audio API not supported in this browser.');
        return;
      }

      this.audioCtx = new AudioCtxClass();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();

      let freqToggle = false;
      this.sirenInterval = setInterval(() => {
        if (!this.audioCtx || this.audioCtx.state === 'closed') return;
        const targetFreq = freqToggle ? 960 : 650;
        osc.frequency.exponentialRampToValueAtTime(targetFreq, this.audioCtx.currentTime + 0.35);
        freqToggle = !freqToggle;
      }, 400);

      this.sirenOscillator = osc;
      this.isSirenPlaying = true;
    } catch (e) {
      console.warn('Audio Siren error:', e);
    }
  },

  stopSiren() {
    if (!this.isSirenPlaying) return;

    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOscillator) {
      try {
        this.sirenOscillator.stop();
        this.sirenOscillator.disconnect();
      } catch (e) {}
      this.sirenOscillator = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }
    this.isSirenPlaying = false;
  }
};
