/* ============================================================
   SAPOTR — CENTRALISED IMAGE CONFIGURATION
   ------------------------------------------------------------
   Single source of truth for every photographic asset used on
   the site. To move to Cloudinary later, replace the values
   below with the Cloudinary URLs. Nothing else needs to change.

   Usage in markup:
     <img data-img="heroEmployee" alt="...">        -> sets src
     <div data-img-bg="serviceMoving"></div>        -> sets background-image
   ============================================================ */
(function (window, document) {
  'use strict';

  var IMAGE_URLS = {
    /* --- Hero: product showcase ------------------------------ */
    heroEmployee:       'assets/images/hero-employee.jpg',
    avatarEmployee1:    'assets/images/avatar-employee-1.jpg',
    avatarEmployee2:    'assets/images/avatar-employee-2.jpg',
    avatarEmployee3:    'assets/images/avatar-employee-3.jpg',
    avatarEmployee4:    'assets/images/avatar-employee-4.jpg',

    /* --- Section 2: the problem ------------------------------ */
    problemPerson:      'assets/images/problem-person.jpg',

    /* --- Section 3: how Sapotr fits into your everyday life -- */
    stepTap:            'assets/images/step-tap.jpg',
    stepAssign:         'assets/images/step-assign.jpg',
    stepDone:           'assets/images/step-done.jpg',

    /* --- Section 5: explore services ------------------------- */
    serviceHomePersonal:  'assets/images/service-home-personal.jpg',
    serviceMoving:        'assets/images/service-moving.jpg',
    serviceEvents:        'assets/images/service-events.jpg',
    serviceCommunities:   'assets/images/service-communities.jpg',
    serviceMaintenance:   'assets/images/service-maintenance.jpg',

    /* --- Brand assets (supplied by client) ------------------- */
    logoWordmark:       'assets/logos/sapotr-wordmark.png',
    logoMark:           'assets/logos/sapotr-mark.png'
  };

  /* Resolve every unresolved [data-img] / [data-img-bg] node.
     Safe to call many times — resolved nodes are skipped. */
  function resolve(root) {
    var scope = root || document;

    var imgs = scope.querySelectorAll('img[data-img]:not([data-img-done])');
    for (var i = 0; i < imgs.length; i++) {
      var el = imgs[i];
      var url = IMAGE_URLS[el.getAttribute('data-img')];
      if (url) { el.setAttribute('src', url); el.setAttribute('data-img-done', ''); }
    }

    var bgs = scope.querySelectorAll('[data-img-bg]:not([data-img-bg-done])');
    for (var j = 0; j < bgs.length; j++) {
      var node = bgs[j];
      var bgUrl = IMAGE_URLS[node.getAttribute('data-img-bg')];
      if (bgUrl) {
        node.style.backgroundImage = 'url("' + bgUrl + '")';
        node.setAttribute('data-img-bg-done', '');
      }
    }
  }

  window.SapotrImages = { urls: IMAGE_URLS, get: function (k) { return IMAGE_URLS[k]; }, resolve: resolve };

  document.addEventListener('DOMContentLoaded', function () { resolve(); });
})(window, document);
