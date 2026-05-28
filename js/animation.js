const AnimationEngine = (() => {
  let _callbacks = [];
  let _rafId = null;
  let _running = false;

  function start() {
    if (_running) return;
    _running = true;
    function loop(now) {
      if (!_running) return;
      _callbacks.forEach(fn => fn(now));
      _rafId = requestAnimationFrame(loop);
    }
    _rafId = requestAnimationFrame(loop);
  }

  function stop() {
    _running = false;
    if (_rafId) cancelAnimationFrame(_rafId);
  }

  function add(fn) {
    if (!_callbacks.includes(fn)) _callbacks.push(fn);
    if (!_running) start();
  }

  function remove(fn) {
    _callbacks = _callbacks.filter(c => c !== fn);
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function tween({ duration = 1000, easing = easeInOut, onUpdate, onComplete }) {
    let playing = false;
    let paused = false;
    let startMs = 0;
    let elapsedPause = 0;

    const tick = (now) => {
      if (!playing || paused) return;
      const t = Math.min((now - startMs - elapsedPause) / duration, 1);
      const e = easing(t);
      if (onUpdate) onUpdate(e, t);
      if (t >= 1) {
        playing = false;
        remove(tick);
        if (onComplete) onComplete();
      }
    };

    return {
      play() {
        elapsedPause = 0;
        startMs = performance.now();
        paused = false;
        playing = true;
        add(tick);
      },
      pause() { paused = true; this._pauseMark = performance.now(); },
      resume() {
        if (!paused) return;
        elapsedPause += performance.now() - this._pauseMark;
        paused = false;
      },
      stop() {
        playing = false;
        paused = false;
        remove(tick);
      },
      progress(t) {
        const clamped = Math.max(0, Math.min(1, t));
        if (onUpdate) onUpdate(easing(clamped), clamped);
      },
      isPlaying() { return playing && !paused; }
    };
  }

  function multiPhaseAnimation(phases, onComplete) {
    let i = 0;
    let current = null;

    function runNext() {
      if (i >= phases.length) {
        if (onComplete) onComplete();
        return;
      }
      const p = phases[i++];
      current = tween({
        duration: p.duration,
        onUpdate: (e, t) => p.onUpdate && p.onUpdate(e, t),
        onComplete: () => {
          if (p.onComplete) p.onComplete();
          runNext();
        }
      });
      current.play();
    }

    return {
      start: runNext,
      stop() { if (current) current.stop(); },
      pause() { if (current) current.pause(); },
      resume() { if (current) current.resume(); }
    };
  }

  return { start, stop, add, remove, tween, easeInOut, multiPhaseAnimation };
})();
window.AnimationEngine = AnimationEngine;
