/* ==========================================================================
   CONCEPT HEALTH CLINIC — ACCESSIBILITY PREFERENCES
   File: js/accessibility.js

   Two reading preferences, both remembered between visits:

     - Text size      — html.text-lg
     - High contrast  — html.contrast-high

   The classes are added by an inline bootstrap script in <head> so the page
   never paints in the wrong state and then corrects itself. This file is only
   responsible for wiring up the buttons and toggling the stored value.

   Everything is defensive: if localStorage is unavailable (private mode, or a
   locked-down browser) the toggles still work for the current page, they just
   are not remembered.
   ========================================================================== */

(function () {
  "use strict";

  var ROOT = document.documentElement;
  var KEYS = { text: "chc:text-lg", contrast: "chc:contrast" };

  /* ------------------------------------------------------------------------
     STORAGE — never throw
     ------------------------------------------------------------------------ */
  function read(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function write(key, value) {
    try {
      if (value) window.localStorage.setItem(key, value);
      else window.localStorage.removeItem(key);
    } catch (e) {
      /* private mode — preference simply does not persist */
    }
  }

  /* ------------------------------------------------------------------------
     TOGGLES
     Each entry maps a preference to the class it drives, the storage key it
     writes and the buttons that represent it. The state is expressed three
     ways so it is never colour-only: aria-pressed, the visible word
     (ON / OFF) and the icon.
     ------------------------------------------------------------------------ */
  var PREFS = {
    text: {
      className: "text-lg",
      key: KEYS.text,
      buttons: "[data-toggle-text]",
      on: { icon: "fa-solid fa-a", label: "Larger text", state: "on" },
      off: { icon: "fa-solid fa-a", label: "Larger text", state: "off" }
    },
    contrast: {
      className: "contrast-high",
      key: KEYS.contrast,
      buttons: "[data-toggle-contrast]",
      on: { icon: "fa-solid fa-circle-half-stroke", label: "High contrast", state: "on" },
      off: { icon: "fa-solid fa-circle-half-stroke", label: "High contrast", state: "off" }
    }
  };

  function paint(pref, isOn) {
    var buttons = document.querySelectorAll(pref.buttons);

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.setAttribute("aria-pressed", isOn ? "true" : "false");

      var icon = btn.querySelector("i");
      if (icon) icon.className = isOn ? pref.on.icon : pref.off.icon;

      var state = btn.querySelector(".pref-toggle__state");
      if (state) state.textContent = isOn ? "On" : "Off";
    });
  }

  /* The accessibility page prints the live state of both settings. Kept at
     module scope so every route that changes a preference — button click or
     keyboard shortcut — updates it through the same function. */
  var syncReadout = function () {};

  function apply(name, isOn, persist) {
    var pref = PREFS[name];

    ROOT.classList.toggle(pref.className, isOn);
    paint(pref, isOn);
    if (persist) write(pref.key, isOn ? "1" : "");
    syncReadout();
    document.dispatchEvent(new Event("chc:preferences-change"));
  }

  function isOn(name) {
    return ROOT.classList.contains(PREFS[name].className);
  }

  /* ------------------------------------------------------------------------
     WIRING
     ------------------------------------------------------------------------ */
  function init() {
    Object.keys(PREFS).forEach(function (name) {
      var pref = PREFS[name];
      var buttons = document.querySelectorAll(pref.buttons);

      // Reflect whatever the head bootstrap script already applied.
      paint(pref, isOn(name));

      Array.prototype.forEach.call(buttons, function (btn) {
        btn.addEventListener("click", function () {
          var next = !isOn(name);
          apply(name, next, true);

          // Announce the change for screen reader users without moving focus.
          var live = document.getElementById("prefAnnounce");
          if (live) {
            live.textContent =
              pref.on.label + " " + (next ? "turned on" : "turned off");
          }
        });
      });
    });

    /* Keyboard shortcut: Alt+Shift+C cycles high contrast. Announced in the
       accessibility statement so it is discoverable rather than secret. */
    document.addEventListener("keydown", function (e) {
      if (e.altKey && e.shiftKey && (e.key === "C" || e.key === "c")) {
        e.preventDefault();
        apply("contrast", !isOn("contrast"), true);
      }
    });

    /* Report the current state on the accessibility page, if present. */
    var readout = document.querySelector("[data-pref-readout]");
    if (readout) {
      syncReadout = function () {
        readout.textContent =
          "Current settings — larger text: " + (isOn("text") ? "On" : "Off") +
          " · high contrast: " + (isOn("contrast") ? "On" : "Off");
      };
      syncReadout();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
