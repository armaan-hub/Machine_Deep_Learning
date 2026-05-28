const UIShared = (() => {
  function saveHash(key, val) {
    const params = new URLSearchParams((location.hash || '#').slice(1));
    params.set(key, typeof val === 'string' ? val : JSON.stringify(val));
    location.hash = params.toString();
  }

  function loadHash(key) {
    const params = new URLSearchParams((location.hash || '#').slice(1));
    if (!params.has(key)) return null;
    const raw = params.get(key);
    try { return JSON.parse(raw); } catch { return raw; }
  }

  function setupKeyboardShortcuts(map) {
    const handler = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const key = e.key === ' ' ? 'Space' : e.key;
      if (map[key]) {
        e.preventDefault();
        map[key](e);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }

  function setupDrag(canvas, onMove, options = {}) {
    const hitTest = options.hitTest || (() => true);
    let active = false;

    function evtPoint(e) {
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top, e];
    }

    function down(e) {
      const [x, y] = evtPoint(e);
      if (!hitTest(x, y, e)) return;
      active = true;
      canvas.setPointerCapture(e.pointerId);
      onMove(x, y, true, e);
    }
    function move(e) {
      if (!active) return;
      const [x, y] = evtPoint(e);
      onMove(x, y, false, e);
    }
    function up(e) {
      if (!active) return;
      active = false;
      canvas.releasePointerCapture(e.pointerId);
    }

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    };
  }

  function createPredictReveal(container, question, options, correctIndex, explanation) {
    container.innerHTML = '';
    const q = document.createElement('div');
    q.className = 'exercise-question';
    q.textContent = question;
    const opts = document.createElement('div');
    opts.className = 'exercise-options';
    const reveal = document.createElement('div');
    reveal.className = 'exercise-reveal';
    let selected = -1;

    options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'exercise-btn';
      b.textContent = opt;
      b.onclick = () => {
        selected = i;
        opts.querySelectorAll('button').forEach((x, j) => x.classList.toggle('active', i === j));
      };
      opts.appendChild(b);
    });

    const revealBtn = document.createElement('button');
    revealBtn.className = 'exercise-btn';
    revealBtn.textContent = 'Reveal';
    revealBtn.onclick = () => {
      const ok = selected === correctIndex;
      reveal.textContent = `${ok ? '✅ Correct.' : '❌ Not quite.'} ${explanation}`;
    };

    container.append(q, opts, revealBtn, reveal);
    return {
      reveal: () => revealBtn.click(),
      reset: () => { selected = -1; reveal.textContent = ''; opts.querySelectorAll('button').forEach(x => x.classList.remove('active')); }
    };
  }

  function updatePanel(el, content) {
    if (!el) return;
    el.textContent = content == null ? '' : String(content);
  }

  return { saveHash, loadHash, setupKeyboardShortcuts, setupDrag, createPredictReveal, updatePanel };
})();
window.UIShared = UIShared;
