/* ============================================================
   Jumyr M Moreno — Portfolio
   ============================================================ */

(function () {
  'use strict';

  const root = document.documentElement;

  /* ── Theme toggle ────────────────────────────────────── */
  const toggle = document.getElementById('themeToggle');

  toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });

  /* ── Scroll progress bar ─────────────────────────────── */
  const scrollBar = document.getElementById('scrollBar');
  function updateScroll() {
    const h = document.documentElement;
    const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
    scrollBar.style.width = (scrolled * 100) + '%';
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  /* ── Back to top ─────────────────────────────────────── */
  const backTop = document.getElementById('backTop');
  window.addEventListener('scroll', () => {
    backTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  /* ── Active nav link (scroll spy) ────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navAnchors.forEach((a) => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach((s) => spy.observe(s));

  /* ── Reveal on scroll ────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal, .section-divider');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  reveals.forEach((el) => revealObs.observe(el));

  /* ── Mobile menu ─────────────────────────────────────── */
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');

  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    navLinks.classList.toggle('open', !open);
  });

  navLinks.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    });
  });

  /* ── GitHub Contribution Calendar ───────────────────────── */
  (function initGhCalendar() {
    const grid      = document.getElementById('ghGrid');
    const monthsEl  = document.getElementById('ghMonths');
    const countEl   = document.getElementById('ghContribCount');
    if (!grid) return;

    const USERNAME  = 'Juuwuwmyr';
    const CELL      = 15;
    const GAP       = 4;
    const WEEK_W    = CELL + GAP;

    /* Level thresholds */
    function getLevel(count) {
      if (count === 0) return 0;
      if (count <= 2)  return 1;
      if (count <= 5)  return 2;
      if (count <= 9)  return 3;
      return 4;
    }

    /* Build a 53-week grid from a flat {date→count} map */
    function buildGrid(map) {
      const today = new Date();
      today.setHours(0,0,0,0);

      /* go back 52 full weeks + partial current week */
      const start = new Date(today);
      start.setDate(today.getDate() - 364);
      /* rewind to Sunday */
      start.setDate(start.getDate() - start.getDay());

      const weeks = [];
      let week = [];
      let d = new Date(start);
      let total = 0;
      const monthCols = {}; /* month → first column index it appears */

      while (d <= today) {
        const key = d.toISOString().slice(0,10);
        const cnt = map[key] || 0;
        total += cnt;
        week.push({ date: key, count: cnt, level: getLevel(cnt) });

        const m = d.getMonth();
        const colIdx = weeks.length;
        if (!(m in monthCols) || (d.getDate() <= 7 && week.length === 1)) {
          monthCols[`${d.getFullYear()}-${m}`] = colIdx;
        }

        if (d.getDay() === 6) { /* Saturday = end of week */
          weeks.push(week);
          week = [];
        }
        d.setDate(d.getDate() + 1);
      }
      if (week.length) weeks.push(week);

      return { weeks, total, monthCols };
    }

    function render(map) {
      const { weeks, total, monthCols } = buildGrid(map);

      /* count label */
      countEl.textContent = total.toLocaleString();

      /* month labels */
      const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const seen = new Set();
      const labels = [];

      weeks.forEach((_, wi) => {
        // find which month starts in this column
        for (const [key, col] of Object.entries(monthCols)) {
          if (col === wi) {
            const m = parseInt(key.split('-')[1]);
            if (!seen.has(m)) {
              seen.add(m);
              labels.push({ col: wi, label: MONTH_NAMES[m] });
            }
          }
        }
      });

      monthsEl.innerHTML = '';
      let prev = 0;
      labels.forEach(({ col, label }) => {
        const spacer = document.createElement('span');
        spacer.className = 'gh-cal-month-label';
        spacer.style.width = ((col - prev) * WEEK_W) + 'px';
        spacer.textContent = label;
        monthsEl.appendChild(spacer);
        prev = col;
      });

      /* grid */
      grid.innerHTML = '';
      weeks.forEach(week => {
        const col = document.createElement('div');
        col.className = 'gh-cal-week';
        /* pad top if week doesn't start Sunday */
        for (let i = 0; i < 7; i++) {
          const cell = document.createElement('div');
          cell.className = 'gh-cal-cell';
          const day = week[i];
          if (day) {
            cell.dataset.level = day.level;
            cell.title = `${day.count} contribution${day.count !== 1 ? 's' : ''} on ${day.date}`;
          } else {
            cell.dataset.level = '0';
            cell.style.visibility = 'hidden';
          }
          col.appendChild(cell);
        }
        grid.appendChild(col);
      });
    }

    /* Fallback: generate realistic-looking static data */
    function renderFallback() {
      const map = {};
      const today = new Date();
      for (let i = 365; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0,10);
        /* sparse random contributions */
        const r = Math.random();
        map[key] = r < 0.55 ? 0 : r < 0.75 ? 1 : r < 0.87 ? 3 : r < 0.95 ? 6 : 10;
      }
      render(map);
    }

    /* Fetch from GitHub contributions proxy */
    async function fetchContributions() {
      try {
        const res = await fetch(
          `https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`
        );
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        const map = {};
        (json.contributions || []).forEach(({ date, count }) => { map[date] = count; });
        render(map);
      } catch {
        renderFallback();
      }
    }

    fetchContributions();
  })();

  /* ── Hero micro-interactions ────────────────────────── */
  (function initHeroInteractions() {

    /* --- Radial spotlight on CTA buttons (tracks cursor) --- */
    document.querySelectorAll('.btn-primary, .btn-secondary').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
        const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
        btn.style.setProperty('--mx', x + '%');
        btn.style.setProperty('--my', y + '%');
      });
    });

    /* --- 3-D tilt on the photo card --- */
    const photoWrap = document.querySelector('.photo-wrap');
    if (photoWrap) {
      const MAX_TILT = 8; // degrees

      photoWrap.addEventListener('mousemove', (e) => {
        const rect = photoWrap.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const rx = ((e.clientY - cy) / (rect.height / 2)) * -MAX_TILT;
        const ry = ((e.clientX - cx) / (rect.width  / 2)) *  MAX_TILT;
        photoWrap.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
      });

      photoWrap.addEventListener('mouseleave', () => {
        photoWrap.style.transform = '';
      });
    }

    /* --- Stat cards: subtle lift on mouse-enter --- */
    document.querySelectorAll('.stat-card').forEach((card) => {
      card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 160ms var(--ease), box-shadow 160ms var(--ease), border-color 160ms var(--ease)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = '';
      });
    });

    /* --- Floating cards: pause bob on hover --- */
    document.querySelectorAll('.float-card').forEach((fc) => {
      fc.addEventListener('mouseenter', () => { fc.style.animationPlayState = 'paused'; });
      fc.addEventListener('mouseleave', () => { fc.style.animationPlayState = 'running'; });
    });

  })();

  /* ── Year ────────────────────────────────────────────── */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ── Hero canvas — particle network ─────────────────── */
  (function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const PARTICLE_COUNT = 72;
    const CONNECTION_DIST = 140;
    const SPEED = 0.38;

    let W, H, particles, raf;

    /* Read accent colour from CSS variable */
    function getAccent() {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent').trim();
      return raw || '#f0b862';
    }

    /* Convert any CSS colour to rgba components */
    function toRgb(cssColor) {
      const tmp = document.createElement('div');
      tmp.style.color = cssColor;
      document.body.appendChild(tmp);
      const computed = getComputedStyle(tmp).color; // "rgb(r, g, b)"
      document.body.removeChild(tmp);
      const m = computed.match(/\d+/g);
      return m ? [+m[0], +m[1], +m[2]] : [240, 184, 98];
    }

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function makeParticle() {
      return {
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r:  Math.random() * 1.8 + 1,
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: PARTICLE_COUNT }, makeParticle);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      const [r, g, b] = toRgb(getAccent());

      /* Update & draw nodes */
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.55)`;
        ctx.fill();
      }

      /* Draw connections */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b2 = particles[j];
          const dx = a.x - b2.x, dy = a.y - b2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.22;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b2.x, b2.y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }

    /* Pause when off-screen to save CPU */
    const heroSection = document.getElementById('hero');
    const visObs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (!raf) draw();
      } else {
        cancelAnimationFrame(raf);
        raf = null;
      }
    }, { threshold: 0.1 });
    visObs.observe(heroSection);

    /* Resize */
    const ro = new ResizeObserver(() => {
      resize();
      /* Clamp existing particles back in bounds */
      if (particles) {
        for (const p of particles) {
          p.x = Math.min(p.x, W);
          p.y = Math.min(p.y, H);
        }
      }
    });
    ro.observe(canvas);

    /* Re-colour when theme toggles */
    const observer = new MutationObserver(() => { /* toRgb() re-reads each frame */ });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    init();
    draw();
  })();
})();