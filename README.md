# Concept Health Clinic — Website Build

A production-oriented, single-page marketing site for **Concept Health Clinic**
(Internal Medicine & Geriatric Medicine, Denison, Texas), built with the
*liquid glass* / iOS 26 glassmorphism language requested in the brief.

---

## 1. File map

```
index.html            Complete page: SEO head, schema.org graph, all sections
css/style.css         Design system: tokens, glass material, components, motion
js/config.js          Single source of truth — clinic NAP, social proof, chatbot graph
js/main.js            Nav, reveals, tilt, counters, slider, FAQ, hours, Fancybox, form
js/engagement.js      Countdown, Toastify social proof, "best time to call"
js/chatbot.js         Conversational assistant ("Clara") + adaptive suggestions
js/analytics.js       Visitor counter + call-click tracking (privacy-first)
assets/logo-mark.png  Client logo, transparent, square (nav + footer)
assets/logo.png       Client logo, 512×512 (schema.org + apple-touch-icon)
assets/favicon-64.png Favicon
assets/og-image.jpg   1200×630 social share card built from the logo
assets/dr-rafay-hero.jpg      Physician portrait 4:4.1 (hero card)
assets/dr-rafay-latif.jpg     Physician portrait 4:4.6 (bio section)
assets/dr-rafay-about.jpg     Physician portrait 4:3   (about section)
assets/dr-rafay-square.jpg    Physician portrait 1:1   (gallery)
*-sm.jpg                      Sharper srcset variants of each
robots.txt            Crawl rules + sitemap pointer
sitemap.xml           One live URL; the other six routes are commented TODOs
```

Open `index.html` directly, or serve the folder (`python3 -m http.server`) — no
build step, no bundler, no `npm install`.

---

## 2. What is implemented

### Design & UI
| Requirement | Where |
|---|---|
| Liquid-glass iOS 26 material | `.glass`, `.glass--dark` — layered gradients + `backdrop-filter` + specular top edge + grain overlay |
| Premium palette | All seven approved hex values as CSS custom properties in `:root` |
| Scroll-triggered motion | GSAP + ScrollTrigger reveals (`data-reveal="up|left|right|scale|blur"`), with an IntersectionObserver fallback |
| Font Awesome throughout | 6.7.2 |
| Photo gallery with Fancybox | 10-item gallery, images + one video, captions, thumbnails, pan-zoom |
| Unsplash imagery | All images via `images.unsplash.com` with `srcset` where it matters |
| Call Us in hero + navbar | `.btn-call` (pulsing phone badge) in the hero, the navbar, the mobile drawer, the offer panel and the closing CTA |

### SEO
- One `<h1>`; `h2` per section; `h3`/`h4` for services — no skipped levels, no repeated H1s.
- Unique title, meta description, keywords, canonical, robots directives, geo meta.
- Open Graph + Twitter card with a 1200×630 image.
- **Schema.org `@graph`**: `MedicalClinic` + `MedicalBusiness` + `LocalBusiness`, `Physician`, `WebSite`, `WebPage`, `BreadcrumbList`, `FAQPage`.
- Descriptive `alt` on every image, `loading="lazy"` and intrinsic `width`/`height` on all but the hero image (which is `fetchpriority="high"`).
- Internal linking block between the two service clusters plus descriptive anchors inside body copy.
- `robots.txt` + `sitemap.xml`.

### UX
| Requirement | Status |
|---|---|
| Call Us sticky in header | ✅ navbar + topbar + floating vibrating button |
| WhatsApp floating bottom-**left**, animated | ✅ pulse ring, brand-green gradient |
| Vibrating call button just **above** WhatsApp | ✅ `.fab--call` with `callShake` keyframes |
| Chatbot bottom-right with suggested buttons | ✅ 25-node conversation graph, typing indicators, adaptive chip ordering |
| Chat end copy + call button | ✅ exact required wording, input disabled, call/SMS/email CTAs revealed |
| Toastify social proof (IN/PK/Arab names + flags) | ✅ 16 records, 9–17 s apart, max 14, pauses on hidden tab |
| Confetti on load | ✅ centre burst + two side cannons, once per session, hard `reset()` safety net |

### Functionality
- Mobile-first; verified **no horizontal overflow at 390 px**.
- Modular, commented JS — each module wrapped in a `safe()` initialiser so one failure can't break the page.
- Discount/offer countdown persisted in `localStorage` so the deadline is real, not a refresh-reset gimmick.
- Accessible: skip link, visible focus rings, `aria-expanded`/`aria-controls`, `role="log"` on the chat, keyboard-operable slider and accordion, `prefers-reduced-motion` honoured throughout (confetti, toasts, marquee, tilt and Lenis all disable).

---

## 2b. Client updates — logo, portrait, counters, map

**Brand assets are now the real ones.** The supplied logo (transparent PNG) was
trimmed of its empty margin and exported to `logo-mark.png` (nav/footer),
`logo.png` (512×512, used by schema.org and as the apple-touch-icon),
`favicon-64.png`, and a pearl-background `og-image.jpg` for link previews.
The mark sits on a white glass tile so the green stays legible against the
navy navbar and footer.

**Dr. Latif's portrait** now appears in **four** places, each with a crop file
built for that container rather than one image stretched to fit:

| Where | File | Ratio | Framing |
|---|---|---|---|
| Hero card | `dr-rafay-hero.jpg` | 4 : 4.1 | head + shoulders |
| About section | `dr-rafay-about.jpg` | 4 : 3 | upper body, landscape |
| Physician bio | `dr-rafay-latif.jpg` | 4 : 4.6 | full studio crop |
| Gallery | `dr-rafay-square.jpg` | 1 : 1 | face-centred square |

Each is exported at 2× its display size with a `srcset` companion, and
`object-position` is tuned per container so the face never drifts out of frame
at any breakpoint. The hero badge moved to the bottom of the frame so it sits
over the suit, not his face.

**Visitor counter** — a genuine server-side count, not a random animation.
Backed by [Abacus](https://abacus.jasoncameron.dev): one integer per namespace,
no cookies, no IP storage, so it needs no consent banner and touches no PHI.
Shown in **four** places, so it is impossible to miss:

| Location | What it shows |
|---|---|
| `#activity` section | full three-card panel with a call CTA |
| Top bar | compact visit pill |
| Contact card | visits + calls strip |
| Footer | visits + calls in the bottom bar |

It also has a **dedicated `#activity` section** — "Live site activity" — with
large animated numerals, a live open/closed card, and its own call CTA, plus
its own nav entry between Gallery and Reviews.

**Resilient by design.** If the counter service is unreachable (offline, ad
blocker, corporate proxy, or a sandboxed preview iframe), the numbers fall back
to a localStorage ledger and the panel **says so**, switching to a warm amber
notice: *"Counts are stored in this browser only — the live counter service is
unreachable… On the live domain this shows site-wide totals."* A dash is never
left on screen, and a local tally is never passed off as a site-wide total.
Set `BASELINE` in `js/analytics.js` if you want the ledger to inherit history.

**Call-click tracking** — one delegated listener covers all `tel:` links on the
page (navbar, hero, activity panel, floating button, offer panel, contact card,
chatbot hand-off, footer). Each click:

1. increments the server-side call counter,
2. pushes a `call_click` event to `dataLayer` (GA4 / GTM),
3. fires a Google Ads conversion if an ID is configured,
4. shows a one-time confirmation toast,
5. **then** dials — with a 400 ms ceiling, so a slow counter can never block
   the call. If the counter is down, the number still dials.

Because a `tel:` click normally navigates the page (killing in-flight
requests), the handler holds navigation briefly — with a 400 ms ceiling, so a
slow counter can never delay the dial. Set `analytics.conversionId` in
`js/config.js` to wire Google Ads conversions.

Each click is also attributed by origin (`navbar`, `hero`, `activity-panel`,
`floating-button`, `chatbot`, `footer`, …) so you can see which placement
actually earns the call.

**Google Map — two live instances.** One in the Contact section (where the
form lives) and one in the **footer**, so a visitor who lands at the bottom of a
long page can orient themselves without scrolling back up. Both use a
click-to-load facade, so the embeds cost nothing on first paint and Google
cookies are only set if the visitor asks for the map. Each loads on button click
or after ~1 s of hover (desktop only), has a `noscript` fallback with a
directions link, and reveals itself even if the iframe's `load` event never
fires. The two instances are wired independently — a failure in one cannot
affect the other.

Replace the `q=` query in `js/main.js` with a place-ID embed URL once the
clinic's Google Business Profile is verified; both maps read from that one
constant.

> **Change before launch:** `analytics.namespace` is `chc-denison-tx`, which is
> public and shared. Set it to something unique to the clinic, otherwise your
> numbers will mix with anyone else who picks the same name.

---

## 3. Libraries (all current CDNs, integrity-pinned where available)

| Library | Version |
|---|---|
| Bootstrap | 5.3.8 |
| Font Awesome | 6.7.2 |
| Fancybox (`@fancyapps/ui`) | 5.0.36 |
| Toastify JS | 1.12.0 |
| GSAP + ScrollTrigger | 3.13.0 |
| canvas-confetti | 1.9.3 |
| Lenis smooth scroll | 1.1.18 (optional enhancement) |
| Google Fonts | Manrope + Inter |

> **GSAP SplitText is not used.** It is a paid Club GreenSock plugin and would
> 404 from a public CDN. The hero headline uses a hand-rolled word-mask split in
> `main.js` (`[data-split-words]`) that produces the same effect with zero
> licensing risk.

---

## 4. Before you go live — required checks

These come straight from the content master's pre-publication checklist:

1. **Photography** — Dr. Latif's portrait is now the supplied image (done).
   The remaining environmental photos in the gallery are licensed stock and
   should be replaced with approved clinic photography as it becomes available.
2. **Clinical copy & credentials** — review all medical copy, board
   certifications and the StatPearls editorial role with Dr. Latif.
3. **Phone, suite number, Saturday hours** — confirm against current office records.
4. **Insurance & new-patient status** — confirm, then update the FAQ and chatbot answers.
5. **Form endpoint** — add a HIPAA-appropriate handler and set:
   ```html
   <script>window.CHC.forms = { endpoint: "https://…" };</script>
   ```
   Until then the form will **not** claim success; it hands the visitor a phone
   number and a pre-filled email. This is deliberate — the content master says
   never claim a submission succeeded before the server confirms receipt.
6. **Patient portal** — verify the eCW URL and label it as an external system (already done).
7. **Privacy & accessibility policies** — the footer links currently point at
   `#contact`; wire them to real policy pages.
8. **Social profiles** — the footer and `sameAs` schema point at generic
   facebook.com / instagram.com / linkedin.com placeholders.
9. **Google Maps embed** — working, but it uses the query-based embed. Swap in
   the official place-ID embed URL (Maps → Share → Embed a map) once the Google
   Business Profile is verified, so the pin lands on the suite, not the plaza.
10. **Analytics** — set `analytics.namespace` to a unique value and
    `analytics.conversionId` to your Google Ads conversion ID.
11. **Sitemap** — uncomment routes only as they actually ship.

---

## 5. Customising

**Business data** (phone, hours, address, portal URL) lives in `js/config.js`
*and* in the visible markup. Keep both in sync — the JS copy drives the chatbot,
directions links and WhatsApp deep link; the markup copy is what crawlers read.

**Chatbot** — add a node to `CHC.chatbot.nodes` and a matching entry in
`TOPIC_MAP` (for interest scoring) and `KEYWORDS` (for free-text matching). The
engine renders messages, typing delays and chips automatically.

**Colours** — every one is a `:root` token. Changing `--green` re-themes buttons,
chips, icons, timeline dots and glass highlights in one edit.

**Motion** — add `data-reveal="left"` (or `up`, `right`, `scale`, `blur`,
`rotate`) plus optional `data-reveal-delay="0.2"` to any element. Wrap children in
`data-reveal-group` for a staggered entrance.

---

## 6. Verified test results

Run against headless Chromium at 1440×950, 1280×900, 1024×800 and 390×844:

- 0 console errors, 0 page errors, 0 failed network requests.
- Exactly 1 `<h1>`; valid JSON-LD.
- Countdown, live "open now" status, today-row highlight, year stamp: all live.
- Fancybox opens images **and** the video; keyboard `Escape` closes.
- Chatbot: greeting → book → … → free-text keyword match → terminal sign-off
  message rendered verbatim; input disabled; call/SMS/email chips revealed.
- Form: blocks empty submit, accepts a valid submit, and (with no endpoint)
  offers the honest fallback instead of a false success.
- No horizontal overflow at 390 / 768 / 1024 / 1280 / 1440 px.
- Visitor counter: live `200` from Abacus, painted into all three locations,
  one hit per session (verified: repeat loads call `get`, not `hit`).
- Call tracking: click raises the displayed count in the hero, panel, contact
  card and footer, and issues `hit/chc-denison-tx/calls` (`200`); navigation
  guard keeps the dialer responsive.
- Counters verified in all four placements at 390 / 768 / 1280 / 1440 px.
- Offline simulation (counter host blocked): falls back to the local ledger,
  swaps to the amber notice, still renders real numbers — no dashes left on
  screen and no false site-wide claim.
- Nav overflow guard: nine items + CTA fit down to 1200 px; below that the
  glass drawer takes over automatically.
- Google Maps: **both** instances verified — facade → iframe swap, `is-loaded`
  state, directions link in the `noscript` fallback.
- Portrait crops: all four containers render without cropping the face at
  390 / 768 / 1440 px.

---

*Built November 2026. Medical information on this site is educational only and
does not replace individualised medical advice. In an emergency, call 911.*
