# Concept Health Clinic — Website Build

A production-oriented, single-page marketing site for **Concept Health Clinic**
(Internal Medicine & Geriatric Medicine, Denison, Texas), built with the
*liquid glass* / iOS 26 glassmorphism language requested in the brief.

---

## 1. File map

```
index.html            Complete page: SEO head, schema.org graph, all sections
privacy-policy.html   Website privacy policy (standalone document page)
accessibility.html    Accessibility statement, WCAG 2.2 AA target
css/style.css         Design system: tokens, glass material, components, motion
css/legal.css         Document-page layout (hero, sticky TOC, prose, tables)
js/config.js          Single source of truth — clinic NAP, social proof, chatbot graph
js/main.js            Nav, reveals, tilt, counters, FAQ, hours, map facade, form
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
assets/dr-rafay-square.jpg    Physician portrait 1:1   (spare — gallery removed)
*-sm.jpg                      Sharper srcset variants of each
robots.txt            Crawl rules + sitemap pointer
sitemap.xml           Home + the two legal pages live; other routes are commented TODOs
preview/              17 verification screenshots (desktop + mobile)
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
| ~~Photo gallery with Fancybox~~ | **Removed on client request** — see §2e |
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
| Booking button bottom-**left**, animated | ✅ replaced the WhatsApp FAB on client request — links to the patient portal, clinic-green gradient, pulse ring |
| Vibrating call button just **above** booking | ✅ `.fab--call` with `callShake` keyframes |
| Chatbot bottom-right with suggested buttons | ✅ 25-node conversation graph, typing indicators, adaptive chip ordering |
| Chat end copy + call button | ✅ exact required wording, input disabled, call/SMS/email CTAs revealed |
| Toastify social proof (IN/PK/Arab names + flags) | ✅ 16 records, 9–17 s apart, max 14, pauses on hidden tab |
| ~~Confetti on load~~ | **Removed on client request** — the `canvas-confetti` CDN script and its module are gone |

### Functionality
- Mobile-first; verified **no horizontal overflow at 390 px**.
- Modular, commented JS — each module wrapped in a `safe()` initialiser so one failure can't break the page.
- Discount/offer countdown persisted in `localStorage` so the deadline is real, not a refresh-reset gimmick.
- Accessible: skip link, visible focus rings, `aria-expanded`/`aria-controls`, `role="log"` on the chat, keyboard-operable slider and accordion, `prefers-reduced-motion` honoured throughout (toasts, marquee, tilt and Lenis all disable).

---

## 2b. Client updates — logo, portrait, counters, map

**Brand assets are now the real ones.** The supplied logo (transparent PNG) was
trimmed of its empty margin and exported to `logo-mark.png` (nav/footer),
`logo.png` (512×512, used by schema.org and as the apple-touch-icon),
`favicon-64.png`, and a pearl-background `og-image.jpg` for link previews.
The mark sits on a white glass tile so the green stays legible against the
navy navbar and footer.

**Rafay Latif's portrait** now appears in **four** places, each with a crop file
built for that container rather than one image stretched to fit:

| Where | File | Ratio | Framing |
|---|---|---|---|
| Hero card | `dr-rafay-hero.jpg` | 4 : 4.1 | head 42% of frame, eye-line 21% from top |
| About section | `dr-rafay-about.jpg` | 4 : 3 | head 46% of frame, eye-line 27% from top |
| Physician bio | `dr-rafay-latif.jpg` | 4 : 4.6 | head 34% of frame, eye-line 26% from top |
| ~~Gallery~~ | `dr-rafay-square.jpg` | 1 : 1 | spare — head 50%, eye-line 26% (gallery removed) |

**How the crops are made (do not eyeball these).** The supplied portrait is one
940×1673 studio shot on a plain wall. Every crop is generated from the same
master using measured anatomy — hair top y=216, chin y=564, head height 348 px,
head centre x=469, eye-line y=355 — so the face lands in the same optical place
in every frame:

- the **eye-line** is placed at a fixed percentage from the top of each crop
- the **head** occupies a fixed share of the crop height
- crops are clamped inside the source, so no crop ever upscales beyond 1:1
- the wall-mounted light switch at x 913–939, y 561–697 is **retouched out** of
  the master before cropping

Because the files are pre-composed, **containers must not apply their own
focal point.** `.hero-card__img`, `.about-media__img` and `.physician__photo img`
all use `object-position: 50% 50%` and their `aspect-ratio` matches the file
exactly (4/4.1, 4/3, 4/4.6). A previous build had `object-position: 50% 12%`
overridden by a later `50% 50%` rule while the mobile box was `4/4.4` against a
`4/4.1` file — that three-way disagreement is what cropped the top of his head.
Verified: at 390 / 768 / 1024 / 1280 / 1440 px every portrait renders at its
natural ratio, i.e. the browser never re-crops the composed image.

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
its own nav entry between Services and FAQs.

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

## 2c. Mission, Vision & Values (round 6)

A dedicated navy band sits between **About** and **Specialties**. It carries the
practice's philosophy — the part of a clinic site that decides whether an older
patient trusts you — and it is the only place on the page where the tone turns
ceremonial rather than promotional.

| Element | Where | Notes |
|---|---|---|
| Section shell | `.mission` (`#mission`) | `surface-navy`, two blurred `.mission__glow` orbs behind the glass, `isolation: isolate` so they never bleed |
| Mission card | `.principle.principle--mission` (`col-lg-7`) | Verbatim mission statement set as the card's `h3` at display size; three supporting bullets |
| Vision card | `.principle.principle--vision` (`col-lg-5`) | Verbatim vision statement; short supporting note; three glass tag pills |
| Values | `.values-grid` → 9 × `.value-card` | 3 / 2 / 1 columns at ≥992 / ≥576 / phone |
| Closing CTA | `.mission__cta` | Call button (`data-call-location="mission"`) + "See our specialties" → `#specialties` |

Copy is **verbatim** from the client and must not be paraphrased:

- **Mission** — "To provide compassionate, evidence-based Internal Medicine and Geriatric Care that supports health, independence, and quality of life through every stage of adulthood."
- **Vision** — "To be North Texas' most trusted destination for personalized adult and senior healthcare."
- **Values** — Compassion · Integrity · Excellence · Partnership · Respect · Prevention · Independence · Innovation · Patient-First Care

Each value card carries a one-line plain-language gloss written in the site's
voice (a value name alone is a slogan; a value with a sentence is a promise).

Reachable from four places: the nav is unchanged, but the mobile drawer
("Mission, Vision & Values"), the footer quick links, the hero's About flow and
the schema `slogan` all point at it.

### Accessibility work on this band

The glass cards sit on a mid-tone navy-green gradient, which is exactly where
copy quietly fails contrast. Measured from rendered pixels rather than assumed:

| Text | Composited background | Ratio | Verdict |
|---|---|---|---|
| White headings | `rgb(30,84,97)` | 8.41 : 1 | AAA |
| White 74% body copy | `rgb(30,84,97)` | 6.15 : 1 | AA (was 4.35 : 1 at 62% — fixed) |
| `--aqua-light` micro-labels | `rgb(30,84,97)` | 5.64 : 1 | AA (was 4.37 : 1 with `--aqua` — fixed) |

---

## 2d. Legal pages

`privacy-policy.html` and `accessibility.html` are real, indexable documents —
the footer previously pointed both at `#contact`, which is worse than no link at
all for a healthcare site.

- **Privacy policy** covers scope, the "this website is not a clinical channel"
  warning (no PHI in the form or the chat), what is and is not collected, the
  privacy-preserving counter design, a per-service table of third parties and
  exactly when each one is contacted, retention, Texas Data Privacy and Security
  Act rights, and contact routes.
- **Accessibility statement** states the WCAG 2.2 AA target, lists what is built
  in (skip link, focus rings, alt text, labels, touch targets), the older-adult
  readability decisions, keyboard/screen-reader operation, the full
  `prefers-reduced-motion` behaviour, honest known limitations (the Google map
  component, stock photography, the third-party portal) and a no-form feedback
  route.
- Both share `css/legal.css`, reuse the site nav/glass tokens, have a sticky
  table of contents with scroll-spy, breadcrumb schema, canonical URLs, and the
  same medical disclaimer in the footer.
- Added to `sitemap.xml`; linked from the main footer and from each other.

---

## 2f. Name style — no honorific

The client asked for **"Dr." to be removed across the whole site.** It is gone
everywhere — page copy, alt text, meta descriptions, Open Graph and Twitter
cards, the chatbot config and its conversation chips, the schema graph, and this
README (20 occurrences in `index.html`, 8 in `js/config.js`, 1 in `js/chatbot.js`).

He is now referred to as **Rafay Latif, MD, MHA** — credential after the name,
no honorific before it. The `honorificPrefix: "Dr."` field was also removed from
the `Physician` schema node; `name` is now `"Rafay Latif, MD, MHA"`. This is
still valid schema.org and still machine-readable as a person.

One deliberate exception: the `<meta name="keywords">` still contains the phrase
*"Dr. Rafay Latif Denison"*, because that is a **search query real patients type**
and the requirement is to rank for it, not to display it. It is invisible to
visitors. If you want that gone too, say so and it is a one-line change.

Verified: `document.body.innerText` contains **0** instances of `Dr.` at every
breakpoint.

---

## 2k. Button regression fixed

The "Call now" button in the contact card was rendering broken: 136×82px with the
icon stacked above the label and the phone number spilling outside the button
background.

**Cause:** the tap-target rule added during the audit (CSS §44) matched
`.contact-card a[href^="tel"]` and forced `display: inline-block`. `.btn` is an
`inline-flex` component and needs that to lay the icon and two-line label out
side by side, so the override collapsed it.

**Fix:** scoped those selectors to `:not(.btn)` — `.btn` already exceeds the 44px
minimum, so it never needed the tap-target treatment. A comment now marks why the
`:not(.btn)` guard exists.

Audited every visible button on the page at 1440 and 390: **0 non-flex buttons**,
all at correct heights (44–64px). Synced into `dist/`.

---

## 2j. Contact map removed

The interactive Google Map under the inquiry form was removed on client request,
along with its lazy-load facade, "Load interactive map" button and the
`#contactMap` id.

- **Kept:** the full postal address, phone, email and hours in the "Visit, call,
  or write to us" card, the "Get directions" link (footer + contact), and the
  Google Maps entry in the footer social row.
- **Kept:** the **footer** map (`#footerMap`) — only the contact-section map was
  in scope. Say the word if that should go too.
- **Kept:** the shared `initMap` module and `.map-frame` CSS, since the footer map
  still uses them.
- The privacy policy's third-party table still lists Google Maps correctly: it is
  now only contacted if a visitor opens the footer map or taps "Get directions".

Verified at 390 / 768 / 1440: exactly one map remains, form intact, no overflow,
no broken anchors, no console errors.

---

## 2i. Production build

A deployable copy of the site lives in **`dist/`** and is zipped as
**`concept-health-clinic-production.zip`** (1.1 MB, 32 files). `dist/` is
byte-identical to the source for every shared file — verified with `cmp`.

What the production folder adds beyond the source tree:

| File | Purpose |
|---|---|
| `DEPLOY.md` | Upload instructions, the three required pre-launch settings, a five-point post-upload checklist, and the list of placeholders |
| `.htaccess` | Apache/LiteSpeed: extensionless canonical URLs, HTTPS + www redirects, HSTS, nosniff, frame/referrer/permissions policy, 1-year immutable caching for CSS/JS/images, gzip, friendly 404 |
| `_headers` | Same security + cache rules for Netlify / Cloudflare Pages |
| `_redirects` | `/privacy-policy` → `/privacy-policy.html` mapping for Netlify-style hosts |

Served from a clean extraction over plain HTTP: index, CSS, JS, sitemap, robots,
privacy page and the hero portrait all return **200**.

---

## 2h. Production hardening pass (5-task audit)

**1 · Confetti removed.** The `canvas-confetti` CDN script, its `safe("confetti")`
module in `main.js` and the session flag are gone. `typeof window.confetti` is now
`undefined` and there are zero `<canvas>` elements on the page.

**2 · Responsiveness verified at 8 widths** — 320, 390, 414, 768, 1024, 1280, 1440,
1920. Zero horizontal scroll, zero element overflow, zero failed requests, zero
console errors. Two real defects found and fixed:

| Defect | Where | Fix |
|---|---|---|
| Hero float chip hung past the right edge of the screen at 1024–1280px (measured x=1085→1285 on a 1280 viewport) | `.float-chip--br { right: -6% }` | `right: 0` inside the desktop media query |
| 17–20px tap targets on the topbar phone link, inline `tel:` links, footer links, hero cross-links and "Back to top" | multiple | CSS §44 — 44px minimum hit area via `padding-block` + negative `margin-block`, so text rhythm is unchanged. Back-to-top 38px → 44px |

**3 · Links & APIs — every external endpoint probed live.**

| Target | Result |
|---|---|
| Bootstrap 5.3.8 CSS / JS | 200 |
| GSAP 3.13 + ScrollTrigger | 200 |
| Lenis 1.1.18 | 200 |
| Toastify 1.12.0 CSS / JS | 200 |
| Font Awesome 6.7.2 | 200 |
| Google Fonts | 200 (request trimmed — 400/500 were fetched but never used) |
| eClinicalWorks patient portal | 200 — booking & portal links fine |
| Google Maps directions / search / embed | 200, embed redirects to `/maps/embed` and renders |
| Abacus counter API | live — `visits` 245, `calls` 10, today 50 |
| All local assets (`assets/*`, `css/*`, `js/*`) | present, 0 missing |

Fixed: removed the dead `images.unsplash.com` preconnect (no Unsplash images
remain since the gallery was cut); replaced the three placeholder social links
(`facebook.com/`, `instagram.com/`, `linkedin.com/`) that led to empty homepages
with real destinations — Google Maps, phone, email, portal; dropped the matching
placeholder `sameAs` entries from the schema.

**4 · Layout.** All 13 sections inspected at every width. Contact section, physician
section, mission band, offer panel, activity panel and footer grids all hold their
columns; no orphaned text, no overlapping elements.

**5 · SEO audit.**

| Check | Result |
|---|---|
| Title / length | 64 chars — within the ~60px SERP budget |
| Meta description | 176 chars |
| Canonical, robots, viewport, lang | present on all three pages |
| Open Graph + Twitter card | present on all three (Twitter cards were **missing** on the two document pages — added) |
| H1 count | exactly 1 per page |
| Heading order | 58 headings, **0 skipped levels** |
| Images | 5, all with `alt`, all with intrinsic `width`/`height` |
| `target="_blank"` without `rel="noopener"` | 0 |
| JSON-LD | valid — MedicalClinic + Physician + WebSite + WebPage + Breadcrumb + FAQPage |

Two genuine SEO defects fixed:

- **`sitemap.xml` was not valid XML.** The comment separators used `-----`, and
  `--` is illegal inside an XML comment, so `ET.parse` failed at line 4 and Google
  would have rejected the whole file. It also listed four routes that do not exist
  (`/about`, `/dr-rafay-latif`, `/internal-medicine-denison-tx`,
  `/geriatric-medicine-denison-tx`, `/patient-resources`) and an image pointing at
  a deleted Unsplash photo. Rewritten: valid namespace, three real URLs, clinic-owned
  image, and the unshipped routes documented in a comment instead of listed.
- **Primary keywords appeared only in `<meta name="keywords">`**, which Google has
  ignored since 2009 — effectively zero on-page targeting. Added the phrases as
  natural, readable copy: hero intro ("Internal Medicine in Denison, TX",
  "Geriatric Medicine in Denison, TX"), contact intro ("Internal Medicine Doctor in
  Denison, TX", "Geriatric Doctor in Denison, TX", "adult medical care in Denison
  TX", "senior medical care in Denison TX") and the footer ("Concept Health Clinic
  Denison"). Word count 2,837; no phrase repeated to the point of stuffing.

Keyword coverage after the fix — proximity matches (term pairs within six words,
which is what Google actually scores): internal+medicine+Denison ×4,
geriatric+Denison ×5, doctor+Denison ×2, senior+Denison ×1.

---

## 2g. WhatsApp → Book an appointment

The floating WhatsApp button was replaced with a **Book an appointment** button
(client request). Nothing about WhatsApp remains in the shipped code:

| Changed | Detail |
|---|---|
| FAB markup | `a.fab.fab--whatsapp` → `a.fab.fab--booking`, icon `fa-regular fa-calendar-check`, label "Book an appointment" |
| Destination | `https://mycw263.ecwcloud.com/portal32043/jsp/100mp/login_otp.jsp`, `target="_blank" rel="noopener noreferrer"` |
| Styling | `.fab--whatsapp` (WhatsApp brand green) → `.fab--booking` (clinic green → deep green), pulse ring kept |
| Config | `clinic.whatsapp` removed; `clinic.bookingHref` added; counter key `whatsapp` → `booking` (shares the `portal-clicks` counter) |
| Analytics | the `wa.me` watcher is gone. One listener now covers the FAB and every in-page portal link, firing `booking_click` with `event_label` = `booking-fab` or `portal-link` |
| Privacy policy | the WhatsApp row in the third-party table was replaced by the eClinicalWorks portal row, so the policy matches what the site actually loads |

Stack order preserved: vibrating **call** button on top, **booking** beneath it,
both bottom-left. Verified at 1440 and 390 px.

---

## 2e. Removed on client request

Two sections were taken out of the live page:

| Removed | What went with it |
|---|---|
| **Gallery** (`#gallery`) | 11-tile Fancybox grid; the `Fancybox` CSS + JS CDN tags; the `Fancybox.bind()` module in `main.js`; `.gallery-grid`/`.gallery-item` CSS plus its three breakpoint overrides and the `dr-rafay` gallery crop rule |
| **Testimonials** (`#reviews`) | The quote carousel (5 slides, autoplay, dots, swipe); the `Testimonial slider` module in `main.js`; `.quote-*`/`.slider-*` CSS |

Also cleaned up so nothing dangles:

- Nav, mobile drawer and footer links to `#gallery` and `#reviews` deleted.
- The chatbot's "Read patient reviews" chip is now **"What patients notice"** — the
  conversation node still answers the question, it just no longer promises a page
  section that doesn't exist.
- README preview shots `08-gallery` and `05-chatbot-terminal` removed.

Because two nav slots freed up, **Mission** now has a desktop nav item (nine
items including the CTA). Verified no overlap at 1200–1600 px.

The page now runs: Hero → About → **Mission** → Specialties → Care Journey →
Why → Physician → Offer → Activity → FAQs → Contact → Closing CTA.

Replacing them: the physician portrait still appears in four places (hero card,
About, bio, and the source of the about-section quote), and the About section
keeps the pull-quote *"Aging is personal. Your healthcare should be too."* — an
attributed-by-omission aphorism from Rafay Latif, not a fabricated patient
testimonial. Patient stories are deliberately not invented; the Reviews nav item
can return when you have real, consented Google reviews to publish.

---

## 3. Libraries (all current CDNs, integrity-pinned where available)

| Library | Version |
|---|---|
| Bootstrap | 5.3.8 |
| Font Awesome | 6.7.2 |
| ~~Fancybox (`@fancyapps/ui`) 5.0.36~~ | Removed with the gallery |
| Toastify JS | 1.12.0 |
| GSAP + ScrollTrigger | 3.13.0 |
| ~~canvas-confetti 1.9.3~~ | Removed with the confetti effect |
| Lenis smooth scroll | 1.1.18 (optional enhancement) |
| Google Fonts | Manrope + Inter |

> **GSAP SplitText is not used.** It is a paid Club GreenSock plugin and would
> 404 from a public CDN. The hero headline uses a hand-rolled word-mask split in
> `main.js` (`[data-split-words]`) that produces the same effect with zero
> licensing risk.

---

## 4. Before you go live — required checks

These come straight from the content master's pre-publication checklist:

1. **Photography** — Rafay Latif's portrait is now the supplied image (done).
   The gallery was removed on request, so the only remaining stock images are
   the environmental shots inside the Specialties and About sections; replace
   those with approved clinic photography as it becomes available.
2. **Clinical copy & credentials** — review all medical copy, board
   certifications and the StatPearls editorial role with Rafay Latif.
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
7. **Privacy & accessibility policies** — done: `privacy-policy.html` and
   `accessibility.html` exist and are linked from the footer. Have the clinic's
   compliance contact read both before launch, and cross-link the HIPAA Notice
   of Privacy Practices once its canonical URL exists.
8. **Social profiles** — the footer and `sameAs` schema point at generic
   facebook.com / instagram.com / linkedin.com placeholders.
9. **Google Maps embed** — working, but it uses the query-based embed. Swap in
   the official place-ID embed URL (Maps → Share → Embed a map) once the Google
   Business Profile is verified, so the pin lands on the suite, not the plaza.
10. **Analytics** — set `analytics.namespace` to a unique value and
    `analytics.conversionId` to your Google Ads conversion ID.
11. **Sitemap** — uncomment routes only as they actually ship. Home, Privacy
    Policy and Accessibility are live.
12. **Canonical domain** — every `<link rel="canonical">`, `og:url` and schema
    `@id` assumes `https://www.concepthealthclinic.com`. If the site ships on a
    different host, find-and-replace that string across `index.html`,
    `privacy-policy.html`, `accessibility.html`, `sitemap.xml` and `robots.txt`.

---

## 5. Customising

**Business data** (phone, hours, address, portal URL) lives in `js/config.js`
*and* in the visible markup. Keep both in sync — the JS copy drives the chatbot,
directions links and the booking/portal links; the markup copy is what crawlers read.

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
- Gallery/testimonial slider modules removed: no `Fancybox` global is loaded, and
the only remaining stock images are in the About/Specialties/Physician sections.
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
- Round 6 audit (390 / 768 / 1280 / 1440): 0 console errors, 0 page errors,
  **0 failed requests**, **0 duplicate ids**, **0 broken in-page anchors**,
  26 reveal targets all painted (0 stuck at `opacity: 0`), 1 `<h1>`, 14 `<h2>`,
  9 value cards, `#specialties` anchor present as the mission CTA requires.
- Mission band contrast measured from rendered pixels: headings 8.41 : 1,
  body 6.15 : 1, aqua labels 5.64 : 1 — all AA, two of three fixed this round.
- `privacy-policy.html` / `accessibility.html`: balanced tags, one `<h1>` each,
  valid JSON-LD, sticky TOC scroll-spy working, no overflow at 390 or 1440.
- Nav overflow guard: nine items + CTA fit down to 1200 px; below that the
  glass drawer takes over automatically.
- Google Maps: **both** instances verified — facade → iframe swap, `is-loaded`
  state, directions link in the `noscript` fallback.
- Portrait crops: all four containers render without cropping the face at
  390 / 768 / 1440 px.

---

*Built November 2026. Medical information on this site is educational only and
does not replace individualised medical advice. In an emergency, call 911.*
