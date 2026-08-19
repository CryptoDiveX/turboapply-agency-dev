/* Supplied lead-flow animation, integrated for /integrations/ cover 2026-08-08. */
/* ============================================================
   Lead flow diagram, particle animation
   No dependencies. Safe to load with <script defer>.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- tunables ---------- */
  var CFG = {
    sourceMs: 950,   // channel  -> website
    midMs:    620,   // website  -> n8n
    branchMs: 1150,  // n8n      -> the four destinations
    pauseMs:  240,   // beat while a card lights up
    restMs:   800,   // blank beat before the next lead appears
    tail:     95,    // comet tail length in SVG units
    dotR:     5,     // particle radius
    haloR:    10
  };

  var SVG_NS = "http://www.w3.org/2000/svg";

  var SOURCES = [
    { path: "lf-src-0", card: "lf-card-fb" },
    { path: "lf-src-1", card: "lf-card-google" },
    { path: "lf-src-2", card: "lf-card-other" }
  ];
  var MID = { path: "lf-mid", card: "lf-card-n8n" };
  var SITE_CARD = "lf-card-site";
  var BRANCHES = [
    { path: "lf-br-0", card: "lf-card-crm" },
    { path: "lf-br-1", card: "lf-card-email" },
    { path: "lf-br-2", card: "lf-card-sales" },
    { path: "lf-br-3", card: "lf-card-analytics" }
  ];

  function init(root) {
    var svg = root.querySelector("svg");
    if (!svg) return;

    var trailLayer = svg.querySelector(".lf-trails");
    var dotLayer = svg.querySelector(".lf-dots");
    var trails = {};

    /* build one tail overlay per connector */
    Array.prototype.forEach.call(svg.querySelectorAll(".lf-line"), function (line) {
      var clone = line.cloneNode(false);
      clone.removeAttribute("id");
      clone.removeAttribute("marker-end");
      clone.setAttribute("class", "lf-trail");
      trailLayer.appendChild(clone);
      trails[line.id] = clone;
    });

    var reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // static diagram, lines stay calm

    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.05 }).observe(root);
    }

    /* ---------- helpers ---------- */

    function wait(ms) {
      return new Promise(function (r) { setTimeout(r, ms); });
    }

    function idle() {
      // hold the loop while the tab is hidden or the block is off screen
      return new Promise(function (resolve) {
        (function check() {
          if (visible && !document.hidden) return resolve();
          setTimeout(check, 400);
        })();
      });
    }

    function pulse(id) {
      var card = svg.querySelector("#" + id);
      if (!card) return;
      card.classList.add("is-hot");
      setTimeout(function () { card.classList.remove("is-hot"); }, 720);
    }

    function makeDot() {
      var g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", "lf-dot");
      var halo = document.createElementNS(SVG_NS, "circle");
      halo.setAttribute("class", "lf-dot-halo");
      halo.setAttribute("r", CFG.haloR);
      var core = document.createElementNS(SVG_NS, "circle");
      core.setAttribute("class", "lf-dot-core");
      core.setAttribute("r", CFG.dotR);
      g.appendChild(halo);
      g.appendChild(core);
      dotLayer.appendChild(g);
      return g;
    }

    function ease(t) { // gentle in, gentle out
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /* animates one particle along one connector */
    function travel(pathId, duration) {
      return new Promise(function (resolve) {
        var path = svg.querySelector("#" + pathId);
        var trail = trails[pathId];
        var len = path.getTotalLength();
        var dot = makeDot();

        trail.style.strokeDasharray = CFG.tail + " " + (len + CFG.tail);
        trail.style.strokeDashoffset = CFG.tail;
        trail.classList.remove("is-fading");
        trail.classList.add("is-live");

        var t0 = null;
        function frame(now) {
          if (t0 === null) t0 = now;
          var t = Math.min(1, (now - t0) / duration);
          var head = ease(t) * len;
          var p = path.getPointAtLength(head);
          dot.setAttribute("transform", "translate(" + p.x + "," + p.y + ")");
          trail.style.strokeDashoffset = CFG.tail - head;
          if (t < 1) {
            requestAnimationFrame(frame);
          } else {
            dot.classList.add("is-out");
            trail.classList.remove("is-live");
            trail.classList.add("is-fading");
            setTimeout(function () {
              if (dot.parentNode) dot.parentNode.removeChild(dot);
            }, 400);
            resolve();
          }
        }
        requestAnimationFrame(frame);
      });
    }

    /* ---------- the loop ---------- */

    var lastSource = -1;
    function pickSource() {
      var i;
      do { i = Math.floor(Math.random() * SOURCES.length); }
      while (i === lastSource && SOURCES.length > 1);
      lastSource = i;
      return i;
    }

    function cycle() {
      var s = SOURCES[pickSource()];
      pulse(s.card);
      return travel(s.path, CFG.sourceMs)
        .then(function () {
          pulse(SITE_CARD);
          return wait(CFG.pauseMs);
        })
        .then(function () { return travel(MID.path, CFG.midMs); })
        .then(function () {
          pulse(MID.card);
          return wait(CFG.pauseMs);
        })
        .then(function () {
          // one lead becomes four, all four move at the same time
          return Promise.all(BRANCHES.map(function (b) {
            return travel(b.path, CFG.branchMs).then(function () { pulse(b.card); });
          }));
        })
        .then(function () { return wait(CFG.restMs); });
    }

    (function run() {
      idle().then(cycle).then(run);
    })();
  }

  function boot() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-lf-root]"), init
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
