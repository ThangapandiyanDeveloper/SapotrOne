/* ============================================================
   SAPOTR — CENTRALISED IMAGE CONFIGURATION
   ------------------------------------------------------------
   Single source of truth for every photographic asset used on
   the site. To move to Cloudinary later, replace the values
   below with the Cloudinary URLs. Nothing else needs to change.

   Usage in markup:
     <img data-img="storyAvatar1" alt="...">        -> sets src
     <source data-img-src="heroB1Mobile">           -> sets srcset
     <div data-img-bg="problemPerson"></div>        -> sets background-image

   A <picture> (or any ancestor) carrying data-img-when="active" is
   skipped by the automatic pass and only resolved when the owning
   component asks for it — SapotrImages.load(el). The hero carousel
   uses this so banners 3 and 4 cost nothing on first paint.
   ============================================================ */
(function (window, document) {
  'use strict';

  var IMAGE_URLS = {
    /* --- Section 1: hero carousel -----------------------------
       Three intentional crops per photographic banner, generated
       from the client's originals: 1920x1080 landscape for laptop /
       desktop, 1280x960 for tablet, 840x1240 portrait for phones.
       Banner 2 is a drawn SVG map, so it needs no photograph.
       Replace these values with Cloudinary URLs when the CDN is
       ready — nothing outside this object refers to a hero file. */
    heroB1Desktop:      'assets/images/hero/b1-desktop.jpg',
    heroB1Tablet:       'assets/images/hero/b1-tablet.jpg',
    heroB1Mobile:       'assets/images/hero/b1-mobile.jpg',

    heroB3Desktop:      'assets/images/hero/b3-desktop.jpg',
    heroB3Tablet:       'assets/images/hero/b3-tablet.jpg',
    heroB3Mobile:       'assets/images/hero/b3-mobile.jpg',

    heroB4Desktop:      'assets/images/hero/b4-desktop.jpg',
    heroB4Tablet:       'assets/images/hero/b4-tablet.jpg',
    heroB4Mobile:       'assets/images/hero/b4-mobile.jpg',

    /* Banner 2 — the staff on the availability cards. Fourteen different
       people, one per card, each 256px square (well above the largest
       rendered size, so they stay crisp at 3x). The navy #0F1738 tee
       and the chest mark are part of each file.

       PENDING CLIENT ASSETS: composited from the existing library while
       the uniform shoot is outstanding. Replace each file in
       assets/images/hero/staff/ with a real photograph of that employee
       in the tee — same names, nothing else changes. */
    heroStaff01:        'assets/images/hero/staff/s01.jpg',
    heroStaff02:        'assets/images/hero/staff/s02.jpg',
    heroStaff03:        'assets/images/hero/staff/s03.jpg',
    heroStaff04:        'assets/images/hero/staff/s04.jpg',
    heroStaff05:        'assets/images/hero/staff/s05.jpg',
    heroStaff06:        'assets/images/hero/staff/s06.jpg',
    heroStaff07:        'assets/images/hero/staff/s07.jpg',
    heroStaff09:        'assets/images/hero/staff/s09.jpg',
    heroStaff10:        'assets/images/hero/staff/s10.jpg',
    heroStaff11:        'assets/images/hero/staff/s11.jpg',
    heroStaff12:        'assets/images/hero/staff/s12.jpg',
    heroStaff13:        'assets/images/hero/staff/s13.jpg',
    heroStaff14:        'assets/images/hero/staff/s14.jpg',
    heroStaff15:        'assets/images/hero/staff/s15.jpg',

    /* --- shared employee avatars (journey map, Why Sapotr) ---- */
    avatarEmployee1:    'assets/images/avatar-employee-1.jpg',
    avatarEmployee2:    'assets/images/avatar-employee-2.jpg',
    avatarEmployee3:    'assets/images/avatar-employee-3.jpg',
    avatarEmployee4:    'assets/images/avatar-employee-4.jpg',

    /* --- Section 2: the problem ------------------------------ */
    problemPerson:      'assets/images/problem-person.jpg',

    /* --- Section 3: how Sapotr fits into your everyday life -- */
    stepTap:            'assets/images/step-tap.jpg',
    stepAssign:         'assets/images/step-assign-otp.jpg',
    stepDone:           'assets/images/step-done.jpg',

    /* --- Section 5: explore services ------------------------- */
    serviceHomePersonal:  'assets/images/service-home-personal.jpg',
    serviceMoving:        'assets/images/service-moving.jpg',
    serviceEvents:        'assets/images/service-events.jpg',
    serviceCommunities:   'assets/images/service-communities.jpg',
    serviceMaintenance:   'assets/images/service-maintenance.jpg',

    /* --- Section 7: customer stories ------------------------- */
    storyAvatar1:       'assets/images/story-avatar-1.jpg',
    storyAvatar2:       'assets/images/story-avatar-2.jpg',
    storyAvatar3:       'assets/images/story-avatar-3.jpg',

    /* --- Section 8: FAQ ------------------------------------- */
    faqIllustration:    'assets/images/faq-illustration.svg',


    /* --- Brand assets (supplied by client) ------------------- */
    logoWordmark:       'assets/logos/sapotr-wordmark.png',
    logoMark:           'assets/logos/sapotr-mark.png'
  };

  /* A node is held back when it (or an ancestor) is marked
     data-img-when — its owner decides when the bytes are worth
     fetching. force:true ignores the hold. */
  function held(el, force) {
    if (force) return false;
    if (el.closest) return !!el.closest('[data-img-when]');
    /* very old engines: walk up by hand */
    for (var n = el; n; n = n.parentNode) {
      if (n.getAttribute && n.getAttribute('data-img-when') !== null) return true;
    }
    return false;
  }

  /* Resolve every unresolved [data-img] / [data-img-src] / [data-img-bg]
     node. Safe to call many times — resolved nodes are skipped. */
  function resolve(root, opts) {
    var scope = root || document;
    var force = !!(opts && opts.force);

    /* <source> first: a browser that has already picked an <img> src
       will not re-evaluate the picture, so the candidates must be in
       place before the img gets its own src. */
    var srcs = scope.querySelectorAll('source[data-img-src]:not([data-img-done])');
    for (var s = 0; s < srcs.length; s++) {
      var src = srcs[s];
      if (held(src, force)) continue;
      var srcUrl = IMAGE_URLS[src.getAttribute('data-img-src')];
      if (srcUrl) { src.setAttribute('srcset', srcUrl); src.setAttribute('data-img-done', ''); }
    }

    var imgs = scope.querySelectorAll('img[data-img]:not([data-img-done])');
    for (var i = 0; i < imgs.length; i++) {
      var el = imgs[i];
      if (held(el, force)) continue;
      var url = IMAGE_URLS[el.getAttribute('data-img')];
      if (url) { el.setAttribute('src', url); el.setAttribute('data-img-done', ''); }
    }

    var bgs = scope.querySelectorAll('[data-img-bg]:not([data-img-bg-done])');
    for (var j = 0; j < bgs.length; j++) {
      var node = bgs[j];
      if (held(node, force)) continue;
      var bgUrl = IMAGE_URLS[node.getAttribute('data-img-bg')];
      if (bgUrl) {
        node.style.backgroundImage = 'url("' + bgUrl + '")';
        node.setAttribute('data-img-bg-done', '');
      }
    }
  }

  /* Resolve a held-back subtree now, and drop the hold so a later
     automatic pass does not have to special-case it. */
  function load(el) {
    if (!el) return;
    resolve(el, { force: true });
    if (el.removeAttribute) el.removeAttribute('data-img-when');
  }

  window.SapotrImages = {
    urls: IMAGE_URLS,
    get: function (k) { return IMAGE_URLS[k]; },
    resolve: resolve,
    load: load
  };

  /* convenience alias — the same object under the name used in the brief */
  window.IMAGE_ASSETS = IMAGE_URLS;

  document.addEventListener('DOMContentLoaded', function () { resolve(); });
})(window, document);
