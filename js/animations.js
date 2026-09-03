/* ============================================================
   SAPOTR — ANIMATIONS
   Scroll reveals, statistic count-up, chat playback,
   journey progress. Vanilla JS, no dependencies.
   ============================================================ */
(function (window, document) {
  'use strict';

  var reduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  var hasIO = 'IntersectionObserver' in window;

  /* ---------------------------------------------------------
     1. SCROLL REVEALS
     Adds .is-in once an element scrolls into view. The optional
     data-delay attribute (ms) staggers items inside a group.
     --------------------------------------------------------- */
  function initReveals() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!hasIO || reduced.matches) {
      for (var n = 0; n < items.length; n++) items[n].classList.add('is-in');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay'), 10) || 0;
        el.style.transitionDelay = delay + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    for (var i = 0; i < items.length; i++) io.observe(items[i]);
  }

  /* ---------------------------------------------------------
     2. STATISTIC COUNT-UP
     Counts 0 -> data-count when the numbers section is seen.
     Numbers themselves are never changed, only animated.
     --------------------------------------------------------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';

    if (reduced.matches) { el.textContent = target + suffix; return; }

    var duration = 1600;
    var start = null;

    function frame(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      /* easeOutExpo — fast, then settles */
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  function initCounters() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;

    if (!hasIO) {
      for (var n = 0; n < nums.length; n++) countUp(nums[n]);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    for (var i = 0; i < nums.length; i++) io.observe(nums[i]);
  }

  /* ---------------------------------------------------------
     3. CHAT PLAYBACK
     Plays the conversation once, in order, with the typing
     indicator shown only between the question and the reply.
     --------------------------------------------------------- */
  function initChat() {
    var chat = document.querySelector('.chat');
    if (!chat) return;

    var bubbles = [].slice.call(chat.querySelectorAll('.bubble'));
    if (!bubbles.length) return;

    if (reduced.matches || !hasIO) {
      bubbles.forEach(function (b) {
        if (b.classList.contains('bubble--typing')) b.classList.add('is-hidden');
        else b.classList.add('is-shown');
      });
      return;
    }

    /* reserve the panel height so playback does not shift the page */
    var body = chat.querySelector('.chat__body');
    if (body) body.style.minHeight = body.offsetHeight + 'px';

    var timers = [];
    var played = false;

    function play() {
      if (played) return;
      played = true;

      var t = 260;
      bubbles.forEach(function (bubble) {
        var isTyping = bubble.classList.contains('bubble--typing');

        timers.push(window.setTimeout(function () {
          bubble.classList.add('is-shown');
        }, t));

        if (isTyping) {
          /* show the dots for a beat, then swap them for the reply */
          timers.push(window.setTimeout(function () {
            bubble.classList.add('is-hidden');
          }, t + 1150));
          t += 1150;
        } else {
          t += 900;
        }
      });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { play(); io.disconnect(); }
      });
    }, { threshold: 0.3 });

    io.observe(chat);
  }

  /* ---------------------------------------------------------
     4. PARALLAX (used by the final CTA)
     Layers drift a few pixels with the cursor and on scroll,
     which gives the showcase depth without moving content far
     enough to distract. Pointer-driven motion only on devices
     that actually have a pointer.
     --------------------------------------------------------- */
  function initParallax(root) {
    if (!root || reduced.matches) return;

    /* only nodes without a CSS transform animation of their own —
       an animation would win over the inline transform set here */
    var layers = [].slice.call(root.querySelectorAll('[data-depth]'));
    if (!layers.length) return;

    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    root.setAttribute('data-parallax', '');

    var mx = 0, my = 0, sy = 0, queued = false;

    function paint() {
      queued = false;
      for (var i = 0; i < layers.length; i++) {
        var d = parseFloat(layers[i].getAttribute('data-depth')) || 0;
        var k = d / 100;
        layers[i].style.transform =
          'translate3d(' + (mx * k).toFixed(2) + 'px,' + (my * k + sy * k * 0.9).toFixed(2) + 'px,0)';
      }
    }

    function schedule() {
      if (!queued) { queued = true; window.requestAnimationFrame(paint); }
    }

    if (fine) {
      root.addEventListener('mousemove', function (e) {
        var r = root.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width - 0.5) * 2 * 16;
        my = ((e.clientY - r.top) / r.height - 0.5) * 2 * 11;
        schedule();
      });
      root.addEventListener('mouseleave', function () { mx = 0; my = 0; schedule(); });
    }

    /* gentle scroll drift while the block is on screen */
    var onScroll = function () {
      var r = root.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      sy = (r.top / window.innerHeight) * -22;
      schedule();
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------------------------------------------------
     5. JOURNEY PROGRESS
     Marks every step before the active one as done, so the
     connecting line reads as progress.
     --------------------------------------------------------- */
  function markJourney(activeIndex) {
    var steps = document.querySelectorAll('#journey .step');
    for (var i = 0; i < steps.length; i++) {
      steps[i].classList.toggle('is-active', i === activeIndex);
      steps[i].classList.toggle('is-done', i < activeIndex);
      var btn = steps[i].querySelector('.step__btn');
      if (btn) btn.setAttribute('aria-expanded', i === activeIndex ? 'true' : 'false');
    }
  }

  window.SapotrAnim = {
    reduced: reduced,
    markJourney: markJourney,
    init: function () {
      initReveals();
      initCounters();
      initChat();
      initParallax(document.querySelector(".hero"));
      initParallax(document.querySelector(".final__stage"));
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.SapotrAnim.init);
  } else {
    window.SapotrAnim.init();
  }
})(window, document);
