(() => {
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  // -------- idle matrix background (starts after 5s idle) --------
  const matrixCanvas = document.getElementById('matrix');
  const matrix = (() => {
    if (!(matrixCanvas instanceof HTMLCanvasElement)) return null;
    const ctx = matrixCanvas.getContext('2d');
    if (!ctx) return null;

    const chars = 'アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+=-'.split('');
    let raf = 0;
    let running = false;
    let w = 0;
    let h = 0;
    let fontSize = 14;
    let columns = 0;
    /** @type {number[]} */
    let drops = [];

    const resize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;
      matrixCanvas.style.width = `${cssW}px`;
      matrixCanvas.style.height = `${cssH}px`;
      matrixCanvas.width = Math.floor(cssW * dpr);
      matrixCanvas.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      w = cssW;
      h = cssH;
      fontSize = Math.max(12, Math.min(16, Math.floor(cssW / 70)));
      columns = Math.floor(w / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * h);
      ctx.font = `${fontSize}px "Share Tech Mono", monospace`;
    };

    const clear = () => {
      ctx.clearRect(0, 0, w, h);
    };

    const step = () => {
      // Subtle fade
      ctx.fillStyle = 'rgba(3, 3, 3, 0.08)';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(155, 93, 229, 0.65)';
      for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i];
        const text = chars[(Math.random() * chars.length) | 0];
        ctx.fillText(text, x, y);

        // reset drop occasionally
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i] += fontSize;
      }

      raf = window.requestAnimationFrame(step);
    };

    const start = () => {
      if (running || prefersReducedMotion) return;
      running = true;
      document.body.dataset.matrix = 'true';
      resize();
      clear();
      raf = window.requestAnimationFrame(step);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      document.body.dataset.matrix = 'false';
      window.cancelAnimationFrame(raf);
      clear();
    };

    window.addEventListener('resize', () => {
      if (!running) return;
      resize();
    });

    return { start, stop };
  })();

  let idleTimer = 0;
  const idleMs = 5000;

  const bumpActivity = () => {
    if (matrix) matrix.stop();
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => matrix?.start(), idleMs);
  };

  bumpActivity();
  ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown', 'wheel'].forEach((evt) => {
    window.addEventListener(evt, bumpActivity, { passive: true });
  });

  // -------- nav (mobile toggle + close behavior) --------
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.getElementById('navMenu');

  const setNavOpen = (open) => {
    document.body.dataset.navOpen = open ? 'true' : 'false';
    if (navToggle) navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (navMenu) navMenu.dataset.collapsed = open ? 'false' : 'true';
  };

  setNavOpen(false);

  navToggle?.addEventListener('click', () => {
    const open = document.body.dataset.navOpen === 'true';
    setNavOpen(!open);
  });

  // Close on link click
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.closest('[data-nav-link]')) {
      setNavOpen(false);
      return;
    }

    // Click outside closes only when open
    if (document.body.dataset.navOpen !== 'true') return;
    if (!navMenu || !navToggle) return;
    if (navMenu.contains(target) || navToggle.contains(target)) return;
    setNavOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.body.dataset.navOpen !== 'true') return;
    setNavOpen(false);
    navToggle?.focus();
  });

  // -------- smooth scroll enhancement (respects reduced motion) --------
  document.addEventListener('click', (e) => {
    const a = (e.target instanceof HTMLElement ? e.target.closest('a[href^="#"]') : null);
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (!el) return;

    if (prefersReducedMotion) return; // allow default jump
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', href);
  });

  // -------- typewriter (hero) --------
  const phrases = [
    'with a practical, traceable mindset.',
    'building secure infrastructures.',
    'zero hidden quick fixes.',
    'every choice must be explainable.',
  ];
  const typeEl = document.getElementById('typewriter');
  if (typeEl) {
    let pi = 0;
    let ci = 0;
    let deleting = false;

    const tick = () => {
      const current = phrases[pi] ?? '';
      if (!deleting) {
        typeEl.textContent = current.slice(0, ++ci);
        if (ci === current.length) {
          deleting = true;
          window.setTimeout(tick, 1700);
          return;
        }
      } else {
        typeEl.textContent = current.slice(0, --ci);
        if (ci === 0) {
          deleting = false;
          pi = (pi + 1) % phrases.length;
        }
      }

      window.setTimeout(tick, deleting ? 36 : 56);
    };

    window.setTimeout(tick, prefersReducedMotion ? 0 : 700);
  }

  // -------- contact form (front-end only) --------
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');

  const setFieldError = (fieldEl, message) => {
    const wrapper = fieldEl.closest('.field');
    const errorEl = wrapper?.querySelector('.field-error');
    if (!wrapper || !(wrapper instanceof HTMLElement) || !errorEl) return;
    wrapper.dataset.invalid = message ? 'true' : 'false';
    errorEl.textContent = message ?? '';
  };

  const validateField = (input) => {
    if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return true;

    input.setCustomValidity('');
    const name = input.getAttribute('name') ?? 'field';
    const value = input.value.trim();

    if (input.hasAttribute('required') && value.length === 0) {
      setFieldError(input, `${name}: required`);
      return false;
    }

    const min = Number(input.getAttribute('minlength') || '0');
    if (min > 0 && value.length > 0 && value.length < min) {
      setFieldError(input, `${name}: min ${min} chars`);
      return false;
    }

    if (input instanceof HTMLInputElement && input.type === 'email' && value.length > 0) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!ok) {
        setFieldError(input, `${name}: invalid email`);
        return false;
      }
    }

    setFieldError(input, '');
    return true;
  };

  if (form instanceof HTMLFormElement) {
    const inputs = Array.from(form.querySelectorAll('input, textarea'));

    inputs.forEach((el) => {
      el.addEventListener('blur', () => validateField(el));
      el.addEventListener('input', () => {
        const wrapper = el.closest('.field');
        if (wrapper instanceof HTMLElement && wrapper.dataset.invalid === 'true') validateField(el);
      });
    });

    form.addEventListener('reset', () => {
      inputs.forEach((el) => setFieldError(el, ''));
      if (status) status.textContent = '';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (status) status.textContent = '';

      const allOk = inputs.map(validateField).every(Boolean);
      if (!allOk) {
        if (status) status.textContent = 'error: invalid fields';
        const firstInvalid = form.querySelector('.field[data-invalid="true"] input, .field[data-invalid="true"] textarea');
        if (firstInvalid instanceof HTMLElement) firstInvalid.focus();
        return;
      }

      // Front-end only: simulate secure send
      if (status) status.textContent = 'sending…';
      window.setTimeout(() => {
        if (status) status.textContent = 'ok: message queued (demo)';
        form.reset();
      }, prefersReducedMotion ? 0 : 650);
    });
  }
})();
