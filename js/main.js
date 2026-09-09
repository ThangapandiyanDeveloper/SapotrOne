/* ============================================================
   SAPOTR — INTERACTIONS
   Navigation, booking journey, service selector, stories,
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
    var INTERVAL = 3400;

    function show(i) {
      index = (i + steps.length) % steps.length;
      if (window.SapotrAnim) window.SapotrAnim.markJourney(index);
    }

    function start() {
      if (reduced.matches || timer) return;
      timer = window.setInterval(function () {
        if (!paused) show(index + 1);
      }, INTERVAL);
    }

    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }

    steps.forEach(function (step, i) {
      var btn = qs('.step__btn', step);
      if (!btn) return;

      btn.addEventListener('click', function () { paused = true; show(i); });
      btn.addEventListener('focus', function () { paused = true; show(i); });
      step.addEventListener('mouseenter', function () { paused = true; show(i); });
    });

    journey.addEventListener('mouseleave', function () { paused = false; });

    show(0);

    /* only run while the section is actually on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) start(); else stop();
        });
      }, { threshold: 0.25 }).observe(journey);
    } else {
      start();
    }
  }

  /* ==========================================================
     3. CAROUSEL — shared engine
     Used by the service selector and the customer stories.
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
     4. CUSTOMER STORIES — render then carousel
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
     5. FAQ ACCORDION
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
     6. FINAL CTA — Try Now
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
     7. IN-PAGE LINKS — respect a sticky header
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
    initStories();
    initAccordion();
    initCtaButton();
    initAnchors();

    createCarousel({
      track: '#svc-track',
      dots: '#svc-dots',
      prev: '[data-svc-prev]',
      next: '[data-svc-next]',
      label: 'Service',
      auto: true,
      interval: 4200
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
