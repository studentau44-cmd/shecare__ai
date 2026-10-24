/**
 * SurvivorCare AI / SheCare AI - Physical Health & Sustenance Log
 * Tracks physical recovery, injuries, pain, fever, bleeding, dizziness,
 * and daily sustenance (food/water). Provides non-diagnostic urgent-care flags.
 */
const PhysicalHealth = {
  // Evaluate Red Flag Symptoms (Non-diagnostic safety guidance)
  checkRedFlags(data) {
    const flags = [];
    const pain = Number(data.painLevel) || 0;
    
    if (pain >= 8) {
      flags.push({
        severity: 'critical',
        title: 'Severe Pain (Level ' + pain + '/10)',
        message: 'Severe acute pain requires immediate clinical evaluation to check for internal injuries or physical trauma.'
      });
    }

    if (data.bleeding === 'Heavy' || data.bleeding === 'Abnormal Continuous') {
      flags.push({
        severity: 'critical',
        title: 'Heavy or Abnormal Bleeding',
        message: 'Heavy bleeding soaking through more than two sanitary pads per hour, or bleeding lasting multiple days after assault, warrants emergency medical assessment.'
      });
    }

    if (data.fever === 'High (>=101°F / 38.3°C)' || data.fever === 'Severe with Chills') {
      flags.push({
        severity: 'warning',
        title: 'High Fever / Signs of Infection',
        message: 'Fever accompanied by pelvic, abdominal, or genital pain may indicate an acute infection requiring clinical antibiotics or medical tests.'
      });
    }

    if (data.dizziness && (data.bleeding !== 'None' || pain >= 5)) {
      flags.push({
        severity: 'critical',
        title: 'Dizziness with Trauma / Bleeding',
        message: 'Dizziness, lightheadedness, or feeling faint alongside bleeding or physical trauma can indicate blood loss, shock, or severe dehydration.'
      });
    }

    if (data.painArea === 'Neck / Throat' || (data.notes && data.notes.toLowerCase().includes('strangl'))) {
      flags.push({
        severity: 'emergency',
        title: 'Potential Strangulation / Airway Risk',
        message: 'CRITICAL: Strangulation or neck pressure can cause delayed internal swelling, vocal changes, or carotid injury hours or days later. Immediate emergency room evaluation is vital, even if no external marks appear.'
      });
    }

    return flags;
  },

  // Save new symptom entry
  logSymptom(formData) {
    const redFlags = this.checkRedFlags(formData);
    const entry = {
      painLevel: formData.painLevel,
      painArea: formData.painArea,
      bleeding: formData.bleeding,
      fever: formData.fever,
      dizziness: formData.dizziness,
      bruising: formData.bruising,
      notes: formData.notes,
      redFlags
    };
    return DB.saveSymptom(entry);
  },

  // Hydration Guidance (Clarifying that tracking limit of 12 is a software limit, not universal clinical prescription)
  getHydrationGuidance(glasses) {
    const count = Number(glasses) || 0;
    if (count === 0) {
      return {
        status: 'None Recorded',
        class: 'badge-danger',
        tip: 'No water recorded today. If you are experiencing dehydration, take small, frequent sips of clean water if safely accessible.'
      };
    } else if (count < 4) {
      return {
        status: 'Low Intake',
        class: 'badge-warning',
        tip: 'Your body needs fluids to help heal from trauma. Aim to drink water steadily through the day if safe.'
      };
    } else if (count < 12) {
      return {
        status: 'Logged (' + count + '/12)',
        class: 'badge-success',
        tip: 'Steady fluid intake logged. Note: Hydration needs vary by person, weather, and physical circumstances.'
      };
    } else {
      return {
        status: 'Limit Reached (12/12)',
        class: 'badge-peach',
        tip: 'You have reached the daily tracking limit of 12 glasses. Note: This is an app tracking limit; personal hydration requirements vary.'
      };
    }
  }
};
