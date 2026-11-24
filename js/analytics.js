/* ==========================================================================
   CONCEPT HEALTH CLINIC — OUTBOUND TRACKING
   File: js/analytics.js
   --------------------------------------------------------------------------
   One job, privacy-first:

   BOOKING CLICK TRACKING
     A delegated listener on the booking button and every patient-portal link
     pushes a single `booking_click` event to window.dataLayer. If GTM or GA4
     is connected later, the event is already there. The label distinguishes
     the floating button from in-page links.

   Nothing else is collected. There are no cookies, no identifiers, no IP
   logging, no third-party counting service and no data stored in the browser.

   Call links are plain `tel:` links and are deliberately not intercepted, so
   the phone dials immediately with no network round-trip in the way.
   ========================================================================== */
(function () {
  "use strict";

  const CFG = window.CHC;
  if (!CFG) return;

  const A = CFG.analytics || {};
  if (A.enabled === false) return;

  const PORTAL_MATCH = 'a[href*="ecwcloud.com"]';

  /** Push an event to the dataLayer if a tag manager is present. */
  function push(payload) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);
    } catch (e) {
      /* A blocked or frozen dataLayer must never break navigation. */
    }
  }

  /* ----------------------------------------------------------------------
     Booking + patient-portal clicks
     The floating "Book an appointment" button and every in-page portal link
     share one destination, so they share one event; the label records which
     entry point the visitor used.
     ---------------------------------------------------------------------- */
  document.addEventListener(
    "click",
    (e) => {
      const portal = e.target.closest(PORTAL_MATCH);
      if (!portal) return;

      const isFab = portal.classList.contains("fab--booking");
      const isNav = !!portal.closest(".site-nav, .nav-mobile");

      push({
        event: "booking_click",
        event_category: "engagement",
        event_label: isFab ? "booking-fab" : isNav ? "navbar" : "portal-link"
      });

      // Optional Google Ads / GA4 conversion, only when configured.
      if (A.conversionId && typeof window.gtag === "function") {
        try {
          window.gtag("event", "conversion", {
            send_to: A.conversionLabel ? `${A.conversionId}/${A.conversionLabel}` : A.conversionId,
            event_category: "engagement",
            event_label: isFab ? "booking-fab" : "portal-link"
          });
        } catch (err) {}
      }
    },
    true
  );
})();
