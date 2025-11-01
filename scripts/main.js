// scripts/main.js — particles + UI (particle toggle, hero = last project, no parallax)

(function () {
  // ---- Particles subsystem ----
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) {
    console.warn('bg-canvas not found — skipping particles');
  }
  const ctx = canvas ? canvas.getContext('2d', { alpha: true }) : null;
  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  let particles = [];
  let animationId = null;
  let paused = false;
  let resizeTimer = null;
  let mqReduced = null;
  let reducedMotion = false;
  let particleEnabled = true;

  function updateReducedMotion() {
    mqReduced = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)')) || null;
    reducedMotion = !!(mqReduced && mqReduced.matches);
  }
  updateReducedMotion();
  if (mqReduced && mqReduced.addEventListener) {
    mqReduced.addEventListener('change', () => {
      updateReducedMotion();
      scheduleResize();
    });
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function initParticles(n) {
    particles = [];
    for (let i = 0; i < n; i++) {
      particles.push({
        x: rand(0, W),
        y: rand(0, H),
        vx: rand(-0.18, 0.18) * (reducedMotion ? 0.45 : 1),
        vy: rand(-0.04, 0.04) * (reducedMotion ? 0.45 : 1),
        r: rand(0.6, 2.6),
        alpha: rand(0.05, 0.22)
      });
    }
    console.debug('Particles initialized:', particles.length);
  }

  function resizeParticles() {
    if (!canvas || !ctx) return;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, canvas.clientWidth || window.innerWidth);
    H = Math.max(1, canvas.clientHeight || window.innerHeight);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const area = W * H;
    let baseCount = Math.floor(area / 12000);
    if (W < 720) baseCount = Math.min(baseCount, 18);
    if (reducedMotion) baseCount = Math.min(baseCount, 10);
    const count = Math.max(8, Math.min(baseCount, 120));
    initParticles(count);
  }
  function scheduleResize(){ clearTimeout(resizeTimer); resizeTimer = setTimeout(resizeParticles, 120); }

  function renderParticles() {
    if (!ctx || !particleEnabled || paused) return;
    ctx.clearRect(0, 0, W, H);

    const g = ctx.createRadialGradient(W * 0.75, H * 0.25, 0, W * 0.75, H * 0.25, Math.max(W, H) * 0.8);
    g.addColorStop(0, 'rgba(46,196,255,0.01)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (let p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
      ctx.beginPath();
      ctx.fillStyle = `rgba(46,196,255,${p.alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const n = particles.length;
    const connectionCap = n > 60 ? 40 : n;
    for (let i = 0; i < n; i++) {
      const a = particles[i];
      const jLimit = Math.min(n, i + connectionCap);
      for (let j = i + 1; j < jLimit; j++) {
        const b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          const alpha = (1 - dist / 90) * 0.06;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(46,196,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    animationId = requestAnimationFrame(renderParticles);
  }

  function startParticles() {
    if (!particleEnabled || !ctx) return;
    if (!animationId) {
      paused = false;
      renderParticles();
    }
  }
  function stopParticles() {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;
    paused = true;
    if (ctx) ctx.clearRect(0, 0, W, H);
  }

  function toggleParticles(force) {
    if (typeof force === 'boolean') particleEnabled = force;
    else particleEnabled = !particleEnabled;
    try { localStorage.setItem('particlesEnabled', particleEnabled ? '1' : '0'); } catch(e){}
    console.info('Particles enabled:', particleEnabled);
    if (particleEnabled) startParticles(); else stopParticles();
    // update floating button text if exists
    const btn = document.getElementById('particleToggleBtn');
    if (btn) btn.textContent = particleEnabled ? 'Частицы: ВКЛ' : 'Частицы: ВЫКЛ';
  }

  // restore pref
  try {
    const saved = localStorage.getItem('particlesEnabled');
    if (saved !== null) particleEnabled = saved === '1';
  } catch(e){}

  window.addEventListener('resize', scheduleResize);
  window.addEventListener('orientationchange', scheduleResize);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopParticles(); else startParticles(); });
  window.addEventListener('beforeunload', () => { stopParticles(); particles = []; });

  // init safely
  resizeParticles();
  const isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 720;
  if (!reducedMotion) {
    if (!isMobile) startParticles();
    else { initParticles(Math.min(18, particles.length)); startParticles(); }
  } else {
    initParticles(Math.min(12, particles.length));
    startParticles();
  }

  // create floating toggle button so it's always visible
  (function createFloatingToggle() {
    if (document.getElementById('particleToggleBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'particleToggleBtn';
    btn.type = 'button';
    btn.textContent = particleEnabled ? 'Частицы: ВКЛ' : 'Частицы: ВЫКЛ';
    btn.addEventListener('click', () => toggleParticles());
    document.body.appendChild(btn);
  })();

  // ---- UI logic: hero, modal, projects ----
  document.addEventListener('DOMContentLoaded', () => {
    // set year
    const yearEl = document.getElementById('year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

    const modal = document.getElementById('modal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalClose = document.getElementById('modalClose');
    let lastFocused = null, trapHandler = null;

    function closeModal(){
      if(!modal) return;
      modal.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
      if(lastFocused && lastFocused.focus) lastFocused.focus();
      if(trapHandler){ document.removeEventListener('keydown', trapHandler); trapHandler = null; }
    }
    function openModal(project){
      if(!modal) return;
      lastFocused = document.activeElement;
      modal.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
      const t = document.getElementById('modalTitle'); if(t) t.textContent = project.title || '';
      const d = document.getElementById('modalDesc'); if(d) d.textContent = project.description || '';
      const link = document.getElementById('modalLink'); if(link) link.href = project.url || '#';
      const gallery = document.getElementById('modalGallery'); if(!gallery) return;
      gallery.innerHTML = '';
      const imgs = (project.gallery && project.gallery.length) ? project.gallery : (project.cover ? [project.cover] : []);
      imgs.forEach(src => {
        const img = document.createElement('img'); img.src = src; img.alt = project.title || ''; gallery.appendChild(img);
      });
      if(modalClose) modalClose.focus();
      trapHandler = function(e){ if(e.key !== 'Tab') return;
        const focusable = modal.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0]; const last = focusable[focusable.length-1];
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
        else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
      };
      document.addEventListener('keydown', trapHandler);
    }

    if(modalClose) modalClose.addEventListener('click', closeModal);
    if(modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // **Removed parallax**: no mousemove handlers here (hero won't move)

    // reveal on scroll
    const revealEls = Array.from(document.querySelectorAll('.reveal'));
    revealEls.forEach(el => el.classList.add('is-hidden'));
    const observer = ('IntersectionObserver' in window) ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          entry.target.classList.remove('is-hidden');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold: 0.12}) : null;

    revealEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < (window.innerHeight || document.documentElement.clientHeight) - 40) {
        el.classList.add('in-view'); el.classList.remove('is-hidden');
      } else if (observer) observer.observe(el);
      else { el.classList.add('in-view'); el.classList.remove('is-hidden'); }
    });

    // projects grid logic
    const grid = document.getElementById('projects-grid');
    const heroImage = document.getElementById('heroImage');
    const heroTitle = document.querySelector('.hero-title');
    const heroLead = document.querySelector('.lead');
    const heroPrimaryBtn = document.querySelector('.btn-primary');

    function renderPlaceholders(n){
      if(!grid) return;
      grid.innerHTML = '';
      for(let i=0;i<n;i++){
        const card = document.createElement('article');
        card.className = 'project-card reveal';
        card.innerHTML = `
          <div class="project-thumb" aria-hidden="true"></div>
          <h3 class="project-title">Название проекта</h3>
          <p class="project-desc">Короткое описание проекта. Добавь реальные данные через admin.html.</p>
          <div class="project-tags small muted">HTML • CSS • JS</div>
        `;
        grid.appendChild(card);
        if (observer) observer.observe(card); else card.classList.add('in-view');
      }
    }

    function renderProjects(projects){
      if(!grid) return;
      grid.innerHTML = '';
      projects.forEach((p) => {
        const card = document.createElement('article');
        card.className = 'project-card reveal';
        const thumbHtml = p.cover ? `<img loading="lazy" src="${p.cover}" alt="${escapeHtml(p.title)}">` : `<div class="project-thumb" aria-hidden="true"></div>`;
        card.innerHTML = `
          <div class="project-thumb">${thumbHtml}</div>
          <h3 class="project-title">${escapeHtml(p.title || 'Без названия')}</h3>
          <p class="project-desc">${escapeHtml(p.description || '')}</p>
          <div class="project-tags small muted">${Array.isArray(p.tags)? p.tags.join(' • '): ''}</div>
        `;
        card.tabIndex = 0;
        card.addEventListener('click', () => openModal(p));
        card.addEventListener('keypress', (e) => { if(e.key === 'Enter') openModal(p); });

        const img = card.querySelector('img');
        if(img){
          // keep subtle hover zoom on thumbnails (no mouse parallax)
          card.addEventListener('mouseover', () => img.style.transform = 'scale(1.02)');
          card.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');
          img.style.transition = 'transform .35s cubic-bezier(.2,.9,.2,1)';
        }

        grid.appendChild(card);
        if(observer) observer.observe(card); else card.classList.add('in-view');
      });

      // set hero to last project if exists
      try {
        if (Array.isArray(projects) && projects.length > 0) {
          const last = projects[projects.length - 1];
          if (heroImage && last.cover) {
            heroImage.style.backgroundImage = `linear-gradient(180deg, rgba(12,12,12,0.15), rgba(0,0,0,0.25)), url('${last.cover}')`;
          }
          if (heroTitle) heroTitle.textContent = last.title || heroTitle.textContent;
          if (heroLead) heroLead.textContent = last.subtitle || last.description || heroLead.textContent;
          if (heroPrimaryBtn && last.url) heroPrimaryBtn.href = last.url;
        }
      } catch(e) {
        console.warn('Не удалось установить hero из последнего проекта', e);
      }
    }

    (function loadProjects(){
      if(!grid) return;
      fetch('data/projects.json', {cache: 'no-store'}).then(r => {
        if(!r.ok) throw new Error('no projects.json');
        return r.json();
      }).then(data => {
        if(!Array.isArray(data) || data.length === 0) renderPlaceholders(6);
        else renderProjects(data);
      }).catch(err => {
        console.warn('projects.json not found or failed to load — rendering placeholders', err);
        renderPlaceholders(6);
      });
    })();

    function escapeHtml(s){ if (s == null) return ''; const str = String(s); return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  });

})(); // IIFE end
