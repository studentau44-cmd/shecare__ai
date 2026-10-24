/**
 * SurvivorCare AI / SheCare AI - Main Application Coordinator & UI Engine
 * Orchestrates navigation, discreet mode, quick exit, water tracking (max 12),
 * camouflage notes, and event wiring.
 */
const App = {
  activeView: 'view-mental-health',
  isDiscreetMode: false,

  async init() {
    // 1. Initialize Auth
    await Auth.init();

    // 2. Setup Navigation
    this.setupNavigation();

    // 3. Setup Quick Exit & Camouflage Notes
    this.setupQuickExit();

    // 4. Setup Discreet Mode Toggle
    this.setupDiscreetMode();

    // 5. Initialize Sub-modules
    this.initMentalHealth();
    this.initPhysicalHealth();
    this.initPeriodTracker();
    this.initPregnancySTI();
    this.initSOS();
    this.initSafetyPlan();
    this.initAuthAndSessions();

    // 6. Check if user is logged in
    this.updateUserInterface();

    console.log('SheCare AI initialized successfully in Offline-First Mode.');
  },

  // View Navigation
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = item.getAttribute('data-view');
        this.switchView(targetView);
      });
    });
  },

  switchView(viewId) {
    this.activeView = viewId;
    
    // Update nav active classes
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      if (item.getAttribute('data-view') === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update section visibility
    document.querySelectorAll('.view-section').forEach(section => {
      if (section.id === viewId) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Quick Exit and Camouflage Notes Engine
  setupQuickExit() {
    const exitButtons = document.querySelectorAll('.quick-exit-btn, #btnCamouflageExit');
    exitButtons.forEach(btn => {
      btn.addEventListener('click', () => this.triggerQuickExit());
    });

    // Global ESC key shortcut for emergency exit
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.triggerQuickExit();
      }
    });

    // Camouflage Return Button - Requires intentional confirmation action
    const promptResumeBtn = document.getElementById('btnPromptResume');
    if (promptResumeBtn) {
      promptResumeBtn.addEventListener('click', () => {
        this.openModal('modalResumeConfirm');
      });
    }

    const confirmResumeBtn = document.getElementById('btnConfirmResumeSession');
    if (confirmResumeBtn) {
      confirmResumeBtn.addEventListener('click', () => {
        this.closeModal('modalResumeConfirm');
        const camo = document.getElementById('camouflageScreen');
        if (camo) camo.classList.remove('active');
        document.title = this.isDiscreetMode ? 'Daily Notes & Planner' : 'SheCare AI - Secure Offline Support';
        this.showToast('Session resumed. You are in safe view.');
      });
    }

    // Quick Exit Limitations Modal trigger
    const limitationBtn = document.getElementById('btnPrivacyNotice');
    if (limitationBtn) {
      limitationBtn.addEventListener('click', () => {
        this.openModal('modalQuickExitNotice');
      });
    }

    // Camouflage scratchpad auto-save
    const scratchpad = document.getElementById('camoScratchpad');
    if (scratchpad) {
      const savedNotes = DB.getCamouflageNotes();
      if (savedNotes && savedNotes.scratchpad) {
        scratchpad.value = savedNotes.scratchpad;
      }
      scratchpad.addEventListener('input', (e) => {
        const cur = DB.getCamouflageNotes();
        cur.scratchpad = e.target.value;
        DB.saveCamouflageNotes(cur);
      });
    }
  },

  triggerQuickExit() {
    // 1. Instantly display neutral notes & planner camouflage screen
    const camo = document.getElementById('camouflageScreen');
    if (camo) {
      camo.classList.add('active');
    }

    // 2. Disguise tab title consistently to neutral daily notes
    document.title = 'Personal Daily Notes & Task Planner';

    // 3. Clear transient sensitive input fields currently in focus without wiping database
    const activeInputs = document.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="checkbox"]), textarea:not(#camoScratchpad)');
    activeInputs.forEach(i => {
      if (!i.hasAttribute('data-preserve')) {
        i.value = '';
      }
    });

    // 4. Stop audio siren immediately if active
    SOS.stopSiren();
  },

  // Discreet Mode (Camouflage styling & neutralized labels)
  setupDiscreetMode() {
    const toggle = document.getElementById('discreetModeToggle');
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        this.setDiscreetMode(e.target.checked);
      });
    }
  },

  setDiscreetMode(enabled) {
    this.isDiscreetMode = enabled;
    if (enabled) {
      document.body.classList.add('discreet-mode');
      document.title = 'Daily Notes & Planner';
      document.getElementById('brandName').textContent = 'Daily Notes';
      document.getElementById('brandBadge').textContent = 'Offline Planner';
      
      // Neutralize nav item text
      document.getElementById('navLabelMental').textContent = 'Mind & Wellness';
      document.getElementById('navLabelPhysical').textContent = 'Daily Body & Hydration';
      document.getElementById('navLabelCycle').textContent = 'Calendar & Log';
      document.getElementById('navLabelPregnancy').textContent = 'Health Reference';
      document.getElementById('navLabelSos').textContent = 'Quick Contacts';
      document.getElementById('navLabelSafety').textContent = 'Personal Safety Notes';
    } else {
      document.body.classList.remove('discreet-mode');
      document.title = 'SheCare AI - Secure Offline Support';
      document.getElementById('brandName').textContent = 'SheCare AI';
      document.getElementById('brandBadge').textContent = 'SurvivorCare • Offline First';

      // Restore healthcare text
      document.getElementById('navLabelMental').textContent = 'Mental Health Support';
      document.getElementById('navLabelPhysical').textContent = 'Physical Health & Sustenance';
      document.getElementById('navLabelCycle').textContent = 'Cycle & Period Tracker';
      document.getElementById('navLabelPregnancy').textContent = 'Pregnancy & HIV/STI';
      document.getElementById('navLabelSos').textContent = 'SOS Emergency Alert';
      document.getElementById('navLabelSafety').textContent = 'Safety Plan & Directory';
    }
  },

  // Toast Notification System
  showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert-box alert-${type}`;
    toast.style.cssText = 'margin:0;padding:10px 16px;box-shadow:0 4px 12px rgba(0,0,0,0.15);border-radius:8px;max-width:340px;';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // Modal helpers
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  showLockScreen() {
    this.openModal('modalLockScreen');
  },

  // Update User Profile UI
  updateUserInterface() {
    const userLabel = document.getElementById('currentUsernameDisplay');
    const authStatus = document.getElementById('authStatusBadge');
    if (Auth.currentUser) {
      if (userLabel) userLabel.textContent = Auth.currentUser.username;
      if (authStatus) {
        authStatus.textContent = 'Protected Session';
        authStatus.className = 'badge badge-success';
      }
    } else {
      if (userLabel) userLabel.textContent = 'Anonymous Guest';
      if (authStatus) {
        authStatus.textContent = 'Guest / Offline Storage';
        authStatus.className = 'badge badge-warning';
      }
    }
    this.renderActiveSessions();
  },

  // -------------------------------------------------------------
  // MODULE INITIALIZERS
  // -------------------------------------------------------------

  // Mental Health Module
  initMentalHealth() {
    // 1. Box Breathing UI
    const circle = document.getElementById('breathingCircle');
    const phaseLabel = document.getElementById('breathingPhaseLabel');
    const timerLabel = document.getElementById('breathingTimerLabel');
    const cycleLabel = document.getElementById('breathingCyclesCount');
    const btnStart = document.getElementById('btnStartBreathing');
    const btnStop = document.getElementById('btnStopBreathing');

    if (btnStart && btnStop) {
      btnStart.addEventListener('click', () => {
        btnStart.style.display = 'none';
        btnStop.style.display = 'inline-flex';
        MentalHealth.startBreathing(state => {
          phaseLabel.textContent = state.phaseName;
          timerLabel.textContent = state.secondsLeft;
          cycleLabel.textContent = `Completed cycles: ${state.cycles}`;
          circle.className = `breathing-circle ${state.phaseClass}`;
        });
      });

      btnStop.addEventListener('click', () => {
        MentalHealth.stopBreathing();
        btnStop.style.display = 'none';
        btnStart.style.display = 'inline-flex';
        phaseLabel.textContent = 'Ready to Begin';
        timerLabel.textContent = '4';
        circle.className = 'breathing-circle';
      });
    }

    // 2. Affirmations UI
    const affText = document.getElementById('affirmationText');
    const btnAffNext = document.getElementById('btnNextAffirmation');
    if (affText && btnAffNext) {
      affText.textContent = MentalHealth.getRandomAffirmation();
      btnAffNext.addEventListener('click', () => {
        affText.textContent = MentalHealth.getRandomAffirmation();
      });
    }

    // 3. 5-4-3-2-1 Grounding UI
    const groundInputs = document.querySelectorAll('.grounding-input');
    const groundProgress = document.getElementById('groundingProgress');
    const groundFinished = document.getElementById('groundingCompletionCard');

    groundInputs.forEach(input => {
      input.addEventListener('input', () => {
        let filledCount = 0;
        groundInputs.forEach(i => { if (i.value.trim().length > 0) filledCount++; });
        if (groundProgress) {
          groundProgress.textContent = `${filledCount} of ${groundInputs.length} senses anchored`;
        }
        if (filledCount === groundInputs.length && groundFinished) {
          groundFinished.style.display = 'block';
        }
      });
    });

    const btnResetGround = document.getElementById('btnResetGrounding');
    if (btnResetGround) {
      btnResetGround.addEventListener('click', () => {
        groundInputs.forEach(i => { i.value = ''; });
        if (groundProgress) groundProgress.textContent = '0 of 15 senses anchored';
        if (groundFinished) groundFinished.style.display = 'none';
      });
    }

    // 4. Trauma-Informed Supportive Chat (Rule-Based Offline Companion)
    const chatInput = document.getElementById('chatInput');
    const chatBtn = document.getElementById('btnSendChat');
    const chatBox = document.getElementById('chatMessages');

    const appendMsg = (sender, text) => {
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${sender}`;
      bubble.textContent = text;
      chatBox.appendChild(bubble);
      chatBox.scrollTop = chatBox.scrollHeight;
    };

    const handleSend = () => {
      const text = chatInput.value.trim();
      if (!text) return;
      appendMsg('user', text);
      chatInput.value = '';

      setTimeout(() => {
        const reply = MentalHealth.getBotResponse(text);
        appendMsg('bot', reply);
      }, 400);
    };

    if (chatBtn && chatInput) {
      chatBtn.addEventListener('click', handleSend);
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
      });
    }

    // Quick chip buttons
    document.querySelectorAll('.chat-action-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chatInput.value = chip.textContent;
        handleSend();
      });
    });
  },

  // Physical Health & Sustenance Module (With Strict 12 Glass Water Limit)
  initPhysicalHealth() {
    const painSlider = document.getElementById('inputPainLevel');
    const painDisplay = document.getElementById('painLevelDisplay');
    if (painSlider && painDisplay) {
      painSlider.addEventListener('input', (e) => {
        painDisplay.textContent = `${e.target.value} / 10`;
      });
    }

    const form = document.getElementById('formLogSymptom');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
          painLevel: document.getElementById('inputPainLevel').value,
          painArea: document.getElementById('inputPainArea').value,
          bleeding: document.getElementById('inputBleeding').value,
          fever: document.getElementById('inputFever').value,
          dizziness: document.getElementById('inputDizziness').checked,
          bruising: document.getElementById('inputBruising').value,
          notes: document.getElementById('inputSymptomNotes').value
        };

        const result = PhysicalHealth.logSymptom(data);
        this.renderSymptomLogs();
        this.renderRedFlagAlerts(result.redFlags);
        form.reset();
        if (painSlider && painDisplay) painDisplay.textContent = '0 / 10';
        this.showToast('Health record saved locally on device.', 'success');
      });
    }

    // Sustenance & Water tracker buttons
    const btnAddWater = document.getElementById('btnAddWater');
    const btnSubWater = document.getElementById('btnSubWater');
    const waterCountDisplay = document.getElementById('waterGlassCount');
    const waterTipDisplay = document.getElementById('waterGuidanceTip');
    const waterLimitAlert = document.getElementById('waterLimitAlert');
    const deniedBox = document.getElementById('checkboxDeniedSustenance');

    const updateSustenanceUI = (todayLog) => {
      const glasses = Number(todayLog.waterGlasses) || 0;
      if (waterCountDisplay) waterCountDisplay.textContent = glasses;
      
      const guidance = PhysicalHealth.getHydrationGuidance(glasses);
      if (waterTipDisplay) {
        waterTipDisplay.innerHTML = `<span class=\"badge ${guidance.class}\">${guidance.status}</span> ${guidance.tip}`;
      }

      // Handle Strict 12-Glass Limit State
      if (glasses >= 12) {
        if (btnAddWater) btnAddWater.disabled = true;
        if (waterLimitAlert) waterLimitAlert.style.display = 'block';
      } else {
        if (btnAddWater) btnAddWater.disabled = false;
        if (waterLimitAlert) waterLimitAlert.style.display = 'none';
      }

      if (btnSubWater) {
        btnSubWater.disabled = (glasses <= 0);
      }

      if (deniedBox) deniedBox.checked = Boolean(todayLog.deniedFoodOrWater);
    };

    const initialToday = DB.getSustenanceForDate();
    if (initialToday) updateSustenanceUI(initialToday);

    if (btnAddWater) {
      btnAddWater.addEventListener('click', () => {
        const curCount = Number(DB.getSustenanceForDate().waterGlasses) || 0;
        if (curCount >= 12) {
          if (waterLimitAlert) waterLimitAlert.style.display = 'block';
          this.showToast('You have reached the daily tracking limit of 12 glasses.', 'calm');
          return;
        }

        const res = DB.addWaterGlass(null, 12);
        updateSustenanceUI(res);
        if (res.reachedLimit) {
          this.showToast('You have reached the daily tracking limit of 12 glasses.', 'calm');
        }
      });
    }

    if (btnSubWater) {
      btnSubWater.addEventListener('click', () => {
        const res = DB.removeWaterGlass(null);
        updateSustenanceUI(res);
      });
    }

    if (deniedBox) {
      deniedBox.addEventListener('change', (e) => {
        DB.updateTodaySustenance(item => {
          item.deniedFoodOrWater = e.target.checked;
          return item;
        });
        if (e.target.checked) {
          this.openModal('modalIsolationHelp');
        }
      });
    }

    this.renderSymptomLogs();
  },

  renderRedFlagAlerts(flags) {
    const container = document.getElementById('activeRedFlagsBox');
    if (!container) return;

    if (!flags || flags.length === 0) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = `
      <div class=\"alert-box alert-danger\">
        <div>
          <strong style=\"display:block;margin-bottom:6px;\">🚨 Urgent Medical Notice:</strong>
          <ul style=\"margin-left:20px;\">
            ${flags.map(f => `<li><strong>${f.title}:</strong> ${f.message}</li>`).join('')}
          </ul>
          <p style=\"margin-top:8px;font-size:0.85rem;\">SheCare AI is not a diagnostic tool. Please consider seeking emergency clinical assessment or visiting the nearest hospital emergency department.</p>
        </div>
      </div>
    `;
  },

  renderSymptomLogs() {
    const container = document.getElementById('symptomLogsList');
    if (!container) return;

    const logs = DB.getSymptoms();
    if (logs.length === 0) {
      container.innerHTML = '<p style=\"color:var(--text-muted);font-size:0.9rem;\">No symptoms recorded yet. Entries remain safely on this device only.</p>';
      return;
    }

    container.innerHTML = logs.map(log => `
      <div class=\"card\" style=\"padding:16px;margin-bottom:12px;\">
        <div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;\">
          <span style=\"font-weight:700;font-size:0.95rem;\">${new Date(log.timestamp).toLocaleDateString()} ${new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          <button class=\"btn btn-sm btn-secondary\" onclick=\"App.deleteSymptomEntry('${log.id}')\">Delete</button>
        </div>
        <div style=\"display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;\">
          <span class=\"badge ${log.painLevel >= 7 ? 'badge-danger' : 'badge-primary'}\">Pain: ${log.painLevel}/10 (${log.painArea})</span>
          <span class=\"badge badge-warning\">Bleeding: ${log.bleeding}</span>
          <span class=\"badge badge-neutral\">Fever: ${log.fever}</span>
          ${log.dizziness ? '<span class=\"badge badge-danger\">Dizziness / Nausea</span>' : ''}
        </div>
        ${log.bruising ? `<div style=\"font-size:0.85rem;color:var(--text-muted);margin-bottom:4px;\"><strong>Marks/Bruising:</strong> ${log.bruising}</div>` : ''}
        ${log.notes ? `<p style=\"font-size:0.88rem;color:var(--text-muted);background:var(--bg-subtle);padding:8px 12px;border-radius:6px;\">${log.notes}</p>` : ''}
      </div>
    `).join('');
  },

  deleteSymptomEntry(id) {
    if (confirm('Delete this symptom record from this device?')) {
      DB.deleteSymptom(id);
      this.renderSymptomLogs();
      this.showToast('Record deleted.');
    }
  },

  // Menstrual / Cycle Tracker Module
  initPeriodTracker() {
    const form = document.getElementById('formLogPeriod');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        try {
          const entry = {
            startDate: document.getElementById('inputCycleStartDate').value,
            flow: document.getElementById('inputCycleFlow').value,
            notes: document.getElementById('inputCycleNotes').value
          };
          PeriodTracker.logPeriod(entry);
          this.renderPeriodStats();
          this.renderPeriodHistory();
          form.reset();
          this.showToast('Cycle log recorded.', 'success');
        } catch (err) {
          alert(err.message);
        }
      });
    }

    this.renderPeriodStats();
    this.renderPeriodHistory();
  },

  renderPeriodStats() {
    const stats = PeriodTracker.calculateStats();
    const nextDateDisplay = document.getElementById('estimatedNextPeriodText');
    const fertileDisplay = document.getElementById('estimatedFertileWindowText');
    const avgLengthDisplay = document.getElementById('avgCycleDaysText');

    if (!stats.hasData) {
      if (nextDateDisplay) nextDateDisplay.textContent = 'Need at least 1 cycle log to calculate estimate.';
      if (fertileDisplay) fertileDisplay.textContent = 'Estimated window will show after cycle is logged.';
      if (avgLengthDisplay) avgLengthDisplay.textContent = 'Baseline 28 days';
      return;
    }

    if (nextDateDisplay) nextDateDisplay.textContent = `${stats.estimatedNextPeriod} (Statistical Estimate)`;
    if (fertileDisplay) fertileDisplay.textContent = `${stats.estimatedFertileStart} to ${stats.estimatedFertileEnd} (Approximate)`;
    if (avgLengthDisplay) avgLengthDisplay.textContent = `${stats.averageCycleDays} days`;
  },

  renderPeriodHistory() {
    const container = document.getElementById('cycleHistoryList');
    if (!container) return;

    const logs = DB.getCycleLogs();
    if (logs.length === 0) {
      container.innerHTML = '<p style=\"color:var(--text-muted);font-size:0.9rem;\">No previous cycles recorded.</p>';
      return;
    }

    container.innerHTML = logs.map(log => `
      <div style=\"display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);\">
        <div>
          <strong>Start Date: ${log.startDate}</strong>
          <div style=\"font-size:0.85rem;color:var(--text-muted);\">Flow: ${log.flow} ${log.notes ? '• ' + log.notes : ''}</div>
        </div>
        <span class=\"badge badge-primary\">Logged</span>
      </div>
    `).join('');
  },

  // Pregnancy & HIV/STI Module
  initPregnancySTI() {
    // 1. HIV PEP Calculator
    const btnCalcPep = document.getElementById('btnCalculatePep');
    const pepInput = document.getElementById('inputPepExposureDate');
    const pepResult = document.getElementById('pepCalculationResult');

    if (btnCalcPep && pepInput && pepResult) {
      btnCalcPep.addEventListener('click', () => {
        const val = pepInput.value;
        if (!val) {
          alert('Please select the approximate date and time of potential exposure.');
          return;
        }

        const res = PregnancySTI.calculatePepStatus(val);
        if (res.status === 'invalid') {
          pepResult.innerHTML = `<div class=\"alert-box alert-warning\">${res.message}</div>`;
          return;
        }

        pepResult.innerHTML = `
          <div class=\"alert-box alert-${res.severity === 'critical' ? 'danger' : (res.severity === 'urgent' ? 'warning' : 'neutral')}\">
            <div>
              <div style=\"font-size:1.1rem;font-weight:700;margin-bottom:6px;\">
                ${res.status === 'active' ? `⏳ Window Remaining: ${res.countdownText}` : '⚠️ PEP Window Has Passed'}
              </div>
              <p>${res.guidance}</p>
            </div>
          </div>
        `;
      });
    }

    // 2. Pregnancy Test Calculator
    const btnCalcPreg = document.getElementById('btnCalculatePregTest');
    const incidentDateInput = document.getElementById('inputPregIncidentDate');
    const pregResult = document.getElementById('pregnancyTestResult');

    if (btnCalcPreg && incidentDateInput && pregResult) {
      btnCalcPreg.addEventListener('click', () => {
        const dateVal = incidentDateInput.value;
        if (!dateVal) {
          alert('Please select the incident date.');
          return;
        }

        const res = PregnancySTI.calculatePregnancyTestDates(dateVal);
        pregResult.innerHTML = `
          <div class=\"card\" style=\"background:var(--bg-subtle);margin-top:16px;\">
            <h4 style=\"margin-bottom:10px;\">Testing & Emergency Contraception Timelines:</h4>
            <div style=\"margin-bottom:8px;\">
              <strong>Emergency Contraception (EC):</strong>
              <div>• Plan B (Levonorgestrel): ${res.planBEligible ? '<span class=\"badge badge-success\">Eligible (within 72h)</span>' : '<span class=\"badge badge-danger\">Window expired (>72h)</span>'}</div>
              <div>• Ella (Ulipristal Acetate): ${res.ellaEligible ? '<span class=\"badge badge-success\">Eligible (within 120h)</span>' : '<span class=\"badge badge-danger\">Window expired (>120h)</span>'}</div>
              <div>• Copper IUD insertion: ${res.iudEligible ? '<span class=\"badge badge-success\">Eligible (within 5 days)</span>' : '<span class=\"badge badge-danger\">Window expired (>5 days)</span>'}</div>
            </div>
            <div style=\"margin-top:12px;border-top:1px solid var(--border);padding-top:10px;\">
              <strong>Home Pregnancy Urine Test Dates:</strong>
              <div>• Earliest Detection Date: <strong>${res.earliestTestDate}</strong> (14 days post-incident)</div>
              <div>• High Accuracy Date: <strong>${res.accurateTestDate}</strong> (21 days post-incident)</div>
              <p style=\"font-size:0.8rem;color:var(--text-muted);margin-top:6px;\">Note: Testing earlier than 14 days often produces false negative results because hCG hormone levels require time to rise.</p>
            </div>
          </div>
        `;
      });
    }

    // 3. STI Educational Library Render
    const stiContainer = document.getElementById('stiKnowledgeCards');
    if (stiContainer) {
      stiContainer.innerHTML = PregnancySTI.stiData.map(item => `
        <div class=\"card\" style=\"padding:18px;\">
          <h4 style=\"color:var(--primary);margin-bottom:8px;\">${item.name}</h4>
          <p style=\"font-size:0.85rem;margin-bottom:6px;\"><strong>Transmission:</strong> ${item.transmission}</p>
          <p style=\"font-size:0.85rem;margin-bottom:6px;\"><strong>Emergency Prophylaxis:</strong> ${item.prophylaxis}</p>
          <p style=\"font-size:0.85rem;margin-bottom:6px;\"><strong>Testing Timeline:</strong> ${item.testingTimeline}</p>
          <p style=\"font-size:0.82rem;color:var(--text-muted);background:var(--bg-subtle);padding:8px;border-radius:6px;\">${item.notes}</p>
        </div>
      `).join('');
    }
  },

  // SOS Emergency Module (With Input Validation, Location Consent & Precautionary Siren)
  initSOS() {
    // 1. Contact Form
    const formContact = document.getElementById('formSosContact');
    if (formContact) {
      const existing = DB.getSosContacts()[0] || {};
      if (existing.name) document.getElementById('inputSosName').value = existing.name;
      if (existing.phone) document.getElementById('inputSosPhone').value = existing.phone;
      if (existing.email) document.getElementById('inputSosEmail').value = existing.email;
      if (existing.customMessage) document.getElementById('inputSosCustomMsg').value = existing.customMessage;

      formContact.addEventListener('submit', (e) => {
        e.preventDefault();
        const contact = {
          name: document.getElementById('inputSosName').value.trim(),
          phone: document.getElementById('inputSosPhone').value.trim(),
          email: document.getElementById('inputSosEmail').value.trim(),
          customMessage: document.getElementById('inputSosCustomMsg').value.trim(),
          isPrimary: true
        };
        const validation = SOS.validateContact(contact);
        if (!validation.valid) {
          alert(validation.error);
          return;
        }
        DB.saveSosContacts([contact]);
        this.showToast('Trusted contact details saved securely on device.', 'success');
      });
    }

    // Helper for location consent
    const getLocationIfConsented = () => {
      const consentBox = document.getElementById('checkboxConsentLocation');
      const hasConsent = consentBox ? consentBox.checked : false;
      return new Promise((resolve) => {
        if (!hasConsent || !navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 5000, maximumAge: 60000 }
        );
      });
    };

    // 2. Native SMS Trigger
    const btnSendSms = document.getElementById('btnDispatchSms');
    if (btnSendSms) {
      btnSendSms.addEventListener('click', async () => {
        const contact = DB.getSosContacts()[0];
        const validation = SOS.validateContact(contact);
        if (!validation.valid) {
          alert('Please configure a valid trusted contact phone number first.');
          return;
        }
        const consentBox = document.getElementById('checkboxConsentLocation');
        const hasConsent = consentBox ? consentBox.checked : false;
        const coords = await getLocationIfConsented();

        const msg = SOS.generateDistressMessage(contact.name, contact.customMessage, hasConsent, coords);
        SOS.dispatchViaDeviceSms(contact.phone, msg);
        this.renderSosLogs();
      });
    }

    // 3. Native Phone Call Trigger
    const btnCallContact = document.getElementById('btnDispatchCall');
    if (btnCallContact) {
      btnCallContact.addEventListener('click', () => {
        const contact = DB.getSosContacts()[0];
        const validation = SOS.validateContact(contact);
        if (!validation.valid) {
          alert('Please configure a valid trusted contact phone number first.');
          return;
        }
        SOS.dispatchViaPhoneCall(contact.phone);
        this.renderSosLogs();
      });
    }

    // 4. Server Gateway Trigger (Truthful network test)
    const btnSendServer = document.getElementById('btnDispatchServer');
    if (btnSendServer) {
      btnSendServer.addEventListener('click', async () => {
        const contact = DB.getSosContacts()[0];
        const validation = SOS.validateContact(contact);
        if (!validation.valid) {
          alert('Please configure a valid trusted contact phone number first.');
          return;
        }
        btnSendServer.disabled = true;
        btnSendServer.textContent = 'Transmitting...';
        const consentBox = document.getElementById('checkboxConsentLocation');
        const hasConsent = consentBox ? consentBox.checked : false;
        const coords = await getLocationIfConsented();

        const msg = SOS.generateDistressMessage(contact.name, contact.customMessage, hasConsent, coords);
        const res = await SOS.dispatchViaServer(contact.phone, msg);
        btnSendServer.disabled = false;
        btnSendServer.textContent = 'Send Alert via Server Gateway';
        this.renderSosLogs();
        this.showToast(res.statusText, res.status.includes('FAILED') ? 'danger' : 'success');
      });
    }

    // 5. Audio Siren Simulator (With Danger Warning)
    const btnStartSiren = document.getElementById('btnStartSiren');
    const btnStopSiren = document.getElementById('btnStopSiren');
    const sirenBanner = document.getElementById('sirenBanner');

    if (btnStartSiren && btnStopSiren) {
      btnStartSiren.addEventListener('click', () => {
        SOS.startSiren();
        btnStartSiren.style.display = 'none';
        btnStopSiren.style.display = 'inline-flex';
        if (sirenBanner) sirenBanner.style.display = 'block';
      });

      btnStopSiren.addEventListener('click', () => {
        SOS.stopSiren();
        btnStopSiren.style.display = 'none';
        btnStartSiren.style.display = 'inline-flex';
        if (sirenBanner) sirenBanner.style.display = 'none';
      });
    }

    this.renderSosLogs();
  },

  renderSosLogs() {
    const container = document.getElementById('sosDispatchLogsList');
    if (!container) return;

    const logs = DB.getSosLogs();
    if (logs.length === 0) {
      container.innerHTML = '<p style=\"color:var(--text-muted);font-size:0.88rem;\">No dispatch attempts recorded.</p>';
      return;
    }

    container.innerHTML = logs.map(l => `
      <div style=\"padding:10px 0;border-bottom:1px solid var(--border);\">
        <div style=\"display:flex;justify-content:space-between;align-items:center;\">
          <strong>${l.channel} &rarr; ${l.contactPhone}</strong>
          <span class=\"badge ${l.status.includes('FAILED') ? 'badge-danger' : (l.status.includes('PENDING') ? 'badge-warning' : 'badge-success')}\">${l.status}</span>
        </div>
        <p style=\"font-size:0.85rem;color:var(--text-muted);margin-top:4px;\">${l.statusText}</p>
        <div style=\"font-size:0.75rem;color:var(--text-subtle);\">Timestamp: ${new Date(l.timestamp).toLocaleTimeString()} • ${l.truthfulNote}</div>
      </div>
    `).join('');
  },

  // Safety Plan & Verified Directory Module
  initSafetyPlan() {
    // 1. Checklist render
    const plan = SafetyPlan.getPlan();
    const checklistContainer = document.getElementById('goBagChecklistContainer');
    if (checklistContainer) {
      checklistContainer.innerHTML = plan.goBagChecklist.map(item => `
        <label style=\"display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;\">
          <input type=\"checkbox\" id=\"check_${item.id}\" ${item.checked ? 'checked' : ''} onchange=\"App.onToggleGoBag('${item.id}', this.checked)\" style=\"width:18px;height:18px;\">
          <span style=\"font-size:0.92rem;${item.checked ? 'text-decoration:line-through;color:var(--text-muted);' : ''}\">${item.label}</span>
        </label>
      `).join('');
    }

    // 2. Safe Code Word & Isolation Steps Form
    const codeWordInput = document.getElementById('inputSafeCodeWord');
    const isolationInput = document.getElementById('inputIsolationSteps');
    const btnSaveSafetyDetails = document.getElementById('btnSaveSafetyDetails');

    if (codeWordInput && plan.safeCodeWord) codeWordInput.value = plan.safeCodeWord;
    if (isolationInput && plan.isolationSteps) isolationInput.value = plan.isolationSteps;

    if (btnSaveSafetyDetails) {
      btnSaveSafetyDetails.addEventListener('click', () => {
        const curPlan = SafetyPlan.getPlan();
        curPlan.safeCodeWord = codeWordInput.value.trim();
        curPlan.isolationSteps = isolationInput.value.trim();
        SafetyPlan.savePlan(curPlan);
        this.showToast('Safety details saved securely on device.', 'success');
      });
    }

    // 3. Verified Directory Filter (Country & Category)
    const filterSelect = document.getElementById('selectDirectoryFilter');
    const countrySelect = document.getElementById('selectCountryFilter');
    
    const applyFilters = () => {
      const cat = filterSelect ? filterSelect.value : 'All';
      const cty = countrySelect ? countrySelect.value : 'All';
      this.renderSupportDirectory(cat, cty);
    };

    if (filterSelect) filterSelect.addEventListener('change', applyFilters);
    if (countrySelect) countrySelect.addEventListener('change', applyFilters);

    this.renderSupportDirectory('All', 'All');
  },

  onToggleGoBag(itemId, checked) {
    SafetyPlan.toggleChecklistItem(itemId, checked);
    this.initSafetyPlan();
  },

  renderSupportDirectory(categoryFilter = 'All', countryFilter = 'All') {
    const container = document.getElementById('verifiedDirectoryContainer');
    if (!container) return;

    let items = SafetyPlan.verifiedDirectory;
    if (categoryFilter !== 'All') {
      items = items.filter(i => i.category === categoryFilter);
    }
    if (countryFilter !== 'All') {
      items = items.filter(i => i.country === countryFilter || (countryFilter === 'Global' && i.country.includes('Global')));
    }

    if (items.length === 0) {
      container.innerHTML = '<p style=\"color:var(--text-muted);font-size:0.9rem;padding:12px;\">No directory resources match the selected filters.</p>';
      return;
    }

    container.innerHTML = items.map(item => `
      <div class=\"card\" style=\"padding:20px;\">
        <div style=\"display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;\">
          <div>
            <h4 style=\"font-size:1.1rem;font-weight:700;\">${item.name}</h4>
            <span class=\"badge badge-primary\" style=\"margin-top:4px;\">${item.category} • ${item.country}</span>
          </div>
          <span class=\"badge badge-success\">${item.availability}</span>
        </div>
        <p style=\"font-size:0.88rem;color:var(--text-muted);margin:10px 0;\">${item.description}</p>
        ${item.officialSource ? `<div style=\"font-size:0.75rem;color:var(--text-subtle);margin-bottom:10px;\"><strong>Source:</strong> ${item.officialSource}</div>` : ''}
        <div style=\"display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;\">
          ${item.phone ? `<a href=\"tel:${item.phone.replace(/[^0-9+]/g, '')}\" class=\"btn btn-sm btn-primary\">Call ${item.phone}</a>` : ''}
          ${item.web ? `<a href=\"${item.web}\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"btn btn-sm btn-secondary\">Visit Official Website</a>` : ''}
          ${item.text ? `<span class=\"badge badge-neutral\" style=\"align-self:center;\">${item.text}</span>` : ''}
        </div>
      </div>
    `).join('');
  },

  // Auth, Active Sessions & Privacy Module
  initAuthAndSessions() {
    // Password Strength Meter listener
    const regPasswordInput = document.getElementById('inputRegPassword');
    const strengthFill = document.getElementById('pwdStrengthFill');
    const strengthLabel = document.getElementById('pwdStrengthLabel');
    const strengthFeedback = document.getElementById('pwdStrengthFeedback');

    if (regPasswordInput && strengthFill && strengthLabel) {
      regPasswordInput.addEventListener('input', (e) => {
        const strength = Auth.evaluatePasswordStrength(e.target.value);
        strengthFill.className = `password-strength-fill ${strength.class}`;
        strengthLabel.textContent = `Strength: ${strength.label}`;
        if (strengthFeedback) strengthFeedback.textContent = strength.feedback;
      });
    }

    // Register Form
    const formReg = document.getElementById('formRegister');
    if (formReg) {
      formReg.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const user = document.getElementById('inputRegUsername').value;
          const pass = document.getElementById('inputRegPassword').value;
          const hint = document.getElementById('inputRegHint').value;
          await Auth.register(user, pass, hint);
          this.updateUserInterface();
          formReg.reset();
          this.showToast('Profile created with PBKDF2 encryption!', 'success');
        } catch (err) {
          alert(err.message);
        }
      });
    }

    // Login Form
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const user = document.getElementById('inputLoginUsername').value;
          const pass = document.getElementById('inputLoginPassword').value;
          await Auth.login(user, pass);
          this.updateUserInterface();
          formLogin.reset();
          this.showToast('Welcome back. Session active.', 'success');
        } catch (err) {
          alert(err.message);
        }
      });
    }

    // Re-auth Lock Form
    const formUnlock = document.getElementById('formUnlockScreen');
    if (formUnlock) {
      formUnlock.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const pass = document.getElementById('inputUnlockPassword').value;
          const stored = DB.get(DB.KEYS.USER, null);
          if (!stored) {
            this.closeModal('modalLockScreen');
            return;
          }
          await Auth.login(stored.username, pass);
          this.closeModal('modalLockScreen');
          document.getElementById('inputUnlockPassword').value = '';
          this.showToast('Unlocked.');
        } catch (err) {
          alert('Incorrect password. Please try again.');
        }
      });
    }

    // Purge All Data Button
    const btnPurge = document.getElementById('btnPurgeAllData');
    if (btnPurge) {
      btnPurge.addEventListener('click', () => {
        if (confirm('CRITICAL PRIVACY ACTION: This will permanently wipe all local health logs, period logs, contacts, and account credentials from this device. Are you sure?')) {
          DB.purgeAllData();
          Auth.logout();
          window.location.reload();
        }
      });
    }

    // Export Data Button
    const btnExport = document.getElementById('btnExportData');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const json = DB.exportData();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shecare_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Export downloaded safely.');
      });
    }
  },

  renderActiveSessions() {
    const container = document.getElementById('activeSessionsList');
    if (!container) return;

    const sessions = Auth.getActiveSessions();
    if (sessions.length === 0) {
      container.innerHTML = '<p style=\"color:var(--text-muted);font-size:0.88rem;\">No active sessions tracked.</p>';
      return;
    }

    container.innerHTML = sessions.map(s => `
      <div style=\"display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid var(--border);\">
        <div>
          <div style=\"font-weight:600;font-size:0.92rem;\">${s.browser} on ${s.os} ${s.isCurrent ? '<span class=\"badge badge-success\">This Device</span>' : ''}</div>
          <div style=\"font-size:0.78rem;color:var(--text-muted);margin-top:2px;\">Screen: ${s.screen} • Login: ${new Date(s.loginTime).toLocaleDateString()} ${new Date(s.loginTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
        </div>
        ${!s.isCurrent ? `<button class=\"btn btn-sm btn-secondary\" onclick=\"App.revokeSessionItem('${s.id}')\">Revoke</button>` : '<span style=\"font-size:0.8rem;color:var(--text-muted);\">Active</span>'}
      </div>
    `).join('');
  },

  revokeSessionItem(sessionId) {
    const res = Auth.revokeSession(sessionId);
    this.renderActiveSessions();
    if (res.loggedOutCurrent) {
      window.location.reload();
    } else {
      this.showToast('Session revoked.');
    }
  }
};

// Global Bootstrapper
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
