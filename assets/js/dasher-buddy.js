(function () {
  var el = document.getElementById("dasher-buddy");
  if (!el) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  var MARGIN = 20;
  var NAV_HEIGHT = 80;
  var HOP_LEN = 140; // base zigzag segment length, px
  var HOP_JITTER = 0.25; // +/- 25%
  var ZIGZAG_ANGLE = 45; // degrees either side of the drift direction
  var SPEED = 90; // px per second while moving
  var TURN_DURATION = 0.35; // seconds to rotate in place at a node
  var MIN_PAUSE = 300;
  var MAX_PAUSE = 1400;

  var x, y; // current position (top-left of sprite)
  var driftDeg = 60; // overall diagonal drift direction, degrees (0 = right, 90 = down)
  var zigSign = 1; // alternates +1/-1 each hop
  var rotationDeg = 0; // current visual rotation (0 = sprite's native "facing down")
  var paused = document.hidden;
  var timer = null;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function toRad(deg) {
    return (deg * Math.PI) / 180;
  }

  function bounds() {
    var w = el.offsetWidth || 42;
    var h = el.offsetHeight || 58;
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

  function setTransform(px, py, rotDeg, duration) {
    el.style.transitionDuration = duration + "s";
    el.style.transform =
      "translate(" + px + "px, " + py + "px) rotate(" + rotDeg + "deg)";
  }

  function placeInitial() {
    var b = bounds();
    x = b.minX;
    y = b.minY;
    rotationDeg = 0;
    el.style.transition = "none";
    el.style.transform = "translate(" + x + "px, " + y + "px) rotate(0deg)";
    el.offsetHeight; // force reflow before re-enabling transitions
    el.style.transition = "";
  }

  function scheduleTimer(fn, ms) {
    timer = setTimeout(fn, ms);
  }

  function nextTarget() {
    var b = bounds();
    var angle = driftDeg + zigSign * ZIGZAG_ANGLE;
    var len = HOP_LEN * rand(1 - HOP_JITTER, 1 + HOP_JITTER);
    var rawX = x + Math.cos(toRad(angle)) * len;
    var rawY = y + Math.sin(toRad(angle)) * len;
    var nx = clamp(rawX, b.minX, b.maxX);
    var ny = clamp(rawY, b.minY, b.maxY);

    // Bounce: if a wall was hit, flip the drift so future hops head back inward.
    if (rawX !== nx) driftDeg = 180 - driftDeg;
    if (rawY !== ny) driftDeg = -driftDeg;
    driftDeg = ((driftDeg % 360) + 360) % 360;

    zigSign *= -1;
    return { nx: nx, ny: ny };
  }

  function step() {
    if (paused) return;

    var target = nextTarget();
    var dx = target.nx - x;
    var dy = target.ny - y;
    var dist = Math.hypot(dx, dy);

    if (dist < 1) {
      scheduleTimer(step, rand(MIN_PAUSE, MAX_PAUSE));
      return;
    }

    // Sprite's native artwork faces "down" (travel angle 90deg = no rotation).
    var travelDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    var newRotation = travelDeg - 90;

    // Turn in place first, then move in a straight line to the node.
    setTransform(x, y, newRotation, TURN_DURATION);
    rotationDeg = newRotation;

    scheduleTimer(function () {
      if (paused) return;
      var duration = clamp(dist / SPEED, 0.6, 4);
      x = target.nx;
      y = target.ny;
      setTransform(x, y, rotationDeg, duration);

      scheduleTimer(function () {
        scheduleTimer(step, rand(MIN_PAUSE, MAX_PAUSE));
      }, duration * 1000);
    }, TURN_DURATION * 1000);
  }

  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
    if (!paused) scheduleTimer(step, rand(MIN_PAUSE, MAX_PAUSE));
    else clearTimeout(timer);
  });

  window.addEventListener("resize", function () {
    var b = bounds();
    x = clamp(x, b.minX, b.maxX);
    y = clamp(y, b.minY, b.maxY);
    setTransform(x, y, rotationDeg, 0);
  });

  placeInitial();
  scheduleTimer(step, rand(MIN_PAUSE, MAX_PAUSE));
})();
