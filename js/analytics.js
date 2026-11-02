/* ==========================================================================
   CONCEPT HEALTH CLINIC — ANALYTICS & COUNTERS
   File: js/analytics.js
   --------------------------------------------------------------------------
   Two jobs, both privacy-first:

   1. VISITOR COUNTER
      A real server-side count (not a random number). Uses Abacus, a free
      counter service that stores a single integer per namespace — no
      cookies, no IPs, no personal data. Every element with
      [data-visitor-count] is filled in.

   2. CALL-CLICK TRACKING
      Delegated listener on every tel: link on the page — navbar, hero,
      floating button, chatbot hand-off, footer. Each click:
        • increments the call counter server-side
        • pushes a `call_click` event to GA4 / GTM if dataLayer exists
        • fires a Google Ads conversion if `conversionId` is configured
        • shows a tiny local confirmation toast (throttled)
      Nothing is sent about *who* clicked — only that a call was started.

   FAILURE BEHAVIOUR
   ---------------
   If the network, the CDN or the counter service is unreachable, the UI
   degrades to an em dash. We never invent a number: fake vanity counters are
   both dishonest and a trust problem on a healthcare site.
   ========================================================================== */
(function () {
  "use strict";

  const CFG = window.CHC;
  if (!CFG) return;

  const A = CFG.analytics || {};
  const clinic = CFG.clinic || {};
  const base = (A.apiBase || "").replace(/\/$/, "");
  const ns = A.namespace || "";
  const K = A.keys || {};

  const $all = (sel) => Array.from(document.querySelectorAll(sel));
  const fmt = (n) => Number(n).toLocaleString("en-US");

  /* ----------------------------------------------------------------------
     SAFE STORAGE (private mode / blocked cookies must not break the page)
     ---------------------------------------------------------------------- */
  const store = {
    get(k) {
      try {
        return window.sessionStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        window.sessionStorage.setItem(k, v);
      } catch (e) {}
    }
  };

  /* ----------------------------------------------------------------------
     COUNTER CLIENT
     ---------------------------------------------------------------------- */
  const counters = {
    /** Increment a counter. Returns the new value, or null on failure. */
    async hit(key) {
      if (!A.enabled || !base || !ns || !key) return null;
      try {
        const res = await fetch(
          `${base}/hit/${encodeURIComponent(ns)}/${encodeURIComponent(key)}`,
          // keepalive lets the request outlive a tel: navigation
          { method: "GET", mode: "cors", cache: "no-store", keepalive: true }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return typeof data.value === "number" ? data.value : null;
      } catch (e) {
        return null;
      }
    },

    /** Read a counter without incrementing it. */
    async get(key) {
      if (!A.enabled || !base || !ns || !key) return null;
      try {
        const res = await fetch(
          `${base}/get/${encodeURIComponent(ns)}/${encodeURIComponent(key)}`,
          { method: "GET", mode: "cors", cache: "no-store" }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return typeof data.value === "number" ? data.value : null;
      } catch (e) {
        return null;
      }
    },

    /** Mark the UI as "live" or "local" so the visitor knows what they see. */
    setMode(mode) {
      // Any element that opted in with data-mode (hero chips, activity strip,
      // the dedicated panel) follows the same source state.
      document.querySelectorAll("[data-mode]").forEach((el) => {
        el.setAttribute("data-mode", mode);
      });
    },

    /** Write a value into every element that displays it. */
    paint(key, value) {
      const selectors = {
        visits: "[data-visitor-count]",
        calls: "[data-call-count]",
        whatsapp: "[data-whatsapp-count]",
        portal: "[data-portal-count]"
      };
      const sel = selectors[key];
      if (!sel) return;

      $all(sel).forEach((el) => {
        if (value === null || value === undefined) {
          el.textContent = "—";
          el.setAttribute("title", "Counter temporarily unavailable");
          el.removeAttribute("data-live");
          return;
        }
        el.setAttribute("data-live", "true");
        // Animate from the previously displayed number for a satisfying tick
        const from = parseInt(el.textContent.replace(/[^\d]/g, ""), 10);
        el.removeAttribute("title");
        if (!from || isNaN(from) || Math.abs(value - from) > 500) {
          el.textContent = fmt(value);
          return;
        }
        const start = performance.now();
        const dur = 700;
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(Math.round(from + (value - from) * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }
  };

  /* ----------------------------------------------------------------------
     1b. LOCAL LEDGER
     When the counter service is unreachable (offline, blocked by a preview
     sandbox, ad-blocker, flaky airport wifi) we still want the numbers to be
     honest and useful. We keep a per-browser ledger in localStorage, seeded
     with a modest baseline so a brand-new deployment doesn't read "1".

     The UI labels which source is in play, so nothing is ever passed off as
     a site-wide total when it is really a local tally.
     ---------------------------------------------------------------------- */
  const LEDGER_KEY = "chc_engagement_ledger";
  const BASELINE = { visits: 0, calls: 0 }; // set to e.g. 1200 to inherit history

  const ledger = {
    read() {
      try {
        const raw = localStorage.getItem(LEDGER_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            visits: Number(parsed.visits) || BASELINE.visits,
            calls: Number(parsed.calls) || BASELINE.calls
          };
        }
      } catch (e) {}
      return { ...BASELINE };
    },
    write(data) {
      try {
        localStorage.setItem(LEDGER_KEY, JSON.stringify(data));
      } catch (e) {}
      return data;
    },
    bump(key, by = 1) {
      const data = this.read();
      data[key] = (data[key] || 0) + by;
      return this.write(data)[key];
    }
  };

  /* ----------------------------------------------------------------------
     1. VISITOR COUNT
     ---------------------------------------------------------------------- */
  async function initVisitors() {
    if (!A.enabled) return;

    const alreadyCounted =
      A.visitOncePerSession !== false && store.get(A.storageKey) === "1";

    let total;
    if (alreadyCounted) {
      total = await counters.get(K.visits);
    } else {
      total = await counters.hit(K.visits);
      if (total !== null) store.set(A.storageKey, "1");
    }

    if (total !== null) {
      counters.setMode("live");
    } else {
      // Offline / blocked: fall back to the local ledger so the panel still
      // shows something real instead of a dash.
      counters.setMode("local");
      total = alreadyCounted ? ledger.read().visits : ledger.bump("visits");
    }

    counters.paint("visits", total);

    // Calls started from this site: read-only on load (a page view is not a call)
    const calls = await counters.get(K.calls);
    if (calls !== null) {
      counters.paint("calls", calls);
    } else {
      const local = ledger.read().calls;
      counters.paint("calls", local);
    }

    // Daily rollover — a separate key per calendar day (Central Time)
    try {
      const day = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Chicago"
      }).format(new Date()); // YYYY-MM-DD
      const todayKey = `${K.visitsToday}-${day}`;
      if (!alreadyCounted) await counters.hit(todayKey);
    } catch (e) {
      /* Intl unavailable — skip the daily rollover, nothing user-visible */
    }
  }

  /* ----------------------------------------------------------------------
     2. CALL-CLICK TRACKING
     ---------------------------------------------------------------------- */
  const CONFIRM_KEY = "chc_call_confirm_shown";

  function showCallConfirm() {
    if (typeof window.Toastify === "undefined") return;
    if (store.get(CONFIRM_KEY) === "1") return;
    store.set(CONFIRM_KEY, "1");

    window.Toastify({
      text: `<div class="social-toast">
               <span class="social-toast__check" aria-hidden="true"><i class="fa-solid fa-phone-volume"></i></span>
               <span class="social-toast__body">
                 <b>Calling ${clinic.phoneDisplay || ""}</b>
                 <em>If your phone doesn't dial, tap the number in the header.</em>
               </span>
             </div>`,
      duration: 4200,
      close: false,
      gravity: "bottom",
      position: "center",
      escapeMarkup: false,
      style: {
        background: "linear-gradient(135deg, #103B5C, #1C6396)",
        color: "#fff"
      }
    }).showToast();
  }

  /** Fire GA4/GTM + Google Ads conversion for a call click. */
  function reportToAnalytics(meta) {
    // GA4 / GTM
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "call_click",
        event_category: "engagement",
        event_label: meta.location,
        phone_number: clinic.phoneDisplay,
        value: 1
      });
    } catch (e) {}

    // gtag conversion (only if the clinic configured an ID)
    if (A.conversionId && typeof window.gtag === "function") {
      try {
        window.gtag("event", "conversion", {
          send_to: A.conversionLabel
            ? `${A.conversionId}/${A.conversionLabel}`
            : A.conversionId,
          event_category: "engagement",
          event_label: meta.location
        });
      } catch (e) {}
    }
  }

  /** Where on the page did the click come from? Useful in reports. */
  function describeLocation(el) {
    const explicit = el.dataset.callLocation;
    if (explicit) return explicit;
    if (el.closest(".site-nav")) return "navbar";
    if (el.closest(".nav-mobile")) return "mobile-drawer";
    if (el.closest(".hero")) return "hero";
    if (el.closest(".fab-stack")) return "floating-button";
    if (el.closest("#chatbot")) return "chatbot";
    if (el.closest(".site-footer")) return "footer";
    if (el.closest("#contact")) return "contact-section";
    if (el.closest("#offer")) return "offer-panel";
    return "body";
  }

  /* A tel: click navigates away, which can abort an in-flight request. So we
     hold the navigation briefly (max 400 ms), fire the counter, then dial.
     The dialer always opens, whether or not the counter responded. */
  function onCallClick(e) {
    const link = e.target.closest('a[href^="tel:"]');
    if (!link) return;

    // Respect modifier clicks and anything a dev wired up themselves
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (link.dataset.tracking === "off") return;

    e.preventDefault();
    if (link.dataset.navigating === "1") return; // double-tap guard
    link.dataset.navigating = "1";

    const href = link.getAttribute("href");
    const meta = { location: describeLocation(link) };

    // Optimistic UI: the number already on screen ticks up immediately
    const shown = $all("[data-call-count]")
      .map((el) => parseInt(el.textContent.replace(/[^\d]/g, ""), 10))
      .find((n) => !isNaN(n));
    if (shown) counters.paint("calls", shown + 1);

    showCallConfirm();
    reportToAnalytics(meta);

    let dialed = false;
    const dial = () => {
      if (dialed) return;
      dialed = true;
      window.location.href = href;
      window.setTimeout(() => {
        link.dataset.navigating = "0";
      }, 1200);
    };

    // Whichever happens first: the counter answers, or 400 ms of patience.
    const guard = window.setTimeout(dial, 400);
    counters.hit(K.calls).then((value) => {
      window.clearTimeout(guard);
      if (value !== null) {
        counters.setMode("live");
        counters.paint("calls", value);
      } else {
        // Counted locally so the number still moves, and labelled as local.
        counters.setMode("local");
        counters.paint("calls", ledger.bump("calls"));
      }
      dial();
    });
  }

  function initCallTracking() {
    // Capture phase so it runs even if something stops propagation later
    document.addEventListener("click", onCallClick, true);
    // Keyboard activation on a focused link fires click too, so this covers
    // Enter/Space without extra handling.
  }

  /* ----------------------------------------------------------------------
     3. SECONDARY OUTBOUND TRACKING (WhatsApp + patient portal)
     ---------------------------------------------------------------------- */
  function initOutboundTracking() {
    document.addEventListener(
      "click",
      (e) => {
        const wa = e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
        if (wa) {
          counters.hit(K.whatsapp).then((v) => v !== null && counters.paint("whatsapp", v));
          try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ event: "whatsapp_click", event_category: "engagement" });
          } catch (err) {}
          return;
        }

        const portal = e.target.closest('a[href*="ecwcloud.com"]');
        if (portal) {
          counters.hit(K.portal).then((v) => v !== null && counters.paint("portal", v));
          try {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ event: "portal_click", event_category: "engagement" });
          } catch (err) {}
        }
      },
      true
    );
  }

  /* ----------------------------------------------------------------------
     4. LIVE "ACTIVE NOW" FLICKER
     A gentle touch: the visitor figure pulses when the count is refreshed,
     signalling that it's live data rather than a static decoration.
     ---------------------------------------------------------------------- */
  function pulseStrip() {
    document
      .querySelectorAll("[data-activity-strip], [data-engagement-panel]")
      .forEach((el) => el.classList.add("is-live"));
  }

  /** Tell the visitor which source is behind the numbers. Honesty beats polish. */
  function labelSource() {
    const textEl = document.querySelector("[data-counter-mode-text]");
    const panels = document.querySelectorAll("[data-engagement-panel]");
    if (!panels.length) return;

    const mode = panels[0].getAttribute("data-mode");
    if (!textEl) return;

    if (mode === "local") {
      textEl.innerHTML =
        "Counts are stored in this browser only — the live counter service is unreachable " +
        "(offline, blocked, or a preview sandbox). <strong>On the live domain this shows " +
        "site-wide totals.</strong>";
    } else if (mode === "live") {
      textEl.innerHTML =
        "Counts are site-wide and aggregated. No personal information, health information or IP addresses are stored.";
    }
  }

  /* ----------------------------------------------------------------------
     BOOT
     ---------------------------------------------------------------------- */
  function boot() {
    initCallTracking();
    initOutboundTracking();

    // Don't compete with first paint / hero animation.
    const start = () => {
      initVisitors().then(() => {
        pulseStrip();
        labelSource();
      });
    };
    if (document.readyState === "complete") window.setTimeout(start, 1600);
    else window.addEventListener("load", () => window.setTimeout(start, 1600));

    // Refresh the displayed totals every 60s so long sessions stay accurate.
    window.setInterval(() => {
      if (document.hidden) return;
      counters.get(K.visits).then((v) => counters.paint("visits", v));
      counters.get(K.calls).then((v) => counters.paint("calls", v));
    }, 60000);
  }

  boot();

  /* Public API — handy for debugging and for the README examples */
  window.CHCStats = {
    visitors: () => counters.get(K.visits),
    calls: () => counters.get(K.calls),
    hit: counters.hit
  };
})();
