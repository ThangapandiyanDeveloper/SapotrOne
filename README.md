# SAPOTR — Homepage

Static marketing homepage for Sapotr, a direct on-demand workforce platform.

**Stack:** HTML5 + CSS3 + vanilla JavaScript. No frameworks, no build step, no
backend. Open `index.html` in a browser and it runs.

---

## Structure

```
index.html            All markup + the inline SVG icon sprite
css/styles.css        Design tokens, components, every section
css/responsive.css    Breakpoint layouts (1440 / 1280 / 1100 / 1024 / 900 / 768 / 640 / 430 / 360)
js/images.js          Centralised image configuration  <- edit this to move to Cloudinary
js/animations.js      Scroll reveals, count-up, chat playback, journey progress
js/main.js            Nav, journey, carousels, accordion, final booking CTA
assets/logos/         Supplied logo + prepared (trimmed) versions
assets/images/        Photography
```

---

## Swapping the images for Cloudinary

Every photo on the site is referenced by a **key**, not a URL. Markup looks like:

```html
<img data-img="heroEmployee" alt="...">
```

All URLs live in one object — `IMAGE_URLS` in [`js/images.js`](js/images.js).
To move to Cloudinary, replace the values and change nothing else:

```js
var IMAGE_URLS = {
  heroEmployee: 'https://res.cloudinary.com/<cloud>/image/upload/.../hero-employee.jpg',
  ...
};
```

`data-img-bg="key"` is also supported for background images if needed later.

The hero image is additionally listed in a `<link rel="preload">` in `<head>`
so it starts downloading immediately — update that one line too.

`window.IMAGE_ASSETS` is an alias of the same object, if you prefer that name.

### Current photography

Sourced from Pexels (free commercial licence, no attribution required) and
downloaded locally so the site is self-contained, fast, and works offline for
client presentation. Each file is already cropped and compressed to the size
it is displayed at (~1.1 MB total for all 18 images).

The three customer-story avatars were additionally face-cropped so they stay
readable at 50 px.

### The FAQ illustration

`assets/images/faq-illustration.svg` — an unDraw illustration (free for
commercial use, no attribution required), **recoloured to the Sapotr palette**:
the question mark takes brand yellow `#FFC107`, figures take navy `#0F1738` and
`#1E2A55`, light shapes white, faint lines `#E5E8F1`. Natural skin tones were
left alone.

It is an SVG, so it scales without pixelation and weighs ~12 KB. It is wired
through the same `IMAGE_URLS` config (`faqIllustration`), so swapping in a
Cloudinary URL is a one-line change like every other image.

## The hero (`#hero`)

Full-bleed workforce photography under a layered navy scrim. The staff sit in
the **lower band** and frame the centred message, so no text ever lands on a
face — that positioning is the whole trick and it is why
`background-position` differs per breakpoint.

Layers, back to front:

| Layer | Role |
|---|---|
| `.hero__bg` → `.hero__bg-img` | the photograph. Outer element takes the pointer/scroll parallax, inner takes the entrance zoom, so the two transforms never fight |
| `.hero__scrim` | readability gradient — dense where the copy sits, opening up over the staff, then closing to near-solid navy at the very bottom so the bodies dissolve instead of being sliced by the section edge |
| `.hero__aura` | two slow brand orbs (yellow / cyan) on 28–34s loops |
| `.hero__mesh` | faint white grid, masked to the copy area |

**Entrance:** the photo fades in and settles from `scale(1.05)` over 1.6s;
copy follows through the existing `.reveal` system at 180 / 300 / 430 / 550 /
670ms; the `Just Tap.` underline draws in at 1.25s. `.hero__accent` uses
`display:table` so it keeps its own line *and* shrink-wraps, which lets the
gradient underline match the words exactly.

**Image:** `assets/images/hero-workforce.jpg`, keyed as `heroBackground` in
`IMAGE_URLS` and applied with the project's existing `data-img-bg` mechanism —
one place to swap for a Cloudinary URL. The source is portrait (1560×2339),
which is what makes the mobile crop work; it was re-encoded to 274 KB because
the scrim hides the compression. Cloudinary's `f_auto,q_auto` plus responsive
widths would cut that further.

**Responsive crops** — the copy block is tall on narrow screens, so the zoom
increases as the viewport narrows to keep faces below the text rather than
behind it:

| Breakpoint | `background-size` / `position` |
|---|---|
| desktop | `cover` / `50% 16%` — three staff across the lower band |
| ≤1024 | `cover` / `50% 14%` |
| ≤768 | `165% auto` / `50% 2%` |
| ≤640 | `285% auto` / `50% 0%` — two faces below the CTA |
| ≤360 | `345% auto` |

**Reduced motion** disables the zoom, the orb drift, the underline draw, the
button sheen and the parallax; the hero stays fully usable.

### The removed hero showcase

The old `#stage` product showcase is gone for good, and so is everything that
belonged to it: its CSS (`.stage*`, `.phone`/`.app__*`, `.emp-badge`,
`.chip-card`, `.map--mini` — 226 lines), its `stageBackdrop` and
`heroEmployee` image keys, and its two orphaned photos. `initStage()` was
generalised into `initParallax(root)`, now shared by the hero and the final
CTA, so there is one parallax implementation rather than two. The base
`.map*` rules stayed — the "How It Works" step-2 map still uses them.

---

## The final CTA (`#book`)

Rebuilt as an immersive navy panel rather than a white form card inside a
dark box. Layout is CSS grid areas, which is what lets the same markup
recompose without duplication:

```
desktop:  'copy art'   ≤1024:  'copy'
          'sel  sel'           'art'
          'cta  cta'           'sel'
                               'cta'
```

- **Atmosphere** — three blurred brand orbs (yellow / cyan / a faint red)
  drifting on 26–38s loops inside `.final__sky`, which is clipped to the
  panel, plus a masked grid echoing the hero.
- **Visual** — `assets/images/cta-employee.jpg`, keyed as `finalCtaEmployee`
  in `IMAGE_URLS`. Enters with `.reveal--rise` (fade + rise + 0.96→1 scale),
  then floats very slowly. Three floating labels use only existing service
  names and icons; they are hidden below 768px.
- **Service choice** — the five options are glass chips on the navy, not form
  buttons. Hover lifts and scales them and warms the icon to yellow; the
  chosen one takes a yellow border, tint, filled icon tile and a check badge,
  and the rest ease back to 60% opacity via
  `.booker__grid:has([aria-checked="true"])`. Where `:has()` is unsupported
  the others simply stay at full opacity — the selected chip is still
  unmistakable, so nothing breaks.
- **Action** — `Try Now` sits muted-translucent until a service is chosen,
  then becomes the full yellow button reading `Book an Employee`.

**The JavaScript was not modified.** `initBooker()` in `js/main.js` still
drives everything through the same hooks: `#booker-q`, `#booker-grid`,
`.booker__opt[data-service]`, `#booker-pick`, `#booker-cta`,
`#booker-cta-txt`, the `.is-idle` toggle and the `.is-nudge` shake. Roving
tabindex and arrow-key selection are unchanged, and every option is still a
real `<button role="radio">`.

---

## Logo assets

The supplied files (`SapotrLogo.png`, `SapotrLogoBrandname.png`) are **1600 × 1600
JPEGs with a solid white background** — the artwork occupies only the middle of
the canvas, so used directly it renders tiny and shows a white box on dark
sections.

Two prepared versions are used on the site. The artwork is untouched — only the
surrounding white canvas was trimmed and made transparent (the white sliver
*inside* the mark is preserved):

| File | Content box | Used for |
|---|---|---|
| `sapotr-wordmark.png` | 1149 × 273 | Navigation, app mock-up, footer |
| `sapotr-mark.png` | 872 × 686 | Favicon, chat avatar, watermark, icon-only spots |

The originals are kept in `assets/logos/` for reference.

Because the wordmark's "Sapotr" text is navy, it is placed on a **white plate**
in the navy footer rather than recoloured. The multicolour mark is used
directly on navy, where it reads correctly.

---

## Content — what is written and what still needs sign-off

### FAQ answers

All seven questions carry the **client-approved answer copy** supplied in the
change request. The wording is deliberately non-committal — it describes how
the booking process works without stating booking limits, fees, refund terms,
verification procedures or availability guarantees.

Answers live inline in the FAQ section of `index.html`, one `<p>` per
`.acc__panel`. There are no placeholder answers left anywhere on the page.

### Customer stories — still placeholder copy

The written specification supplies no testimonial copy. The three stories shown
are **transcribed from the client's own reference mock-up** so the section can be
presented; they are not real, approved customer quotes.

They live in one array — `TESTIMONIALS` in [`js/main.js`](js/main.js).

To show empty marked slots instead of the reference copy, flip one line:

```js
var TESTIMONIAL_MODE = 'blank';   // 'reference' (default) | 'blank'
```

**Replace these with real, approved testimonials before launch.** The profile
photographs are stock images standing in for real customers and should be
replaced at the same time.

---

## Pages not yet built

The homepage was the scope of this build. The specification also calls for:

- **For Businesses** — "duplicate the home page with a bit of content change"
- **For Employee Partners** — separate content page
- **Support** — contact page

Until those exist, the three centre nav links point at the closest homepage
anchors (`#why`, `#partners`, `#support`) so nothing is a dead link. Footer
links to pages that do not exist yet (About Us, Careers, Blog, Privacy Policy,
Terms & Conditions, Become a Partner, Partner Login, Help Centre) are `href="#"`
placeholders.

---

## Behaviour notes

- **The hero showcase is a layered scene** — a real venue behind the Employee
  Partner, the Sapotr app and the live status cards. Layers drift a few pixels
  with the cursor and on scroll (`initStage` in `js/animations.js`). Pointer
  motion only runs on devices that have a pointer.
- **Step 3 of the journey is a small product interaction** — when "Assign"
  becomes the active step, *Employee arrived → Share this OTP 8273 → Verified ·
  Work assigned* animate in sequence.
- **"Book an Employee" is front-end only.** No backend, no booking is processed.
- The final CTA is a booking-style interaction: choosing a service turns the
  **Try Now** button into **Book an Employee**. Nothing is submitted.
- The service rail auto-scrolls, pausing on hover, focus or when off screen.
- The booking journey auto-advances and stops on hover, focus or click.
- Statistics count up once when scrolled into view. The numbers themselves are
  exactly as specified (260+, 110+, 450+, 1100+, 700+).
- Carousel arrows and dots hide themselves when every card already fits.

## Accessibility

Semantic landmarks and heading order, skip link, visible focus rings, keyboard
support for the accordion (native buttons + `aria-expanded`), carousels (arrow
keys) and the CTA service picker (`radiogroup` roles + arrow keys), alt text on
content images with decorative images marked `aria-hidden`/empty alt, and a
full `prefers-reduced-motion` path that shows all content immediately and stops
every animation.

## Browser support

Current Chrome, Edge, Firefox and Safari. Uses `IntersectionObserver`
(with fallbacks that simply show content), CSS custom properties, grid and
`aspect-ratio`.
