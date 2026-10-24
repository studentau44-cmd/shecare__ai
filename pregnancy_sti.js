/**
 * SurvivorCare AI - Pregnancy & HIV/STI Support
 * Provides urgent HIV PEP (72-hour window) countdown, STI educational facts,
 * and responsible pregnancy test guidance. Strictly non-diagnostic.
 */
const PregnancySTI = {
  // HIV PEP 72-Hour Calculator
  calculatePepStatus(exposureDateTimeStr) {
    if (!exposureDateTimeStr) return null;

    const exposureTime = new Date(exposureDateTimeStr).getTime();
    const now = Date.now();
    const diffMs = now - exposureTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    const windowHours = 72;
    const hoursRemaining = windowHours - diffHours;

    if (diffHours < 0) {
      return {
        status: 'invalid',
        message: 'Selected date/time is in the future. Please select when the incident occurred.'
      };
    }

    if (hoursRemaining > 0) {
      const hoursInt = Math.floor(hoursRemaining);
      const minutesInt = Math.floor((hoursRemaining - hoursInt) * 60);
      const isUrgent = hoursRemaining < 24;

      return {
        status: 'active',
        hoursRemaining: hoursRemaining.toFixed(1),
        countdownText: `${hoursInt} hours, ${minutesInt} mins remaining`,
        severity: isUrgent ? 'critical' : 'urgent',
        badgeClass: isUrgent ? 'badge-danger' : 'badge-warning',
        guidance: isUrgent
          ? 'URGENT: Less than 24 hours remain in the 72-hour PEP window. Go immediately to an Emergency Room, Sexual Assault Referral Centre (SARC), or Urgent Care.'
          : 'TIME-SENSITIVE: You are within the 72-hour window. PEP (Post-Exposure Prophylaxis) is most effective the sooner it is started. Please consult an emergency clinician or SARC clinic right away.'
      };
    } else {
      const hoursPast = Math.abs(hoursRemaining).toFixed(0);
      return {
        status: 'expired',
        hoursRemaining: 0,
        hoursPast,
        severity: 'neutral',
        badgeClass: 'badge-neutral',
        guidance: `The 72-hour window has passed (${hoursPast} hours ago). While PEP is generally not prescribed past 72 hours, clinical assessment, baseline STI/HIV lab testing, and follow-up medical care are still very important. Please visit a clinic or healthcare provider.`
      };
    }
  },

  // Pregnancy Test Timeline Calculator
  calculatePregnancyTestDates(incidentDateStr, nextPeriodDateStr) {
    if (!incidentDateStr) return null;

    const incidentDate = new Date(incidentDateStr);
    
    // Earliest home urine test: 14 days after incident
    const earliestTestDate = new Date(incidentDate);
    earliestTestDate.setDate(incidentDate.getDate() + 14);

    // High accuracy home urine test: 21 days after incident
    const accurateTestDate = new Date(incidentDate);
    accurateTestDate.setDate(incidentDate.getDate() + 21);

    // Emergency Contraceptive Windows from incident
    const now = new Date();
    const hoursSinceIncident = (now - incidentDate) / (1000 * 60 * 60);

    return {
      hoursSinceIncident: Math.max(0, Math.floor(hoursSinceIncident)),
      planBEligible: hoursSinceIncident <= 72,
      ellaEligible: hoursSinceIncident <= 120,
      iudEligible: hoursSinceIncident <= 120,
      earliestTestDate: earliestTestDate.toISOString().split('T')[0],
      accurateTestDate: accurateTestDate.toISOString().split('T')[0]
    };
  },

  // STI Information Library
  stiData: [
    {
      name: 'HIV (Human Immunodeficiency Virus)',
      transmission: 'Unprotected penetrative sex, broken mucosal membranes, blood contact',
      prophylaxis: 'PEP (Post-Exposure Prophylaxis) within 72 hours (antiretroviral regimen for 28 days)',
      testingTimeline: 'Baseline test immediately, then repeat at 4–6 weeks and 3 months (lab blood test)',
      notes: 'Symptoms like swollen glands, sore throat, or mild fever may or may not occur and cannot diagnose or rule out HIV. Clinical testing is required.'
    },
    {
      name: 'Chlamydia & Gonorrhea',
      transmission: 'Genital, oral, or anal contact',
      prophylaxis: 'Commonly prescribed presumptive antibiotics (e.g. Ceftriaxone + Doxycycline) at emergency/SARC exam',
      testingTimeline: 'NAAT urine test or swab 1 to 2 weeks post-incident',
      notes: 'Frequently 100% asymptomatic in women. Highly treatable with standard antibiotics when evaluated by a clinician.'
    },
    {
      name: 'Trichomoniasis',
      transmission: 'Parasitic protozoan spread via genital contact',
      prophylaxis: 'Presumptive single-dose Metronidazole or Tinidazole often offered at clinical exam',
      testingTimeline: 'Lab swab or NAAT test 1 to 3 weeks post-incident',
      notes: 'Can cause itching, discharge, or burning, or remain without symptoms.'
    },
    {
      name: 'Hepatitis B (HBV)',
      transmission: 'Blood, semen, and other bodily fluids',
      prophylaxis: 'Hepatitis B vaccine and/or Hepatitis B Immune Globulin (HBIG) within 14 days for unvaccinated individuals',
      testingTimeline: 'Baseline blood panel, repeat at 3 and 6 months',
      notes: 'Hospital SARC staff can check your vaccination status and administer protective doses if indicated.'
    },
    {
      name: 'Syphilis',
      transmission: 'Direct contact with a syphilis chancre/sore',
      prophylaxis: 'Penicillin or doxycycline prescribed upon clinical suspicion or confirmed exposure',
      testingTimeline: 'Serological blood test (RPR/VDRL) at baseline, 6 weeks, and 3 months',
      notes: 'Painless sores may appear 3 weeks later and can easily go unnoticed. Curable with antibiotics.'
    }
  ]
};
