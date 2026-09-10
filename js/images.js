/* ============================================================
   SAPOTR — CENTRALISED IMAGE CONFIGURATION
   ------------------------------------------------------------
   Single source of truth for every photographic asset used on
   the site. To move to Cloudinary later, replace the values
   below with the Cloudinary URLs. Nothing else needs to change.

   Usage in markup:
     <img data-img="storyMarkD" alt="...">         -> sets src
     <source data-img-src="heroB1Tall">             -> sets srcset
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
       The hero fills the viewport the header leaves behind, so the
       banner's shape follows the device: roughly 0.6 on a phone,
       0.85 on a tall tablet, 1.8-2.4 on a laptop. Hence one crop per
       shape rather than per width — see the <picture> in index.html,
       which picks by viewport aspect as well as width.

       Banner 2 is a drawn SVG map, so it needs no photograph.
       Replace these values with Cloudinary URLs when the CDN is
       ready — nothing outside this object refers to a hero file. */
    heroB1Wide:         'assets/images/hero/b1-wide.jpg',     /* retail counter */
    heroB1Square:       'assets/images/hero/b1-square.jpg',
    heroB1Tall:         'assets/images/hero/b1-tall.jpg',

    heroB3Wide:         'assets/images/hero/b3-wide.jpg',     /* chef at the pass */
    heroB3Square:       'assets/images/hero/b3-square.jpg',
    heroB3Tall:         'assets/images/hero/b3-tall.jpg',

    heroB4Wide:         'assets/images/hero/b4-wide.jpg',     /* logistics at scale */
    heroB4Square:       'assets/images/hero/b4-square.jpg',
    heroB4Tall:         'assets/images/hero/b4-tall.jpg',

    /* Banner 2 — the staff on the availability cards. Fourteen
       different people, one per card, sized down from the client's own
       photographs in assets/Staffs (already in the navy SAPOTR tee with
       the wordmark on the chest). 168x224, four times the largest
       rendered size, so they stay crisp at 3x. */
    heroStaff01:        'assets/images/hero/staff/s01.jpg',
    heroStaff02:        'assets/images/hero/staff/s02.jpg',
    heroStaff03:        'assets/images/hero/staff/s03.jpg',
    heroStaff04:        'assets/images/hero/staff/s04.jpg',
    heroStaff05:        'assets/images/hero/staff/s05.jpg',
    heroStaff06:        'assets/images/hero/staff/s06.jpg',
    heroStaff07:        'assets/images/hero/staff/s07.jpg',
    heroStaff08:        'assets/images/hero/staff/s08.jpg',
    heroStaff09:        'assets/images/hero/staff/s09.jpg',
    heroStaff10:        'assets/images/hero/staff/s10.jpg',
    heroStaff11:        'assets/images/hero/staff/s11.jpg',
    heroStaff12:        'assets/images/hero/staff/s12.jpg',
    heroStaff13:        'assets/images/hero/staff/s13.jpg',
    heroStaff14:        'assets/images/hero/staff/s14.jpg',

    /* --- shared employee avatars (journey map, Why Sapotr) ---- */
    avatarEmployee1:    'assets/Staffs/Male1.png',
    avatarEmployee2:    'assets/Staffs/Female1.png',
    avatarEmployee3:    'assets/Staffs/Male2.png',
    avatarEmployee4:    'assets/Staffs/Female2.png',

    /* --- Section 2: the problem ------------------------------ */
    problemPerson:      'assets/images/problem-person.jpg',

    /* --- Section 3: how Sapotr fits into your everyday life -- */
    stepTap:            'assets/images/step-tap.jpg',
    stepAssign:         'assets/images/step-assign-otp.jpg',
    stepDone:           'assets/images/step-done.jpg',

    /* --- Section 5: explore business industries --------------
       One photograph per industry card.

       exploreHospitality and exploreOther are card-sized crops
       (880x605 — the card's 16/11 box at 2x) cut from the client's
       originals, which were 3.5 MB and 9.9 MB portraits: far too
       heavy for a 300px card, and framed wrong for a landscape box.

       Retail and warehousing point at the hero's own banners. Banner
       1 is decoded before the rail is ever reached, so those cards
       cost no extra bytes.

       exploreEducation is a STAND-IN. The asset library holds no
       school, university or sports-event photograph, so the closest
       relevant existing image (an institutional building) is used.
       Replace it here when the client supplies real imagery. */
    exploreEvents:        'assets/images/service-events.jpg',
    exploreHospitality:   'assets/images/explore/hospitality.jpg',
    exploreRetail:        'assets/images/hero/b1-wide.jpg',
    exploreWarehousing:   'assets/images/hero/b4-wide.jpg',
    exploreDelivery:      'assets/images/service-moving.jpg',
    exploreEducation:     'assets/images/service-communities.jpg',
    exploreConstruction:  'assets/images/service-maintenance.jpg',
    exploreCleaning:      'assets/images/service-home-personal.jpg',
    exploreOther:         'assets/images/explore/other-business.jpg',

    /* --- Section 7: customer stories -------------------------
       One portrait per story — nine different people, none of them
       reused from anywhere else on the site. Each is cropped square
       and centred on the face at 320x320, roughly six times the
       50px the avatar renders at, so it stays crisp at 3x. */
    storyMarkD:         'assets/images/stories/mark-d.jpg',
    storySarahT:        'assets/images/stories/sarah-t.jpg',
    storyJamesL:        'assets/images/stories/james-l.jpg',
    storyPriyaS:        'assets/images/stories/priya-s.jpg',
    storyDanielR:       'assets/images/stories/daniel-r.jpg',
    storyEmmaW:         'assets/images/stories/emma-w.jpg',
    storyChrisM:        'assets/images/stories/chris-m.jpg',
    storyAlexK:         'assets/images/stories/alex-k.jpg',
    storyTomB:          'assets/images/stories/tom-b.jpg',

    /* --- Section 8: FAQ ------------------------------------- */
    faqIllustration:    'assets/images/faq-illustration.svg',

    /* --- Section 9: final CTA -------------------------------
       New asset, used nowhere else: a manager walking the aisle with
       the extra staff member she booked — the closing panel's whole
       argument in one frame. 1280x900 so the visual card stays sharp
       at 2x without paying for a hero-sized file. */
    ctaTeamAtWork:      'assets/images/cta/nz-team-at-work.jpg',


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
