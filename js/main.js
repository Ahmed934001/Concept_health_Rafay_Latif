/* ==========================================================================
   CONCEPT HEALTH CLINIC — CORE INTERACTIONS
   File: js/main.js
   Contents:
     1.  Environment helpers (reduced motion, session flags)
     2.  Preloader + confetti welcome
     3.  Navigation (sticky state, mobile drawer, scroll spy, smooth scroll)
     4.  Scroll progress bar
     5.  Reveal animations (GSAP ScrollTrigger → IntersectionObserver fallback)
     6.  Hero word-by-word headline animation
     7.  3D tilt cards & liquid blob parallax
     8.  Animated counters
     9.  Testimonial slider
     10. FAQ accordion
     11. Live "open now" hours status
     12. Fancybox gallery
     13. Contact form (validation + endpoint-aware submit)
     14. Back-to-top
   --------------------------------------------------------------------------
   Everything is written as small, independent initialisers so a section that
   fails never takes the rest of the page down with it.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     0. TINY HELPERS
     ------------------------------------------------------------------------ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = () => typeof window.gsap !== "undefined";
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  // Debounce for resize-heavy work
  function debounce(fn, wait = 150) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /* Flag the document as JS-ready so CSS can pre-hide reveal targets without
     ever hiding content from no-JS users or crawlers. */
  document.documentElement.classList.add("has-js");
  document.documentElement.classList.add("js-reveal-ready");

  /* ------------------------------------------------------------------------
     1. SAFE INIT WRAPPER — one failing module must not break the page
     ------------------------------------------------------------------------ */
  const safe = (name, fn) => {
    try {
      fn();
    } catch (err) {
      console.warn(`[CHC] module "${name}" failed:`, err);
    }
  };

  /* ========================================================================
     2. PRELOADER + CONFETTI
     ======================================================================== */
  safe("preloader", function () {
    const preloader = $("#preloader");
    if (!preloader) return;

    const hide = () => {
      preloader.classList.add("is-done");
      document.body.classList.add("is-loaded");
      window.setTimeout(() => {
        preloader.remove();
      }, 900);
    };

    // Never let the loader outstay its welcome, even on a slow network.
    const failsafe = window.setTimeout(hide, 2600);
    window.addEventListener("load", () => {
      window.clearTimeout(failsafe);
      window.setTimeout(hide, 420);
    });
  });

  safe("confetti", function () {
    // Fire once per browser session so returning visitors aren't spammed,
    // and never for users who asked for reduced motion.
    if (prefersReduced() || typeof window.confetti === "undefined") return;
    const KEY = "chc_confetti_seen";
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch (e) {
      /* private mode — treat as unseen */
    }
    if (seen) return;
    try {
      sessionStorage.setItem(KEY, "1");
    } catch (e) {}

    const palette = ["#438C68", "#7EC8C0", "#103B5C", "#E7F2ED", "#D9A441", "#FFFFFF"];

    window.setTimeout(() => {
      // Gentle centre burst — celebratory, not chaotic.
      confetti({
        particleCount: 90,
        spread: 78,
        startVelocity: 42,
        origin: { x: 0.5, y: 0.42 },
        colors: palette,
        scalar: 0.95,
        ticks: 220,
        disableForReducedMotion: true
      });

      // Two soft side cannons a beat later for depth.
      window.setTimeout(() => {
        confetti({
          particleCount: 45,
          angle: 60,
          spread: 62,
          origin: { x: 0, y: 0.68 },
          colors: palette,
          scalar: 0.8,
          disableForReducedMotion: true
        });
        confetti({
          particleCount: 45,
          angle: 120,
          spread: 62,
          origin: { x: 1, y: 0.68 },
          colors: palette,
          scalar: 0.8,
          disableForReducedMotion: true
        });
      }, 320);
      // Safety net: no matter what, clear the canvas so no stray particles
      // can linger over the page content.
      window.setTimeout(() => {
        try { window.confetti.reset(); } catch (e) {}
      }, 6500);
    }, 700);
  });

  /* ========================================================================
     3. NAVIGATION
     ======================================================================== */
  safe("nav", function () {
    const nav = $("#siteNav");
    const toggle = $("#navToggle");
    const drawer = $("#navMobile");

    /* --- sticky "condensed" state ------------------------------------- */
    if (nav) {
      const onScroll = () => {
        nav.classList.toggle("is-scrolled", window.scrollY > 24);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* --- mobile drawer ------------------------------------------------ */
    if (toggle && drawer) {
      const setOpen = (open) => {
        toggle.setAttribute("aria-expanded", String(open));
        drawer.classList.toggle("is-open", open);
        drawer.setAttribute("aria-hidden", String(!open));
        document.body.style.overflow = open ? "hidden" : "";
      };

      toggle.addEventListener("click", () => {
        setOpen(toggle.getAttribute("aria-expanded") !== "true");
      });

      // Close on link tap, Escape, or resize to desktop.
      drawer.addEventListener("click", (e) => {
        if (e.target.closest("a")) setOpen(false);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && drawer.classList.contains("is-open")) {
          setOpen(false);
          toggle.focus();
        }
      });
      window.addEventListener(
        "resize",
        debounce(() => {
          if (window.innerWidth >= 992) setOpen(false);
        }, 160)
      );
    }

    /* --- overflow guard ------------------------------------------------
       Nine nav items + a call CTA is close to the limit. If the desktop row
       would overflow, collapse to the glass drawer instead of letting items
       spill or wrap. Runs on load and resize. */
    const inner = $(".site-nav__inner");
    const desktopNav = $(".nav-desktop");
    const checkFit = () => {
      if (!nav || !inner || !desktopNav) return;
      if (window.innerWidth < 1200) return; // drawer already handles this

      nav.classList.remove("is-tight");
      // Force a reflow, then compare the row's natural width to its container.
      void nav.offsetWidth;
      if (inner.scrollWidth > inner.clientWidth + 2) {
        nav.classList.add("is-tight");
      }
    };
    window.addEventListener("load", checkFit);
    window.addEventListener("resize", debounce(checkFit, 180));
    checkFit();

    /* --- scroll spy (highlights the active nav item) ------------------- */
    const spyLinks = $$('[data-spy]');
    if (spyLinks.length && "IntersectionObserver" in window) {
      const map = new Map();
      spyLinks.forEach((link) => {
        const id = link.getAttribute("href");
        if (id && id.startsWith("#")) {
          const target = $(id);
          if (target) map.set(target, link);
        }
      });

      const spy = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            spyLinks.forEach((l) => l.classList.remove("active"));
            const link = map.get(entry.target);
            if (link) link.classList.add("active");
          });
        },
        { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
      );
      map.forEach((_link, section) => spy.observe(section));
    }

    /* --- smooth anchor scrolling (works with or without Lenis) -------- */
    document.addEventListener("click", (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#" || hash.length < 2) return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;

      e.preventDefault();
      const navH = nav ? nav.offsetHeight + 14 : 90;

      if (window.__lenis) {
        window.__lenis.scrollTo(target, { offset: -navH, duration: 1.15 });
      } else {
        const top =
          target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({
          top,
          behavior: prefersReduced() ? "auto" : "smooth"
        });
      }
      // Keep the URL shareable without jumping.
      history.replaceState(null, "", hash);
      // Move focus for keyboard users.
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });

  /* ========================================================================
     4. SCROLL PROGRESS BAR
     ======================================================================== */
  safe("progress", function () {
    const bar = $("#scrollProgress");
    if (!bar) return;
    const update = () => {
      const h =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? clamp(window.scrollY / h, 0, 1) : 0;
      bar.style.transform = `scaleX(${pct})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", debounce(update, 200));
  });

  /* ========================================================================
     5. REVEAL ANIMATIONS
     GSAP ScrollTrigger when available, IntersectionObserver otherwise.
     ======================================================================== */
  safe("reveal", function () {
    const items = $$("[data-reveal]");
    if (!items.length) return;

    if (prefersReduced()) {
      items.forEach((el) => {
        el.style.opacity = 1;
        el.style.transform = "none";
      });
      document.documentElement.classList.remove("js-reveal-ready");
      return;
    }

    if (hasGSAP() && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);

      items.forEach((el) => {
        const type = el.dataset.reveal || "up";
        const delay = parseFloat(el.dataset.revealDelay || "0");
        const dur = parseFloat(el.dataset.revealDuration || "1");

        const from = { opacity: 0, duration: dur, ease: "power3.out", delay };
        switch (type) {
          case "left":
            from.x = -44;
            break;
          case "right":
            from.x = 44;
            break;
          case "scale":
            from.scale = 0.92;
            from.y = 20;
            break;
          case "blur":
            from.filter = "blur(14px)";
            from.y = 26;
            break;
          case "rotate":
            from.rotateX = -14;
            from.y = 40;
            from.transformOrigin = "center bottom";
            break;
          default:
            from.y = 38;
        }

        window.gsap.from(el, {
          ...from,
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true
          },
          onComplete: () => {
            el.style.willChange = "auto";
          }
        });
      });

      // Stagger children inside any [data-reveal-group]
      $$("[data-reveal-group]").forEach((group) => {
        const kids = Array.from(group.children);
        if (!kids.length) return;
        window.gsap.from(kids, {
          opacity: 0,
          y: 34,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.09,
          scrollTrigger: { trigger: group, start: "top 85%", once: true }
        });
      });
    } else {
      // ---- Fallback: IntersectionObserver, still elegant ----
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.style.transition =
              "opacity .85s cubic-bezier(.22,1,.36,1), transform .85s cubic-bezier(.22,1,.36,1)";
            el.style.opacity = "1";
            el.style.transform = "none";
            io.unobserve(el);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
      );

      items.forEach((el) => {
        const type = el.dataset.reveal || "up";
        const offset =
          type === "left"
            ? "translateX(-40px)"
            : type === "right"
            ? "translateX(40px)"
            : type === "scale"
            ? "scale(.93)"
            : "translateY(36px)";
        el.style.opacity = "0";
        el.style.transform = offset;
        io.observe(el);
      });
    }

    /* FAILSAFE: whatever happens with ScrollTrigger, anything that is already
       inside the viewport must never stay invisible. Runs once, shortly after
       load, and only touches elements that are genuinely on screen. */
    window.setTimeout(() => {
      const vh = window.innerHeight;
      $$("[data-reveal], [data-reveal-group] > *").forEach((el) => {
        const r = el.getBoundingClientRect();
        const onScreen = r.top < vh && r.bottom > 0;
        const cs = window.getComputedStyle(el);
        if (onScreen && parseFloat(cs.opacity) < 0.9) {
          el.style.transition = "opacity .6s ease, transform .6s ease";
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
    }, 2200);

    // Underline sweep on section titles
    $$(".title-underline").forEach((el) => {
      if (!("IntersectionObserver" in window)) {
        el.classList.add("is-in");
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              el.classList.add("is-in");
              io.unobserve(el);
            }
          });
        },
        { threshold: 0.6 }
      );
      io.observe(el);
    });
  });

  /* ========================================================================
     6. HERO HEADLINE — word-by-word liquid entrance
     ======================================================================== */
  safe("heroHeadline", function () {
    const el = $("[data-split-words]");
    if (!el || prefersReduced()) return;

    // Wrap each word in a mask so it can slide up cleanly.
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words
      .map(
        (w) =>
          `<span class="word-mask" style="display:inline-block;overflow:hidden;vertical-align:bottom;"><span class="word" style="display:inline-block;will-change:transform;">${w}</span></span>`
      )
      .join(" ");

    const targets = $$(".word", el);

    if (hasGSAP()) {
      window.gsap.from(targets, {
        yPercent: 118,
        opacity: 0,
        rotate: 3,
        duration: 1.15,
        ease: "power4.out",
        stagger: 0.055,
        delay: 0.25
      });
    } else {
      targets.forEach((t, i) => {
        t.style.opacity = 0;
        t.style.transform = "translateY(110%)";
        setTimeout(() => {
          t.style.transition =
            "opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1)";
          t.style.opacity = 1;
          t.style.transform = "none";
        }, 180 + i * 55);
      });
    }
  });

  /* ========================================================================
     7. 3D TILT + LIQUID BLOB PARALLAX
     ======================================================================== */
  safe("tilt", function () {
    if (prefersReduced()) return;
    if (window.matchMedia("(hover: none)").matches) return; // skip touch devices

    $$("[data-tilt]").forEach((card) => {
      const max = parseFloat(card.dataset.tilt || "8");

      const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(1200px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateY(-4px)`;
      };
      const onLeave = () => {
        card.style.transform =
          "perspective(1200px) rotateY(0deg) rotateX(0deg) translateY(0)";
      };

      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
    });

    /* Parallax on decorative blobs — rAF throttled */
    const blobs = $$(".hero__blob");
    if (!blobs.length) return;
    let ticking = false;

    const move = () => {
      const y = window.scrollY;
      blobs.forEach((b, i) => {
        const speed = 0.06 + i * 0.035;
        b.style.transform = `translate3d(0, ${y * speed}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(move);
          ticking = true;
        }
      },
      { passive: true }
    );
  });

  /* ========================================================================
     8. ANIMATED COUNTERS
     ======================================================================== */
  safe("counters", function () {
    const counters = $$("[data-count]");
    if (!counters.length) return;

    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const duration = parseInt(el.dataset.duration || "1800", 10);
      const prefix = el.dataset.prefix || "";
      const start = performance.now();

      const tick = (now) => {
        const p = clamp((now - start) / duration, 0, 1);
        // easeOutExpo — fast start, gentle settle
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        const value = (target * eased).toFixed(decimals);
        el.textContent = prefix + Number(value).toLocaleString("en-US");
        if (p < 1) window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    };

    if (prefersReduced() || !("IntersectionObserver" in window)) {
      counters.forEach((el) => {
        const d = parseInt(el.dataset.decimals || "0", 10);
        el.textContent =
          (el.dataset.prefix || "") +
          Number(el.dataset.count).toLocaleString("en-US", {
            minimumFractionDigits: d,
            maximumFractionDigits: d
          });
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => io.observe(c));
  });

  /* ========================================================================
     9. TESTIMONIAL SLIDER
     Arrow buttons, dots, keyboard, swipe. Autoplay pauses on hover/focus.
     ======================================================================== */
  safe("slider", function () {
    $$("[data-slider]").forEach((root) => {
      const track = $(".quote-track", root);
      const slides = $$(".quote-slide", root);
      if (!track || slides.length < 2) return;

      const prev = $("[data-slide-prev]", root);
      const next = $("[data-slide-next]", root);
      const dotsWrap = $("[data-slide-dots]", root);
      let index = 0;
      let timer = null;

      // Dots
      const dots = [];
      if (dotsWrap) {
        slides.forEach((_, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.setAttribute("aria-label", `Go to testimonial ${i + 1}`);
          b.addEventListener("click", () => go(i, true));
          dotsWrap.appendChild(b);
          dots.push(b);
        });
      }

      function render() {
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
        slides.forEach((s, i) => s.setAttribute("aria-hidden", String(i !== index)));
      }

      function go(i, user) {
        index = (i + slides.length) % slides.length;
        render();
        if (user) restart();
      }

      function restart() {
        if (prefersReduced()) return;
        window.clearInterval(timer);
        timer = window.setInterval(() => go(index + 1), 6500);
      }

      prev?.addEventListener("click", () => go(index - 1, true));
      next?.addEventListener("click", () => go(index + 1, true));

      root.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") go(index - 1, true);
        if (e.key === "ArrowRight") go(index + 1, true);
      });

      root.addEventListener("mouseenter", () => window.clearInterval(timer));
      root.addEventListener("mouseleave", restart);
      root.addEventListener("focusin", () => window.clearInterval(timer));

      // Touch swipe
      let startX = null;
      track.addEventListener(
        "touchstart",
        (e) => {
          startX = e.touches[0].clientX;
        },
        { passive: true }
      );
      track.addEventListener(
        "touchend",
        (e) => {
          if (startX === null) return;
          const dx = e.changedTouches[0].clientX - startX;
          if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1), true);
          startX = null;
        },
        { passive: true }
      );

      render();
      restart();
    });
  });

  /* ========================================================================
     10. FAQ ACCORDION (accessible, animated max-height)
     ======================================================================== */
  safe("faq", function () {
    $$(".faq-item").forEach((item) => {
      const btn = $(".faq-q", item);
      const panel = $(".faq-a", item);
      if (!btn || !panel) return;

      btn.setAttribute("aria-expanded", "false");

      btn.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");

        // Accordion behaviour: close siblings in the same list
        const list = item.closest(".faq-list");
        if (list && !isOpen) {
          $$(".faq-item.is-open", list).forEach((other) => {
            other.classList.remove("is-open");
            const ob = $(".faq-q", other);
            const op = $(".faq-a", other);
            if (ob) ob.setAttribute("aria-expanded", "false");
            if (op) op.style.maxHeight = "0px";
          });
        }

        item.classList.toggle("is-open", !isOpen);
        btn.setAttribute("aria-expanded", String(!isOpen));
        panel.style.maxHeight = isOpen ? "0px" : panel.scrollHeight + "px";
      });
    });

    // Recalculate open panels on resize (text reflow changes height)
    window.addEventListener(
      "resize",
      debounce(() => {
        $$(".faq-item.is-open .faq-a").forEach((p) => {
          p.style.maxHeight = p.scrollHeight + "px";
        });
      }, 200)
    );
  });

  /* ========================================================================
     11. LIVE "OPEN NOW" STATUS + TODAY HIGHLIGHT
     Clinic runs on Central Time; the widget respects that regardless of
     where the visitor is browsing from.
     ======================================================================== */
  safe("hours", function () {
    // Several places show live status (top bar, contact card, activity panel),
    // so paint them all rather than just the first match.
    const statusEls = $$("[data-open-status]");
    const table = $("[data-hours-table]");

    const hours = {
      0: null, // Sunday
      1: [9, 17],
      2: [9, 17],
      3: [9, 17],
      4: [9, 17],
      5: [9, 17],
      6: [9, 13]
    };

    // Get the current day/hour in America/Chicago
    let centralNow;
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        weekday: "short",
        hour: "numeric",
        minute: "numeric",
        hour12: false
      }).formatToParts(new Date());
      const get = (t) => parts.find((p) => p.type === t)?.value;
      const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      centralNow = {
        day: dayMap[get("weekday")] ?? new Date().getDay(),
        hour: parseInt(get("hour"), 10) + parseInt(get("minute"), 10) / 60
      };
    } catch (e) {
      const d = new Date();
      centralNow = { day: d.getDay(), hour: d.getHours() + d.getMinutes() / 60 };
    }

    const today = hours[centralNow.day];
    const isOpen = today && centralNow.hour >= today[0] && centralNow.hour < today[1];

    // 24h -> friendly 12h ("17" -> "5 PM", "9" -> "9 AM")
    const friendly = (h24) => {
      const h = h24 % 12 === 0 ? 12 : h24 % 12;
      return `${h}:00 ${h24 < 12 ? "AM" : "PM"}`;
    };

    let statusHTML;
    if (isOpen) {
      statusHTML = `<i class="fa-solid fa-circle-check"></i> Open now — closes at ${friendly(today[1])} CT`;
    } else if (today && centralNow.hour < today[0]) {
      statusHTML = `<i class="fa-regular fa-clock"></i> Opens today at ${friendly(today[0])} CT`;
    } else {
      statusHTML = `<i class="fa-regular fa-moon"></i> Closed now — leave a message and we'll call back`;
    }
    statusEls.forEach((el) => {
      el.innerHTML = statusHTML;
      el.classList.toggle("text-green", Boolean(isOpen));
    });

    if (table) {
      const rows = $$("tr[data-day]", table);
      rows.forEach((row) => {
        const d = parseInt(row.dataset.day, 10);
        row.classList.toggle("is-today", d === centralNow.day);
      });
    }
  });

  /* ========================================================================
     12. FANCYBOX GALLERY
     ======================================================================== */
  safe("fancybox", function () {
    if (typeof window.Fancybox === "undefined") return;

    window.Fancybox.bind('[data-fancybox="clinic-gallery"]', {
      Carousel: {
        infinite: true,
        transition: "fade"
      },
      Toolbar: {
        display: {
          left: ["infobar"],
          middle: [],
          right: ["slideshow", "thumbs", "close"]
        }
      },
      Images: { Panzoom: { maxScale: 2.2 } },
      Thumbs: { type: "classic" },
      animated: true,
      showClass: "f-fadeIn",
      hideClass: "f-fadeOut",
      l10n: { CLOSE: "Close", NEXT: "Next", PREV: "Previous" }
    });
  });

  /* ========================================================================
     12b. GOOGLE MAP — click-to-load facade
     Keeps the third-party embed off the critical path (and off the visitor's
     cookie jar) until they actually ask for the map.
     ======================================================================== */
  safe("map", function () {
    const query = encodeURIComponent(
      "Concept Health Clinic, 4616 US Highway 75, Suite 203, Denison, TX 75020"
    );
    const src = `https://www.google.com/maps?q=${query}&z=16&output=embed`;

    /** Wire up one map block. Each block is independent, so a failure in the
        footer map can never stop the contact map from loading. */
    const initMap = (wrap) => {
      if (!wrap) return;
      const facade = wrap.querySelector("[data-map-facade]");
      const loadBtn = wrap.querySelector("[data-map-load]");
      if (!facade) return;

      const load = () => {
        if (wrap.querySelector("iframe")) return;

        const iframe = document.createElement("iframe");
        iframe.src = src;
        iframe.title =
          "Google Map showing Concept Health Clinic at 4616 US Highway 75, Suite 203, Denison, Texas 75020";
        iframe.width = "100%";
        iframe.height = "100%";
        iframe.loading = "lazy";
        iframe.referrerPolicy = "no-referrer-when-downgrade";
        iframe.setAttribute("allowfullscreen", "");
        iframe.style.border = "0";
        iframe.style.display = "block";
        iframe.style.minHeight = "100%";

        iframe.addEventListener("load", () => wrap.classList.add("is-loaded"));

        wrap.appendChild(iframe);
        wrap.classList.add("is-loading");

        // Google's embed occasionally never fires `load` (blocked frames,
        // strict privacy modes). Reveal it anyway so the map is never invisible.
        window.setTimeout(() => wrap.classList.add("is-loaded"), 2600);

        try {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: "map_load",
            event_category: "engagement",
            event_label: wrap.id || "map"
          });
        } catch (e) {}
      };

      loadBtn?.addEventListener("click", load);

      // Load on hover intent (desktop only — avoids surprise on touch).
      let hoverTimer = null;
      facade.addEventListener("mouseenter", () => {
        if (window.matchMedia("(hover: none)").matches) return;
        hoverTimer = window.setTimeout(load, 1100);
      });
      facade.addEventListener("mouseleave", () => window.clearTimeout(hoverTimer));
    };

    $$(".map-frame--live").forEach(initMap);
  });

  /* ========================================================================
     13. CONTACT FORM
     Validates client-side, then posts to CHC.forms.endpoint if one is
     configured. Until a real endpoint exists we never claim success — the
     user is handed a phone number and a pre-filled email instead.
     ======================================================================== */
  safe("contactForm", function () {
    const form = $("#inquiryForm");
    if (!form) return;

    const status = $("#formStatus");
    const submitBtn = $('button[type="submit"]', form);

    const setStatus = (msg, type) => {
      if (!status) return;
      status.textContent = msg;
      status.classList.remove("text-green", "text-danger");
      status.classList.add(type === "error" ? "text-danger" : "text-green");
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // --- native validation first -----------------------------------
      if (!form.checkValidity()) {
        form.classList.add("was-validated");
        setStatus("Please complete the highlighted fields.", "error");
        const firstInvalid = $(":invalid", form);
        firstInvalid?.focus();
        return;
      }

      // --- honeypot spam guard ---------------------------------------
      const honey = form.querySelector('[name="company_website"]');
      if (honey && honey.value.trim() !== "") {
        // Silently drop — bots fill hidden fields, humans don't.
        form.reset();
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());
      const endpoint = window.CHC?.forms?.endpoint;

      submitBtn && ((submitBtn.disabled = true), (submitBtn.style.opacity = "0.65"));

      try {
        if (endpoint) {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data,
              submittedAt: new Date().toISOString(),
              source: "website-contact-form"
            })
          });
          if (!res.ok) throw new Error("Request failed: " + res.status);

          setStatus(
            "Thank you for contacting Concept Health Clinic. Your inquiry has been submitted. For time-sensitive concerns, please call our office directly.",
            "success"
          );
          form.reset();
          form.classList.remove("was-validated");
        } else {
          // --- No endpoint yet: be transparent, offer real channels ----
          const subject = encodeURIComponent(
            `Website inquiry — ${data.inquiryType || "General"}`
          );
          const body = encodeURIComponent(
            `Name: ${data.fullName}\nEmail: ${data.email}\nPhone: ${data.phone}\nInquiry type: ${data.inquiryType}\n\n${data.message}`
          );
          setStatus(
            "This form is not yet connected to our secure intake system. Please call (903) 600-2100, or send your message by email — we've prepared it for you.",
            "success"
          );
          const mailLink = document.createElement("a");
          mailLink.href = `mailto:info@concepthealthclinic.com?subject=${subject}&body=${body}`;
          mailLink.className = "btn btn-glass-primary btn-sm mt-3";
          mailLink.innerHTML = '<i class="fa-solid fa-envelope"></i> Open pre-filled email';
          status?.appendChild(document.createElement("br"));
          status?.appendChild(mailLink);
        }
      } catch (err) {
        console.error("[CHC] form submit error:", err);
        setStatus(
          "We couldn't send that just now. Please call (903) 600-2100 and we'll help you directly.",
          "error"
        );
      } finally {
        submitBtn && ((submitBtn.disabled = false), (submitBtn.style.opacity = "1"));
      }
    });
  });

  /* ========================================================================
     14. BACK TO TOP
     ======================================================================== */
  safe("backToTop", function () {
    const btn = $("#backToTop");
    if (!btn) return;

    const toggle = () => {
      btn.classList.toggle("is-visible", window.scrollY > 600);
    };
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });

    btn.addEventListener("click", () => {
      if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.2 });
      else window.scrollTo({ top: 0, behavior: prefersReduced() ? "auto" : "smooth" });
    });
  });

  /* ========================================================================
     14b. CARE JOURNEY — sticky stage synced to the scroll steps
     As each step scrolls past the reading line, the sticky glass "stage"
     above it morphs number, title and subtitle. Cheap, smooth, and it makes
     a five-step section feel like a single continuous story.
     ======================================================================== */
  safe("journey", function () {
    const steps = $$("[data-journey-step]");
    const numEl = $("[data-journey-num]");
    const titleEl = $("[data-journey-title]");
    const copyEl = $("[data-journey-copy]");
    if (!steps.length || !numEl || !titleEl || !copyEl) return;

    let activeIndex = -1;

    const setActive = (i) => {
      if (i === activeIndex) return;
      activeIndex = i;

      steps.forEach((step, idx) => step.classList.toggle("is-active", idx === i));

      const step = steps[i];
      if (!step) return;
      const h3 = $("h3", step);
      const p = $("p", step);
      const label = $(".journey__step-label", step);

      // Swap content with a quick fade so the change reads as intentional
      const stage = numEl.closest(".journey__stage-inner");
      if (stage && !prefersReduced()) {
        stage.style.transition = "opacity .22s ease, transform .22s ease";
        stage.style.opacity = "0.15";
        stage.style.transform = "translateY(8px)";
      }

      window.setTimeout(() => {
        numEl.textContent = String(i + 1).padStart(2, "0");
        titleEl.textContent = h3 ? h3.textContent : "";
        copyEl.textContent = p ? p.textContent : "";
        if (label) copyEl.dataset.label = label.textContent;

        if (stage) {
          stage.style.opacity = "1";
          stage.style.transform = "none";
        }
      }, prefersReduced() ? 0 : 220);
    };

    /* Pick whichever step's midpoint sits closest to the viewport's centre
       line. Robust at any scroll speed and with sticky elements in the way. */
    let ticking = false;
    const sync = () => {
      ticking = false;
      const centre = window.innerHeight * 0.5;
      let bestIdx = 0;
      let bestDist = Infinity;

      steps.forEach((step, i) => {
        const r = step.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const dist = Math.abs(mid - centre);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });
      setActive(bestIdx);
    };

    const request = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(sync);
      }
    };

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", debounce(request, 200));
    setActive(0);
    sync();
  });

  /* ========================================================================
     15. CURRENT YEAR STAMP
     ======================================================================== */
  safe("year", function () {
    $$("[data-current-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  });
})();
