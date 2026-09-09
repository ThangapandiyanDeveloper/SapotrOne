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

  /* per-banner dwell: the two banners that tell a story in steps get
     a little longer than the two that read at a glance */
  var DWELL = [6200, 6200, 7000, 7000];

  var SWIPE_MIN = 44;      /* px of travel before a drag counts as a swipe */
  var SWIPE_LOCK = 10;     /* px before we decide the gesture is ours */

  /* Banner 1 — the trades, in the order the client supplied. */
  var TRADES = [
    'Events', 'Shop', 'Store', 'Restaurants', 'Supermarkets',
    'Hotels', 'Warehouses', 'Showrooms', 'Moving & Setup', 'Delivery & Couriers'
  ];
  var TRADE_HOLD = 1900;   /* how long each trade stays up */

  /* Banner 2 — staff available around Auckland.
     tier 1 shows on every phone, 1+2 from tablet up, 1+2+3 on desktop,
     which is 5 / 9 / 14 cards. x/y are percentages of the banner; tx/ty
     and mx/my override them on tablet and phone so the centre of each
     composition stays clear of the headline. */
  var STAFF = [
    /* tier 1 — the four that survive on a phone: corners only, so the
       headline and the sub-heading are never covered */
    { n: 'Sophie', r: '4.9', p: 'heroStaff2', t: 1, x: 4,  y: 12, tx: 2,  ty: 10, mx: 1,  my: 5  },
    { n: 'Emily',  r: '4.8', p: 'heroStaff5', t: 1, x: 81, y: 12, tx: 72, ty: 9,  mx: 54, my: 5  },
    { n: 'Grace',  r: '4.9', p: 'heroStaff3', t: 1, x: 5,  y: 74, tx: 3,  ty: 72, mx: 1,  my: 62 },
    { n: 'James',  r: '4.7', p: 'heroStaff4', t: 1, x: 82, y: 74, tx: 73, ty: 71, mx: 54, my: 62 },

    /* tier 2 — tablet up, nine cards. A tablet's copy is nearly as wide
       as the banner, so on that layout the side cards stack above and
       below the headline instead of flanking it. */
    { n: 'Nina',   r: '4.8', p: 'heroStaff7', t: 2, x: 25, y: 80, tx: 26, ty: 70 },
    { n: 'Aisha',  r: '4.8', p: 'heroStaff7', t: 2, x: 41, y: 2,  tx: 40, ty: 2  },
    { n: 'Raj',    r: '4.6', p: 'heroStaff1', t: 2, x: 62, y: 3,  tx: 57, ty: 2  },
    { n: 'Priya',  r: '4.9', p: 'heroStaff5', t: 2, x: 2,  y: 33, tx: 1,  ty: 20 },
    { n: 'Daniel', r: '4.7', p: 'heroStaff6', t: 2, x: 85, y: 33, tx: 74, ty: 20 },

    /* tier 3 — desktop only, fourteen cards */
    { n: 'Liam',   r: '4.8', p: 'heroStaff4', t: 3, x: 21, y: 3  },
    { n: 'Caleb',  r: '4.6', p: 'heroStaff1', t: 3, x: 1,  y: 56 },
    { n: 'Mateo',  r: '4.7', p: 'heroStaff6', t: 3, x: 86, y: 55 },
    { n: 'Tariq',  r: '4.8', p: 'heroStaff1', t: 3, x: 65, y: 80 },
    { n: 'Chloe',  r: '4.9', p: 'heroStaff3', t: 3, x: 11, y: 45 }
  ];

  /* Loose pins, so the map reads as "many" without another 14 cards. */
  var PINS = [
    { t: 1, c: 'y', x: 17, y: 26, tx: 15, ty: 24, mx: 16, my: 26 },
    { t: 1, c: 'c', x: 73, y: 50, tx: 66, ty: 48, mx: 80, my: 26 },
    { t: 1, c: 'n', x: 32, y: 66, tx: 30, ty: 64, mx: 66, my: 75 },
    { t: 2, c: 'r', x: 57, y: 18, tx: 52, ty: 16 },
    { t: 2, c: 'y', x: 9,  y: 46, tx: 8,  ty: 44 },
    { t: 2, c: 'n', x: 90, y: 22, tx: 82, ty: 20 },
    { t: 3, c: 'c', x: 37, y: 15 },
    { t: 3, c: 'y', x: 79, y: 42 },
    { t: 3, c: 'n', x: 20, y: 84 },
    { t: 3, c: 'r', x: 55, y: 76 }
  ];
  var PIN_COLOURS = { y: '#FFC107', c: '#12C7C7', r: '#FF4B2B', n: '#0F1738' };

  /* The map is re-framed rather than simply zoomed, so a phone gets
     central Auckland instead of a slice of the same wide picture. */
  var MAP_VIEWS = [
    { max: 600,  box: '330 40 560 620' },
    { max: 1024, box: '150 0 920 700' },
    { max: 1e9,  box: '0 0 1200 700' }
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

  /* Re-running a CSS animation needs the class off, a forced reflow,
     then the class back on. */
  function restart(el) {
    if (!el) return;
    el.style.animation = 'none';
    /* eslint-disable-next-line no-unused-expressions */
    el.offsetHeight;
    el.style.animation = '';
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------------------------------------------------------
     3. CAROUSEL
     --------------------------------------------------------- */
  function initCarousel() {
    var stage = qs('#hero-stage');
    var wrap = qs('#hero-slides');
    var dotsBox = qs('#hero-dots');
    var prog = qs('#hero-prog');
    var pp = qs('#hero-pp');
    if (!stage || !wrap) return null;

    var slides = [].slice.call(wrap.querySelectorAll('.hslide'));
    if (slides.length < 2) return null;

    var index = 0;
    var timer = null;
    var outTimer = null;
    var dots = [];

    /* every reason the rotation might be waiting, tracked separately so
       one of them clearing does not resume over the top of another */
    var holds = { hover: false, drag: false, focus: false, off: false, hidden: false, user: false };

    /* --- markup the script owns --- */
    slides.forEach(function (s, i) {
      s.removeAttribute('hidden');          /* JS is here: CSS takes over */
      s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      s.id = s.id || 'hslide-' + (i + 1);

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hdot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.setAttribute('aria-controls', s.id);
      b.setAttribute('aria-label', 'Banner ' + (i + 1) + ' of ' + slides.length);
      b.tabIndex = i === 0 ? 0 : -1;
      /* navigating does not undo an explicit pause — if someone pressed
         pause they still expect the banner to stay where they put it */
      b.addEventListener('click', function () { go(i); });
      dotsBox.appendChild(b);
      dots.push(b);
    });

    /* --- loading: only what the next step actually needs --- */
    function warm(i) {
      if (!slides[i] || !window.SapotrImages) return;
      var held = slides[i].querySelectorAll('[data-img-when]');
      for (var h = 0; h < held.length; h++) window.SapotrImages.load(held[h]);
    }
    warm(0);

    /* --- paint --- */
    function apply(prev) {
      slides.forEach(function (s, i) {
        var on = i === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      });

      if (typeof prev === 'number' && prev !== index) {
        var old = slides[prev];
        old.classList.add('is-out');
        window.clearTimeout(outTimer);
        outTimer = window.setTimeout(function () {
          /* only clear it if the slide is still the one on its way out */
          if (!old.classList.contains('is-active')) old.classList.remove('is-out');
        }, 1000);
      }

      dots.forEach(function (d, i) {
        d.setAttribute('aria-selected', i === index ? 'true' : 'false');
        d.tabIndex = i === index ? 0 : -1;
      });

      /* this one, in case a dot jumped straight here, and the next,
         because it is the one thing anyone is about to see */
      warm(index);
      warm((index + 1) % slides.length);

      if (window.SapotrHeroTrades) window.SapotrHeroTrades.toggle(index === 0);
      restartProgress();
    }

    function go(i) {
      var prev = index;
      var n = slides.length;
      index = ((i % n) + n) % n;
      if (index === prev) return;
      apply(prev);
      schedule();
    }
    function next() { go(index + 1); }

    /* --- timing --- */
    function paused() {
      for (var k in holds) { if (holds[k]) return true; }
      return false;
    }

    function schedule() {
      window.clearTimeout(timer);
      timer = null;
      if (reduced.matches || paused()) return;
      timer = window.setTimeout(next, DWELL[index] || 6200);
    }

    function restartProgress() {
      if (!prog || reduced.matches) return;
      prog.style.setProperty('--dur', (DWELL[index] || 6200) + 'ms');
      prog.classList.remove('is-run');
      restart(prog.firstElementChild);
      /* the bar and the timer have to start on the same frame */
      window.requestAnimationFrame(function () {
        prog.classList.add('is-run');
        prog.classList.toggle('is-hold', paused());
      });
    }

    function hold(reason, on) {
      if (holds[reason] === on) return;
      holds[reason] = on;

      if (prog) prog.classList.toggle('is-hold', paused());
      if (pp) {
        pp.setAttribute('aria-pressed', holds.user ? 'true' : 'false');
        pp.setAttribute('aria-label', holds.user
          ? 'Play the banner rotation'
          : 'Pause the banner rotation');
      }

      if (paused()) { window.clearTimeout(timer); timer = null; }
      else if (!timer) schedule();
    }

    /* --- pause conditions --- */
    if (window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      stage.addEventListener('mouseenter', function () { hold('hover', true); });
      stage.addEventListener('mouseleave', function () { hold('hover', false); });
    }
    stage.addEventListener('focusin', function () { hold('focus', true); });
    stage.addEventListener('focusout', function () { hold('focus', false); });

    document.addEventListener('visibilitychange', function () {
      hold('hidden', document.visibilityState === 'hidden');
    });

    /* nothing should animate while the banner is off screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { hold('off', !e.isIntersecting); });
      }, { threshold: 0.15 }).observe(stage);
    }

    if (pp) {
      pp.setAttribute('aria-pressed', 'false');
      pp.addEventListener('click', function () { hold('user', !holds.user); });
      if (reduced.matches) pp.hidden = true;   /* nothing to pause */
    }

    /* --- keyboard --- */
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(index - 1);
      else if (e.key === 'ArrowRight') go(index + 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(slides.length - 1);
      else return;
      e.preventDefault();
      dots[index].focus();
    });

    /* --- gestures (4) --- */
    initGestures(stage, wrap, {
      onStart: function () { hold('drag', true); },
      onEnd: function (dir) {
        hold('drag', false);
        if (dir) go(index + dir);
        else schedule();
      },
      current: function () { return slides[index]; }
    });

    apply();
    schedule();
    return { go: go, next: next, hold: hold };
  }

  /* ---------------------------------------------------------
     4. GESTURES — touch, pen and mouse drag
     The slide tracks the finger, so a swipe feels connected rather
     than like a button press. Vertical scrolling is never stolen:
     touch-action on the stage keeps pan-y with the page.
     --------------------------------------------------------- */
  function initGestures(stage, wrap, api) {
    var down = false, decided = false, mine = false;
    var x0 = 0, y0 = 0, dx = 0, id = null;

    function begin(px, py, pid) {
      down = true; decided = false; mine = false;
      x0 = px; y0 = py; dx = 0; id = pid;
    }

    function move(px, py, ev) {
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

      if (ev && ev.cancelable) ev.preventDefault();
      /* resist, so the ends of the reel feel like a reel */
      var slide = api.current();
      if (slide) slide.style.setProperty('--hdx', (dx * 0.32).toFixed(1) + 'px');
    }

    function end() {
      if (!down && !mine) { return; }
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
    window.addEventListener('resize', debounce(measure, 140));
    window.addEventListener('orientationchange', debounce(measure, 220));

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') stop();
      else if (window.SapotrHero && window.SapotrHero.tradesWanted) start();
    });

    return {
      toggle: function (on) {
        window.SapotrHero = window.SapotrHero || {};
        window.SapotrHero.tradesWanted = !!on;
        if (on) start(); else stop();
      },
      measure: measure
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
               They are 5-7KB each, so low priority is enough. */
            '<span class="hcard__av">' +
              '<img data-img="' + s.p + '" alt="" width="160" height="160" decoding="async" fetchpriority="low">' +
              '<img class="hcard__mark" data-img="heroUniformMark" alt="" width="72" height="57" decoding="async" fetchpriority="low">' +
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
  function init() {
    if (!qs('#hero-stage')) return;

    initMap();
    window.SapotrHeroTrades = initTrades();
    initSelector();

    var car = initCarousel();

    /* banner 1 is live from the first frame */
    if (window.SapotrHeroTrades) window.SapotrHeroTrades.toggle(true);

    /* the two photographic banners nobody has reached yet can wait
       until the browser is idle */
    var rest = function () {
      var held = document.querySelectorAll('#hero-slides [data-img-when]');
      for (var i = 0; i < held.length; i++) {
        if (window.SapotrImages) window.SapotrImages.load(held[i]);
      }
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(rest, { timeout: 3500 });
    } else {
      window.addEventListener('load', function () { window.setTimeout(rest, 1400); });
    }

    window.SapotrHero = window.SapotrHero || {};
    window.SapotrHero.carousel = car;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
