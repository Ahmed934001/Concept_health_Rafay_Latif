/* ==========================================================================
   CONCEPT HEALTH CLINIC — ENGAGEMENT LAYER
   File: js/engagement.js
   --------------------------------------------------------------------------
   Three conversion/engagement systems that run site-wide:

     1. COUNTDOWN  — the "New Patient Welcome" offer timer. Persisted to
                     localStorage so every visitor sees the same honest
                     deadline rather than a fake reset on refresh.
     2. SOCIAL PROOF — randomised Toastify notifications using Indian,
                     Pakistani and Arabic names with flag emojis, throttled so
                     they never feel spammy.
     3. HAPPY HOUR  — subtle, tasteful "best time to call" hint in the topbar.

   All three respect prefers-reduced-motion and page visibility so we never
   burn CPU (or goodwill) on a hidden tab.
   ========================================================================== */
(function () {
  "use strict";

  const CFG = window.CHC;
  if (!CFG) return;

  const prefersReduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ========================================================================
     1. COUNTDOWN
     ======================================================================== */
  (function countdown() {
    const wrap = document.querySelector("[data-countdown]");
    if (!wrap) return;

    const els = {
      days: wrap.querySelector("[data-cd-days]"),
      hours: wrap.querySelector("[data-cd-hours]"),
      mins: wrap.querySelector("[data-cd-mins]"),
      secs: wrap.querySelector("[data-cd-secs]")
    };
    const note = document.querySelector("[data-countdown-note]");

    /* Rolling 14-day window aligned to the start of the current month, so the
       deadline is always real, always soon, and never resets on refresh.
       Stored in localStorage to keep every tab in sync. */
    const KEY = "chc_offer_deadline";
    let deadline;

    try {
      const stored = parseInt(localStorage.getItem(KEY) || "0", 10);
      if (stored && stored > Date.now()) {
        deadline = stored;
      } else {
        const now = new Date();
        deadline = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        ).getTime(); // last day of this month
        localStorage.setItem(KEY, String(deadline));
      }
    } catch (e) {
      // Private mode — fall back to end of month, computed fresh each load
      const now = new Date();
      deadline = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
    }

    const pad = (n) => String(Math.max(0, n)).padStart(2, "0");

    function tick() {
      const diff = deadline - Date.now();

      if (diff <= 0) {
        els.days && (els.days.textContent = "00");
        els.hours && (els.hours.textContent = "00");
        els.mins && (els.mins.textContent = "00");
        els.secs && (els.secs.textContent = "00");
        return false;
      }

      const s = Math.floor(diff / 1000);
      els.days && (els.days.textContent = pad(Math.floor(s / 86400)));
      els.hours && (els.hours.textContent = pad(Math.floor((s % 86400) / 3600)));
      els.mins && (els.mins.textContent = pad(Math.floor((s % 3600) / 60)));
      els.secs && (els.secs.textContent = pad(s % 60));
      return true;
    }

    tick();
    let id = window.setInterval(() => {
      if (document.hidden) return; // don't tick in background tabs
      if (!tick()) window.clearInterval(id);
    }, 1000);

    if (note) {
      const d = new Date(deadline);
      note.textContent = `Offer ends ${d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric"
      })} · Central Time`;
    }
  })();

  /* ========================================================================
     2. SOCIAL PROOF TOASTS
     ======================================================================== */
  (function socialProof() {
    if (typeof window.Toastify === "undefined") return;

    // Brands sometimes arrive via a template literal in the config; keep it
    // readable and safe.
    const esc = (s) =>
      String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[c]));

    const pool = CFG.socialProof.slice();
    let lastIndex = -1;
    let timer = null;
    let shown = 0;
    const MAX_SHOWN = 14; // stop after this many so it never becomes noise

    function pick() {
      // Avoid showing the same record twice in a row
      let i;
      do {
        i = Math.floor(Math.random() * pool.length);
      } while (i === lastIndex && pool.length > 1);
      lastIndex = i;
      return pool[i];
    }

    function fire() {
      if (document.hidden) return schedule();
      if (shown >= MAX_SHOWN) return;

      const p = pick();
      shown++;

      const gradients = [
        "linear-gradient(135deg, #438C68, #2F6B4E)",
        "linear-gradient(135deg, #103B5C, #1C6396)",
        "linear-gradient(135deg, #2F6B4E, #103B5C)",
        "linear-gradient(135deg, #3E8FA8, #103B5C)"
      ];

      window.Toastify({
        text: `<div class="social-toast">
                 <span class="social-toast__flag" aria-hidden="true">${p.flag}</span>
                 <span class="social-toast__check" aria-hidden="true"><i class="fa-solid fa-check"></i></span>
                 <span class="social-toast__body">
                   <b>${esc(p.name)}</b> from ${esc(p.city)}
                   <em>${esc(p.action)} · ${esc(p.ago)}</em>
                 </span>
               </div>`,
        duration: 5200,
        close: true,
        gravity: "bottom",
        position: "center",
        stopOnFocus: true,
        escapeMarkup: false,
        style: {
          background: gradients[Math.floor(Math.random() * gradients.length)],
          color: "#fff"
        }
      }).showToast();

      schedule();
    }

    function schedule() {
      window.clearTimeout(timer);
      if (shown >= MAX_SHOWN) return;
      // 9–17s between toasts — present but never intrusive
      const delay = 9000 + Math.random() * 8000;
      timer = window.setTimeout(fire, delay);
    }

    // Start after the page has settled, and never on reduced-motion users
    // who may be sensitive to repeated motion.
    if (prefersReduced()) return;
    window.setTimeout(schedule, 11000);

    // Pause everything while the tab is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) window.clearTimeout(timer);
      else schedule();
    });
  })();

  /* ========================================================================
     3. "BEST TIME TO CALL" HINT
     A small honest nudge: quietest phone windows during clinic hours.
     ======================================================================== */
  (function bestTimeToCall() {
    const el = document.querySelector("[data-best-time]");
    if (!el) return;

    const now = new Date();
    const hour = now.getHours();
    let msg;

    if (hour >= 9 && hour < 11) {
      msg = "Lines are quietest right now — good time to call.";
    } else if (hour >= 11 && hour < 14) {
      msg = "Lunch hour is our busiest window. Try after 2 PM for a shorter wait.";
    } else if (hour >= 14 && hour < 16) {
      msg = "2–4 PM is typically our calmest stretch of the afternoon.";
    } else if (hour >= 16 && hour < 17) {
      msg = "Last hour of the day — call now and we'll fit you in.";
    } else if (hour >= 17) {
      msg = "We're closed now. Leave a message or call back after 9 AM CT.";
    } else {
      msg = "We open at 9 AM CT — call early for the widest choice of slots.";
    }
    el.textContent = msg;
  })();

  /* ========================================================================
     4. GENTLE "SCROLLED PAST HERO" CTA REVEAL
     Reveals the fixed call strip on mobile once the hero is out of view.
     ======================================================================== */
  (function mobileCallBar() {
    const bar = document.querySelector("[data-mobile-call-bar]");
    if (!bar) return;
    const hero = document.querySelector(".hero");
    if (!hero || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        bar.classList.toggle("is-visible", !entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );
    io.observe(hero);
  })();
})();
