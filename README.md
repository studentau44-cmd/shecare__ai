# SheCare AI 🌸 (SurvivorCare AI)
### Secure, Offline-First Care & Safety Application for Survivors of Sexual Violence

> **Application Name:** SheCare AI / SurvivorCare AI  
> **Repository Folder:** `SheCare AI/`  
> **Deployed URL:** `https://manahilx.github.io/Shecare_AI/`  
> **Target Audience:** Rape and sexual assault survivors, particularly women experiencing family abuse, domestic coercion, isolation, denial of medical care, or deprivation of sustenance.  
> **Tech Stack:** Offline-First HTML5 / CSS3 / Vanilla Modern JavaScript (ES2022) / Web Crypto API (PBKDF2 SHA-256) / PWA Service Worker / Python 3 Standard Library Backend (Zero External Dependencies)

---

## 🚨 Root Cause Diagnosis for GitHub Pages Deployed Site

If your deployed GitHub Pages site rendered as plain white with default black serif text and oversized outline icons, here was the exact technical cause and how it has now been resolved:

1. **Missing Subdirectories on GitHub Repository (`css/` and `js/`):**
   - When uploading files via the GitHub Web interface (*"Add files via upload"*), browser drag-and-drop frequently omits subdirectories (`css/` and `js/`).
   - Consequently, requests to `https://manahilx.github.io/Shecare_AI/css/styles.css` and `js/*.js` returned **HTTP 404 Not Found**.
2. **Service Worker Fallback Trap in `sw.js`:**
   - The previous service worker caught failed asset requests and returned `index.html` as the fallback response.
   - Because `index.html` is `text/html`, modern browsers blocked it with strict stylesheet MIME checking (*"Refused to apply style because its MIME type ('text/html') is not a supported stylesheet MIME type"*).
3. **SVG Icons Defaulting to Full Width:**
   - Without CSS applied, inline SVGs with `viewBox="0 0 24 24"` expanded to fill the entire container width (300–400px wide), resulting in screen-filling black outline icons.
4. **Permanent Architecture Fix:**
   - `index.html` now includes **embedded core styles** (`<style id="shecare-core-styles">`) and an **embedded resilient script engine** (`<script id="shecare-bundled-engine">`), while still maintaining modular `css/styles.css` and `js/*.js` files.
   - Even if only `index.html` is uploaded to GitHub, **the complete peach ombre design, cards, mobile layout, and all interactive features (breathing box, 12-glass water limit, grounding, period tracker, PEP calculator, SOS) will render instantly without any 404 errors!**
   - Every `<svg>` now includes explicit `width="24" height="24"` attributes and inline style constraints, guaranteeing icons can never exceed 24–32px.
   - `sw.js` cache versioned to `shecare-v2.1` with safe MIME fallback (only falling back to `index.html` for navigation page loads, never for CSS or JS).

---

## 🌟 1. Project Context & Purpose

Survivors of sexual assault and domestic violence frequently face severe systemic barriers to receiving timely care:
- **Surveillance & Coercion:** Abusive partners or family members actively monitor phones, browsers, and communications.
- **Physical Isolation & Sustenance Deprivation:** In abusive environments, survivors are sometimes deliberately withheld food, water, or access to transportation and clinical care.
- **Time-Critical Medical Windows:** Crucial post-exposure interventions—such as **HIV PEP (Post-Exposure Prophylaxis)** which must be assessed and initiated **strictly within 72 hours**—are missed due to confusion, shame, or lack of offline guidance.
- **Connectivity Gaps:** When internet access is disconnected, throttled, or monitored by network routers, traditional cloud-dependent apps fail completely.

**SheCare AI** (SurvivorCare AI) provides a self-contained, offline-first digital safe harbor. It operates 100% locally on the survivor's device, guarantees zero third-party telemetry or ad-tracker leaks, features a realistic **Neutral Notes & Task Planner Camouflage Screen** triggered instantly via **ESC**, and offers trauma-informed clinical and wellness guidance.

---

## 🏗️ 2. Architecture & File Structure

```
SheCare AI/
├── index.html               # Responsive single-page application with self-contained styling,
│                            # mobile layout, explicit 24px SVG sizing, and full interaction engine
├── manifest.json            # PWA manifest (discreet name: "Daily Notes", theme: #C96F55)
├── sw.js                    # PWA Service Worker (v2.1 safe MIME caching)
├── server.py                # Python 3 standard library server with security headers & APIs
├── run_app.bat              # One-click Windows runner (starts server and opens browser)
├── .gitignore               # Protects runtime sessions and personal data from git commits
├── README.md                # Hackathon presentation guide, architecture, setup & test steps
├── css/
│   └── styles.css           # Light-peach to dark-peach ombre theme, accessible contrast,
│                            # neutral camouflage overrides, and responsive mobile rules
├── js/
│   ├── app.js               # Application coordinator, view router, quick-exit handler,
│                            # water tracking (max 12), and modal management
│   ├── auth.js              # Client-side Web Crypto PBKDF2 hashing, dynamic password strength,
│                            # inactivity auto-lock, and truthful device recognition
│   ├── db.js                # Offline storage engine (LocalStorage abstraction, strict 12-glass
│                            # water clamping, purge & export, camouflage notes storage)
│   ├── mental_health.js     # Trauma-informed offline companion, 5-4-3-2-1 grounding, box breathing
│   ├── physical_health.js   # Symptom & injury logger, red flag warnings, sustenance guidance
│   ├── period_tracker.js    # Timezone-safe menstrual cycle tracking with boundary math
│   ├── pregnancy_sti.js     # 72-Hour HIV PEP live countdown, responsible pregnancy test calculator,
│                            # and comprehensive STI educational knowledgebase
│   ├── sos.js               # Trusted contact management, SMS/tel dispatch, truthful status
│   └── safety_plan.js       # Safety plan builder, go-bag checklist, verified directory
│                            # (includes independently verified Pakistan & India lifelines)
├── data/                    # Local server JSON storage (sessions, users, SOS gateway logs)
└── tests/
    └── test_suite.py        # Automated test suite (14 tests covering backend, crypto, water limits,
                             # cycle math, verified directory, camouflage, SVGs, and disclaimers)
```

---

## 📋 3. Key Implemented Features

### A. Discreet Mode & Quick Exit (Camouflage)
- **Instant Escape:** Floating **Quick Exit** button and global `ESC` keyboard shortcut immediately substitute sensitive healthcare content with a functional **Personal Daily Notes & Task Planner** (featuring real scratchpad and to-do checklist).
- **Form Sanitization:** Clears any active, unsaved sensitive input fields immediately upon triggering without touching saved database records.
- **Intentional Resume Protection:** Returning to the sensitive health view requires an intentional user confirmation (`#modalResumeConfirm`) with a privacy check reminding the user to ensure nobody is watching their screen.
- **Discreet Mode Toggle:** Allows switching visible sidebar labels into neutral terms (*"Daily Notes"*, *"Mind & Wellness"*, *"Hydration Planner"*).
- **Honest Limitations Disclosure:** Explicit modal educates survivors that Quick Exit cannot wipe browser URL history or intercept over-the-shoulder hardware monitoring, guiding them on how to use Private/Incognito windows safely.

### B. Password Strength & Secure Authentication
- **Zero Plaintext Storage:** Passwords are cryptographically salted (16 random bytes) and hashed using **PBKDF2 with SHA-256 and 100,000 iterations** via both client-side Web Crypto API and server-side `hashlib`.
- **Dynamic Password Strength Meter:** Real-time visual feedback analyzing length, character entropy (uppercase, lowercase, numbers, symbols), and deducting penalties for common weak strings.
- **Inactivity Auto-Lock:** Automatically locks sensitive screens after 5 minutes of idle time, prompting for the password before revealing data.

### C. Privacy & Data Autonomy
- **Zero Third-Party Sharing:** Absolutely no Google Analytics, external CDNs, tracking pixels, or data brokers.
- **Full Data Autonomy:** Includes a one-click **Purge All Data** button that immediately zeroes and wipes all local credentials, symptoms, and contacts.
- **Data Portability:** Allows survivors to export an encrypted JSON backup file for personal records.

### D. Active Sessions & Truthful Device Recognition
- **Truthful Tracking:** Recognizes device platform (Windows, macOS, iOS, Android, Linux), browser engine, and screen dimensions via user-agent heuristics and persistent device UUIDs.
- **Session Revocation:** Lists all active sessions and enables survivors to revoke unfamiliar logins or remote sessions.

### E. Mental Health & Crisis Grounding
- **Therapist Disclaimer:** Clear prominent banner stating the tool is an offline wellness companion and does not replace a licensed clinical therapist or doctor.
- **Offline Crisis Companion:** Deterministic, trauma-informed conversational assistant responding to panic, flashbacks, guilt, self-blame, and loneliness without sending queries to cloud servers.
- **Box Breathing (4-4-4-4):** Animated, smooth visual circle guiding survivors through Inhale (4s), Hold (4s), Exhale (4s), and Rest (4s) with a cycle counter.
- **5-4-3-2-1 Sensory Grounding Tool:** Interactive checklist allowing survivors to ground sight, touch, hearing, smell, and taste to counter dissociation and flashbacks.
- **Empowering Affirmations:** Curated, non-toxic affirmations validating survival, body autonomy, and emotions.

### F. Physical Health & Sustenance Support
- **Symptom & Injury Tracker:** Log pain levels (0–10 slider), affected body areas, bleeding status, fever levels, dizziness, and bruising.
- **Critical Red-Flag Warnings:** Automated safety flags for severe pain, excessive bleeding, high fever with pelvic symptoms, or **neck trauma / strangulation** (warning survivors of delayed airway swelling risks).
- **Basic Needs Check-In:** Dedicated sustenance counter designed for survivors facing confinement or denial of basic care, paired with an emergency guide for covert hydration.
- **Non-Diagnostic Policy:** Explicitly advises survivors that tracking is for personal records and does not constitute a clinical medical diagnosis.

### G. Water Tracker — Strict Daily Maximum of 12 Glasses
- **Strict Clamping (0 to 12):** Enforces a software tracking limit of maximum 12 glasses in both UI and storage layer (`js/db.js`).
- **Accessible Limit Notification:** When the 12-glass limit is reached, `btnAddWater` is automatically disabled. Attempting a 13th glass displays a calm, non-shaming notification: *“You have reached the daily tracking limit of 12 glasses.”*
- **Decrement Safety:** Removing glasses decrements smoothly and is strictly bounded at 0 (never negative).
- **Date Independence:** Water records are keyed by date (`YYYY-MM-DD`), ensuring changing dates does not mix records across days.
- **Non-Prescriptive Disclaimer:** Explicitly clarifies that 12 glasses is an application software tracking limit, not a universal medical hydration rule, as individual needs vary.

### H. Menstrual Cycle Tracker (Timezone-Safe Date Math)
- **Cycle Logging:** Records cycle start dates, flow intensity, and accompanying symptoms.
- **UTC Timezone-Safe Date Math:** Implements UTC date arithmetic in `js/period_tracker.js` ensuring correct transitions across month boundaries (e.g. Jan 31 -> Feb 28), leap years (Feb 1 -> Feb 29), and year boundaries (Dec 15 -> Jan 12) without timezone offset drift.
- **Mandatory Honest Labeling:** Prominent warning clarifies that trauma, extreme stress, emergency contraception, and malnutrition alter cycles unpredictably, and estimates cannot be relied upon for contraception or ruling out pregnancy.

### I. Responsible Pregnancy Guidance
- **Testing Window Calculator:** Explains that home urine pregnancy tests are accurate **14 to 21 days** post-incident, and that earlier testing frequently produces false negatives.
- **Emergency Contraception (EC) Timelines:** Clear guidance on Plan B (within 72 hours), Ella (within 120 hours), and copper IUD insertions (within 5 days).
- **Non-Diagnostic Disclaimer:** Clarifies that symptoms like nausea, fatigue, or breast tenderness are common stress/hormonal reactions and do not diagnose pregnancy.

### J. HIV / STI Support & Urgent 72-Hour PEP Protocol
- **Time-Critical PEP Countdown:** Prominent interactive calculator computing exact hours elapsed and remaining in the **72-hour window** for HIV Post-Exposure Prophylaxis.
- **Educational STI Knowledgebase:** Detailed clinical facts on Chlamydia, Gonorrhea, Trichomoniasis, Syphilis, Hepatitis B, and HPV, including typical incubation periods and presumptive treatments at clinical centers.
- **Non-Diagnostic Disclaimer:** Clarifies that acute HIV and many STIs are initially asymptomatic; clinical laboratory testing is required.

### K. SOS Emergency Alert System
- **Trusted Contact Configuration:** Stores primary advocate name, phone, email, and custom alert notes with format validation.
- **Multi-Channel Dispatch:**
  - **Native SMS URI (`sms:`)**: Handshake that launches the device's native messaging application with pre-filled distress text.
  - **Native Phone Dialer (`tel:`)**: Opens device call handler.
  - **Server Gateway**: Dispatches to local server gateway.
- **Explicit Location Authorization:** GPS coordinates are only requested and included if the survivor explicitly checks the location consent box (`#checkboxConsentLocation`).
- **Truthful Status Reporting:** Displays explicit states (`OPENED_IN_MESSAGING_APP`, `DIALER_OPENED`, `DISPATCHED_TO_CARRIER`, or `FAILED_OFFLINE`). Honestly notes that opening an app does not confirm cellular delivery.
- **Offline Distress Siren with Precautionary Warning:** Synthesizes an alternating dual-frequency acoustic alarm via the Web Audio API with zero external audio assets. Warns that loud alarms may increase danger if an abuser is within hearing range.

### L. Verified Directory (Pakistan, India, US, UK, Canada & Global)
Includes independently verified official resources categorized by country and service type:

#### 🇵🇰 Pakistan Verified Resources
- **Ministry of Human Rights (MOHR) Helpline:** Call `1099` (Toll-Free 24/7 across Pakistan).  
  *Official Source:* [Ministry of Human Rights, Government of Pakistan](https://mohr.gov.pk)
- **Madadgaar National Helpline:** Call `1098` / `021-34533033` (Daily 9:00 AM – 9:00 PM PKT).  
  *Official Source:* [Lawyers for Human Rights and Legal Aid (LHRLA) / Madadgaar](http://www.madadgaar.org)
- **Punjab Women Helpline:** Call `1043` (Toll-Free 24/7 in Punjab).  
  *Official Source:* [Punjab Commission on the Status of Women (PCSW)](https://pcsw.punjab.gov.pk)
- **Rozan Counselling Helpline:** Call `0800-22444` / Mobile: `0304-111-1741` (Mon–Sat 10:00 AM – 6:00 PM PKT).  
  *Official Source:* [Rozan Registered Mental Health NGO](https://rozan.org)

#### 🇮🇳 India Verified Resources
- **National Emergency Response Support System (ERSS):** Call `112` (Toll-Free 24/7 Pan-India).  
  *Official Source:* [Ministry of Home Affairs, Government of India](https://112.gov.in)
- **Women Helpline (181):** Call `181` (Toll-Free 24/7 Pan-India).  
  *Official Source:* [Ministry of Women and Child Development (MWCD), Government of India](https://wcd.nic.in)
- **National Commission for Women (NCW) Helpline:** Call `7827170170` (24/7 dedicated helpline).  
  *Official Source:* [National Commission for Women, Government of India](http://ncw.nic.in)
- **NIMHANS Psychosocial & Mental Health Helpline:** Call `080-46110007` (Toll-Free 24/7).  
  *Official Source:* [National Institute of Mental Health and Neuro Sciences (NIMHANS)](https://nimhans.ac.in)

#### 🌐 International Verified Resources
- **RAINN (National Sexual Assault Hotline - US):** `1-800-656-4673` / [rainn.org](https://www.rainn.org)
- **National Domestic Violence Hotline (US):** `1-800-799-7233` / Text "START" to `88788` / [thehotline.org](https://www.thehotline.org)
- **988 Suicide & Crisis Lifeline (US & Canada):** Dial or Text `988` / [988lifeline.org](https://988lifeline.org)
- **Crisis Text Line:** Text "HOME" to `741741` / [crisistextline.org](https://www.crisistextline.org)
- **UK Rape Crisis & SARC Directory:** `0808 500 2222` / [rapecrisis.org.uk](https://rapecrisis.org.uk)
- **Canadian Women's Foundation:** `1-866-863-0511` / [canadianwomen.org](https://canadianwomen.org)
- **Befrienders Worldwide & IASP:** [befrienders.org](https://www.befrienders.org)

### M. Strict Exclusion: Zero Language Translator
- In strict adherence to project specifications, no translation features, language dropdowns, or translation APIs exist in this codebase.

---

## 🎨 4. Design System: Light-Peach to Dark-Peach Ombre

`css/styles.css` features an elegant, subtle ombre gradient:
- **Light Peach:** `#FFF1E8`
- **Soft Peach:** `#F6C7AE`
- **Medium Peach:** `#E9A184`
- **Dark Peach Accent:** `#C96F55`
- **Background Gradient:** `linear-gradient(145deg, #FFF1E8 0%, #FCF5F0 35%, #F7D2BF 75%, #EDB097 100%)`
- **Contrast & Legibility:** Clean white cards (`#ffffff`) with warm subtle borders ensure WCAG AAA contrast for reading under stress.
- **Neutral Camouflage Overrides:** The Camouflage Screen (`#camouflageScreen`) and Discreet Mode use neutral slate styling (`#f1f5f9`), ensuring the disguise view does not inherit sensitive health peach styling.

---

## 🚀 5. How to Update Deployed GitHub Pages

To make your GitHub Pages site live with all fixes immediately:
1. Push or upload the updated files (`index.html`, `sw.js`, `manifest.json`, `README.md`, `run_app.bat`, `server.py`, `css/styles.css`, and the `js/` folder) to your repository `manahilx/Shecare_AI`.
2. Even if only `index.html` is replaced on GitHub, the site will **immediately work** because the full styles and scripts are embedded with resilient fallbacks.
3. On your mobile browser, refresh `https://manahilx.github.io/Shecare_AI/`. If a cached version appears, perform a hard refresh or clear website data for that domain so `sw.js` activates cache `shecare-v2.1`.

---

## 🧪 6. Automated Test Suite

An automated test suite in `tests/test_suite.py` verifies backend health, cryptographic registration, login validation, session tracking, SOS dispatch, water tracker limits, menstrual boundary math, verified directories, camouflage notes, SVG dimensions, and translator exclusion:

Run the test suite:
```bash
python tests/test_suite.py
```

Expected output:
```
----------------------------------------------------------------------
Ran 14 tests in 1.657s

OK
```
