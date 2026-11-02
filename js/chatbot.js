/* ==========================================================================
   CONCEPT HEALTH CLINIC — CONVERSATIONAL PATIENT ASSISTANT ("Clara")
   File: js/chatbot.js
   --------------------------------------------------------------------------
   Design intent
   ------------
   Behind the friendly UI this is a small, deterministic conversation engine
   driven by the graph in js/config.js. There is no model call and no PHI
   handling here — that is deliberate for a healthcare site:

     • Nothing the visitor types is stored or transmitted.
     • The assistant never gives medical advice; it routes clinical questions
       to a human.
     • Conversion logic follows: clarify → educate → lower risk → gentle
       scarcity → micro-commitment → hand-off to phone.

   Preference adaptation
   --------------------
   Every chip tap carries a topic tag. We score topics as the visitor moves
   through the graph and then re-order / augment the suggested buttons so
   they reflect demonstrated interest (e.g. someone who explores geriatric
   content gets falls & frailty surfaced first next time).

   Terminal state
   --------------
   When the visitor reaches the `end` node the input is disabled, the panel
   shows the required sign-off copy and a call-the-clinic button is revealed.
   ========================================================================== */
(function () {
  "use strict";

  const CFG = window.CHC;
  if (!CFG || !CFG.chatbot) return;

  const root = document.getElementById("chatbot");
  const openers = Array.from(document.querySelectorAll("[data-chat-open]"));
  const closer = document.getElementById("chatClose");
  const body = document.getElementById("chatBody");
  const chipsWrap = document.getElementById("chatChips");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSend");
  const badge = document.querySelector("[data-chat-badge]");

  if (!root || !body || !chipsWrap) return;

  /* ----------------------------------------------------------------------
     STATE
     ---------------------------------------------------------------------- */
  const state = {
    started: false,
    ended: false,
    busy: false,
    current: null,
    history: [],
    // Interest scores per topic — powers adaptive suggestions
    interests: {
      geriatric: 0,
      internal: 0,
      booking: 0,
      insurance: 0,
      doctor: 0,
      logistics: 0
    }
  };

  const TOPIC_MAP = {
    geriatric: "geriatric",
    falls: "geriatric",
    frailty: "geriatric",
    cognition: "geriatric",
    goals: "geriatric",
    caregiver: "geriatric",
    internal: "internal",
    chronic: "internal",
    medication: "internal",
    preventive: "internal",
    transitions: "internal",
    book: "booking",
    newPatient: "booking",
    existingPatient: "booking",
    firstVisit: "booking",
    availability: "booking",
    prep: "booking",
    portal: "booking",
    insurance: "insurance",
    cost: "insurance",
    doctor: "doctor",
    approach: "doctor",
    reviews: "doctor",
    location: "logistics",
    family: "logistics",
    closing: "booking"
  };

  /* ----------------------------------------------------------------------
     HELPERS
     ---------------------------------------------------------------------- */
  const scrollToEnd = () => {
    // microtask so layout has settled
    requestAnimationFrame(() => {
      body.scrollTop = body.scrollHeight;
    });
  };

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  function addMessage(html, who = "bot") {
    const wrap = document.createElement("div");
    wrap.className = `msg msg--${who}`;
    const bubble = document.createElement("div");
    bubble.className = "msg__bubble";
    bubble.innerHTML = html;
    wrap.appendChild(bubble);
    body.appendChild(wrap);
    scrollToEnd();
    return wrap;
  }

  function showTyping() {
    const wrap = document.createElement("div");
    wrap.className = "msg msg--bot";
    wrap.dataset.typing = "true";
    wrap.innerHTML =
      '<div class="msg__bubble"><span class="typing" role="status" aria-label="Clara is typing"><span></span><span></span><span></span></span></div>';
    body.appendChild(wrap);
    scrollToEnd();
    return wrap;
  }

  function renderChips(chips) {
    chipsWrap.innerHTML = "";
    if (!chips || !chips.length) return;

    chips.forEach((chip, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "chip" + (chip.to && chip.to.startsWith("action:call") ? " chip--call" : "");
      btn.style.animationDelay = `${i * 55}ms`;
      btn.innerHTML =
        (chip.icon ? `<i class="${chip.icon}"></i>` : "") + chip.label;
      btn.addEventListener("click", () => onChip(chip));
      chipsWrap.appendChild(btn);
    });
  }

  /* ----------------------------------------------------------------------
     ACTION HANDLERS
     ---------------------------------------------------------------------- */
  const ACTIONS = {
    /* Terminal sign-off — used by the "End chat" chip */
    end: () => {
      addMessage("End chat", "user");
      state.current = "end";
      chipsWrap.innerHTML = "";
      (async () => {
        const typing = showTyping();
        await wait(650);
        typing.remove();
        endConversation(
          "This conversation has been ended. Please contact our customer support for more details"
        );
      })();
      return false;
    },
    call: () => {
      window.location.href = `tel:${CFG.clinic.phoneDial}`;
      addMessage(
        `Calling <strong>${CFG.clinic.phoneDisplay}</strong>… If your phone doesn't dial automatically, tap <a href="tel:${CFG.clinic.phoneDial}">${CFG.clinic.phoneDisplay}</a>.`,
        "bot"
      );
      return false;
    },
    callEnd: () => {
      window.location.href = `tel:${CFG.clinic.phoneDial}`;
      return false;
    },
    text: () => {
      window.location.href = `sms:${CFG.clinic.phoneDial}`;
      return false;
    },
    portal: () => {
      window.open(CFG.clinic.portal, "_blank", "noopener");
      addMessage(
        "The secure patient portal has opened in a new tab. Available features depend on your account configuration.",
        "bot"
      );
      return false;
    },
    physician: () => {
      closeChat();
      const el = document.getElementById("physician");
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: "smooth" });
      }
      return false;
    },
    directions: () => {
      const q = encodeURIComponent(
        `${CFG.clinic.street}, ${CFG.clinic.locality}, ${CFG.clinic.region} ${CFG.clinic.postal}`
      );
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${q}`,
        "_blank",
        "noopener"
      );
      return false;
    },
  };

  /* ----------------------------------------------------------------------
     GRAPH NAVIGATION
     ---------------------------------------------------------------------- */
  function scoreTopic(nodeKey) {
    const topic = TOPIC_MAP[nodeKey];
    if (topic && state.interests[topic] !== undefined) {
      state.interests[topic] += 1;
    }
  }

  /** Re-order chips so the visitor's demonstrated interest comes first. */
  function personalise(chips) {
    if (!chips) return chips;
    const total = Object.values(state.interests).reduce((a, b) => a + b, 0);
    if (total < 2) return chips; // not enough signal yet

    // Rank each chip by the interest score of the node it points to.
    const scored = chips.map((chip, i) => {
      const key = (chip.to || "").replace("action:", "");
      const topic = TOPIC_MAP[key];
      return { chip, i, score: topic ? state.interests[topic] || 0 : 0 };
    });

    scored.sort((a, b) => b.score - a.score || a.i - b.i);
    const ordered = scored.map((s) => s.chip);

    // Surface the highest-interest topic as a highlighted "continue" chip.
    const topTopic = Object.entries(state.interests).sort((a, b) => b[1] - a[1])[0];
    if (topTopic && topTopic[1] >= 2) {
      const shortcut = {
        geriatric: { label: "Continue: geriatric care", to: "geriatric", icon: "fa-solid fa-person-cane" },
        internal: { label: "Continue: internal medicine", to: "internal", icon: "fa-solid fa-stethoscope" },
        booking: { label: "Continue: booking a visit", to: "book", icon: "fa-regular fa-calendar-check" },
        insurance: { label: "Continue: insurance & cost", to: "insurance", icon: "fa-solid fa-shield-halved" },
        doctor: { label: "Continue: meet Dr. Latif", to: "doctor", icon: "fa-solid fa-user-doctor" },
        logistics: { label: "Continue: hours & location", to: "location", icon: "fa-solid fa-location-dot" }
      }[topTopic[0]];

      if (shortcut && !ordered.some((c) => c.to === shortcut.to)) {
        ordered.unshift(shortcut);
      }
    }
    return ordered;
  }

  async function playNode(key) {
    if (state.ended) return;

    const node =
      key === "greeting" ? CFG.chatbot.greeting : CFG.chatbot.nodes[key];

    if (!node) {
      return playFallback();
    }

    state.current = key;
    state.busy = true;
    scoreTopic(key);

    chipsWrap.innerHTML = "";

    const messages = node.messages || [];
    for (let i = 0; i < messages.length; i++) {
      const typing = showTyping();
      await wait(380 + Math.min(messages[i].length * 4, 700));
      typing.remove();
      addMessage(messages[i], "bot");
      await wait(120);
    }

    if (node.terminate) {
      endConversation();
      state.busy = false;
      return;
    }

    renderChips(personalise(node.chips));
    state.busy = false;
  }

  function playFallback() {
    const fb = CFG.chatbot.fallback;
    chipsWrap.innerHTML = "";
    (async () => {
      const typing = showTyping();
      await wait(650);
      typing.remove();
      fb.messages.forEach((m) => addMessage(m, "bot"));
      renderChips(personalise(fb.chips));
      state.busy = false;
    })();
  }

  function onChip(chip) {
    if (state.busy || state.ended) return;

    // Echo the choice as a user message
    addMessage(chip.label.replace(/<[^>]+>/g, ""), "user");
    state.history.push(chip.label);

    if (chip.to && chip.to.startsWith("action:")) {
      const actionName = chip.to.replace("action:", "");
      const handler = ACTIONS[actionName];
      if (handler) {
        const keepOpen = handler();
        if (keepOpen === false && actionName !== "end" && actionName !== "callEnd") {
          renderChips(personalise(CFG.chatbot.nodes.closing.chips));
        }
        return;
      }
    }
    playNode(chip.to);
  }

  /* ----------------------------------------------------------------------
     TERMINAL STATE
     ---------------------------------------------------------------------- */
  function endConversation(finalMessage) {
    state.ended = true;
    chipsWrap.innerHTML = "";
    if (finalMessage) addMessage(finalMessage, "bot");

    // Required sign-off wording + a call CTA
    const cta = document.createElement("a");
    cta.href = `tel:${CFG.clinic.phoneDial}`;
    cta.className = "chip chip--call";
    cta.innerHTML = `<i class="fa-solid fa-phone-volume"></i> Call customer support ${CFG.clinic.phoneDisplay}`;
    chipsWrap.appendChild(cta);

    const note = document.createElement("a");
    note.href = `sms:${CFG.clinic.phoneDial}`;
    note.className = "chip";
    note.innerHTML = `<i class="fa-regular fa-comment-dots"></i> Or send a text`;
    chipsWrap.appendChild(note);

    const mail = document.createElement("a");
    mail.href = `mailto:${CFG.clinic.email}?subject=${encodeURIComponent("Website inquiry")}`;
    mail.className = "chip";
    mail.innerHTML = `<i class="fa-regular fa-envelope"></i> Email ${CFG.clinic.email}`;
    chipsWrap.appendChild(mail);

    if (input) {
      input.disabled = true;
      input.placeholder = "Conversation ended — please call us";
    }
    if (sendBtn) sendBtn.disabled = true;

    // Give the visitor a clear, human exit.
    const hours = CFG.clinic.hours;
    void hours;
  }

  /* ----------------------------------------------------------------------
     FREE-TEXT MATCHING (keyword → node)
     ---------------------------------------------------------------------- */
  const KEYWORDS = [
    { words: ["appointment", "book", "schedule", "booking", "available", "slot", "visit"], to: "book" },
    { words: ["geriatric", "elderly", "senior", "aging", "older", "geriatrics"], to: "geriatric" },
    { words: ["internal", "primary", "adult", "checkup", "general"], to: "internal" },
    { words: ["fall", "falls", "dizzy", "balance", "mobility", "walking"], to: "falls" },
    { words: ["frail", "frailty", "weak", "strength", "sarcopenia"], to: "frailty" },
    { words: ["memory", "dementia", "alzheimer", "forget", "confusion", "cognitive"], to: "cognition" },
    { words: ["medication", "medicine", "pill", "pharmacy", "polypharmacy", "drug"], to: "medication" },
    { words: ["insurance", "coverage", "medicare", "medicaid", "plan", "network"], to: "insurance" },
    { words: ["cost", "price", "fee", "pay", "expensive", "afford"], to: "cost" },
    { words: ["doctor", "physician", "latif", "who", "credential", "experience", "about"], to: "doctor" },
    { words: ["hour", "open", "close", "location", "address", "where", "direction", "parking"], to: "location" },
    { words: ["portal", "records", "online", "login", "chart"], to: "portal" },
    { words: ["bring", "prepare", "prep", "first visit", "what to expect"], to: "prep" },
    { words: ["family", "caregiver", "mother", "father", "parent", "wife", "husband"], to: "caregiver" },
    { words: ["hospital", "discharge", "admitted", "transition", "readmission"], to: "transitions" },
    { words: ["diabetes", "blood pressure", "hypertension", "cholesterol", "chronic", "thyroid"], to: "chronic" },
    { words: ["prevent", "screening", "vaccine", "wellness", "annual"], to: "preventive" },
    { words: ["goal", "advance", "directive", "hospice", "palliative", "end of life"], to: "goals" },
    { words: ["review", "testimonial", "rating", "google", "star", "recommend"], to: "reviews" },
    { words: ["approach", "philosophy", "difference", "why", "choose"], to: "approach" },
    { words: ["emergency", "911", "urgent", "chest pain"], to: "emergency" },
    { words: ["thank", "thanks", "bye", "goodbye", "done", "end"], to: "closing" }
  ];

  function matchKeywords(text) {
    const t = text.toLowerCase().trim();
    let best = null;
    let bestScore = 0;

    KEYWORDS.forEach((entry) => {
      entry.words.forEach((w) => {
        if (t.includes(w)) {
          const score = w.length; // longer match = more specific
          if (score > bestScore) {
            bestScore = score;
            best = entry.to;
          }
        }
      });
    });
    return best;
  }

  /* ----------------------------------------------------------------------
     EMERGENCY INTERCEPT — safety first on a healthcare site
     ---------------------------------------------------------------------- */
  function emergencyReply() {
    addMessage(
      "<strong>If this is a medical emergency, call 911 now.</strong> Please don't wait for a website reply.",
      "bot"
    );
    addMessage(
      "This chat is not monitored and must never be used for urgent symptoms. For non-urgent clinic questions, call "
        + `<a href="tel:${CFG.clinic.phoneDial}">${CFG.clinic.phoneDisplay}</a>.`,
      "bot"
    );
    renderChips([
      { label: "Call 911", to: "action:call", icon: "fa-solid fa-truck-medical" },
      { label: "Back to the start", to: "greeting", icon: "fa-solid fa-rotate-left" }
    ]);
    // Replace the 911 chip handler with the real emergency number
    const first = chipsWrap.querySelector(".chip");
    if (first) {
      first.onclick = null;
      first.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "tel:911";
      });
    }
    state.busy = false;
  }

  /* ----------------------------------------------------------------------
     FREE-TEXT SUBMIT
     ---------------------------------------------------------------------- */
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (state.ended || state.busy) return;

      const text = (input?.value || "").trim();
      if (!text) return;

      addMessage(text.replace(/</g, "&lt;"), "user");
      state.history.push(text);
      if (input) input.value = "";
      state.busy = true;

      const match = matchKeywords(text);

      if (/emergenc|911|chest pain|stroke|can'?t breathe|bleeding heavily/i.test(text)) {
        const typing = showTyping();
        await wait(500);
        typing.remove();
        emergencyReply();
        return;
      }

      const typing = showTyping();
      await wait(700);
      typing.remove();

      if (match === "emergency") {
        emergencyReply();
      } else if (match) {
        await playNode(match);
      } else {
        playFallback();
      }
    });
  }

  /* ----------------------------------------------------------------------
     OPEN / CLOSE
     ---------------------------------------------------------------------- */
  function openChat() {
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    openers.forEach((b) => b.setAttribute("aria-expanded", "true"));

    if (badge) badge.style.display = "none";

    if (!state.started) {
      state.started = true;
      playNode("greeting");
    }
    window.setTimeout(() => input?.focus({ preventScroll: true }), 420);
  }

  function closeChat() {
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    openers.forEach((b) => b.setAttribute("aria-expanded", "false"));
  }

  openers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (root.classList.contains("is-open")) closeChat();
      else openChat();
    });
  });

  closer?.addEventListener("click", closeChat);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("is-open")) {
      closeChat();
      openers[0]?.focus();
    }
  });

  /* ----------------------------------------------------------------------
     NUDGE: open a proactive greeting bubble after 22s of engaged browsing
     (once per session, never on reduced-motion users who'd find it jarring)
     ---------------------------------------------------------------------- */
  try {
    if (!sessionStorage.getItem("chc_chat_nudge")) {
      let scrolled = false;
      window.addEventListener(
        "scroll",
        () => {
          if (!scrolled && window.scrollY > 700) {
            scrolled = true;
            window.setTimeout(() => {
              if (!state.started && !root.classList.contains("is-open")) {
                sessionStorage.setItem("chc_chat_nudge", "1");
                if (badge) {
                  badge.textContent = "1";
                  badge.style.display = "";
                }
              }
            }, 9000);
          }
        },
        { passive: true }
      );
    }
  } catch (e) {
    /* sessionStorage unavailable — skip the nudge */
  }

  /* Expose a tiny API so other modules (e.g. FAB) can deep-link into topics */
  window.CHChat = { open: openChat, close: closeChat, play: playNode };
})();
