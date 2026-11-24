/* ==========================================================================
   CONCEPT HEALTH CLINIC — ENGAGEMENT LAYER
   File: js/engagement.js
   --------------------------------------------------------------------------
   One job, deliberately small:

     GENTLE CTA REVEAL — reveals the fixed booking strip once the hero is out
     of view on mobile.

   The countdown, the social-proof notifications and the "best time to call"
   hint were removed at the client's request. Nothing here loads a third-party
   library or writes to storage.
   ========================================================================== */
(function () {
  "use strict";

  const CFG = window.CHC;
  if (!CFG) return;

  const prefersReduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ========================================================================
     GENTLE "SCROLLED PAST HERO" CTA REVEAL
     Reveals the fixed booking strip on mobile once the hero is out of view.
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
