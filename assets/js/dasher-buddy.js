(function () {
  var el = document.getElementById("dasher-buddy");
  if (!el) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  var MARGIN = 24;
  var NAV_HEIGHT = 72;
  var MIN_HOP = 120;
  var MAX_HOP = 380;
  var SPEED = 70; // px per second
  var MIN_PAUSE = 400;
  var MAX_PAUSE = 2200;

  var x = 0;
  var y = 0;
  var paused = document.hidden;
  var timer = null;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function bounds() {
    var w = el.offsetWidth || 56;
    var h = el.offsetHeight || 56;
    return {
      minX: MARGIN,
      maxX: Math.max(MARGIN, window.innerWidth - w - MARGIN),
      minY: NAV_HEIGHT,
      maxY: Math.max(NAV_HEIGHT, window.innerHeight - h - MARGIN),
    };
  }

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  function placeInitial() {
    var b = bounds();
    x = rand(b.minX, b.maxX);
    y = rand(b.minY, b.maxY);
    el.style.transition = "none";
    el.style.transform = "translate(" + x + "px, " + y + "px)";
    el.offsetHeight; // force reflow so the next move animates
    el.style.transition = "";
  }

  function scheduleNext(delay) {
    clearTimeout(timer);
    timer = setTimeout(step, delay);
  }

  function step() {
    if (paused) return;

    var b = bounds();
    var angle = rand(0, Math.PI * 2);
    var hop = rand(MIN_HOP, MAX_HOP);
    var nx = clamp(x + Math.cos(angle) * hop, b.minX, b.maxX);
    var ny = clamp(y + Math.sin(angle) * hop, b.minY, b.maxY);
    var dist = Math.hypot(nx - x, ny - y);
    var duration = clamp(dist / SPEED, 1.2, 6);

    x = nx;
    y = ny;
    el.style.transitionDuration = duration + "s";
    el.style.transform = "translate(" + x + "px, " + y + "px)";

    scheduleNext(duration * 1000 + rand(MIN_PAUSE, MAX_PAUSE));
  }

  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
    if (!paused) scheduleNext(rand(MIN_PAUSE, MAX_PAUSE));
    else clearTimeout(timer);
  });

  window.addEventListener("resize", function () {
    var b = bounds();
    x = clamp(x, b.minX, b.maxX);
    y = clamp(y, b.minY, b.maxY);
    el.style.transform = "translate(" + x + "px, " + y + "px)";
  });

  placeInitial();
  scheduleNext(rand(MIN_PAUSE, MAX_PAUSE));
})();
