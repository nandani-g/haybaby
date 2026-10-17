(() => {
  const $ = (s) => document.querySelector(s);
  const safe = (fn) => { try { return fn(); } catch (e) { return null; } };

  /* ---------- Audio (muted by default, mute toggle required) ---------- */
  let ctx = null, muted = true;
  const muteBtn = $('#muteBtn');
  function note(freq, when = 0, dur = 0.5) {
    if (muted) return;
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.textContent = muted ? '🔇 Sound off' : '🔊 Sound on';
    muteBtn.setAttribute('aria-pressed', String(muted));
    if (!muted) { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); note(660); }
  });
  const lullaby = [392, 392, 494, 392, 523, 494, 392, 330, 349, 392];
  function playLullaby() {
    if (muted) return toast('Turn sound on (top right) to hear the lullaby 🎵');
    lullaby.forEach((f, i) => note(f, i * 0.45, 0.7));
  }
  $('#playLullaby').addEventListener('click', playLullaby);

  /* ---------- Eyes follow pointer / touch ---------- */
  const pip = $('#pip'), pL = $('#pupilL'), pR = $('#pupilR');
  function look(x, y) {
    const r = pip.getBoundingClientRect();
    const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    const d = Math.hypot(dx, dy) || 1, m = Math.min(10, d / 20);
    const ox = (dx / d) * m, oy = (dy / d) * m;
    pL.setAttribute('cx', 70 + ox); pL.setAttribute('cy', 115 + oy);
    pR.setAttribute('cx', 130 + ox); pR.setAttribute('cy', 115 + oy);
  }
  window.addEventListener('pointermove', (e) => look(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) look(t.clientX, t.clientY); }, { passive: true });

  /* ---------- Day / night toggle ---------- */
  const themeBtn = $('#themeBtn'), mouth = $('#mouth');
  themeBtn.addEventListener('click', () => {
    const night = document.body.classList.toggle('night');
    themeBtn.textContent = night ? '☀️ Day' : '🌙 Night';
    themeBtn.setAttribute('aria-pressed', String(night));
    mouth.setAttribute('d', night ? 'M80 182 Q100 176 122 182' : 'M78 178 Q100 192 124 176'); // sleepy vs happy
    note(night ? 330 : 523);
    safe(() => localStorage.setItem('pipTheme', night ? 'night' : 'day'));
  });
  if (safe(() => localStorage.getItem('pipTheme')) === 'night') themeBtn.click();

  /* ---------- Scroll reveal for story scenes ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); note(600 + Math.random() * 200, 0, 0.3); }
  }), { threshold: 0.3 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- Nightlights ---------- */
  document.querySelectorAll('.lamp').forEach((l) => l.addEventListener('click', () => { l.classList.toggle('on'); note(700); }));

  /* ---------- Block toy ---------- */
  const stack = $('#stack'); const colors = ['#ff9ec7', '#8fb8ff', '#ffd966', '#a8e6cf', '#d4a5ff'];
  $('#addBlock').addEventListener('click', () => {
    const b = document.createElement('div'); b.className = 'block';
    b.style.background = colors[stack.children.length % colors.length];
    b.style.marginLeft = (Math.random() * 24 - 12) + 'px';
    stack.appendChild(b); note(300 + stack.children.length * 40, 0, 0.2);
    if (stack.children.length === 10) toast('10 blocks! Pip giggles 🎉');
  });
  $('#resetBlocks').addEventListener('click', () => { stack.innerHTML = ''; });

  /* ---------- Hit counter ---------- */
  const od = $('#odometer');
  const n = (safe(() => parseInt(localStorage.getItem('pipDreams') || '1203', 10)) || 1203) + 1;
  safe(() => localStorage.setItem('pipDreams', n));
  od.textContent = String(n).padStart(4, '0');

  /* ---------- Easter egg: tap the star on Pip's cap 5 times ---------- */
  let taps = 0;
  $('#capStar').addEventListener('click', () => {
    taps++;
    if (taps >= 5) {
      taps = 0; pip.classList.toggle('asleep');
      toast(pip.classList.contains('asleep') ? 'Shhh... Pip fell asleep 💤' : 'Pip woke up! Giggle! 🎉');
      playLullaby();
    }
  });

  /* ---------- Sparkle cursor trail ---------- */
  const cv = $('#sparkles'), c = cv.getContext('2d'); let parts = [];
  const resize = () => { cv.width = innerWidth; cv.height = innerHeight; };
  resize(); addEventListener('resize', resize);
  const spawn = (x, y) => parts.push({ x, y, vx: (Math.random() - .5) * 1.5, vy: Math.random() * 1.5 + .3, life: 1 });
  addEventListener('pointermove', (e) => spawn(e.clientX, e.clientY));
  (function tick() {
    c.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter((p) => p.life > 0);
    parts.forEach((p) => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; c.globalAlpha = p.life; c.fillStyle = '#ffd966'; c.fillText('✦', p.x, p.y); });
    requestAnimationFrame(tick);
  })();

  /* ---------- Toast ---------- */
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status');
    document.body.appendChild(t); setTimeout(() => t.remove(), 2500);
  }
})();
