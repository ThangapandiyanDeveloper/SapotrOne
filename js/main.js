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
     CUSTOMER STORIES — CONTENT
     ----------------------------------------------------------
     PLACEHOLDER CONTENT.
     The written specification does not supply testimonial copy;
     the entries below are transcribed from the client's own
     reference mock-up so the section can be presented. Replace
     each entry with a real, approved customer story before the
     site goes live.

     TESTIMONIAL_MODE
       'reference' — show the reference copy below (default)
       'blank'     — show empty, clearly-marked content slots
     ========================================================== */
  var TESTIMONIAL_MODE = 'reference';

  var TESTIMONIALS = [
    {
      quote: 'Sapotr helped us get reliable helpers for our moving day. Super easy and very professional.',
      name: 'Sarah T.',
      service: 'Moving & Shifting',
      location: 'Auckland',
      photo: 'storyAvatar1'
    },
    {
      quote: 'We needed extra hands for our event. Booked in minutes and everything went smoothly.',
      name: 'James L.',
      service: 'Events & Celebrations',
      location: 'Wellington',
      photo: 'storyAvatar2'
    },
    {
      quote: 'Great experience! Employees arrive on time, do the job well, and the app is easy to use.',
      name: 'Priya K.',
      service: 'Home & Personal',
      location: 'Hamilton',
      photo: 'storyAvatar3'
    }
  ];

  var BLANK_STORY = { quote: '', name: '', service: '', location: '', photo: '' };

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
     3. CAROUSEL — shared engine
     Used by the customer stories. A clamped, arrow-driven pager:
     the industry rail in section 5 loops instead, so it runs on
     its own engine (initExplore, below).
     ========================================================== */
  function createCarousel(opts) {
    var track = qs(opts.track);
    if (!track) return null;

    var slides = qsa(':scope > li', track);
    if (!slides.length) return null;

    var dotsBox = opts.dots ? qs(opts.dots) : null;
    var prev = opts.prev ? qs(opts.prev) : null;
    var next = opts.next ? qs(opts.next) : null;

    var index = 0;
    var timer = null;
    var paused = false;

    /* how many slides fit — determines the furthest valid index.
       The track may carry inline padding (the full-bleed service rail),
       so measure the usable width rather than the whole viewport. */
    function metrics() {
      var cs = window.getComputedStyle(track);
      var gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
      var padL = parseFloat(cs.paddingLeft || '0') || 0;
      var padR = parseFloat(cs.paddingRight || '0') || 0;
      var view = track.parentElement.getBoundingClientRect().width - padL - padR;
      return { slideW: slides[0].getBoundingClientRect().width, gap: gap, view: view };
    }

    function perView() {
      var m = metrics();
      if (!m.slideW) return 1;
      return Math.max(1, Math.floor((m.view + m.gap) / (m.slideW + m.gap) + 0.02));
    }

    function maxIndex() {
      return Math.max(0, slides.length - perView());
    }

    /* a rail that shows everything at once needs no controls */
    function syncControls() {
      var idle = maxIndex() === 0;
      [prev, next].forEach(function (b) { if (b) b.hidden = idle; });
      if (dotsBox) dotsBox.hidden = idle;
    }

    function apply() {
      var m = metrics();
      var offset = index * (m.slideW + m.gap);

      track.style.transform = 'translate3d(' + (-offset) + 'px,0,0)';

      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });

      if (dotsBox) {
        qsa('button', dotsBox).forEach(function (d, i) {
          d.setAttribute('aria-selected', i === index ? 'true' : 'false');
        });
      }
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= maxIndex();
      syncControls();
    }

    function go(i) {
      var max = maxIndex();
      index = i < 0 ? max : (i > max ? 0 : i);
      apply();
    }

    /* dots — one per reachable position */
    function buildDots() {
      if (!dotsBox) return;
      dotsBox.innerHTML = '';
      for (var d = 0; d <= maxIndex(); d++) {
        (function (i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('role', 'tab');
          b.setAttribute('aria-label', (opts.label || 'Slide') + ' ' + (i + 1));
          b.addEventListener('click', function () { paused = true; go(i); });
          dotsBox.appendChild(b);
        })(d);
      }
    }
    buildDots();

    if (prev) prev.addEventListener('click', function () { paused = true; go(index - 1); });
    if (next) next.addEventListener('click', function () { paused = true; go(index + 1); });

    /* keyboard support on the slides themselves */
    slides.forEach(function (s, i) {
      s.addEventListener('focus', function () { paused = true; go(Math.min(i, maxIndex())); });
      s.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); paused = true; go(index + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); paused = true; go(index - 1); }
      });
      s.addEventListener('mouseenter', function () { paused = true; });
    });
    track.addEventListener('mouseleave', function () { paused = false; });

    /* auto-scroll */
    function start() {
      if (!opts.auto || reduced.matches || timer) return;
      timer = window.setInterval(function () {
        if (!paused) go(index + 1);
      }, opts.interval || 4200);
    }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
      }, { threshold: 0.2 }).observe(track.parentElement);
    } else {
      start();
    }

    /* re-measure on resize, and rebuild the dots if the count changed */
    var lastMax = maxIndex();
    window.addEventListener('resize', debounce(function () {
      var nowMax = maxIndex();
      if (nowMax !== lastMax) { lastMax = nowMax; buildDots(); }
      go(Math.min(index, nowMax));
    }, 160));

    apply();
    return { go: go, apply: apply };
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
     Its own engine rather than createCarousel(), because this rail
     loops without end, is dragged directly and carries no arrow
     controls — none of which the shared clamped engine does.
     Section 7 keeps using createCarousel() unchanged.

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
      var gap = parseFloat(cs.columnGap || cs.gap || '0') || 0;
      var cardW = slides[0].getBoundingClientRect().width;
      return {
        card: cardW,
        step: cardW + gap,
        padL: parseFloat(cs.paddingLeft) || 0,
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
     ========================================================== */
  function initStories() {
    var track = qs('#story-track');
    if (!track) return;

    var blank = TESTIMONIAL_MODE === 'blank';
    var data = blank ? [BLANK_STORY, BLANK_STORY, BLANK_STORY] : TESTIMONIALS;

    var html = data.map(function (s) {
      var quote = s.quote
        ? escapeHtml(s.quote)
        : '<span class="acc__pending" data-content-slot="story-quote">Customer quote to be supplied.</span>';
      var name = s.name ? escapeHtml(s.name) : 'Customer name';
      var service = s.service ? escapeHtml(s.service) : 'Service type';
      var location = s.location ? escapeHtml(s.location) : 'Location';

      /* a photograph where we have one, initials otherwise */
      var avatar = s.photo
        ? '<span class="story__av"><img data-img="' + s.photo + '" alt="" width="400" height="400" loading="lazy" decoding="async"></span>'
        : '<span class="story__av story__av--blank" aria-hidden="true">' +
            (s.name ? s.name.charAt(0).toUpperCase() : '&mdash;') + '</span>';

      return '' +
        '<li class="story" tabindex="0" data-placeholder="' + (blank ? 'true' : 'reference') + '">' +
          '<svg class="story__quote ic" aria-hidden="true"><use href="#i-quote"></use></svg>' +
          '<p class="story__text">' + quote + '</p>' +
          '<div class="story__foot">' +
            avatar +
            '<span class="story__meta">' +
              '<b>' + name + '</b>' +
              '<i><svg class="ic" aria-hidden="true"><use href="#i-pin"></use></svg>' + location + '</i>' +
            '</span>' +
          '</div>' +
          '<span class="story__badge">' + service + '</span>' +
        '</li>';
    }).join('');

    track.innerHTML = html;

    /* the cards were just injected — resolve their image keys */
    if (window.SapotrImages) window.SapotrImages.resolve(track);

    createCarousel({
      track: '#story-track',
      dots: '#story-dots',
      prev: '[data-story-prev]',
      next: '[data-story-next]',
      label: 'Story',
      auto: false
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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
