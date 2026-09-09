/* ============================================================
   SAPOTR — HERO
   The four-banner landing carousel and the floating quick-selection
   box beneath it. Vanilla JS, no dependencies, no library.

     1. Config           5. Banner 1 rolling trade names
     2. Helpers          6. Banner 2 map (cards, pins, framing)
     3. Carousel         7. Floating selection box
     4. Gestures         8. Boot
   ============================================================ */
(function (window, document) {
  'use strict';

  /* ---------------------------------------------------------
     1. CONFIG
     --------------------------------------------------------- */

  /* How long each banner holds once it has finished arriving. The two
     that tell a story in steps get a little longer than the two that
     read at a glance. Dwell plus XFADE is the full cycle, so a banner
     is on screen for about six to seven seconds either way. */
  var DWELL = [5400, 5600, 6100, 6100];

  /* the cross-fade, and it must stay in step with the transition
     durations on .hslide in css/hero.css */
  var XFADE = 950;

  /* however slow the connection, the carousel starts rotating within
     this long -- a stalled image can never freeze the hero */
  var PRELOAD_CAP = 6000;

  var SWIPE_MIN = 44;      /* px of travel before a drag counts as a swipe */
  var SWIPE_LOCK = 10;     /* px before we decide the gesture is ours */

  /* Banner 1 — how long each trade name stays up. The names themselves
     live in the markup, inside #hroll: they have to be in the HTML both
     for the no-JS case and so their widths can be measured, so that is
     the one place they are listed. */
  var TRADE_HOLD = 1900;

  /* Banner 2 — staff available around Auckland. Every card is a
     different person: fourteen distinct avatars, each already wearing
     the navy tee with the mark on the chest (assets/images/hero/staff/).
     No photograph is reused.

     tier 1 shows on every phone, 1+2 from tablet up, 1+2+3 on desktop,
     which is 4 / 9 / 14 cards. x/y are percentages of the banner; tx/ty
     and mx/my override them on tablet and phone so the centre of each
     composition stays clear of the headline. */
  var STAFF = [
    /* tier 1 — the four that survive on a phone: corners only, so the
       headline and the sub-heading are never covered */
    { n: 'Sophie', r: '4.9', p: 'heroStaff03', t: 1, x: 4,  y: 12, tx: 2,  ty: 10, mx: 1,  my: 5  },
    { n: 'Emily',  r: '4.8', p: 'heroStaff02', t: 1, x: 81, y: 12, tx: 72, ty: 9,  mx: 54, my: 5  },
    { n: 'Grace',  r: '4.9', p: 'heroStaff10', t: 1, x: 5,  y: 74, tx: 3,  ty: 72, mx: 1,  my: 62 },
    { n: 'James',  r: '4.7', p: 'heroStaff14', t: 1, x: 82, y: 74, tx: 73, ty: 71, mx: 54, my: 62 },

    /* tier 2 — tablet up, nine cards. A tablet's copy is nearly as wide
       as the banner, so on that layout the side cards stack above and
       below the headline instead of flanking it. */
    { n: 'Nina',   r: '4.8', p: 'heroStaff11', t: 2, x: 25, y: 80, tx: 26, ty: 70 },
    { n: 'Aisha',  r: '4.8', p: 'heroStaff05', t: 2, x: 41, y: 2,  tx: 40, ty: 2  },
    { n: 'Raj',    r: '4.6', p: 'heroStaff01', t: 2, x: 62, y: 3,  tx: 57, ty: 2  },
    { n: 'Priya',  r: '4.9', p: 'heroStaff07', t: 2, x: 2,  y: 33, tx: 1,  ty: 20 },
    { n: 'Daniel', r: '4.7', p: 'heroStaff06', t: 2, x: 85, y: 33, tx: 74, ty: 20 },

    /* tier 3 — desktop only, fourteen cards */
    { n: 'Liam',   r: '4.8', p: 'heroStaff13', t: 3, x: 21, y: 3  },
    { n: 'Caleb',  r: '4.6', p: 'heroStaff04', t: 3, x: 1,  y: 56 },
    { n: 'Ruby',   r: '4.7', p: 'heroStaff09', t: 3, x: 86, y: 55 },
    { n: 'Chloe',  r: '4.8', p: 'heroStaff12', t: 3, x: 65, y: 80 },
    { n: 'Ava',    r: '4.9', p: 'heroStaff15', t: 3, x: 11, y: 45 }
  ];

  /* Loose pins, so the map reads as "many" without another 14 cards. */
  var PINS = [
    { t: 1, c: 'y', x: 17, y: 26, tx: 15, ty: 24, mx: 16, my: 26 },
    { t: 1, c: 'c', x: 73, y: 50, tx: 66, ty: 48, mx: 80, my: 26 },
    { t: 1, c: 'n', x: 32, y: 66, tx: 30, ty: 64, mx: 66, my: 75 },
    { t: 2, c: 'r', x: 57, y: 18, tx: 52, ty: 16 },
    { t: 2, c: 'y', x: 20, y: 37, tx: 8,  ty: 44 },
    { t: 2, c: 'n', x: 90, y: 22, tx: 82, ty: 20 },
    { t: 3, c: 'c', x: 37, y: 15 },
    { t: 3, c: 'y', x: 70, y: 62 },
    { t: 3, c: 'n', x: 20, y: 84 },
    { t: 3, c: 'r', x: 55, y: 76 }
  ];
  var PIN_COLOURS = { y: '#FFC107', c: '#12C7C7', r: '#FF4B2B', n: '#0F1738' };

  /* The map is re-framed rather than simply zoomed, so each device gets
     a composition rather than a crop of the same picture. All three
     frames are pulled well back: a laptop sees Albany to Onehunga and
     Kumeu to Waiheke, and even a phone still spans the CBD to Papakura,
     so the banner reads as staff spread across the region. */
  var MAP_VIEWS = [
    { max: 600,  box: '260 250 720 700' },
    { max: 1024, box: '60 120 1180 640' },
    { max: 1e9,  box: '-150 40 1620 740' }
  ];

  /* ---------------------------------------------------------
     2. HELPERS
     --------------------------------------------------------- */
  var reduced = (window.SapotrAnim && window.SapotrAnim.reduced) ||
    (window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false });

  function qs(s, r) { return (r || document).querySelector(s); }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, self = this;
      window.clearTimeout(t);
      t = window.setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------------------------------------------------------
     3. CAROUSEL

     A small state machine. Two numbers describe everything on
     screen -- `index` (the banner showing) and `leaving` (the one
     fading out, or -1) -- and paint() derives every class from
     them on each change. Nothing accumulates, so a slide can
     never end up carrying is-active and is-out at once, which is
     what used to leave the hero blank after 4 -> 1.

     One dwell timer exists at a time. Navigation while a
     cross-fade is running is coalesced into a single pending
     request rather than interrupting it, so no amount of
     swiping or clicking can desynchronise the state.
     --------------------------------------------------------- */
  function initCarousel() {
    var stage = qs('#hero-stage');
    var wrap = qs('#hero-slides');
    var dotsBox = qs('#hero-dots');
    if (!stage || !wrap || !dotsBox) return null;

    var slides = [].slice.call(wrap.querySelectorAll('.hslide'));
    if (slides.length < 2) return null;

    /* --- state --- */
    var index = 0;          /* the banner on screen */
    var leaving = -1;       /* the banner fading out, or -1 */
    var busy = false;       /* a cross-fade is in flight */
    var queued = null;      /* at most one pending request */
    var timer = null;       /* the dwell timer -- there is only ever one */
    var fadeTimer = null;   /* ends the current cross-fade */
    var ready = [];         /* per-banner: are its pixels available? */
    var dots = [];
    var dead = false;       /* set by destroy(), stops every callback */

    /* every reason the rotation might be waiting, tracked apart so that
       clearing one does not resume over the top of another */
    var holds = { hover: false, drag: false, focus: false, off: false, hidden: false };

    /* One AbortController for every listener this instance adds, so a
       re-initialisation cannot leave the old ones behind. */
    var ac = ('AbortController' in window) ? new AbortController() : null;
    var sig = ac ? { signal: ac.signal } : undefined;

    /* ---- markup the script owns ---- */
    dotsBox.innerHTML = '';              /* re-init must not stack dots */
    slides.forEach(function (s, i) {
      s.removeAttribute('hidden');       /* JS is here, CSS takes over */
      s.id = s.id || 'hslide-' + (i + 1);
      ready[i] = false;

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hdot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', s.id);
      b.setAttribute('aria-label', 'Banner ' + (i + 1) + ' of ' + slides.length);
      b.addEventListener('click', function () { go(i); }, sig);
      dotsBox.appendChild(b);
      dots.push(b);
    });

    /* ---------- preloading ----------
       Every banner's pixels are fetched up front so a transition never
       has to wait on the network. A banner counts as ready when its
       image has loaded, when it has failed (its gradient stands in), or
       when it has no photograph at all, as the map has. PRELOAD_CAP
       stops a stalled connection from holding the carousel for ever. */
    function markReady(i) { ready[i] = true; }

    function watchSlide(i) {
      var pics = slides[i].querySelectorAll('.hslide__pic img');
      if (!pics.length) { markReady(i); return; }   /* the drawn map */

      var left = pics.length;
      var settle = function () {
        left--;
        if (left <= 0) markReady(i);
      };
      for (var p = 0; p < pics.length; p++) {
        var img = pics[p];
        /* already settled, whether it arrived or failed */
        if (img.complete) { settle(); continue; }
        img.addEventListener('load', settle, { once: true });
        /* a broken file must not stall the carousel: the banner's own
           gradient is a valid background on its own */
        img.addEventListener('error', settle, { once: true });
      }
    }

    function preload() {
      /* resolve every held-back banner now: correctness of the
         transition matters more than shaving the last request, and
         they are all marked fetchpriority=low so banner 1 still wins */
      for (var i = 0; i < slides.length; i++) {
        var held = slides[i].querySelectorAll('[data-img-when]');
        for (var h = 0; h < held.length; h++) {
          if (window.SapotrImages) window.SapotrImages.load(held[h]);
        }
        watchSlide(i);
      }
      window.setTimeout(function () {
        if (dead) return;
        for (var k = 0; k < slides.length; k++) markReady(k);
      }, PRELOAD_CAP);
    }

    /* ---------- paint: classes derived, never accumulated ---------- */
    function paint() {
      for (var i = 0; i < slides.length; i++) {
        var s = slides[i];
        var on = i === index;
        /* is-active and is-out are mutually exclusive by construction,
           because go() never lets leaving equal index */
        s.classList.toggle('is-active', on);
        s.classList.toggle('is-out', i === leaving);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      }
      for (var d = 0; d < dots.length; d++) {
        dots[d].setAttribute('aria-selected', d === index ? 'true' : 'false');
        dots[d].tabIndex = d === index ? 0 : -1;
      }
      if (window.SapotrHeroTrades) window.SapotrHeroTrades.toggle(index === 0);
    }

    /* ---------- timing ---------- */
    function paused() {
      for (var k in holds) { if (holds[k]) return true; }
      return false;
    }

    /* the single authoritative dwell timer */
    function arm() {
      window.clearTimeout(timer);
      timer = null;
      if (dead || reduced.matches || paused() || busy) return;
      timer = window.setTimeout(autoNext, DWELL[index] || 6000);
    }

    /* Auto-advance prefers a banner whose pixels are in. If the next one
       is not ready yet it looks past it, and if none are it simply waits
       another dwell -- it never shows an empty frame. */
    function autoNext() {
      if (dead) return;
      var n = slides.length;
      for (var k = 1; k <= n; k++) {
        var cand = (index + k) % n;
        if (ready[cand]) { go(cand); return; }
      }
      arm();
    }

    function endFade() {
      if (dead) return;
      busy = false;
      leaving = -1;
      paint();                 /* this is what clears is-out, every time */

      if (queued !== null) {
        var q = queued;
        queued = null;
        if (q !== index) { go(q); return; }
      }
      arm();
    }

    /* ---------- the one way the carousel ever moves ---------- */
    function go(i) {
      if (dead) return;
      var n = slides.length;
      var target = ((i % n) + n) % n;

      if (busy) {
        /* coalesce: only the most recent intent survives, so a flurry
           of swipes costs one extra transition, not one per swipe */
        queued = target;
        return;
      }
      if (target === index) { arm(); return; }

      leaving = index;
      index = target;
      busy = true;

      window.clearTimeout(timer);
      timer = null;
      paint();

      window.clearTimeout(fadeTimer);
      fadeTimer = window.setTimeout(endFade, XFADE);
    }

    function hold(reason, on) {
      if (dead || holds[reason] === on) return;
      holds[reason] = on;
      if (paused()) { window.clearTimeout(timer); timer = null; }
      else arm();
    }

    /* ---------- pause conditions ---------- */
    /* hovering or tabbing into the banner holds it, so a reader is never
       moved on mid-sentence */
    if (window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      stage.addEventListener('mouseenter', function () { hold('hover', true); }, sig);
      stage.addEventListener('mouseleave', function () { hold('hover', false); }, sig);
    }
    stage.addEventListener('focusin', function () { hold('focus', true); }, sig);
    stage.addEventListener('focusout', function () { hold('focus', false); }, sig);

    /* a hidden tab must not bank up timers; arm() clearing first means
       any number of visibility flips still leaves exactly one */
    function onVisibility() { hold('hidden', document.visibilityState === 'hidden'); }
    document.addEventListener('visibilitychange', onVisibility, sig);
    onVisibility();

    /* nor should anything animate while the banner is off screen */
    var io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        for (var e = 0; e < entries.length; e++) hold('off', !entries[e].isIntersecting);
      }, { threshold: 0.15 });
      io.observe(stage);
    }

    /* ---------- keyboard ---------- */
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(index - 1);
      else if (e.key === 'ArrowRight') go(index + 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(slides.length - 1);
      else return;
      e.preventDefault();
      dots[index].focus();
    }, sig);

    /* ---------- gestures ---------- */
    initGestures(stage, wrap, {
      busy: function () { return busy; },
      onStart: function () { hold('drag', true); },
      onEnd: function (dir) {
        hold('drag', false);
        if (dir) go(index + dir);
        else arm();
      },
      current: function () { return slides[index]; }
    });

    /* ---------- orientation / resize ----------
       Only a repaint is needed: the layout is CSS, and the state is
       independent of it, so turning a phone can never desynchronise. */
    var onResize = debounce(function () { if (!dead) paint(); }, 200);
    window.addEventListener('orientationchange', onResize, sig);

    function destroy() {
      dead = true;
      window.clearTimeout(timer);
      window.clearTimeout(fadeTimer);
      if (io) io.disconnect();
      if (ac) ac.abort();
      /* older engines without AbortController: take these off by hand */
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('orientationchange', onResize);
    }

    preload();
    paint();
    arm();

    return {
      go: go,
      next: function () { go(index + 1); },
      hold: hold,
      destroy: destroy,
      state: function () {
        return { index: index, leaving: leaving, busy: busy, queued: queued, ready: ready.slice() };
      }
    };
  }

  /* ---------------------------------------------------------
     4. GESTURES — touch, pen and mouse drag
     The slide tracks the finger, so a swipe feels connected rather
     than like a button press. Vertical scrolling is never stolen:
     touch-action on the stage keeps pan-y with the page, and a
     gesture is only claimed once it is clearly horizontal.
     --------------------------------------------------------- */
  function initGestures(stage, wrap, api) {
    var down = false, decided = false, mine = false;
    var x0 = 0, y0 = 0, dx = 0, id = null;

    function begin(px, py, pid) {
      if (api.busy()) return;         /* never fight a running cross-fade */
      down = true; decided = false; mine = false;
      x0 = px; y0 = py; dx = 0; id = pid;
    }

    function move(px, py, e) {
      if (!down) return;
      dx = px - x0;
      var dy = py - y0;

      if (!decided) {
        if (Math.abs(dx) < SWIPE_LOCK && Math.abs(dy) < SWIPE_LOCK) return;
        decided = true;
        mine = Math.abs(dx) > Math.abs(dy);
        if (!mine) { down = false; return; }   /* the page wanted it */
        stage.classList.add('is-dragging');
        api.onStart();
      }
      if (!mine) return;

      if (e && e.cancelable) e.preventDefault();
      /* resist, so the reel feels like a reel */
      var slide = api.current();
      if (slide) slide.style.setProperty('--hdx', (dx * 0.32).toFixed(1) + 'px');
    }

    function end() {
      if (!down && !mine) return;
      var slide = api.current();
      if (slide) slide.style.removeProperty('--hdx');
      stage.classList.remove('is-dragging');

      var dir = 0;
      if (mine && Math.abs(dx) > SWIPE_MIN) dir = dx < 0 ? 1 : -1;
      if (mine) api.onEnd(dir);

      down = false; decided = false; mine = false; dx = 0; id = null;
    }

    if (window.PointerEvent) {
      wrap.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        begin(e.clientX, e.clientY, e.pointerId);
      });
      wrap.addEventListener('pointermove', function (e) {
        if (id !== null && e.pointerId !== id) return;
        move(e.clientX, e.clientY, e);
      });
      wrap.addEventListener('pointerup', end);
      wrap.addEventListener('pointercancel', end);
      wrap.addEventListener('lostpointercapture', end);
    } else {
      /* older Safari / Samsung Internet builds */
      wrap.addEventListener('touchstart', function (e) {
        var t = e.changedTouches[0];
        begin(t.clientX, t.clientY, t.identifier);
      }, { passive: true });
      wrap.addEventListener('touchmove', function (e) {
        var t = e.changedTouches[0];
        move(t.clientX, t.clientY, e);
      }, { passive: false });
      wrap.addEventListener('touchend', end);
      wrap.addEventListener('touchcancel', end);

      wrap.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        begin(e.clientX, e.clientY, null);
      });
      window.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY, e); });
      window.addEventListener('mouseup', end);
    }

    /* a drag must never leave a stray text selection behind */
    wrap.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }
  /* ---------------------------------------------------------
     5. BANNER 1 — ROLLING TRADE NAMES
     The wrapper's width is animated to the measured width of the
     active word, so the headline glides between 'Shop' and
     'Delivery & Couriers' instead of jumping. Widths are measured
     from the live nodes, so they follow the responsive type scale.
     --------------------------------------------------------- */
  function initTrades() {
    var win = qs('#hroll');
    if (!win) return null;

    var words = [].slice.call(win.querySelectorAll('.hroll__w'));
    var sizer = win.querySelector('.hroll__sizer');
    if (!words.length || !sizer) return null;

    var at = 0;
    var timer = null;
    var running = false;
    var wanted = false;      /* is banner 1 the one on screen? */
    var widths = [];
    var longest = sizer.textContent;

    /* The visible words are absolutely positioned and stretched across
       the wrapper, so their own boxes cannot be measured. The sizer is
       in-flow and nowrap, which means it reports its natural width
       whatever width the wrapper has been given — borrow it. */
    function measure() {
      widths = words.map(function (w) {
        sizer.textContent = w.textContent;
        return Math.ceil(sizer.getBoundingClientRect().width);
      });
      sizer.textContent = longest;
      sizeTo(at);
    }

    function sizeTo(i) {
      if (widths[i]) win.style.width = widths[i] + 'px';
    }

    function show(i) {
      var from = words[at];
      at = (i + words.length) % words.length;
      var to = words[at];
      if (from === to) { sizeTo(at); return; }

      from.classList.remove('is-in');
      from.classList.add('is-out');
      to.classList.remove('is-out');
      to.classList.add('is-in');
      sizeTo(at);

      /* park the word that left, so only two are ever mid-transition */
      window.setTimeout(function () {
        if (!from.classList.contains('is-in')) from.classList.remove('is-out');
      }, 560);
    }

    function tick() { show(at + 1); }

    function start() {
      if (running || reduced.matches) return;
      running = true;
      timer = window.setInterval(tick, TRADE_HOLD);
    }
    function stop() {
      running = false;
      window.clearInterval(timer);
      timer = null;
    }

    /* measure once the webfont has actually swapped in, or the widths
       would be taken from the fallback face */
    measure();
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(measure);
    }
    var onMeasure = debounce(measure, 160);
    window.addEventListener('resize', onMeasure);
    window.addEventListener('orientationchange', onMeasure);

    /* a hidden tab should not be rolling words nobody can see */
    function onVisibility() {
      if (document.visibilityState === 'hidden') stop();
      else if (wanted) start();
    }
    document.addEventListener('visibilitychange', onVisibility);

    return {
      toggle: function (on) {
        wanted = !!on;
        if (on && document.visibilityState !== 'hidden') start();
        else stop();
      },
      measure: measure,
      destroy: function () {
        stop();
        window.removeEventListener('resize', onMeasure);
        window.removeEventListener('orientationchange', onMeasure);
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }

  /* ---------------------------------------------------------
     6. BANNER 2 — MAP CARDS, PINS AND FRAMING
     --------------------------------------------------------- */
  function pct(v, fallback) {
    return typeof v === 'number' ? v : fallback;
  }

  function initMap() {
    var cardsBox = qs('#hmap-cards');
    var pinsBox = qs('#hmap-pins');
    var svg = qs('#hmap-svg');

    if (cardsBox) {
      cardsBox.innerHTML = STAFF.map(function (s, i) {
        var style =
          '--i:' + i + ';' +
          '--x:' + s.x + ';--y:' + s.y + ';' +
          '--tx:' + pct(s.tx, s.x) + ';--ty:' + pct(s.ty, s.y) + ';' +
          '--mx:' + pct(s.mx, pct(s.tx, s.x)) + ';--my:' + pct(s.my, pct(s.ty, s.y)) + ';';

        return '' +
          '<div class="hcard hcard--t' + s.t + '" style="' + style + '">' +
            /* not loading="lazy": these sit inside a slide that is
               visibility:hidden until the carousel reaches it, and a
               lazy image in a hidden subtree is never fetched, so the
               faces would pop in after the banner had already arrived.
               Low priority keeps them behind banner 1 instead. */
            '<span class="hcard__av">' +
              '<img data-img="' + s.p + '" alt="" width="256" height="256" decoding="async" fetchpriority="low">' +
            '</span>' +
            '<span class="hcard__txt">' +
              '<b class="hcard__n">' + esc(s.n) + '</b>' +
              '<span class="hcard__r">' +
                '<svg class="ic" aria-hidden="true"><use href="#i-star"></use></svg>' + esc(s.r) +
              '</span>' +
              '<span class="hcard__a"><i></i>Available Nearby</span>' +
            '</span>' +
          '</div>';
      }).join('');
    }

    if (pinsBox) {
      pinsBox.innerHTML = PINS.map(function (p, i) {
        var style =
          '--i:' + i + ';--pin:' + PIN_COLOURS[p.c] + ';' +
          '--x:' + p.x + ';--y:' + p.y + ';' +
          '--tx:' + pct(p.tx, p.x) + ';--ty:' + pct(p.ty, p.y) + ';' +
          '--mx:' + pct(p.mx, pct(p.tx, p.x)) + ';--my:' + pct(p.my, pct(p.ty, p.y)) + ';';
        return '<i class="hpin hpin--t' + p.t + '" style="' + style + '"><i></i></i>';
      }).join('');
    }

    /* the avatars were injected, so their image keys need resolving */
    if (window.SapotrImages) {
      window.SapotrImages.resolve(cardsBox);
    }

    /* --- re-frame the map per viewport --- */
    function frame() {
      if (!svg) return;
      var w = window.innerWidth || document.documentElement.clientWidth;
      for (var i = 0; i < MAP_VIEWS.length; i++) {
        if (w <= MAP_VIEWS[i].max) {
          if (svg.getAttribute('viewBox') !== MAP_VIEWS[i].box) {
            svg.setAttribute('viewBox', MAP_VIEWS[i].box);
          }
          return;
        }
      }
    }
    frame();
    window.addEventListener('resize', debounce(frame, 140));
    window.addEventListener('orientationchange', debounce(frame, 220));
  }

  /* ---------------------------------------------------------
     7. FLOATING SELECTION BOX
     Two single-choice groups. Buttons rather than inputs, because the
     panel is a shortcut into the booking flow, not a form that posts;
     the ARIA radio pattern gives it the right semantics and the same
     arrow-key behaviour a native group would have.
     --------------------------------------------------------- */
  function initSelector() {
    var sel = qs('#hsel');
    if (!sel) return;

    var groups = [].slice.call(sel.querySelectorAll('[role="radiogroup"]'));
    var chosen = {};

    groups.forEach(function (group) {
      var opts = [].slice.call(group.querySelectorAll('[role="radio"]'));
      if (!opts.length) return;

      function pick(i, focus) {
        var target = opts[(i + opts.length) % opts.length];
        opts.forEach(function (o) {
          var on = o === target;
          o.classList.toggle('is-on', on);
          o.setAttribute('aria-checked', on ? 'true' : 'false');
          o.tabIndex = on ? 0 : -1;
        });
        chosen[group.getAttribute('aria-labelledby')] = target.getAttribute('data-val');
        if (focus) {
          target.focus();
          /* on the phone rail, bring the choice fully into view */
          if (target.scrollIntoView) {
            target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          }
        }
      }

      opts.forEach(function (o, i) {
        o.addEventListener('click', function () { pick(i, false); });
        o.addEventListener('keydown', function (e) {
          var k = e.key;
          if (k === 'ArrowRight' || k === 'ArrowDown') { pick(i + 1, true); e.preventDefault(); }
          else if (k === 'ArrowLeft' || k === 'ArrowUp') { pick(i - 1, true); e.preventDefault(); }
          else if (k === ' ' || k === 'Enter') { pick(i, false); e.preventDefault(); }
        });
      });

      /* seed from the markup so the two stay in step */
      var start = opts.indexOf(group.querySelector('[aria-checked="true"]'));
      pick(start < 0 ? 0 : start, false);
    });

    /* On a phone the options are one swipeable rail. The edge fades hint
       at what is off screen, so they have to know where the rail is:
       no right-hand fade once the CTA at the end is fully in view. */
    var row = qs('#hsel-row');
    if (row) {
      var markEdges = function () {
        var max = row.scrollWidth - row.clientWidth;
        if (max < 2) { sel.setAttribute('data-rail', 'none'); return; }
        var at = row.scrollLeft;
        sel.setAttribute('data-rail',
          at <= 1 ? 'start' : (at >= max - 1 ? 'end' : 'mid'));
      };
      row.addEventListener('scroll', markEdges, { passive: true });
      window.addEventListener('resize', debounce(markEdges, 120));
      markEdges();
    }

    /* the CTA carries the choice through to the booking section, so the
       panel is not a dead end */
    var cta = sel.querySelector('.hsel__cta');
    if (cta) {
      cta.addEventListener('click', function () {
        window.SapotrHero = window.SapotrHero || {};
        window.SapotrHero.selection = {
          category: chosen['hsel-cat-lab'] || null,
          when: chosen['hsel-when-lab'] || null
        };
      });
    }
  }

  /* ---------------------------------------------------------
     8. BOOT
     --------------------------------------------------------- */
  /* Idempotent: if the hero is initialised twice — a second script tag,
     a client-side re-render — the previous instance is torn down first,
     so there is never a second set of timers or listeners running
     alongside the live one. */
  function init() {
    if (!qs('#hero-stage')) return;

    window.SapotrHero = window.SapotrHero || {};
    if (window.SapotrHero.carousel && window.SapotrHero.carousel.destroy) {
      window.SapotrHero.carousel.destroy();
    }
    if (window.SapotrHeroTrades && window.SapotrHeroTrades.destroy) {
      window.SapotrHeroTrades.destroy();
    }

    initMap();
    window.SapotrHeroTrades = initTrades();
    initSelector();

    /* the carousel preloads all four banners itself and only rotates
       between banners whose pixels are in */
    window.SapotrHero.carousel = initCarousel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
