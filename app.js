/* ═══════════════════════════════════════════════
   EMMAT — Unified site · interactions
   1. "Products" dropdown        (every page)
   2. Research pages             (home: progress, reveal, section dots, anchors)
   3. Sensory radar charts       (home)
   4. Product launch pages       (BB Cream, Milky Toner)
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const doc = document.documentElement;

  // ─────────────────────────────────────────── 1. PRODUCTS DROPDOWN
  $$('.nav-dd').forEach((dd) => {
    const btn = $('.nav-dd-btn', dd);
    if (!btn) return;
    const setOpen = (open) => {
      dd.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!dd.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (!dd.contains(e.target)) setOpen(false);
    });
    dd.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dd.classList.contains('open')) {
        setOpen(false);
        btn.focus();
      }
    });
    dd.addEventListener('focusout', (e) => {
      if (!dd.contains(e.relatedTarget)) setOpen(false);
    });
  });

  // ─────────────────────────────────────────── 2. RESEARCH HOME
  const progress = document.getElementById('scrollProgress');
  if (progress) initResearchHome();

  function initResearchHome() {
    const heroBg = $('.hero-bg');
    const backToTop = document.getElementById('backToTop');
    let ticking = false;

    function onScroll() {
      const scrollTop = window.pageYOffset || doc.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      const pct = height > 0 ? (scrollTop / height) * 100 : 0;
      progress.style.width = pct + '%';

      // Hero parallax (~0.15× rate) — only while hero is roughly in view
      if (heroBg && !reduced && scrollTop < window.innerHeight * 1.2) {
        heroBg.style.transform = 'translate3d(0, ' + (-scrollTop * 0.15) + 'px, 0)';
      }

      // Back-to-top visibility (past 800 px)
      if (backToTop) backToTop.classList.toggle('is-visible', scrollTop > 800);

      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });

    // Reveal on scroll
    if (!reduced && 'IntersectionObserver' in window) {
      const revealTargets = $$(
        '.section-header, ' +
        '.section .grid-2 > *, ' +
        '.section .grid-3 > *, ' +
        '.section .grid-methods > *, ' +
        '.section .conclusions > *, ' +
        '.section .product-card, ' +
        '.section .charac-panel, ' +
        '.section .finding-punchline, ' +
        '.section .future-note'
      );
      revealTargets.forEach(el => el.classList.add('reveal'));

      const revealIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealIO.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

      revealTargets.forEach(el => revealIO.observe(el));
    }

    // Section-nav active state
    const navLinks = $$('#sectionNav a');
    if (navLinks.length && 'IntersectionObserver' in window) {
      const linkById = {};
      navLinks.forEach(a => { linkById[a.getAttribute('href').replace(/^#/, '')] = a; });
      const sections = Object.keys(linkById).map(id => document.getElementById(id)).filter(Boolean);

      const navIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach(a => a.classList.remove('active'));
            const link = linkById[entry.target.id];
            if (link) link.classList.add('active');
          }
        });
      }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

      sections.forEach(s => navIO.observe(s));
    }

    // Anchor links on H2/H3
    const toast = document.getElementById('toast');
    let toastTimer;

    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('is-visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1600);
    }

    function slugify(text) {
      return text.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }

    const usedIds = new Set($$('[id]').map(el => el.id));

    $$('.section h2, .section h3').forEach(h => {
      // Keep anchors on top-level section headings only — skip card internals.
      if (h.closest('.card, .product-card, .positioning-card, .conclusion, .about-text, .downloads, .future-note, .active-system, .rationale')) {
        return;
      }

      let id = h.id;
      if (!id) {
        const parentSection = h.closest('section[id]');
        const base = slugify(h.textContent || 'heading');
        const stem = parentSection ? parentSection.id + '-' + base : base;
        let candidate = stem;
        let n = 1;
        while (usedIds.has(candidate)) candidate = stem + '-' + (++n);
        id = candidate;
        h.id = id;
        usedIds.add(id);
      }

      h.classList.add('anchor-heading');
      const link = document.createElement('a');
      link.className = 'anchor-link';
      link.href = '#' + id;
      link.setAttribute('aria-label', 'Copy link to this section');
      link.textContent = '#';
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const url = window.location.origin + window.location.pathname + '#' + id;
        const copyPromise = navigator.clipboard && navigator.clipboard.writeText
          ? navigator.clipboard.writeText(url)
          : Promise.reject();
        copyPromise.then(() => showToast('Link copied'))
                   .catch(() => {
                     try {
                       const ta = document.createElement('textarea');
                       ta.value = url;
                       ta.style.position = 'fixed';
                       ta.style.top = '-1000px';
                       document.body.appendChild(ta);
                       ta.select();
                       document.execCommand('copy');
                       document.body.removeChild(ta);
                       showToast('Link copied');
                     } catch (_) {
                       showToast('Copy failed');
                     }
                   });
        history.replaceState(null, '', '#' + id);
      });
      h.insertBefore(link, h.firstChild);
    });

    // Back-to-top
    if (backToTop) {
      backToTop.addEventListener('click', function () {
        if (reduced) window.scrollTo(0, 0);
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Kick once to set initial state
    onScroll();
  }

  // ─────────────────────────────────────────── 3. SENSORY RADAR CHARTS
  // Data from Emma Terenzi's thesis presentation deck (slides 06 and 07).
  // Panel n = 5, scale 0–10. Drawn on a plain canvas — no chart library.
  const PALETTE = {
    text:  '#3B2E24',
    cream: '#FBF6EE',
    muted: '#8B7D6C',
    deep:  '#5C4B3A',
    ester:  { line: '#5C4B3A',                   rgb: '92, 75, 58'   },  // deep tone
    apg:    { line: 'rgba(237, 219, 206, 0.9)',  rgb: '237, 219, 206' }, // soft rose
    starch: { line: '#B58E5F',                   rgb: '181, 142, 95' }   // gold
  };

  const CHARTS = {
    radarBase: {
      labels: ['Pickup', 'Thickness', 'Spreadability', 'Soaping effect', 'Absorption rate', 'Shine effect', 'Residual amount'],
      datasets: [
        { label: 'Ester Blend',         data: [7.0, 5.5, 7.9, 2.2, 5.0, 4.0, 4.5], tone: PALETTE.ester },
        { label: 'Alkyl Polyglucoside', data: [7.5, 6.0, 5.5, 7.5, 5.5, 7.4, 7.1], tone: PALETTE.apg },
        { label: 'Modified Starch',     data: [7.8, 6.5, 6.5, 4.0, 6.5, 4.5, 3.6], tone: PALETTE.starch }
      ]
    },
    radarPigment: {
      labels: ['Spreadability', 'Mattifying effect', 'Colour homogeneity', 'Coverage', 'Blendability', 'Residual amount'],
      datasets: [
        { label: 'Ester Blend',     data: [8.0, 7.0, 7.3, 7.5, 7.6, 4.0], tone: PALETTE.ester },
        { label: 'Modified Starch', data: [4.5, 3.8, 1.9, 3.0, 2.6, 2.4], tone: PALETTE.starch }
      ]
    }
  };
  const SCALE_MAX = 10;

  function drawRadar(canvas, chart, t) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    if (!w) return;
    const h = Math.round(w / 1.05);
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const small = w < 380;
    const n = chart.labels.length;
    const cx = w / 2;
    const cy = h / 2;
    const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const labelFont = "600 " + (small ? 10 : 11) + "px Inter, sans-serif";
    const labelGap = 14;
    const lineH = 13;

    // Largest radius that still leaves room for every attribute label
    ctx.font = labelFont;
    let R = Math.min(w, h) / 2 - 20;
    chart.labels.forEach((label, i) => {
      const cos = Math.abs(Math.cos(angle(i)));
      const sin = Math.abs(Math.sin(angle(i)));
      const lines = label.split(' ');
      const lineW = Math.max.apply(null, lines.map(l => ctx.measureText(l).width));
      if (cos > 0.15) R = Math.min(R, (w / 2 - lineW - 6) / cos - labelGap);
      if (sin > 0.15) R = Math.min(R, (h / 2 - lines.length * lineH - 4) / sin - labelGap);
    });
    R = Math.max(R, 40);

    const point = (i, v) => [cx + Math.cos(angle(i)) * R * (v / SCALE_MAX), cy + Math.sin(angle(i)) * R * (v / SCALE_MAX)];
    const polygon = (values) => {
      ctx.beginPath();
      values.forEach((v, i) => {
        const [x, y] = point(i, v);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
    };

    // Grid rings + spokes
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(181, 142, 95, 0.25)';
    for (let v = 2; v <= SCALE_MAX; v += 2) {
      polygon(chart.labels.map(() => v));
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(139, 125, 108, 0.35)';
    for (let i = 0; i < n; i++) {
      const [x, y] = point(i, SCALE_MAX);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Scale ticks
    ctx.fillStyle = PALETTE.muted;
    ctx.font = "italic 11px Georgia, serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let v = 2; v <= SCALE_MAX; v += 2) {
      ctx.fillText(String(v), cx + 4, cy - R * (v / SCALE_MAX));
    }

    // Attribute labels (two lines when the label has two words)
    ctx.fillStyle = PALETTE.deep;
    ctx.font = labelFont;
    chart.labels.forEach((label, i) => {
      const a = angle(i);
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const lines = label.split(' ');
      const lx = cx + cos * (R + labelGap);
      const ly = cy + sin * (R + labelGap);
      ctx.textAlign = Math.abs(cos) < 0.15 ? 'center' : (cos > 0 ? 'left' : 'right');
      let y0 = ly - ((lines.length - 1) * lineH) / 2;
      if (sin < -0.8) y0 = ly - (lines.length - 1) * lineH;
      if (sin > 0.8) y0 = ly;
      lines.forEach((line, k) => ctx.fillText(line, lx, y0 + k * lineH));
    });

    // Datasets
    chart.datasets.forEach((set) => {
      const values = set.data.map(v => v * t);
      const fill = ctx.createLinearGradient(0, cy - R, 0, cy + R);
      fill.addColorStop(0, 'rgba(' + set.tone.rgb + ', 0.40)');
      fill.addColorStop(1, 'rgba(' + set.tone.rgb + ', 0.02)');

      polygon(values);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2;
      ctx.strokeStyle = set.tone.line;
      ctx.stroke();

      values.forEach((v, i) => {
        const [x, y] = point(i, v);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = set.tone.line;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = PALETTE.cream;
        ctx.stroke();
      });
    });

    // Value labels (once the shapes have settled)
    if (t >= 1) {
      ctx.font = "500 10px Inter, sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      chart.datasets.forEach((set) => {
        set.data.forEach((v, i) => {
          const [px, py] = point(i, v);
          const x = px + Math.cos(angle(i)) * 14;
          const y = py + Math.sin(angle(i)) * 14;
          const text = v.toFixed(1);
          const tw = ctx.measureText(text).width + 10;
          ctx.fillStyle = 'rgba(251, 246, 238, 0.8)';
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x - tw / 2, y - 8, tw, 16, 8);
          else ctx.rect(x - tw / 2, y - 8, tw, 16);
          ctx.fill();
          ctx.fillStyle = PALETTE.text;
          ctx.fillText(text, x, y);
        });
      });
    }
  }

  function initRadar(id) {
    const canvas = document.getElementById(id);
    const chart = CHARTS[id];
    if (!canvas || !chart || !canvas.getContext) return;

    // Legend (HTML, so it stays readable and selectable)
    const legend = document.createElement('ul');
    legend.className = 'chart-legend';
    chart.datasets.forEach((set) => {
      const li = document.createElement('li');
      const dot = document.createElement('i');
      dot.style.background = set.tone.line;
      li.appendChild(dot);
      li.appendChild(document.createTextNode(set.label));
      legend.appendChild(li);
    });
    canvas.insertAdjacentElement('afterend', legend);

    let t = 0;
    let started = false;
    const render = () => drawRadar(canvas, chart, started ? t : 0);

    const start = () => {
      started = true;
      if (reduced) { t = 1; render(); return; }
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min((now - t0) / 900, 1);
        t = 1 - Math.pow(1 - p, 4);            // easeOutQuart
        render();
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    render();
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) { io.disconnect(); start(); }
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
      io.observe(canvas);
    } else {
      start();
    }

    let resizeTick = false;
    window.addEventListener('resize', () => {
      if (resizeTick) return;
      resizeTick = true;
      requestAnimationFrame(() => { resizeTick = false; render(); });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  }

  initRadar('radarBase');
  initRadar('radarPigment');

  // ─────────────────────────────────────────── 4. PRODUCT LAUNCH PAGES
  const nav = document.getElementById('nav');
  if (nav) initProductPage();

  function initProductPage() {
    /* ===== loader: hide on load ===== */
    const hideLoader = () => setTimeout(() => $('#loader')?.classList.add('gone'), 1700);
    if (document.readyState === 'complete') hideLoader();
    else window.addEventListener('load', hideLoader);

    /* ===== nav: solid-on-scroll + progress bar ===== */
    const prog = $('#progress i');
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('solid', y > 60);
      if (prog) {
        const max = doc.scrollHeight - window.innerHeight;
        prog.style.width = max > 0 ? Math.min(100, (y / max) * 100) + '%' : '0%';
      }
      // sticky-cta stays hidden near the top
      document.body.classList.toggle('sticky-hidden', y < 200);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ===== mobile burger ===== */
    const burger = $('.nav-burger');
    if (burger) {
      const setMenu = (open) => {
        document.body.classList.toggle('menu-open', open);
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      };
      burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
      $$('.nav-links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
      });
    }

    /* ===== reveal on scroll ===== */
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      $$('.reveal').forEach(el => io.observe(el));
    } else {
      $$('.reveal').forEach(el => el.classList.add('in'));
    }

    /* ===== product thumbnails swap ===== */
    const productImg = $('.product-frame img');
    if (productImg) {
      productImg.style.transition = 'opacity .35s ease';
      $$('.ptn').forEach(btn => {
        btn.addEventListener('click', () => {
          $$('.ptn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          productImg.style.opacity = '0';
          setTimeout(() => {
            productImg.src = btn.dataset.img;
            if (btn.dataset.alt) productImg.alt = btn.dataset.alt;
            productImg.style.opacity = '1';
          }, 280);
        });
      });
    }

    /* ===== newsletter (no back-end: just acknowledges) ===== */
    const nlForm = $('.nl-form');
    if (nlForm) {
      nlForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const button = $('button', nlForm);
        button.textContent = 'Thank you ✷';
        button.disabled = true;
        $('input', nlForm).value = '';
      });
    }

    /* ===== magnetic CTA ===== */
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (isFinePointer && !reduced) {
      $$('.magnetic').forEach(el => {
        const strength = 14;
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - r.left - r.width / 2;
          const y = e.clientY - r.top - r.height / 2;
          el.style.transform = `translate(${x / r.width * strength}px, ${y / r.height * strength}px)`;
        });
        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
      });
    }

    /* ===== cursor follower ===== */
    const cursor = $('#cursor');
    if (cursor && isFinePointer && !reduced) {
      let tx = 0, ty = 0, x = 0, y = 0;
      window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
      const tick = () => {
        x += (tx - x) * 0.12;
        y += (ty - y) * 0.12;
        cursor.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
        requestAnimationFrame(tick);
      };
      tick();
    } else {
      document.body.classList.add('no-cursor');
    }

    /* ===== gold dust canvas ===== */
    const canvas = $('#dust');
    if (canvas && !reduced) {
      const ctx = canvas.getContext('2d');
      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      let W = 0, H = 0;
      const particles = [];
      const COUNT = window.matchMedia('(max-width: 880px)').matches ? 40 : 90;

      const resize = () => {
        W = canvas.width  = window.innerWidth  * DPR;
        H = canvas.height = window.innerHeight * DPR;
        canvas.style.width  = window.innerWidth  + 'px';
        canvas.style.height = window.innerHeight + 'px';
      };
      resize();
      window.addEventListener('resize', resize);

      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: (Math.random() * 1.4 + 0.3) * DPR,
          vx: (Math.random() - 0.5) * 0.3 * DPR,
          vy: (-Math.random() * 0.4 - 0.05) * DPR,
          a: Math.random() * 0.6 + 0.2,
          twinkle: Math.random() * Math.PI * 2,
        });
      }

      let last = performance.now();
      const draw = (now) => {
        const dt = Math.min((now - last) / 16.67, 2);
        last = now;
        ctx.clearRect(0, 0, W, H);
        for (const p of particles) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.twinkle += 0.03 * dt;
          if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
          if (p.x < -10) p.x = W + 10;
          if (p.x >  W + 10) p.x = -10;

          const flicker = (Math.sin(p.twinkle) + 1) * 0.5;
          ctx.beginPath();
          ctx.fillStyle = `rgba(232, 210, 159, ${p.a * flicker})`;
          ctx.shadowBlur = 8 * DPR;
          ctx.shadowColor = 'rgba(232, 210, 159, 0.6)';
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    }

    /* ===== manifesto constellation: draw on enter ===== */
    const cstl = $('.manifesto-cstl .cstl-draw path');
    if (cstl && 'IntersectionObserver' in window) {
      const len = cstl.getTotalLength();
      cstl.style.strokeDasharray = len;
      cstl.style.strokeDashoffset = len;
      cstl.style.transition = 'stroke-dashoffset 2.4s cubic-bezier(.16,1,.3,1)';
      const io2 = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            cstl.style.strokeDashoffset = '0';
            io2.disconnect();
          }
        });
      }, { threshold: 0.25 });
      io2.observe($('.manifesto'));
    }

    /* ===== subtle parallax on hero image ===== */
    const heroVid = $('.hero-video');
    if (heroVid && isFinePointer && !reduced) {
      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (y < window.innerHeight) {
          heroVid.style.transform = `translateY(${y * 0.18}px) scale(${1.05 + (y / window.innerHeight) * 0.05})`;
        }
      }, { passive: true });
    }

    /* ===== gallery lightbox ===== */
    const lb = $('#lightbox');
    const figures = $$('#gallery-grid .gi');
    if (lb && figures.length) {
      const lbImg = $('img', lb);
      const lbCounter = $('.lb-counter', lb);
      let lbIndex = 0;
      let lastFocus = null;
      const visible = () => figures.filter(f => f.style.display !== 'none');

      const showLB = () => {
        const all = visible();
        if (!all.length) return;
        lbIndex = (lbIndex + all.length) % all.length;
        const img = $('img', all[lbIndex]);
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt;
        lbCounter.textContent = `${String(lbIndex + 1).padStart(2, '0')} / ${String(all.length).padStart(2, '0')}`;
      };
      const openLB = (fig) => {
        lastFocus = fig;
        lbIndex = visible().indexOf(fig);
        showLB();
        lb.classList.add('open');
        lb.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lock');
        $('.lb-close', lb).focus();
      };
      const closeLB = () => {
        lb.classList.remove('open');
        lb.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lock');
        if (lastFocus) lastFocus.focus();
      };

      figures.forEach((fig) => {
        $('img', fig).addEventListener('error', () => { fig.style.display = 'none'; });
        fig.addEventListener('click', () => openLB(fig));
        fig.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLB(fig); }
        });
      });

      $('.lb-close', lb).addEventListener('click', closeLB);
      $('.lb-prev', lb).addEventListener('click', () => { lbIndex--; showLB(); });
      $('.lb-next', lb).addEventListener('click', () => { lbIndex++; showLB(); });
      lb.addEventListener('click', (e) => { if (e.target === lb) closeLB(); });
      document.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'Escape') closeLB();
        if (e.key === 'ArrowLeft') { lbIndex--; showLB(); }
        if (e.key === 'ArrowRight') { lbIndex++; showLB(); }
      });
    }
  }
})();
