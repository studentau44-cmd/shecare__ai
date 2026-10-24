/**
 * SurvivorCare AI / SheCare AI - Menstrual & Cycle Tracker
 * Records cycle dates, symptoms, and flow.
 * All predictions are explicitly labelled statistical estimates.
 * Implements timezone-safe date math for month and year boundaries.
 */
const PeriodTracker = {
  // Validate YYYY-MM-DD format and real calendar date
  isValidDateString(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    const [y, m, d] = parts.map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
    if (y < 1970 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
    
    // Check with UTC date to ensure valid calendar day (e.g. Feb 31 rejected)
    const test = new Date(Date.UTC(y, m - 1, d));
    return test.getUTCFullYear() === y && (test.getUTCMonth() + 1) === m && test.getUTCDate() === d;
  },

  // Timezone-safe UTC date addition
  addDaysToDateString(dateStr, daysToAdd) {
    if (!this.isValidDateString(dateStr)) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    const utcMs = Date.UTC(y, m - 1, d) + (daysToAdd * 86400000);
    const res = new Date(utcMs);
    const resY = res.getUTCFullYear();
    const resM = String(res.getUTCMonth() + 1).padStart(2, '0');
    const resD = String(res.getUTCDate()).padStart(2, '0');
    return `${resY}-${resM}-${resD}`;
  },

  // Calculate cycle difference in days (UTC)
  diffInDays(startStr, endStr) {
    if (!this.isValidDateString(startStr) || !this.isValidDateString(endStr)) return null;
    const [y1, m1, d1] = startStr.split('-').map(Number);
    const [y2, m2, d2] = endStr.split('-').map(Number);
    const ms1 = Date.UTC(y1, m1 - 1, d1);
    const ms2 = Date.UTC(y2, m2 - 1, d2);
    return Math.round((ms2 - ms1) / 86400000);
  },

  // Calculate cycle statistics
  calculateStats(customLogs = null) {
    const rawLogs = customLogs || DB.getCycleLogs();
    if (!rawLogs || !Array.isArray(rawLogs) || rawLogs.length === 0) {
      return {
        hasData: false,
        averageCycleDays: 28,
        estimatedNextPeriod: null,
        estimatedFertileStart: null,
        estimatedFertileEnd: null,
        disclaimer: 'Predictions are statistical estimates only. Menstrual timing varies widely with stress and trauma.'
      };
    }

    // Filter valid dates and sort ascending
    const validLogs = rawLogs
      .filter(l => l && this.isValidDateString(l.startDate))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    if (validLogs.length === 0) {
      return {
        hasData: false,
        averageCycleDays: 28,
        estimatedNextPeriod: null,
        estimatedFertileStart: null,
        estimatedFertileEnd: null,
        disclaimer: 'No valid calendar dates found.'
      };
    }

    const cycleLengths = [];
    for (let i = 1; i < validLogs.length; i++) {
      const diff = this.diffInDays(validLogs[i - 1].startDate, validLogs[i].startDate);
      // Valid historical cycle lengths typically between 18 and 50 days
      if (diff !== null && diff >= 18 && diff <= 55) {
        cycleLengths.push(diff);
      }
    }

    const avgDays = cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : 28;

    const latest = validLogs[validLogs.length - 1];
    
    // Predicted next period date using safe UTC math
    const estimatedNextPeriod = this.addDaysToDateString(latest.startDate, avgDays);
    // Estimated fertile window: approx 17 days to 11 days before next estimated period
    const estimatedFertileStart = this.addDaysToDateString(latest.startDate, avgDays - 17);
    const estimatedFertileEnd = this.addDaysToDateString(latest.startDate, avgDays - 11);

    return {
      hasData: true,
      lastRecordedDate: latest.startDate,
      averageCycleDays: avgDays,
      estimatedNextPeriod,
      estimatedFertileStart,
      estimatedFertileEnd,
      disclaimer: 'Statistical estimate only. Acute trauma, severe stress, emergency contraception, or nutritional deprivation cause unpredictable variations. Never use to rule out pregnancy.'
    };
  },

  // Save new period entry
  logPeriod(entry) {
    if (!entry || !entry.startDate) {
      throw new Error('Please select a cycle start date.');
    }
    if (!this.isValidDateString(entry.startDate)) {
      throw new Error('Invalid date format. Please use a valid calendar date.');
    }
    return DB.saveCycleLog(entry);
  }
};
