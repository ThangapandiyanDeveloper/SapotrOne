/* ============================================================
   SAPOTR — INTERACTIONS
   Navigation, booking journey, the industry rail, stories,
   FAQ accordion, final booking CTA. Vanilla JS only.
   ============================================================ */
(function (window, document) {
  'use strict';

  var reduced = (window.SapotrAnim && window.SapotrAnim.reduced) || { matches: false };
  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }

  /* ==========================================================
     CUSTOMER STORIES — CONTENT (section 7)
     ----------------------------------------------------------
     Nine client-supplied stories, used verbatim. Each carries the
     key of its own portrait (see js/images.js — nine different
     people, none of them reused from anywhere else on the site) and
     the alt text that describes who is in it.

     The section makes no claim the platform does not: these are
     presented as customer stories, not as verified reviews.
     ========================================================== */
  var TESTIMONIALS = [
    {
      title: 'Last-Minute Staff Shortage',
      quote: '“We were short-staffed at the last minute. I opened SAPOTR, booked someone nearby, and got the extra hands we needed.”',
      name: 'Mark D.',
      role: 'Retail Store Owner',
      location: 'Auckland, New Zealand',
      photo: 'storyMarkD',
      alt: 'Mark D., retail store owner in Auckland'
    },
    {
      title: 'No More Calling Around',
      quote: '“I usually spend so much time calling around and waiting for replies. This time, I booked staff directly through SAPOTR and got back to running my business.”',
      name: 'Sarah T.',
      role: 'Restaurant Manager',
      location: 'Wellington, New Zealand',
      photo: 'storySarahT',
      alt: 'Sarah T., restaurant manager in Wellington'
    },
    {
      title: 'No Facebook Posts & Waiting',
      quote: '“Posting on Facebook and waiting for someone to respond takes time. With SAPOTR, I can book the staff I need directly.”',
      name: 'James L.',
      role: 'Showroom Owner',
      location: 'Christchurch, New Zealand',
      photo: 'storyJamesL',
      alt: 'James L., showroom owner in Christchurch'
    },
    {
      title: 'A Few Hours of Help',
      quote: '“Sometimes we only need extra hands for a few hours. SAPOTR gives us that flexibility without taking on another permanent employee.”',
      name: 'Priya S.',
      role: 'Café Manager',
      location: 'Hamilton, New Zealand',
      photo: 'storyPriyaS',
      alt: 'Priya S., café manager in Hamilton'
    },
    {
      title: 'Half-Day Support',
      quote: '“We needed extra help for half a day. I booked someone through SAPOTR and didn’t have to spend hours looking for people.”',
      name: 'Daniel R.',
      role: 'Hospitality Manager',
      location: 'Tauranga, New Zealand',
      photo: 'storyDanielR',
      alt: 'Daniel R., hospitality manager in Tauranga'
    },
    {
      title: 'Full-Day Booking',
      quote: '“We had a full day of extra work coming up, so we booked temporary staff through SAPOTR. It was exactly the support we needed.”',
      name: 'Emma W.',
      role: 'Event Manager',
      location: 'Queenstown, New Zealand',
      photo: 'storyEmmaW',
      alt: 'Emma W., event manager in Queenstown'
    },
    {
      title: 'Book in Advance',
      quote: '“We knew we had a busy day coming up, so I booked our extra staff in advance. It made planning much easier.”',
      name: 'Chris M.',
      role: 'Warehouse Manager',
      location: 'Palmerston North, New Zealand',
      photo: 'storyChrisM',
      alt: 'Chris M., warehouse manager in Palmerston North'
    },
    {
      title: 'Unexpected Replacement',
      quote: '“One of our staff called in sick before a busy shift. We needed someone quickly, so I booked temporary support through SAPOTR.”',
      name: 'Alex K.',
      role: 'Operations Manager',
      location: 'Dunedin, New Zealand',
      photo: 'storyAlexK',
      alt: 'Alex K., operations manager in Dunedin'
    },
    {
      title: 'My Time Was Saved',
      quote: '“I thought finding someone at the last minute would take hours. I booked through SAPOTR myself, and it saved me a lot of time.”',
      name: 'Tom B.',
      role: 'Business Owner',
      location: 'Napier, New Zealand',
      photo: 'storyTomB',
      alt: 'Tom B., business owner in Napier'
    }
  ];

  /* ==========================================================
     1. NAVIGATION
     ========================================================== */
  function initNav() {
    var nav = qs('#site-nav');
    var burger = qs('.nav__burger');
    var menu = qs('#mobile-menu');
    if (!nav) return;

    /* subtle border once the page has scrolled */
    var onScroll = function () {
      nav.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!burger || !menu) return;

    function setOpen(open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      menu.hidden = !open;
    }

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });

    /* close after choosing a destination */
    qsa('a', menu).forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        burger.focus();
      }
    });

    /* a resize back to desktop should not leave the panel open */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) setOpen(false);
    });
  }

  /* ==========================================================
     2. BOOKING JOURNEY (how it works)
     Auto-advances, pauses on interaction, click/keys to select.
     ========================================================== */
  function initJourney() {
    var journey = qs('#journey');
    if (!journey) return;

    var steps = qsa('.step', journey);
    if (!steps.length) return;

    var index = 0;
    var timer = null;
    var paused = false;
    var onScreen = false;

    /* the step pacer bar is driven by --step-dur, so the stylesheet and
       the clock below can never drift apart */
    var declared = parseInt(
      window.getComputedStyle(journey).getPropertyValue('--step-dur'), 10);
    var INTERVAL = declared > 0 ? declared : 4200;

    function setPaused(on) {
      paused = on;
      journey.classList.toggle('is-paused', on);
    }

    function show(i) {
      index = (i + steps.length) % steps.length;
      if (window.SapotrAnim) window.SapotrAnim.markJourney(index);
    }

    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }

    /* replays the active step's pacer from zero, so the bar and the
       clock always start together */
    function resetPacer() {
      var bar = qs('.step.is-active .step__prog i', journey);
      if (!bar) return;
      bar.style.animation = 'none';
      void bar.offsetWidth;            /* reflow: the next frame restarts it */
      bar.style.animation = '';
    }

    /* one timer, always — starting replaces the previous one */
    function start() {
      stop();
      resetPacer();
      if (reduced.matches || !onScreen) return;
      timer = window.setInterval(function () {
        if (!paused) show(index + 1);
      }, INTERVAL);
    }

    /* a deliberate pick gets a full turn of its own; picking the step
       that is already live leaves its turn running */
    function pick(i) {
      if (i === index) return;
      show(i);
      start();
    }

    /* letting go hands the live step a fresh full turn, so the pacer and
       the clock agree again */
    function resume() {
      setPaused(false);
      start();
    }

    /* a pointer that can hover gets to hold a step by resting on it;
       touch has no hover to release, so a tap re-paces instead */
    var canHover = window.matchMedia
      ? window.matchMedia('(hover: hover)').matches : true;

    steps.forEach(function (step, i) {
      var btn = qs('.step__btn', step);
      if (!btn) return;

      btn.addEventListener('click', function () {
        pick(i);
        if (!canHover) resume();
      });
      /* keyboard: hold on the focused step, release when focus moves on */
      btn.addEventListener('focus', function () { setPaused(true); pick(i); });
      btn.addEventListener('blur', resume);
      if (canHover) {
        step.addEventListener('mouseenter', function () { setPaused(true); pick(i); });
      }
    });

    if (canHover) journey.addEventListener('mouseleave', resume);

    show(0);

    /* only run while the section is actually on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          onScreen = entry.isIntersecting;
          if (onScreen) start(); else stop();
        });
      }, { threshold: 0.25 }).observe(journey);
    } else {
      onScreen = true;
      start();
    }
  }

  /* ==========================================================
     3. CAROUSEL — the customer stories rail (section 7)
     ----------------------------------------------------------
     A paged, looping rail. How many cards a page holds is whatever
     the CSS fits — three on a desktop, two on a tablet, one on a
     phone — and the rail always moves a whole page, so a card is
     never left half in view and the arrows, the dots, the autoplay
     and a finger all advance by exactly the same amount.

     THE LOOP. `need` copies of the tail sit before the originals and
     `need` copies of the head after them, so whichever page is
     arriving from either edge is already rendered. Position N is a
     clone of position 0, pixel for pixel, so once the rail has moved
     past the last story it is re-seated on the real one with the
     transition switched off and nothing shows. The re-seat happens
     lazily — at the start of the next move rather than on a
     transitionend that may not fire — so the rail cannot get stuck.

     PAGES STAY ON A CARD. `cur` is always a real card index, and a
     move adds or subtracts a whole page, so every page boundary lands
     on a card. With nine stories that is a clean three-page cycle on
     a desktop and a nine-page one on a phone.

     ONE CLOCK. A single interval runs for the life of the page and
     early-returns while the rail is held (hover, drag, a recent
     gesture), off screen, or in a hidden tab. Nothing anywhere else
     creates a timer, so there is nothing to duplicate.

     The industry rail in section 5 runs its own engine (initExplore,
     below): it moves one card at a time and is full bleed, neither of
     which this one does.
     ========================================================== */
  function createStoryRail(opts) {
    var viewport = qs(opts.viewport);
    var track = qs(opts.track);
    if (!viewport || !track) return null;

    var slides = qsa(':scope > li', track);
    var N = slides.length;
    if (!N) return null;

    var dotsBox = opts.dots ? qs(opts.dots) : null;
    var prev = opts.prev ? qs(opts.prev) : null;
    var next = opts.next ? qs(opts.next) : null;

    var INTERVAL = opts.interval || 5200;  /* a story is worth reading */
    var HOLD = 3400;                       /* how long a touched rail is left alone */

    var cur = 0;        /* logical card; -per..N+per between moves */
    var per = 1;        /* cards in a page — measured, not assumed */
    var base = 0;       /* child index of the first real card */
    var need = 0;       /* clones per side */
    var stepPx = 0;     /* one card plus one gap */
    var cells = [];     /* every li, tagged with the story it shows */

    var timer = null;
    var onScreen = false;
    var hovering = false;
    var dragging = false;
    var holdUntil = 0;

    function norm(i) { return ((i % N) + N) % N; }
    function hold() { holdUntil = Date.now() + HOLD; }
    function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }

    /* ---- measurement ------------------------------------- */
    function metrics() {
      var cs = window.getComputedStyle(track);
      var gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
      var card = slides[0].getBoundingClientRect().width;
      return { card: card, gap: gap, step: card + gap, vw: viewport.getBoundingClientRect().width };
    }

    /* The CSS decides the page size: the card's flex-basis is written so
       a whole number of them fits the viewport at every breakpoint, and
       this reads that number back rather than restating the maths. */
    function measure() {
      var m = metrics();
      stepPx = m.step;
      per = m.step ? Math.max(1, Math.min(N, Math.floor((m.vw + m.gap) / m.step + 0.02))) : 1;
    }

    /* a page can only start on a card, so a new page size snaps `cur`
       back onto one of its own boundaries */
    function snap() { cur = norm(Math.floor(norm(cur) / per) * per); }

    /* ---- clones ------------------------------------------
       A move leaves `cur` at most one page outside [0,N), and a drag can
       throw the rail one page further again, so a page either side of
       that — 2 x per — covers every pixel that can be asked for. */
    function mkClone(i) {
      var c = slides[norm(i)].cloneNode(true);
      c.setAttribute('data-clone', String(norm(i)));
      c.setAttribute('aria-hidden', 'true');   /* announced once, as the original */
      c.removeAttribute('tabindex');           /* and never a tab stop */
      c.classList.remove('is-active');
      return c;
    }

    function buildClones() {
      qsa('[data-clone]', track).forEach(function (n) { track.removeChild(n); });

      need = Math.max(1, Math.min(N, per * 2));

      var head = document.createDocumentFragment();
      var tail = document.createDocumentFragment();
      for (var i = 0; i < need; i++) {
        head.appendChild(mkClone(N - need + i));
        tail.appendChild(mkClone(i));
      }
      track.insertBefore(head, track.firstChild);
      track.appendChild(tail);
      base = need;

      cells = qsa(':scope > li', track).map(function (el) {
        var of = el.getAttribute('data-clone');
        return { el: el, idx: of === null ? slides.indexOf(el) : parseInt(of, 10) };
      });

      /* clones inherit resolved src attributes, but ask anyway in case
         this ever runs before the image pass */
      if (window.SapotrImages) window.SapotrImages.resolve(track);
    }

    /* ---- moving ------------------------------------------ */
    function paint(px) { track.style.transform = 'translate3d(' + px + 'px,0,0)'; }
    function offsetFor(i) { return -(base + i) * stepPx; }

    /* an instant re-seat, used to hop between a clone and the real card
       it stands in for — identical pixels, so nothing shows */
    function seat(i) {
      cur = i;
      track.style.transition = 'none';
      paint(offsetFor(i));
      void track.offsetWidth;        /* commit it before easing returns */
      track.style.transition = '';
    }

    function slide(i) {
      cur = i;
      track.style.transition = '';
      paint(offsetFor(i));
    }

    /* every move starts by coming back to a real card, so `cur` can
       never wander further than one page outside the set */
    function reseat() {
      if (cur >= N) seat(cur - N);
      else if (cur < 0) seat(cur + N);
    }

    function go(pages) {
      reseat();
      slide(cur + pages * per);
      sync();
    }

    function goTo(i) {
      reseat();
      slide(i);
      sync();
    }

    function sync() {
      var live = norm(cur);

      /* the whole live page reads as active — the clone standing in for
         one of its cards included, so the seam is invisible in style as
         well as in position. --in is the card's place in the page, which
         staggers the settle from left to right. */
      cells.forEach(function (c) {
        var at = norm(c.idx - live);
        var on = at < per;
        c.el.classList.toggle('is-active', on);
        c.el.style.setProperty('--in', on ? at : 0);
      });

      /* a rail that shows every story at once needs no controls */
      var idle = per >= N;
      if (prev) prev.hidden = idle;
      if (next) next.hidden = idle;
      if (!dotsBox) return;
      dotsBox.hidden = idle;

      var active = live / gcd(N, per);
      qsa('button', dotsBox).forEach(function (d, i) {
        d.setAttribute('aria-selected', i === active ? 'true' : 'false');
        d.tabIndex = i === active ? 0 : -1;
      });
    }

    /* ---- dots: one per page the rail can start on --------
       Advancing by `per` from 0 visits every multiple of gcd(N,per)
       before it comes back round, so that is exactly how many stops
       there are: three on a desktop, one per story on a phone. */
    function buildDots() {
      if (!dotsBox) return;
      var g = gcd(N, per);
      var count = N / g;
      dotsBox.innerHTML = '';
      for (var d = 0; d < count; d++) {
        (function (i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('role', 'tab');
          b.setAttribute('aria-label', 'Go to story ' + (i * g + 1));
          b.tabIndex = i === 0 ? 0 : -1;
          b.addEventListener('click', function () { hold(); goTo(i * g); });
          dotsBox.appendChild(b);
        })(d);
      }
    }

    /* ---- the clock --------------------------------------- */
    function tick() {
      if (dragging || hovering || !onScreen || document.hidden) return;
      if (Date.now() < holdUntil) return;
      go(1);
    }
    function start() {
      if (timer || reduced.matches) return;
      timer = window.setInterval(tick, INTERVAL);
    }
    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }

    /* ---- drag: finger, and mouse where there is one ------
       touch-action:pan-y on the track (see styles.css) leaves the
       vertical axis to the page, so scrolling down the page is never
       mistaken for a swipe across the rail. */
    var pointerId = null, dragStartX = 0, dragFrom = 0, dragDx = 0;

    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (per >= N) return;
      reseat();                       /* always drag from a real card */
      dragging = true;
      pointerId = e.pointerId;
      dragStartX = e.clientX;
      dragFrom = offsetFor(cur);
      dragDx = 0;
      viewport.classList.add('is-dragging');
      if (track.setPointerCapture) {
        try { track.setPointerCapture(e.pointerId); } catch (err) { /* not captureable */ }
      }
    });

    track.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== pointerId) return;
      /* one page is as far as a single drag goes — which is exactly how
         much clone buffer sits beyond the page already in view */
      var limit = stepPx * per;
      dragDx = Math.max(-limit, Math.min(limit, e.clientX - dragStartX));
      paint(dragFrom + dragDx);
    });

    function endDrag(e) {
      if (!dragging || (e && e.pointerId !== pointerId)) return;
      dragging = false;
      pointerId = null;
      viewport.classList.remove('is-dragging');
      hold();
      /* a short flick still counts; anything less settles back. One page
         per gesture, so a fast swipe can never skip a story. */
      var threshold = Math.min(64, stepPx * 0.18);
      go(Math.abs(dragDx) > threshold ? (dragDx < 0 ? 1 : -1) : 0);
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    /* a portrait must not become a native drag payload mid-swipe */
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* ---- arrows ------------------------------------------ */
    if (prev) prev.addEventListener('click', function () { hold(); go(-1); });
    if (next) next.addEventListener('click', function () { hold(); go(1); });

    /* ---- pointer resting on the rail holds it ------------ */
    if (!window.matchMedia || window.matchMedia('(hover: hover)').matches) {
      viewport.addEventListener('mouseenter', function () { hovering = true; });
      viewport.addEventListener('mouseleave', function () { hovering = false; });
    }

    /* The viewport is a scrollport as well as a clip box, so bringing a
       focused card into view would scroll it and leave the rail
       permanently offset. The rail is positioned by transform alone, so
       this box must never hold a scroll offset. */
    viewport.addEventListener('scroll', function () {
      if (viewport.scrollLeft !== 0) viewport.scrollLeft = 0;
    });

    /* ---- keyboard on the cards themselves ---------------- */
    slides.forEach(function (s, i) {
      s.addEventListener('focus', function () {
        hold();
        goTo(norm(Math.floor(i / per) * per));
      });
      s.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); hold(); go(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); hold(); go(-1); }
      });
    });

    /* ---- rebuild on a real layout change ----------------- */
    function rebuild() {
      measure();
      snap();
      buildClones();
      buildDots();
      seat(norm(cur));
      sync();
    }

    var onResize = debounce(function () {
      var was = per;
      measure();
      if (per !== was) { rebuild(); return; }
      seat(norm(cur));            /* same page size, new card width */
      sync();
    }, 160);
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); return; }
      if (onScreen) { hold(); start(); }
    });

    /* only run while the rail is actually on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          onScreen = entry.isIntersecting;
          if (onScreen) start(); else stop();
        });
      }, { threshold: 0.2 }).observe(viewport);
    } else {
      onScreen = true;
      start();
    }

    rebuild();
    return { go: go, goTo: goTo };
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, self = this;
      window.clearTimeout(t);
      t = window.setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  /* ==========================================================
     4. EXPLORE — the industry rail (section 5)
     ----------------------------------------------------------
     Its own engine rather than createStoryRail(), because this rail
     moves a single card at a time, runs full bleed on a phone and
     carries no arrow controls — none of which the stories rail does.

     THE LOOP. `need` copies of the tail sit before the originals and
     `need` copies of the head after them, so whichever slide is
     arriving from either edge is already rendered — there is never a
     blank to scroll into. Advancing past the last industry lands on a
     clone of the first; the move after that re-seats the rail on the
     real one with the transition switched off. The two are identical
     pixels, so the seam is never seen, and because the re-seat happens
     lazily — at the start of the next move rather than on a
     transitionend that may not fire — the rail cannot get stuck.

     ONE CLOCK. A single interval runs for the life of the page and
     early-returns while the rail is held (hover, drag, a recent
     gesture), off screen, or in a hidden tab. Nothing anywhere else
     creates a timer, so there is nothing to duplicate.
     ========================================================== */
  function initExplore() {
    var viewport = qs('#svc-viewport');
    var track = qs('#svc-track');
    var dotsBox = qs('#svc-dots');
    if (!viewport || !track) return;

    var slides = qsa(':scope > li', track);
    var N = slides.length;
    if (!N) return;

    var INTERVAL = 4200;   /* the pace the journey and the rail share */
    var HOLD = 2800;       /* how long a touched rail is left alone */

    var cur = 0;           /* logical slide; -1..N between moves */
    var base = 0;          /* child index of the first real slide */
    var need = 0;          /* clones per side */
    var stepPx = 0;        /* one slide plus one gap */
    var cells = [];        /* every li, tagged with the slide it shows */

    var timer = null;
    var onScreen = false;
    var hovering = false;
    var dragging = false;
    var holdUntil = 0;

    function norm(i) { return ((i % N) + N) % N; }
    function hold() { holdUntil = Date.now() + HOLD; }

    /* ---- measurement ------------------------------------- */
    function metrics() {
      var cs = window.getComputedStyle(track);
      var vs = window.getComputedStyle(viewport);
      var gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
      var cardW = slides[0].getBoundingClientRect().width;
      return {
        card: cardW,
        step: cardW + gap,
        /* the rail's inset from the clip box: the track's own gutter
           while the rail runs full bleed on a phone, the viewport's
           padding once it is contained from 768px up. Read both, so
           the clone count is right in either composition. */
        padL: (parseFloat(cs.paddingLeft) || 0) + (parseFloat(vs.paddingLeft) || 0),
        vw: viewport.getBoundingClientRect().width
      };
    }

    function measure() { stepPx = metrics().step; }

    /* How many copies each side has to hold.
       Not "one more than fits on screen": the viewport is full bleed
       while the track carries a wide gutter, so at 1440 the rail has
       to reach 120px left of its own content box and 1020px past the
       first card's right edge — a buffer sized by what fits inside
       the gutters leaves a sliver of bare background at the far right
       on the frame the rail sits on a clone. Sized from that coverage
       instead, taken at the two extremes `cur` reaches: one step
       before the first slide and one past the last, which is also
       exactly as far as a single drag can throw it. */
    function clonesNeeded() {
      var m = metrics();
      if (!m.step) return 2;
      var right = Math.ceil((m.vw - m.padL - m.card) / m.step) + 1;
      var left = Math.ceil(m.padL / m.step) + 1;
      return Math.min(N, Math.max(2, right, left));
    }

    /* ---- clones ------------------------------------------ */
    function mkClone(node, i) {
      var c = node.cloneNode(true);
      c.setAttribute('data-clone', String(i));
      c.setAttribute('aria-hidden', 'true');   /* announced once, as the original */
      c.removeAttribute('tabindex');           /* and never a tab stop */
      c.classList.remove('is-active');
      return c;
    }

    function buildClones() {
      qsa('[data-clone]', track).forEach(function (n) { track.removeChild(n); });

      need = clonesNeeded();

      var head = document.createDocumentFragment();
      var tail = document.createDocumentFragment();
      for (var i = 0; i < need; i++) {
        head.appendChild(mkClone(slides[N - need + i], N - need + i));
        tail.appendChild(mkClone(slides[i], i));
      }
      track.insertBefore(head, track.firstChild);
      track.appendChild(tail);
      base = need;

      cells = qsa(':scope > li', track).map(function (el) {
        var of = el.getAttribute('data-clone');
        return { el: el, idx: of === null ? slides.indexOf(el) : parseInt(of, 10) };
      });

      /* clones inherit resolved src attributes, but ask anyway in case
         this ever runs before the image pass */
      if (window.SapotrImages) window.SapotrImages.resolve(track);
    }

    /* ---- moving ------------------------------------------ */
    function paint(px) { track.style.transform = 'translate3d(' + px + 'px,0,0)'; }
    function offsetFor(i) { return -(base + i) * stepPx; }

    /* an instant re-seat, used to hop between a clone and the real
       slide it stands in for — identical pixels, so nothing shows */
    function seat(i) {
      cur = i;
      track.style.transition = 'none';
      paint(offsetFor(i));
      void track.offsetWidth;        /* commit it before easing returns */
      track.style.transition = '';
    }

    function slide(i) {
      cur = i;
      track.style.transition = '';
      paint(offsetFor(i));
    }

    /* every move starts by coming back to a real slide, so `cur` can
       never wander further than one step outside the set */
    function reseat() {
      if (cur >= N) seat(cur - N);
      else if (cur < 0) seat(cur + N);
    }

    function go(delta) {
      reseat();
      slide(cur + delta);
      sync();
    }

    function goTo(i) {
      reseat();
      slide(i);
      sync();
    }

    function sync() {
      var live = norm(cur);
      /* the clone standing in for the live slide wears the active
         treatment too, so the seam is invisible in style as well */
      cells.forEach(function (c) { c.el.classList.toggle('is-active', c.idx === live); });
      if (!dotsBox) return;
      qsa('button', dotsBox).forEach(function (d, i) {
        d.setAttribute('aria-selected', i === live ? 'true' : 'false');
        d.tabIndex = i === live ? 0 : -1;
      });
    }

    /* ---- dots: one per industry, built once -------------- */
    function buildDots() {
      if (!dotsBox) return;
      dotsBox.innerHTML = '';
      slides.forEach(function (s, i) {
        var name = qs('h3', s);
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', name ? name.textContent.trim() : 'Industry ' + (i + 1));
        b.tabIndex = i === 0 ? 0 : -1;
        b.addEventListener('click', function () { hold(); goTo(i); });
        dotsBox.appendChild(b);
      });
    }

    /* ---- the clock --------------------------------------- */
    function tick() {
      if (dragging || hovering || !onScreen || document.hidden) return;
      if (Date.now() < holdUntil) return;
      go(1);
    }
    function start() {
      if (timer || reduced.matches) return;
      timer = window.setInterval(tick, INTERVAL);
    }
    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }

    /* ---- drag: finger, and mouse where there is one ------ */
    var pointerId = null, dragStartX = 0, dragFrom = 0, dragDx = 0;

    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      reseat();                       /* always drag from a real slide */
      dragging = true;
      pointerId = e.pointerId;
      dragStartX = e.clientX;
      dragFrom = offsetFor(cur);
      dragDx = 0;
      viewport.classList.add('is-dragging');
      if (track.setPointerCapture) {
        try { track.setPointerCapture(e.pointerId); } catch (err) { /* not captureable */ }
      }
    });

    track.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== pointerId) return;
      /* one slide is as far as a single drag goes — which is exactly
         how much clone buffer sits on either side */
      dragDx = Math.max(-stepPx, Math.min(stepPx, e.clientX - dragStartX));
      paint(dragFrom + dragDx);
    });

    function endDrag(e) {
      if (!dragging || (e && e.pointerId !== pointerId)) return;
      dragging = false;
      pointerId = null;
      viewport.classList.remove('is-dragging');
      hold();
      /* a short flick still counts; anything less settles back */
      var threshold = Math.min(64, stepPx * 0.18);
      go(Math.abs(dragDx) > threshold ? (dragDx < 0 ? 1 : -1) : 0);
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    /* a photograph must not become a native drag payload mid-swipe */
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* ---- trackpad: a horizontal gesture belongs to the rail,
       a vertical one still scrolls the page ---------------- */
    var wheelAcc = 0, wheelLock = 0;
    viewport.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      hold();
      var now = Date.now();
      if (now < wheelLock) return;
      wheelAcc += e.deltaX;
      if (Math.abs(wheelAcc) < 40) return;
      go(wheelAcc > 0 ? 1 : -1);
      wheelAcc = 0;
      wheelLock = now + 420;          /* one slide per burst of scrolling */
    }, { passive: false });

    /* ---- pointer resting on the rail holds it ------------ */
    if (!window.matchMedia || window.matchMedia('(hover: hover)').matches) {
      viewport.addEventListener('mouseenter', function () { hovering = true; });
      viewport.addEventListener('mouseleave', function () { hovering = false; });
    }

    /* Where overflow:clip is not understood the viewport falls back to
       overflow:hidden, which is still a scrollport: revealing a focused
       card would scroll it and leave the rail permanently offset. The
       rail is positioned by transform alone, so this box must never
       hold a scroll offset. */
    viewport.addEventListener('scroll', function () {
      if (viewport.scrollLeft !== 0) viewport.scrollLeft = 0;
    });

    /* ---- keyboard on the cards themselves ---------------- */
    slides.forEach(function (s, i) {
      s.addEventListener('focus', function () { hold(); goTo(i); });
      s.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); hold(); go(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); hold(); go(-1); }
      });
    });

    /* ---- rebuild on a real layout change ----------------- */
    function rebuild() {
      buildClones();
      measure();
      seat(norm(cur));
      sync();
    }

    var onResize = debounce(function () {
      if (clonesNeeded() !== need) { rebuild(); return; }
      measure();
      seat(norm(cur));            /* same clones, new step width */
      sync();
    }, 160);
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); return; }
      if (onScreen) { hold(); start(); }
    });

    /* only run while the rail is actually on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          onScreen = entry.isIntersecting;
          if (onScreen) start(); else stop();
        });
      }, { threshold: 0.2 }).observe(viewport);
    } else {
      onScreen = true;
      start();
    }

    buildDots();
    rebuild();
  }

  /* ==========================================================
     5. CUSTOMER STORIES — render then carousel
     The cards are built from TESTIMONIALS rather than written out in
     the markup, so a story is edited in one place and the carousel
     picks up the new count without any other change.
     ========================================================== */
  function initStories() {
    var track = qs('#story-track');
    if (!track) return;

    var total = TESTIMONIALS.length;

    track.innerHTML = TESTIMONIALS.map(function (s, i) {
      return '' +
        '<li class="story" tabindex="0" role="group" aria-roledescription="slide"' +
            ' aria-label="Story ' + (i + 1) + ' of ' + total + '">' +
          '<svg class="story__quote ic" aria-hidden="true"><use href="#i-quote"></use></svg>' +
          '<h3 class="story__title">' + escapeHtml(s.title) + '</h3>' +
          '<p class="story__text">' + brandMark(escapeHtml(s.quote)) + '</p>' +
          '<div class="story__foot">' +
            '<span class="story__av">' +
              '<img data-img="' + s.photo + '" alt="' + escapeHtml(s.alt) + '"' +
                ' width="320" height="320" loading="lazy" decoding="async">' +
            '</span>' +
            '<span class="story__meta">' +
              '<b>' + escapeHtml(s.name) + '</b>' +
              '<em>' + escapeHtml(s.role) + '</em>' +
              '<i><svg class="ic" aria-hidden="true"><use href="#i-pin"></use></svg>' +
                escapeHtml(s.location) + '</i>' +
            '</span>' +
          '</div>' +
        '</li>';
    }).join('');

    /* the cards were just injected — resolve their image keys */
    if (window.SapotrImages) window.SapotrImages.resolve(track);

    createStoryRail({
      viewport: '.stories__viewport',
      track: '#story-track',
      dots: '#story-dots',
      prev: '[data-story-prev]',
      next: '[data-story-next]'
    });
  }

  /* the brand name takes its shared mark wherever it appears in a quote.
     Runs after escapeHtml, so the span it adds is the only markup in
     there — the customer's own words are never interpreted as HTML. */
  function brandMark(html) {
    return html.replace(/SAPOTR/g, '<span class="brand">SAPOTR</span>');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ==========================================================
     6. FAQ ACCORDION
     ========================================================== */
  function initAccordion() {
    var acc = qs('#acc');
    if (!acc) return;

    var items = qsa('.acc__item', acc);

    items.forEach(function (item) {
      var btn = qs('.acc__btn', item);
      var panel = qs('.acc__panel', item);
      if (!btn || !panel) return;

      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';

        /* one panel at a time keeps the list scannable */
        items.forEach(function (other) {
          var oBtn = qs('.acc__btn', other);
          var oPanel = qs('.acc__panel', other);
          if (!oBtn || !oPanel) return;
          oBtn.setAttribute('aria-expanded', 'false');
          other.classList.remove('is-open');
          oPanel.style.maxHeight = '';
        });

        if (!open) {
          btn.setAttribute('aria-expanded', 'true');
          item.classList.add('is-open');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });

    /* keep an open panel correctly sized when the layout reflows */
    window.addEventListener('resize', debounce(function () {
      var open = qs('.acc__item.is-open .acc__panel', acc);
      if (open) open.style.maxHeight = open.scrollHeight + 'px';
    }, 160));
  }

  /* ==========================================================
     7. FINAL CTA — Try Now
     Purely visual: the button performs no action. The only script
     here moves a soft highlight to follow the cursor inside it.
     ========================================================== */
  function initCtaButton() {
    var btn = qs('.cta__btn');
    if (!btn || reduced.matches) return;

    var queued = false, x = 50, y = 50;

    function paint() {
      queued = false;
      btn.style.setProperty('--mx', x + '%');
      btn.style.setProperty('--my', y + '%');
    }

    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width) * 100;
      y = ((e.clientY - r.top) / r.height) * 100;
      if (!queued) { queued = true; window.requestAnimationFrame(paint); }
    });

    btn.addEventListener('pointerleave', function () {
      btn.style.setProperty('--mx', '50%');
      btn.style.setProperty('--my', '50%');
    });
  }

  /* ==========================================================
     8. IN-PAGE LINKS — respect a sticky header
     ========================================================== */
  function initAnchors() {
    qsa('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') { e.preventDefault(); return; }
        var target = qs(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top: top, behavior: reduced.matches ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------------------------------------------------------- */
  function init() {
    initNav();
    initJourney();
    initExplore();
    initStories();
    initAccordion();
    initCtaButton();
    initAnchors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
