// scripts/main.js — particles + UI (particle toggle, hero = last project, no parallax, sidebar sync)
// + achievements slider (fetch with fallback), image load sync, logo fallback
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
    // prefer client size, fallback to viewport
    W = Math.max(1, (canvas.clientWidth || window.innerWidth));
    H = Math.max(1, (canvas.clientHeight || window.innerHeight));
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    // ensure transform is set for DPR
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

    // subtle radial tint
    try {
      const g = ctx.createRadialGradient(W * 0.75, H * 0.25, 0, W * 0.75, H * 0.25, Math.max(W, H) * 0.8);
      g.addColorStop(0, 'rgba(46,196,255,0.01)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    } catch (e) {
      /* fallback - ignore gradient errors */
    }

    const n = particles.length;
    for (let i = 0; i < n; i++) {
      const p = particles[i];
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

    // connections (cap per particle for performance)
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
    const btn = document.getElementById('particleToggleBtn');
    if (btn) {
      btn.textContent = particleEnabled ? 'Частицы: ВКЛ' : 'Частицы: ВЫКЛ';
      btn.setAttribute('aria-pressed', particleEnabled ? 'true' : 'false');
    }
  }

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
    else { initParticles(18); startParticles(); } // fixed: use number directly
  } else {
    initParticles(12);
    startParticles();
  }

  // create floating toggle button so it's always visible
  (function createFloatingToggle() {
    if (document.getElementById('particleToggleBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'particleToggleBtn';
    btn.type = 'button';
    btn.className = 'particle-toggle';
    btn.setAttribute('aria-label', 'Включить или выключить частицы на фоне');
    btn.setAttribute('aria-pressed', particleEnabled ? 'true' : 'false');
    btn.textContent = particleEnabled ? 'Частицы: ВКЛ' : 'Частицы: ВЫКЛ';
    btn.style.zIndex = 120;
    btn.addEventListener('click', () => toggleParticles());
    document.body.appendChild(btn);

    // make toggle visually indicate reduced-motion preference
    if (reducedMotion) {
      btn.style.opacity = '0.65';
      btn.title = 'Частицы отключены или замедлены из-за системной настройки "уменьшить движение"';
    }
  })();

  // ---- UI logic: hero, modal, projects, sidebar sync, achievements ----
  document.addEventListener('DOMContentLoaded', () => {
    // small HTML-escape helper (used for achievements and other text insertions)
    function escapeHtml(s) {
      if (s == null) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // Debounce util
    function debounce(fn, wait=120){
      let t = null;
      return function(...args){
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    }

    // sync sidebar height to hero-card on wide screens
    function syncSidebarHeight(){
      const sidebarInner = document.querySelector('.sidebar-inner');
      const heroCard = document.querySelector('.hero-card');
      if(!sidebarInner || !heroCard) return;
      if (window.innerWidth <= 720) {
        sidebarInner.style.height = '';
        return;
      }
      window.requestAnimationFrame(() => {
        const heroRect = heroCard.getBoundingClientRect();
        const minH = 160;
        const newH = Math.max(minH, Math.round(heroRect.height));
        sidebarInner.style.height = newH + 'px';
      });
    }
    const debouncedSync = debounce(syncSidebarHeight, 110);
    window.addEventListener('resize', debouncedSync);
    window.addEventListener('orientationchange', debouncedSync);

    // logo fallback: if logo image is missing or 404, replace with text
    (function ensureLogo(){
      const img = document.querySelector('.logo img');
      const logoText = document.querySelector('.logo-text');
      if(!img) return;
      img.addEventListener('error', () => {
        console.warn('Logo image failed to load — hiding img and showing text');
        img.style.display = 'none';
        if (logoText) logoText.style.display = 'inline-block';
      });
      // if image not loaded (cached missing), check naturalWidth
      if (img.complete && img.naturalWidth === 0) {
        img.dispatchEvent(new Event('error'));
      }
    })();

    // set year
    const yearEl = document.getElementById('year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

    // modal
    const modal = document.getElementById('modal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalClose = document.getElementById('modalClose');
    let lastFocused = null, trapHandler = null;
    let previousBodyOverflow = '';

    function closeModal(){
      if(!modal) return;
      modal.setAttribute('aria-hidden','true');
      document.body.style.overflow = previousBodyOverflow || '';
      previousBodyOverflow = '';
      if(lastFocused && lastFocused.focus) lastFocused.focus();
      if(trapHandler){ document.removeEventListener('keydown', trapHandler, {capture:true}); trapHandler = null; }
    }
    function openModal(project){
      if(!modal) return;
      lastFocused = document.activeElement;
      modal.setAttribute('aria-hidden','false');
      previousBodyOverflow = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
      const t = document.getElementById('modalTitle'); if(t) t.textContent = project.title || '';
      const d = document.getElementById('modalDesc'); if(d) d.textContent = project.description || '';
      const link = document.getElementById('modalLink'); if(link) {
        link.href = project.url || '#';
        link.rel = 'noopener noreferrer';
      }
      const gallery = document.getElementById('modalGallery'); if(!gallery) return;
      gallery.innerHTML = '';
      const imgs = (project.gallery && project.gallery.length) ? project.gallery : (project.cover ? [project.cover] : []);
      imgs.forEach(src => {
        const img = document.createElement('img'); img.src = src; img.alt = project.title || ''; gallery.appendChild(img);
      });
      if(modalClose) modalClose.focus();
      trapHandler = function(e){
        if (e.key !== 'Tab') return;
        const focusable = Array.from(modal.querySelectorAll('a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'))
          .filter(el => el && el.offsetParent !== null);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === modal) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener('keydown', trapHandler, { capture: true });
    }

    if(modalClose) modalClose.addEventListener('click', closeModal);
    if(modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

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
      const frag = document.createDocumentFragment();
      for(let i=0;i<n;i++){
        const card = document.createElement('article');
        card.className = 'project-card reveal in-view';
        // Note: accessibility: article kept as visual card. add aria-hidden for placeholders
        card.setAttribute('aria-hidden', 'true');

        const thumb = document.createElement('div'); thumb.className = 'project-thumb'; thumb.setAttribute('aria-hidden','true');

        const title = document.createElement('h3'); title.className = 'project-title'; title.textContent = 'Название проекта';
        const desc = document.createElement('p'); desc.className = 'project-desc'; desc.textContent = 'Короткое описание проекта. Добавь реальные данные через admin.html.';
        const tags = document.createElement('div'); tags.className = 'project-tags small muted'; tags.textContent = 'HTML • CSS • JS';

        card.appendChild(thumb);
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(tags);

        frag.appendChild(card);
      }
      grid.appendChild(frag);
      // ensure sidebar height sync after placeholders
      debouncedSync();
    }

    function attachImageLoadHandlers(imgEl){
      if(!imgEl) return;
      // if image already loaded or errored, trigger sync immediately
      function done(){ debouncedSync(); }
      imgEl.addEventListener('load', done);
      imgEl.addEventListener('error', () => {
        console.warn('project thumbnail failed to load:', imgEl.src);
        // keep placeholder but still sync
        done();
      });
      // handle already-complete images
      if (imgEl.complete) done();
    }

    function renderProjects(projects){
      if(!grid) return;
      grid.innerHTML = '';

      const frag = document.createDocumentFragment();

      projects.forEach((p) => {
        const card = document.createElement('article');
        card.className = 'project-card reveal';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        // accessible name
        card.setAttribute('aria-label', (p.title ? String(p.title) : 'Открыть проект'));

        // thumbnail container
        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'project-thumb';
        if (p.cover) {
          const img = document.createElement('img');
          img.loading = 'lazy';
          img.src = p.cover;
          img.alt = p.title || '';
          img.style.transition = 'transform .35s cubic-bezier(.2,.9,.2,1)';
          thumbWrap.appendChild(img);

          // hover zoom
          card.addEventListener('mouseover', () => { img.style.transform = 'scale(1.02)'; });
          card.addEventListener('mouseleave', () => { img.style.transform = 'scale(1)'; });

          attachImageLoadHandlers(img);
        } else {
          // placeholder (keeps DOM consistent)
          const ph = document.createElement('div');
          ph.setAttribute('aria-hidden', 'true');
          ph.style.height = '120px';
          ph.className = 'project-thumb';
          thumbWrap.appendChild(ph);
        }

        const title = document.createElement('h3');
        title.className = 'project-title';
        title.textContent = p.title || 'Без названия';

        const desc = document.createElement('p');
        desc.className = 'project-desc';
        desc.textContent = p.description || '';

        const tags = document.createElement('div');
        tags.className = 'project-tags small muted';
        if (Array.isArray(p.tags)) tags.textContent = p.tags.join(' • ');

        // assemble
        card.appendChild(thumbWrap);
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(tags);

        // interactions
        card.addEventListener('click', () => openModal(p));
        card.addEventListener('keypress', (e) => { if (e.key === 'Enter') openModal(p); });

        frag.appendChild(card);

        if (observer) observer.observe(card); else card.classList.add('in-view');
      });

      grid.appendChild(frag);

      // set hero to last project if exists
      try {
        if (Array.isArray(projects) && projects.length > 0) {
          const last = projects[projects.length - 1];
          if (heroImage && last.cover) {
            // set background (no parallax)
            heroImage.style.backgroundImage = `linear-gradient(180deg, rgba(12,12,12,0.15), rgba(0,0,0,0.25)), url('${last.cover}')`;
          }
          if (heroTitle) heroTitle.textContent = last.title || heroTitle.textContent;
          if (heroLead) heroLead.textContent = last.subtitle || last.description || heroLead.textContent;
          if (heroPrimaryBtn && last.url) {
            heroPrimaryBtn.href = last.url;
            heroPrimaryBtn.setAttribute('rel', 'noopener noreferrer');
          }
        }
      } catch(e) {
        console.warn('Не удалось установить hero из последнего проекта', e);
      }

      // sync sidebar height with hero after rendering (and a slight delay for images/backgrounds)
      debouncedSync();
      setTimeout(debouncedSync, 120);
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

    // initial sync attempt after DOM ready
    setTimeout(debouncedSync, 60);

    /* ---------- ACHIEVEMENTS: fetch data/achievements.json with fallback to defaults ---------- */
    (function achievementsModule(){
      const defaultAchievements = [
        { id:'a1', title:'100+ UI screens', sub:'Дизайн интерфейсов', icon:'★' },
        { id:'a2', title:'50+ проектов', sub:'Различных кейсов', icon:'✓' },
        { id:'a3', title:'20k+ строк', sub:'Чистого кода', icon:'</>' },
        { id:'a4', title:'Open-source', sub:'Проекты на GitHub', icon:'⬢' },
        { id:'a5', title:'Конференции', sub:'Доклады и выступления', icon:'🎤' }
      ];
      const track = document.getElementById('achievementsTrack');
      if(!track) return;

      function waitImagesLoaded(container, timeout = 1200) {
        const imgs = Array.from(container.querySelectorAll('img'));
        if (imgs.length === 0) return Promise.resolve();
        return new Promise(resolve => {
          let remaining = imgs.length;
          let done = () => {
            if (--remaining <= 0) resolve();
          };
          imgs.forEach(img => {
            if (img.complete) { done(); return; }
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          });
          // timeout fallback
          setTimeout(resolve, timeout);
        });
      }

      function buildRows(items){
        const rowA = document.createElement('div'); rowA.className = 'ach-row';
        const rowB = document.createElement('div'); rowB.className = 'ach-row-copy';
        items.forEach(a => {
          const item = document.createElement('div');
          item.className = 'ach-item';
          // support svg path or simple emoji/text
          let iconHtml = '';
          if (a.icon && typeof a.icon === 'string' && a.icon.startsWith('assets/')) {
            iconHtml = `<img src="${escapeHtml(a.icon)}" alt="" style="width:36px;height:36px;object-fit:contain">`;
          } else {
            // escape title/sub separately; icon is typically small emoji or symbol
            iconHtml = `<div class="ach-icon" aria-hidden="true">${escapeHtml(a.icon || '★')}</div>`;
          }
          // escape text fields
          const safeTitle = escapeHtml(a.title || '');
          const safeSub = escapeHtml(a.sub || '');
          item.innerHTML = `${iconHtml}<div class="ach-text"><div class="ach-title">${safeTitle}</div><div class="ach-sub">${safeSub}</div></div>`;
          // append a clone to rowA and original to rowB (two rows for seamless loop)
          rowA.appendChild(item.cloneNode(true));
          rowB.appendChild(item);
        });
        track.innerHTML = '';
        track.appendChild(rowA);
        track.appendChild(rowB);
        return { rowA, rowB };
      }

      function startLoop(rowA){
        // start safe: reset scroll to 0 to avoid jumps
        track.scrollLeft = 0;
        let scrollX = track.scrollLeft || 0;
        let widthLoop = rowA.scrollWidth || 1;
        let pausedAch = false;
        let lastTs = performance.now();
        const speed = 14; // px per second — чуть помедленнее для более приятного эффекта

        function step(ts){
          if(pausedAch){ lastTs = ts; requestAnimationFrame(step); return; }
          const delta = Math.min(40, ts - lastTs); lastTs = ts;
          scrollX += (speed * delta) / 1000;
          if (scrollX >= widthLoop) scrollX -= widthLoop;
          // assign integer scrollLeft to avoid sub-pixel jitter
          track.scrollLeft = Math.floor(scrollX);
          requestAnimationFrame(step);
        }

        // recalc after layout stable
        setTimeout(()=>{ widthLoop = rowA.scrollWidth || 1; requestAnimationFrame(step); }, 60);

        track.addEventListener('mouseenter', ()=>{ pausedAch = true; });
        track.addEventListener('mouseleave', ()=>{ pausedAch = false; });
        track.addEventListener('touchstart', ()=>{ pausedAch = true; }, {passive:true});
        track.addEventListener('touchend', ()=>{ pausedAch = false; }, {passive:true});
        window.addEventListener('resize', debounce(()=>{ widthLoop = rowA.scrollWidth || 1; }, 160));
      }

      // try to fetch JSON and fallback to defaults
      fetch('data/achievements.json', { cache: 'no-store' })
        .then(r => {
          if (!r.ok) throw new Error('no achievements.json');
          return r.json();
        })
        .then(data => {
          if (!Array.isArray(data) || data.length === 0) data = defaultAchievements;
          const { rowA } = buildRows(data);
          // wait for any images inside the built rows to load, then start loop
          waitImagesLoaded(rowA).then(()=> startLoop(rowA));
        })
        .catch(err => {
          console.info('achievements.json not found or failed — using defaults', err);
          const { rowA } = buildRows(defaultAchievements);
          waitImagesLoaded(rowA).then(()=> startLoop(rowA));
        });
    })();

  }); // DOMContentLoaded end

})(); // IIFE end
