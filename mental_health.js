/**
 * SurvivorCare AI - Trauma-Informed Mental Health Support
 * Provides grounding exercises (5-4-3-2-1), box breathing, affirmations,
 * and supportive offline chat. Does not replace a licensed therapist.
 */
const MentalHealth = {
  // Box Breathing State
  breathingInterval: null,
  breathingSeconds: 4,
  breathingPhaseIndex: 0,
  breathingCycleCount: 0,
  breathingPhases: [
    { name: 'Inhale Slowly', class: 'inhale', duration: 4 },
    { name: 'Hold Gently', class: 'hold', duration: 4 },
    { name: 'Exhale Smoothly', class: 'exhale', duration: 4 },
    { name: 'Rest / Pause', class: 'rest', duration: 4 }
  ],

  // Trauma-Informed Affirmations Library
  affirmations: [
    "What happened was not your fault. You are not to blame.",
    "You survived. Your body and mind did what was necessary to keep you alive.",
    "You have the right to feel whatever you are feeling right now—anger, sadness, numbness, or shock.",
    "You deserve safety, food, clean water, and compassionate medical care.",
    "Healing does not have a strict timeline. You can take this one breath and one moment at a time.",
    "You do not have to make major decisions right now. Your safety and grounding come first.",
    "Your boundaries are valid, and you have complete ownership over your body and your story.",
    "You are worthy of support, respect, and peaceful living."
  ],

  // Curated Rule-Based Offline Response Knowledgebase
  // Clearly labeled as deterministic rule-based offline support, not an AI LLM or therapist
  offlineResponses: [
    {
      keywords: ['panic', 'anxiety', 'scared', 'shaking', 'hyperventilat', 'breath', 'terrified', 'fear'],
      reply: "Take a gentle breath with me right now. You are physically safe in this immediate second. Panic is your nervous system trying to protect you, but the danger is not in this very room right now. Would you like to try the Box Breathing exercise or the 5-4-3-2-1 Grounding tool on this page? They can help signal your brain that you are safe."
    },
    {
      keywords: ['guilt', 'fault', 'blame', 'regret', 'stupid', 'should have', 'my fault', 'ashamed', 'shame'],
      reply: "Please hear this clearly: What happened is 100% the responsibility of the person who harmed you. It was NEVER your fault. Nothing you wore, drank, said, or did justifies assault or abuse. Self-blame is a common coping response to regain a sense of control, but you are not to blame."
    },
    {
      keywords: ['flashback', 'reliving', 'memories', 'nightmare', 'vision', 'remembering'],
      reply: "A flashback can feel so vivid, but it is a memory, not the present reality. Feel the ground beneath your feet. Touch a solid surface near you. Look at 3 blue or green objects in your room. Remind yourself: 'I am here, in the present, and the memory cannot hurt me right now.'"
    },
    {
      keywords: ['water', 'food', 'starv', 'hungry', 'thirsty', 'denied', 'locked', 'trapped'],
      reply: "Denying someone food or water is severe neglect and abuse. If you are trapped or being withheld basic necessities, please check our Sustenance Tracker to log what you can safely access, and view our Safety Plan to find emergency shelter, discreet community support, or safe contacts who can intervene."
    },
    {
      keywords: ['therapist', 'doctor', 'counsel', 'hospital', 'clinic', 'exam', 'sarc'],
      reply: "I am an offline support companion, not a licensed therapist or physician. Reaching out to a specialized trauma counselor or visiting a Sexual Assault Referral Centre (SARC) / ER can provide compassionate medical care, STI prevention (PEP within 72h), and emotional support at your own pace."
    },
    {
      keywords: ['pep', 'hiv', 'sti', 'std', 'infection', 'disease'],
      reply: "If you have concerns about HIV or STIs, please note that HIV PEP (Post-Exposure Prophylaxis) must be started within 72 hours of exposure to be effective. Check our HIV/STI section for a live countdown and guidance on accessing confidential clinical assessment."
    },
    {
      keywords: ['pregnant', 'pregnancy', 'plan b', 'morning after', 'period'],
      reply: "You have compassionate options. Emergency contraception (like Plan B) is most effective when taken as soon as possible within 72 hours (or Ella up to 120 hours). Home pregnancy tests are generally accurate 14 to 21 days after exposure. Visit our Pregnancy Support tab for clear timelines."
    },
    {
      keywords: ['alone', 'lonely', 'nobody', 'isolated', 'no one understands'],
      reply: "You may feel deeply isolated, especially if people around you are unsupportive, but you are not alone. Millions of survivors have walked this path, and confidential advocates are available 24/7 at hotlines like RAINN (1-800-656-4673) where you can speak or text without giving your real name."
    }
  ],

  defaultResponse: "I hear you, and your feelings are completely valid. Remember that SurvivorCare AI is an offline support tool and does not replace a licensed therapist. If you are feeling overwhelmed, you can try our grounding exercises, explore our verified support directory, or connect with a 24/7 crisis advocate whenever you feel ready.",

  // Get response for chat
  getBotResponse(userInput) {
    const text = userInput.toLowerCase();
    for (const item of this.offlineResponses) {
      if (item.keywords.some(k => text.includes(k))) {
        return item.reply;
      }
    }
    return this.defaultResponse;
  },

  // Get random affirmation
  getRandomAffirmation() {
    const idx = Math.floor(Math.random() * this.affirmations.length);
    return this.affirmations[idx];
  },

  // Breathing Box Engine
  startBreathing(onTick) {
    if (this.breathingInterval) clearInterval(this.breathingInterval);
    
    this.breathingPhaseIndex = 0;
    this.breathingSeconds = this.breathingPhases[0].duration;
    
    const trigger = () => {
      const phase = this.breathingPhases[this.breathingPhaseIndex];
      if (onTick) {
        onTick({
          phaseName: phase.name,
          phaseClass: phase.class,
          secondsLeft: this.breathingSeconds,
          cycles: this.breathingCycleCount
        });
      }

      this.breathingSeconds--;
      if (this.breathingSeconds < 0) {
        this.breathingPhaseIndex = (this.breathingPhaseIndex + 1) % this.breathingPhases.length;
        this.breathingSeconds = this.breathingPhases[this.breathingPhaseIndex].duration;
        if (this.breathingPhaseIndex === 0) {
          this.breathingCycleCount++;
        }
      }
    };

    trigger();
    this.breathingInterval = setInterval(trigger, 1000);
  },

  stopBreathing() {
    if (this.breathingInterval) {
      clearInterval(this.breathingInterval);
      this.breathingInterval = null;
    }
    this.breathingPhaseIndex = 0;
    this.breathingSeconds = 4;
  }
};
