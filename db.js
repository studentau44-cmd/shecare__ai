/**
 * SurvivorCare AI / SheCare AI - Offline-First Database & Storage Engine
 * Manages local persistent data with strict zero-third-party-sharing privacy.
 */
const DB = {
  KEYS: {
    USER: 'survivorcare_user',
    SESSIONS: 'survivorcare_sessions',
    SYMPTOMS: 'survivorcare_symptom_logs',
    CYCLE: 'survivorcare_cycle_logs',
    SUSTENANCE: 'survivorcare_sustenance_logs',
    SAFETY_PLAN: 'survivorcare_safety_plan',
    SOS_CONTACTS: 'survivorcare_sos_contacts',
    SOS_LOGS: 'survivorcare_sos_logs',
    SETTINGS: 'survivorcare_settings',
    CHAT_HISTORY: 'survivorcare_chat_history',
    CAMOUFLAGE_NOTES: 'survivorcare_camouflage_notes'
  },

  WATER_CONFIG: {
    DEFAULT_MAX_GLASSES: 12,
    MIN_GLASSES: 0
  },

  // Safe JSON extraction
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn('LocalStorage read error for key ' + key, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('LocalStorage write error for key ' + key, e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Purge ALL data instantly (Privacy Emergency Button)
  purgeAllData() {
    try {
      Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
      return true;
    } catch (e) {
      console.error('Purge error', e);
      return false;
    }
  },

  // Export encrypted/structured JSON backup for survivor
  exportData() {
    const backup = {};
    Object.entries(this.KEYS).forEach(([name, key]) => {
      backup[name] = this.get(key, null);
    });
    return JSON.stringify(backup, null, 2);
  },

  // --- Symptom Logs ---
  getSymptoms() {
    return this.get(this.KEYS.SYMPTOMS, []);
  },

  saveSymptom(entry) {
    const logs = this.getSymptoms();
    const newEntry = {
      id: 'sym_' + Date.now(),
      timestamp: new Date().toISOString(),
      painLevel: Number(entry.painLevel) || 0,
      painArea: entry.painArea || 'General Body',
      bleeding: entry.bleeding || 'None',
      fever: entry.fever || 'None',
      dizziness: Boolean(entry.dizziness),
      bruising: entry.bruising || '',
      notes: entry.notes || '',
      redFlags: entry.redFlags || []
    };
    logs.unshift(newEntry);
    this.set(this.KEYS.SYMPTOMS, logs);
    return newEntry;
  },

  deleteSymptom(id) {
    let logs = this.getSymptoms();
    logs = logs.filter(l => l.id !== id);
    this.set(this.KEYS.SYMPTOMS, logs);
    return true;
  },

  // --- Menstrual / Cycle Logs ---
  getCycleLogs() {
    return this.get(this.KEYS.CYCLE, []);
  },

  saveCycleLog(entry) {
    const logs = this.getCycleLogs();
    const newEntry = {
      id: 'cyc_' + Date.now(),
      startDate: entry.startDate,
      endDate: entry.endDate || null,
      flow: entry.flow || 'Medium',
      symptoms: entry.symptoms || [],
      notes: entry.notes || ''
    };
    logs.unshift(newEntry);
    this.set(this.KEYS.CYCLE, logs);
    return newEntry;
  },

  // --- Sustenance & Water Logs (Strict Daily Max: 12 Glasses) ---
  getSustenance() {
    const today = new Date().toISOString().split('T')[0];
    return this.getSustenanceAll();
  },

  getSustenanceAll() {
    const logs = this.get(this.KEYS.SUSTENANCE, {});
    const today = new Date().toISOString().split('T')[0];
    if (!logs[today]) {
      logs[today] = {
        date: today,
        waterGlasses: 0,
        meals: { breakfast: false, lunch: false, dinner: false, snacks: false },
        notes: '',
        deniedFoodOrWater: false
      };
      this.set(this.KEYS.SUSTENANCE, logs);
    }
    return logs;
  },

  getSustenanceForDate(dateStr = null) {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const logs = this.get(this.KEYS.SUSTENANCE, {});
    if (!logs[targetDate]) {
      logs[targetDate] = {
        date: targetDate,
        waterGlasses: 0,
        meals: { breakfast: false, lunch: false, dinner: false, snacks: false },
        notes: '',
        deniedFoodOrWater: false
      };
      this.set(this.KEYS.SUSTENANCE, logs);
    }
    return logs[targetDate];
  },

  // Add water glass with strict 12 limit
  addWaterGlass(dateStr = null, maxLimit = 12) {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const logs = this.get(this.KEYS.SUSTENANCE, {});
    if (!logs[targetDate]) {
      logs[targetDate] = {
        date: targetDate,
        waterGlasses: 0,
        meals: { breakfast: false, lunch: false, dinner: false, snacks: false },
        notes: '',
        deniedFoodOrWater: false
      };
    }
    const current = Number(logs[targetDate].waterGlasses) || 0;
    if (current >= maxLimit) {
      logs[targetDate].waterGlasses = maxLimit;
      this.set(this.KEYS.SUSTENANCE, logs);
      return {
        date: targetDate,
        waterGlasses: maxLimit,
        reachedLimit: true,
        message: `You have reached the daily tracking limit of ${maxLimit} glasses.`
      };
    }

    const nextCount = Math.min(current + 1, maxLimit);
    logs[targetDate].waterGlasses = nextCount;
    this.set(this.KEYS.SUSTENANCE, logs);
    return {
      date: targetDate,
      waterGlasses: nextCount,
      reachedLimit: nextCount >= maxLimit,
      message: nextCount >= maxLimit ? `You have reached the daily tracking limit of ${maxLimit} glasses.` : null
    };
  },

  // Remove water glass (cannot be negative)
  removeWaterGlass(dateStr = null) {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const logs = this.get(this.KEYS.SUSTENANCE, {});
    if (!logs[targetDate]) {
      logs[targetDate] = {
        date: targetDate,
        waterGlasses: 0,
        meals: { breakfast: false, lunch: false, dinner: false, snacks: false },
        notes: '',
        deniedFoodOrWater: false
      };
    }
    const current = Number(logs[targetDate].waterGlasses) || 0;
    const nextCount = Math.max(0, current - 1);
    logs[targetDate].waterGlasses = nextCount;
    this.set(this.KEYS.SUSTENANCE, logs);
    return {
      date: targetDate,
      waterGlasses: nextCount,
      reachedLimit: false,
      message: null
    };
  },

  // Set exact water count (strictly clamped between 0 and max)
  setWaterForDate(dateStr, count, maxLimit = 12) {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const logs = this.get(this.KEYS.SUSTENANCE, {});
    if (!logs[targetDate]) {
      logs[targetDate] = {
        date: targetDate,
        waterGlasses: 0,
        meals: { breakfast: false, lunch: false, dinner: false, snacks: false },
        notes: '',
        deniedFoodOrWater: false
      };
    }
    const clamped = Math.max(0, Math.min(Number(count) || 0, maxLimit));
    logs[targetDate].waterGlasses = clamped;
    this.set(this.KEYS.SUSTENANCE, logs);
    return logs[targetDate];
  },

  updateTodaySustenance(updater, maxLimit = 12) {
    const logs = this.getSustenanceAll();
    const today = new Date().toISOString().split('T')[0];
    const updated = updater(logs[today]);
    // Apply strict clamping to prevent any direct bypass
    if (typeof updated.waterGlasses === 'number') {
      updated.waterGlasses = Math.max(0, Math.min(updated.waterGlasses, maxLimit));
    }
    logs[today] = updated;
    this.set(this.KEYS.SUSTENANCE, logs);
    return logs[today];
  },

  // --- Safety Plan ---
  getSafetyPlan() {
    return this.get(this.KEYS.SAFETY_PLAN, {
      safeLocations: [
        { name: 'Public Hospital ER / SARC Clinic', address: 'Nearest general emergency center', contact: '24/7 Open' },
        { name: 'Public Library / Community Center', address: 'Safe daylight shelter with public phones', contact: '' }
      ],
      goBagChecklist: [
        { id: 'item_id', label: 'Government ID / Passport / Birth Certificate', checked: false },
        { id: 'item_cash', label: 'Emergency Cash / ATM Card', checked: false },
        { id: 'item_meds', label: 'Critical Prescription Medications', checked: false },
        { id: 'item_keys', label: 'Spare House & Car Keys', checked: false },
        { id: 'item_charger', label: 'Phone & Charger / Portable Battery', checked: false },
        { id: 'item_clothes', label: 'Change of Warm Clothing', checked: false }
      ],
      safeCodeWord: '',
      isolationSteps: 'If denied food, water, or physical movement: Keep a hidden water container. Note times when abusers are asleep. Identify a trusted neighbor or delivery person who can call emergency services on your behalf.'
    });
  },

  saveSafetyPlan(plan) {
    return this.set(this.KEYS.SAFETY_PLAN, plan);
  },

  // --- SOS Contacts ---
  getSosContacts() {
    return this.get(this.KEYS.SOS_CONTACTS, [
      { name: 'Trusted Friend / Advocate', phone: '', email: '', isPrimary: true }
    ]);
  },

  saveSosContacts(contacts) {
    return this.set(this.KEYS.SOS_CONTACTS, contacts);
  },

  // --- SOS Dispatch Logs ---
  getSosLogs() {
    return this.get(this.KEYS.SOS_LOGS, []);
  },

  saveSosLog(log) {
    const logs = this.getSosLogs();
    logs.unshift(log);
    this.set(this.KEYS.SOS_LOGS, logs.slice(0, 30));
    return log;
  },

  // --- Camouflage Notes & Planner Data ---
  getCamouflageNotes() {
    return this.get(this.KEYS.CAMOUFLAGE_NOTES, {
      scratchpad: '',
      todos: [
        { id: 'todo_1', text: 'Pick up groceries & household essentials', completed: false },
        { id: 'todo_2', text: 'Confirm schedule for this week', completed: true },
        { id: 'todo_3', text: 'Organize personal study notes', completed: false }
      ]
    });
  },

  saveCamouflageNotes(data) {
    return this.set(this.KEYS.CAMOUFLAGE_NOTES, data);
  }
};
