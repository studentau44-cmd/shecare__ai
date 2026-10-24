/**
 * SurvivorCare AI / SheCare AI - Safety Plan Builder & Verified Support Directory
 * Empowers survivors to prepare personal safety strategies and access verified
 * international & national crisis, medical, legal, and sustenance lifelines.
 * Includes independently verified official resources for Pakistan, India, US, UK, and Canada.
 */
const SafetyPlan = {
  // Verified Support Directory (Real, verified, non-fictional resources)
  verifiedDirectory: [
    // --- PAKISTAN RESOURCES ---
    {
      id: 'mohr_pk',
      name: 'Ministry of Human Rights (MOHR) Helpline',
      category: 'Legal Advocacy',
      country: 'Pakistan',
      phone: '1099',
      text: null,
      web: 'https://mohr.gov.pk',
      availability: 'Toll-Free 24/7 across Pakistan',
      officialSource: 'Government of Pakistan, Ministry of Human Rights',
      description: 'Official federal government helpline providing free legal advice, emergency human rights violation reporting, and crisis referrals for women facing abuse or confinement.'
    },
    {
      id: 'madadgaar_pk',
      name: 'Madadgaar National Helpline',
      category: 'Immediate Crisis',
      country: 'Pakistan',
      phone: '1098',
      text: null,
      web: 'http://www.madadgaar.org',
      availability: 'Daily 9:00 AM – 9:00 PM PKT (Landline: 021-34533033)',
      officialSource: 'Lawyers for Human Rights and Legal Aid (LHRLA) / Madadgaar',
      description: 'First national civil society helpline for women and children in Pakistan, offering immediate crisis support, shelter referrals, and legal counsel.'
    },
    {
      id: 'pcsw_punjab_pk',
      name: 'Punjab Women Helpline (1043)',
      category: 'Immediate Crisis',
      country: 'Pakistan',
      phone: '1043',
      text: null,
      web: 'https://pcsw.punjab.gov.pk',
      availability: 'Toll-Free 24/7 (Punjab Province)',
      officialSource: 'Punjab Commission on the Status of Women (PCSW)',
      description: 'Official 24/7 helpline for women dealing with domestic abuse, violence, or harassment; coordinates with local police and shelter homes (Dar-ul-Aman).'
    },
    {
      id: 'rozan_pk',
      name: 'Rozan Counselling & Emotional Support Helpline',
      category: 'Counseling',
      country: 'Pakistan',
      phone: '0800-22444',
      text: 'Mobile: 0304-111-1741',
      web: 'https://rozan.org',
      availability: 'Mon–Sat, 10:00 AM – 6:00 PM PKT',
      officialSource: 'Rozan (Registered non-profit mental health NGO, Islamabad)',
      description: 'Specialized trauma-informed psychological first aid and emotional counselling for women survivors of gender-based violence and distress.'
    },

    // --- INDIA RESOURCES ---
    {
      id: 'erss_in',
      name: 'National Emergency Response Support System (ERSS)',
      category: 'Immediate Crisis',
      country: 'India',
      phone: '112',
      text: 'SMS: 112',
      web: 'https://112.gov.in',
      availability: 'Toll-Free 24/7 Pan-India',
      officialSource: 'Ministry of Home Affairs, Government of India',
      description: 'Single national emergency number across all Indian States and Union Territories for immediate police, fire, or emergency medical response.'
    },
    {
      id: 'women_helpline_in',
      name: 'Women Helpline (181)',
      category: 'Immediate Crisis',
      country: 'India',
      phone: '181',
      text: null,
      web: 'https://wcd.nic.in',
      availability: 'Toll-Free 24/7 Pan-India',
      officialSource: 'Ministry of Women and Child Development (MWCD), Government of India',
      description: 'Universal toll-free 24/7 emergency response and referral service for women affected by violence; directly linked to One Stop Centres (Sakhi) for medical, legal, and counseling aid.'
    },
    {
      id: 'ncw_in',
      name: 'National Commission for Women (NCW) 24/7 Helpline',
      category: 'Legal Advocacy',
      country: 'India',
      phone: '7827170170',
      text: null,
      web: 'http://ncw.nic.in',
      availability: '24/7 Dedicated Helpline',
      officialSource: 'National Commission for Women, Government of India',
      description: 'Round-the-clock helpline providing support, legal assistance, and rapid coordination for women facing domestic violence, sexual assault, and coercion.'
    },
    {
      id: 'nimhans_in',
      name: 'NIMHANS Psychosocial & Mental Health Helpline',
      category: 'Counseling',
      country: 'India',
      phone: '080-46110007',
      text: null,
      web: 'https://nimhans.ac.in',
      availability: 'Toll-Free 24/7',
      officialSource: 'National Institute of Mental Health and Neuro Sciences (NIMHANS)',
      description: 'National psychosocial helpline providing free, confidential trauma support, crisis counseling, and psychological first aid.'
    },

    // --- UNITED STATES & CANADA ---
    {
      id: 'rainn_us',
      name: 'RAINN (National Sexual Assault Hotline)',
      category: 'Immediate Crisis',
      country: 'United States',
      phone: '1-800-656-4673',
      text: null,
      web: 'https://www.rainn.org',
      availability: '24/7, Free, Confidential',
      officialSource: 'Rape, Abuse & Incest National Network (RAINN)',
      description: 'The largest anti-sexual violence organization in the US. Connects survivors with local sexual assault service providers trained to support healing and medical forensic guidance.'
    },
    {
      id: 'ndvh_us',
      name: 'National Domestic Violence Hotline',
      category: 'Immediate Crisis',
      country: 'United States',
      phone: '1-800-799-7233',
      text: 'Text "START" to 88788',
      web: 'https://www.thehotline.org',
      availability: '24/7, Free, Confidential',
      officialSource: 'National Domestic Violence Hotline',
      description: 'Support for survivors experiencing domestic abuse, coercion, physical violence, or isolation. Can help create emergency shelter and safety plans.'
    },
    {
      id: 'crisis_text_line',
      name: 'Crisis Text Line',
      category: 'Counseling',
      country: 'US, UK, Canada',
      phone: null,
      text: 'Text "HOME" to 741741 (US/CA) or 85258 (UK)',
      web: 'https://www.crisistextline.org',
      availability: '24/7, Free, Confidential',
      officialSource: 'Crisis Text Line Inc.',
      description: 'Free, confidential 24/7 text support with trained crisis counselors for acute trauma, panic, anxiety, or emotional distress.'
    },
    {
      id: 'lifeline_988',
      name: '988 Suicide & Crisis Lifeline',
      category: 'Immediate Crisis',
      country: 'United States & Canada',
      phone: '988',
      text: 'Text 988',
      web: 'https://988lifeline.org',
      availability: '24/7, Free, Confidential',
      officialSource: 'SAMHSA / Vibrant Emotional Health',
      description: 'Immediate compassionate support for individuals experiencing overwhelming emotional pain, panic, or thoughts of self-harm.'
    },
    {
      id: 'sarc_uk',
      name: 'UK National Rape Crisis & SARC Directory',
      category: 'Medical & Forensic',
      country: 'United Kingdom',
      phone: '0808 500 2222',
      text: null,
      web: 'https://rapecrisis.org.uk',
      availability: '24/7 Free Support',
      officialSource: 'Rape Crisis England & Wales / NHS SARC Network',
      description: 'Specialist services for women and girls who have experienced rape or sexual abuse. Facilitates access to NHS Sexual Assault Referral Centres (SARCs).'
    },
    {
      id: 'cwf_canada',
      name: 'Canadian Women\'s Foundation & Shelter Network',
      category: 'Shelter & Food Aid',
      country: 'Canada',
      phone: '1-866-863-0511',
      text: null,
      web: 'https://canadianwomen.org',
      availability: '24/7 Emergency Support',
      officialSource: 'Canadian Women\'s Foundation',
      description: 'Connects survivors across Canada with safe emergency shelters, food security, trauma counseling, and legal support services.'
    },
    {
      id: 'iasp_global',
      name: 'Befrienders Worldwide & IASP Global Lifelines',
      category: 'Immediate Crisis',
      country: 'Global / International',
      phone: null,
      text: null,
      web: 'https://www.befrienders.org',
      availability: 'Directory of 400+ international centers',
      officialSource: 'International Association for Suicide Prevention (IASP) / Befrienders',
      description: 'Global database of free, verified crisis lines and emotional support centers across Europe, Asia, Africa, the Americas, and Oceania.'
    }
  ],

  // Load Safety Plan
  getPlan() {
    return DB.getSafetyPlan();
  },

  // Save changes to Safety Plan
  savePlan(plan) {
    return DB.saveSafetyPlan(plan);
  },

  // Toggle go-bag checklist item
  toggleChecklistItem(itemId, checked) {
    const plan = this.getPlan();
    const item = plan.goBagChecklist.find(i => i.id === itemId);
    if (item) {
      item.checked = checked;
      this.savePlan(plan);
    }
    return plan;
  },

  // Add safe location
  addSafeLocation(location) {
    const plan = this.getPlan();
    plan.safeLocations.push(location);
    this.savePlan(plan);
    return plan;
  },

  // Remove safe location
  removeSafeLocation(index) {
    const plan = this.getPlan();
    if (index >= 0 && index < plan.safeLocations.length) {
      plan.safeLocations.splice(index, 1);
      this.savePlan(plan);
    }
    return plan;
  }
};
