/* ==========================================================================
   CONCEPT HEALTH CLINIC — SITE CONFIGURATION
   File: js/config.js
   Purpose: single source of truth for business data, social-proof content and
   the chatbot conversation graph. Edit here — never hunt through the markup.
   ========================================================================== */
(function (window) {
  "use strict";

  const CHC = {
    /* ---------------------------------------------------------------
       Core NAP (Name / Address / Phone) — used by JS-driven UI + schema
       --------------------------------------------------------------- */
    clinic: {
      name: "Concept Health Clinic",
      physician: "Dr. Rafay Latif, MD, MHA",
      phoneDisplay: "(903) 600-2100",
      phoneDial: "+19036002100",
      whatsapp: "19036002100", // E.164 without "+" for wa.me links
      email: "info@concepthealthclinic.com",
      street: "4616 US Highway 75, Suite 203 'A'",
      locality: "Denison",
      region: "TX",
      postal: "75020",
      country: "US",
      portal:
        "https://mycw263.ecwcloud.com/portal32043/jsp/100mp/login_otp.jsp",
      hours: [
        { day: "Monday", open: "09:00", close: "17:00" },
        { day: "Tuesday", open: "09:00", close: "17:00" },
        { day: "Wednesday", open: "09:00", close: "17:00" },
        { day: "Thursday", open: "09:00", close: "17:00" },
        { day: "Friday", open: "09:00", close: "17:00" },
        { day: "Saturday", open: "09:00", close: "13:00" },
        { day: "Sunday", open: null, close: null }
      ]
    },

    /* ---------------------------------------------------------------
       ANALYTICS — visitor counter + call-click tracking
       ---------------------------------------------------------------
       ::analytics.counter:: uses Abacus (https://abacus.jasoncameron.dev),
       a free, no-account, no-cookie hit counter. It stores one integer per
       namespace and nothing else — no IPs, no identifiers, so it raises no
       cookie-consent or PHI issues.

       IMPORTANT: change `namespace` to something unique to this clinic
       before launch. Namespaces are public; a generic name will collide
       with other sites and inflate your numbers.

       Prefer a self-hosted or first-party endpoint? Set `apiBase` to your
       own service implementing the same GET /hit/:ns/:key and
       GET /get/:ns/:key contract, and nothing else needs to change.
       --------------------------------------------------------------- */
    analytics: {
      enabled: true,
      apiBase: "https://abacus.jasoncameron.dev",
      namespace: "chc-denison-tx",
      keys: {
        visits: "visits",              // page views
        visitsToday: "visits-today",   // daily rollover
        calls: "calls",                // every tel: click
        whatsapp: "whatsapp-clicks",
        portal: "portal-clicks"
      },
      // Count one visit per browser session, but every call click.
      visitOncePerSession: true,
      storageKey: "chc_visit_counted",

      /* ---- Call attribution --------------------------------------------
         Drop in your Google Ads / GA4 conversion ID to measure calls as
         conversions. Leave empty to disable. Works with gtag.js or
         Google Tag Manager's dataLayer.
         Example: "AW-123456789/AbC-D_efG"  or  "G-XXXXXXXXXX"        */
      conversionId: "",
      conversionLabel: ""
    },

    /* ---------------------------------------------------------------
       Live social proof for Toastify notifications.
       Names deliberately mix Indian, Pakistani and Arabic communities with
       flag emojis — Denison / North Texas has a genuinely diverse patient
       base and the pattern is familiar from high-converting local sites.
       --------------------------------------------------------------- */
    socialProof: [
      { name: "Ayesha", flag: "🇵🇰", city: "Denison, TX", action: "booked a Geriatric Medicine consultation", ago: "a few seconds ago" },
      { name: "Rahul", flag: "🇮🇳", city: "Sherman, TX", action: "requested an Internal Medicine appointment", ago: "1 minute ago" },
      { name: "Fatima", flag: "🇦🇪", city: "Denison, TX", action: "scheduled a comprehensive geriatric assessment", ago: "2 minutes ago" },
      { name: "Imran", flag: "🇵🇰", city: "Pottsboro, TX", action: "called about falls-risk evaluation", ago: "3 minutes ago" },
      { name: "Priya", flag: "🇮🇳", city: "Durant, OK", action: "joined the patient portal", ago: "4 minutes ago" },
      { name: "Khalid", flag: "🇸🇦", city: "Sherman, TX", action: "booked a medication review visit", ago: "5 minutes ago" },
      { name: "Sana", flag: "🇵🇰", city: "Van Alstyne, TX", action: "requested a preventive health visit", ago: "6 minutes ago" },
      { name: "Omar", flag: "🇪🇬", city: "Denison, TX", action: "scheduled a follow-up for hypertension", ago: "7 minutes ago" },
      { name: "Ananya", flag: "🇮🇳", city: "McKinney, TX", action: "asked about transitions of care after a hospital stay", ago: "8 minutes ago" },
      { name: "Yusuf", flag: "🇦🇪", city: "Howe, TX", action: "booked a frailty and mobility assessment", ago: "9 minutes ago" },
      { name: "Meera", flag: "🇮🇳", city: "Denison, TX", action: "referred a parent for geriatric care", ago: "11 minutes ago" },
      { name: "Zainab", flag: "🇵🇰", city: "Sherman, TX", action: "requested an appointment for diabetes management", ago: "12 minutes ago" },
      { name: "Tariq", flag: "🇯🇴", city: "Denison, TX", action: "booked an annual wellness visit", ago: "14 minutes ago" },
      { name: "Nadia", flag: "🇱🇧", city: "Gunter, TX", action: "requested a care-transition plan review", ago: "15 minutes ago" },
      { name: "Vikram", flag: "🇮🇳", city: "Denison, TX", action: "called to confirm an internal medicine slot", ago: "17 minutes ago" },
      { name: "Hina", flag: "🇵🇰", city: "Bells, TX", action: "asked about advance care planning", ago: "19 minutes ago" }
    ],

    /* ---------------------------------------------------------------
       CHATBOT CONVERSATION GRAPH
       Each node: { messages: [...], chips: [{label, to}] }
       `to` values starting with "action:" are terminal behaviours.
       Marketing logic baked in: clarify → educate → de-risk → scarcity →
       micro-commitment → hand-off to a human (call).
       --------------------------------------------------------------- */
    chatbot: {
      greeting: {
        messages: [
          "Hi, I'm <strong>Clara</strong> 👋 the patient assistant at Concept Health Clinic.",
          "I can answer most questions about appointments, insurance, geriatric care and what to expect on your first visit. What would you like to start with?"
        ],
        chips: [
          { label: "Book an appointment", to: "book" },
          { label: "Geriatric care", to: "geriatric" },
          { label: "Internal Medicine", to: "internal" },
          { label: "Insurance & cost", to: "insurance" },
          { label: "Meet Dr. Latif", to: "doctor" },
          { label: "Clinic hours & location", to: "location" }
        ]
      },

      nodes: {
        /* ------------------------- APPOINTMENTS ------------------------- */
        book: {
          messages: [
            "Wonderful — that's the most important step, and it takes about two minutes.",
            "New patient or existing patient?",
            "Either way, our team confirms every request by phone, so nothing gets lost."
          ],
          chips: [
            { label: "I'm a new patient", to: "newPatient" },
            { label: "I'm already a patient", to: "existingPatient" },
            { label: "What should I bring?", to: "prep" },
            { label: "Is there a wait?", to: "availability" }
          ]
        },
        newPatient: {
          messages: [
            "Perfect. New patients usually start with a <strong>comprehensive first visit</strong> — we review your history, medications, and goals before anything else.",
            "Most people tell us the same thing afterwards: <em>“nobody had ever asked me all of those questions before.”</em> That's the point.",
            "The fastest way to lock a time is a 30-second phone call with our front desk."
          ],
          chips: [
            { label: "What's included in visit one?", to: "firstVisit" },
            { label: "Call now to book", to: "action:call" },
            { label: "Coverage questions first", to: "insurance" },
            { label: "Geriatric assessment", to: "geriatric" }
          ]
        },
        existingPatient: {
          messages: [
            "Welcome back 👋 Follow-ups, medication reviews and hospital follow-ups are all handled the same way — one call, and we find the slot that fits.",
            "If you were recently in hospital, tell the front desk: we prioritise a <strong>transition-of-care visit within 7 days</strong> to reduce the risk of a readmission."
          ],
          chips: [
            { label: "Post-hospital follow-up", to: "transitions" },
            { label: "Medication review", to: "medication" },
            { label: "Call the clinic", to: "action:call" },
            { label: "Patient portal", to: "portal" }
          ]
        },
        firstVisit: {
          messages: [
            "A first visit is usually 45–60 minutes — deliberately longer than a typical 12-minute appointment.",
            "We cover: your full medical history, <strong>every medication and supplement</strong>, functional and mobility questions, preventive screenings, and what matters most to you day to day.",
            "You leave with a written plan you can actually follow, not a stack of prints you'll never read."
          ],
          chips: [
            { label: "What should I bring?", to: "prep" },
            { label: "Book my first visit", to: "action:call" },
            { label: "Do you take my insurance?", to: "insurance" },
            { label: "Talk to a human", to: "action:call" }
          ]
        },
        availability: {
          messages: [
            "We're currently accepting new patients, and same-week slots do open up when there's a cancellation.",
            "Monday–Friday we're open 9:00 AM–5:00 PM, Saturday 9:00 AM–1:00 PM (Central Time).",
            "If timing is tight for you, calling is the smart move — the desk can see the live calendar, I can't."
          ],
          chips: [
            { label: "Call for the next opening", to: "action:call" },
            { label: "Clinic hours & location", to: "location" },
            { label: "Ask about insurance", to: "insurance" }
          ]
        },
        prep: {
          messages: [
            "Bring these and your visit goes twice as smoothly:",
            "• Photo ID<br>• Insurance card (if applicable)<br>• <strong>A full medication list</strong> — including supplements<br>• Recent test results or hospital records<br>• Your questions, written down",
            "For geriatric visits, also note any recent falls, changes in walking or memory, or difficulty managing medicines. Those details change the plan."
          ],
          chips: [
            { label: "Book my appointment", to: "action:call" },
            { label: "Can family come with me?", to: "family" },
            { label: "What's a geriatric assessment?", to: "geriatric" }
          ]
        },
        family: {
          messages: [
            "Absolutely — and for older adults it's often the difference between a good visit and a great one.",
            "Please let the front desk know in advance so we can arrange the appropriate consent and privacy steps.",
            "We treat caregivers as part of the care team, not as spectators."
          ],
          chips: [
            { label: "Book with my family member", to: "action:call" },
            { label: "Geriatric care details", to: "geriatric" },
            { label: "Advance care planning", to: "goals" }
          ]
        },
        portal: {
          messages: [
            "Our patient portal gives you secure access to the services enabled on your account.",
            "It's the right place for records and messages — <strong>not</strong> for emergencies."
          ],
          chips: [
            { label: "Open the patient portal", to: "action:portal" },
            { label: "Book by phone instead", to: "action:call" },
            { label: "Back to the start", to: "greeting" }
          ]
        },

        /* ------------------------- CLINICAL ------------------------- */
        internal: {
          messages: [
            "<strong>Internal Medicine</strong> is adult healthcare with a wide lens: prevention, diagnosis, and long-term management — especially when several conditions overlap.",
            "Most patients come to us for one of these:",
            "• Preventive healthcare &amp; screenings<br>• Chronic disease management (blood pressure, diabetes, cholesterol)<br>• A comprehensive medical evaluation when symptoms don't fit one box<br>• Medication review<br>• Ongoing adult primary care",
            "Dr. Latif spent 15+ years in hospital medicine, so he's used to complex, multi-system cases — not just single diagnoses."
          ],
          chips: [
            { label: "Chronic condition care", to: "chronic" },
            { label: "Medication review", to: "medication" },
            { label: "Preventive care", to: "preventive" },
            { label: "Book an internal medicine visit", to: "action:call" }
          ]
        },
        chronic: {
          messages: [
            "Living with a long-term condition is a management project, not a single appointment.",
            "We monitor the numbers, adjust treatment when something drifts, and keep an eye on how the condition actually affects your days.",
            "Here's the honest part: most people who feel “fine” still benefit from a review — high blood pressure and early kidney changes are famously quiet."
          ],
          chips: [
            { label: "Medication review", to: "medication" },
            { label: "Book a chronic care visit", to: "action:call" },
            { label: "Is this geriatric instead?", to: "geriatric" }
          ]
        },
        medication: {
          messages: [
            "Medication review is one of the highest-value visits we offer — especially once you're on five or more medicines.",
            "We look for duplication, interactions, doses that no longer fit your kidney function or weight, and anything that could be causing dizziness or falls.",
            "Patients often leave with <strong>fewer</strong> medications, not more. That's usually the win."
          ],
          chips: [
            { label: "Book a medication review", to: "action:call" },
            { label: "This is my parent, not me", to: "caregiver" },
            { label: "Falls and dizziness", to: "falls" }
          ]
        },
        preventive: {
          messages: [
            "Prevention is cheaper, calmer and kinder than repair.",
            "A preventive visit can include health-risk assessment, a review of which screenings are due for your age and history, lifestyle conversations, and a plan for the next 12 months.",
            "We won't oversell tests you don't need. We will tell you plainly what's worth doing and why."
          ],
          chips: [
            { label: "Book a preventive visit", to: "action:call" },
            { label: "What about Medicare checkups?", to: "insurance" },
            { label: "Meet Dr. Latif first", to: "doctor" }
          ]
        },
        transitions: {
          messages: [
            "The week after a hospital discharge is statistically one of the riskiest in a patient's year. Medication errors and missed follow-ups spike there.",
            "Our transitions-of-care approach: reconcile the discharge list against what you actually take, schedule a prompt follow-up, and coordinate with your other clinicians.",
            "If you or a parent was discharged recently, call us early rather than waiting for a problem."
          ],
          chips: [
            { label: "Call about a recent discharge", to: "action:call" },
            { label: "Medication review", to: "medication" },
            { label: "Geriatric care", to: "geriatric" }
          ]
        },

        /* ------------------------- GERIATRIC ------------------------- */
        geriatric: {
          messages: [
            "<strong>Geriatric Medicine</strong> looks at the whole picture: conditions <em>and</em> mobility, memory, medications, independence, and what a good day actually looks like for you.",
            "We focus on:",
            "• Comprehensive geriatric assessment<br>• Frailty prevention &amp; management<br>• Falls-risk evaluation<br>• Complex chronic conditions<br>• Polypharmacy (too many medicines)<br>• Transitions of care<br>• Goals of care &amp; advance care planning"
          ],
          chips: [
            { label: "Falls & mobility", to: "falls" },
            { label: "Frailty & strength", to: "frailty" },
            { label: "Memory & thinking changes", to: "cognition" },
            { label: "Goals of care", to: "goals" },
            { label: "Book a geriatric visit", to: "action:call" }
          ]
        },
        falls: {
          messages: [
            "Falls are rarely “just clumsy.” They're usually a signal: a medication side effect, low blood pressure on standing, vision, footwear, balance, or a home hazard.",
            "A falls-risk evaluation works through those causes one by one, then builds a plan that's realistic for the person's home and routine.",
            "If there has been <strong>one</strong> fall or a new fear of falling, that's already enough reason to be seen."
          ],
          chips: [
            { label: "Book a falls evaluation", to: "action:call" },
            { label: "It's my mother/father", to: "caregiver" },
            { label: "Medication review", to: "medication" }
          ]
        },
        frailty: {
          messages: [
            "Frailty isn't a diagnosis you either have or don't — it sits on a spectrum, and it can be nudged back.",
            "We look at strength, walking speed, weight changes, energy and how daily tasks feel. From there: protein and movement targets, medication clean-up, and treating the conditions that drain reserve.",
            "The earlier we look, the more room there is to change the trajectory."
          ],
          chips: [
            { label: "Book a frailty assessment", to: "action:call" },
            { label: "Falls & mobility", to: "falls" },
            { label: "Is this covered?", to: "insurance" }
          ]
        },
        cognition: {
          messages: [
            "Changes in memory or thinking deserve a proper work-up before anyone assumes the worst.",
            "Some causes are treatable and reversible — thyroid problems, B12 deficiency, sleep issues, medication effects, depression. Others need an accurate baseline so future change can be measured.",
            "We approach it methodically and we involve family with the patient's consent."
          ],
          chips: [
            { label: "Book a cognitive evaluation", to: "action:call" },
            { label: "Can family join?", to: "family" },
            { label: "Goals of care", to: "goals" }
          ]
        },
        goals: {
          messages: [
            "Goals-of-care and advance care planning conversations are some of the most human things we do.",
            "They're not about giving up — they're about making sure that if decisions ever have to be made quickly, they're made the way <em>you</em> would have made them.",
            "We take the time. There's no rush in this conversation."
          ],
          chips: [
            { label: "Book a planning visit", to: "action:call" },
            { label: "Talk to a human first", to: "action:call" },
            { label: "Geriatric care overview", to: "geriatric" }
          ]
        },
        caregiver: {
          messages: [
            "Caring for a parent is a job nobody trains you for. You're doing more than you think.",
            "We can see them with you present (with their consent), and we'll explain things in plain language — twice if needed.",
            "If you're worried about falls, medicines, memory or a recent hospital stay, that's exactly the right reason to book."
          ],
          chips: [
            { label: "Book for my parent", to: "action:call" },
            { label: "Falls & mobility", to: "falls" },
            { label: "What should I bring?", to: "prep" }
          ]
        },

        /* ------------------------- TRUST / OBJECTIONS ------------------------- */
        doctor: {
          messages: [
            "<strong>Dr. Rafay Latif, MD, MHA</strong> is board-certified in Internal Medicine and Geriatric Medicine, with more than 15 years in hospital-based medicine.",
            "Highlights: former Chief Hospitalist at Harlem Hospital Center · Geriatric fellowship at Northwell Health / Zucker School of Medicine · Internal Medicine residency at Columbia University – Harlem Hospital Center · Master of Health Administration from Columbia University · Editor-in-Chief of the Geriatric section of StatPearls.",
            "Translation: he has managed very complex patients in very demanding settings — and now brings that depth to outpatient care, where someone actually has time to listen."
          ],
          chips: [
            { label: "See his credentials", to: "action:physician" },
            { label: "Book with Dr. Latif", to: "action:call" },
            { label: "What's your approach?", to: "approach" }
          ]
        },
        approach: {
          messages: [
            "Our approach, in five words: <strong>listen first, treat second</strong>.",
            "We start with your history and what's changed, discuss prevention and long-term wellness, manage ongoing conditions sensibly, and factor in mobility, independence and family context as people age.",
            "You'll always know why a decision is being made. No mystery plans."
          ],
          chips: [
            { label: "Book a visit", to: "action:call" },
            { label: "Read patient reviews", to: "reviews" },
            { label: "Insurance & cost", to: "insurance" }
          ]
        },
        insurance: {
          messages: [
            "Straight answer: coverage depends on your specific plan, so our front desk confirms it directly before you book — no surprises at check-in.",
            "Call and have your card handy; they'll verify your plan, explain any cost share, and tell you exactly what to expect.",
            "Medicare patients: ask specifically about annual wellness visits and chronic care management while you're on the phone."
          ],
          chips: [
            { label: "Call to verify my plan", to: "action:call" },
            { label: "What does a visit cost?", to: "cost" },
            { label: "Book anyway", to: "action:call" }
          ]
        },
        cost: {
          messages: [
            "We'd rather you ask than guess — that's true for most people.",
            "Fees depend on visit type and your insurance. One call gets you a clear number instead of a range.",
            "And a reminder worth having: an untreated chronic condition is almost always more expensive than a visit."
          ],
          chips: [
            { label: "Get an exact answer", to: "action:call" },
            { label: "Verify insurance", to: "insurance" },
            { label: "Back to start", to: "greeting" }
          ]
        },
        reviews: {
          messages: [
            "What patients mention most often is time — feeling like the visit wasn't rushed.",
            "Families also tell us they appreciated having the geriatric picture explained in plain language, and being involved in the plan.",
            "The best way to judge is to talk to us and see how the conversation feels."
          ],
          chips: [
            { label: "Call and see for yourself", to: "action:call" },
            { label: "Meet Dr. Latif", to: "doctor" },
            { label: "Book a first visit", to: "book" }
          ]
        },
        location: {
          messages: [
            "We're at <strong>Gateway Central, 4616 US Highway 75, Suite 203 'A', Denison, Texas 75020</strong> — easy to reach from Sherman, Pottsboro, Howe, Bells and Van Alstyne.",
            "Hours: Monday–Friday 9:00 AM–5:00 PM · Saturday 9:00 AM–1:00 PM · Sunday closed (Central Time; holiday hours may vary).",
            "Phone: <a href='tel:+19036002100'>(903) 600-2100</a>."
          ],
          chips: [
            { label: "Get directions", to: "action:directions" },
            { label: "Call the clinic", to: "action:call" },
            { label: "Book an appointment", to: "book" }
          ]
        },

        /* ------------------------- CLOSING NODES ------------------------- */
        closing: {
          messages: [
            "Before we wrap: the single most useful thing you can do today is <strong>one phone call</strong>.",
            "It's free, it takes two minutes, and you'll know exactly where you stand — even if you don't book.",
            "Our team answers during business hours, and Saturday mornings are a good window if weekdays are impossible."
          ],
          chips: [
            { label: "Call (903) 600-2100", to: "action:call" },
            { label: "End chat", to: "action:end" }
          ]
        },
        end: {
          messages: [
            "This conversation has been ended. Please contact our customer support for more details"
          ],
          chips: [{ label: "Call customer support", to: "action:callEnd" }],
          terminate: true
        }
      },

      /* Anything the user types that we can't match gets a graceful fallback */
      fallback: {
        messages: [
          "That's a good question — and honestly, one a human should answer properly rather than me guessing.",
          "Our front desk can answer anything about appointments, insurance, records or a specific symptom concern. Want me to point you to them?"
        ],
        chips: [
          { label: "Call the clinic", to: "action:call" },
          { label: "Book an appointment", to: "book" },
          { label: "Clinic hours", to: "location" },
          { label: "Meet Dr. Latif", to: "doctor" }
        ]
      }
    }
  };

  window.CHC = CHC;
})(window);
