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

### Current photography

Sourced from Pexels (free commercial licence, no attribution required) and
downloaded locally so the site is self-contained, fast, and works offline for
client presentation. Each file is already cropped and compressed to the size
it is displayed at (~800 KB total for all 14 images).

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

## Content that still needs to be supplied

Nothing on the site was invented. Where the specification did not provide copy,
a marked, replaceable slot was built instead.

### 1. FAQ answers — 6 of 7 outstanding

Only *"What is SAPOTR?"* has a supplied answer. The other six panels contain:

> *Answer to be supplied by SAPOTR.*

Find them in `index.html` via `data-content-slot="faq-answer"` and replace the
`<p class="acc__pending" …>` with a normal `<p>`.

### 2. Customer stories — placeholder

The written specification supplies no testimonial copy. The three stories
currently shown are **transcribed from the client's own reference mock-up** so
the section can be presented; they are not real, approved customer quotes.

They live in one array — `TESTIMONIALS` in [`js/main.js`](js/main.js).

Avatars are deliberately **initials, not photographs**, so no real person's
likeness is attached to unapproved words.

To show empty marked slots instead of the reference copy, flip one line:

```js
var TESTIMONIAL_MODE = 'blank';   // 'reference' (default) | 'blank'
```

**Replace these with real, approved testimonials before launch.**

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
