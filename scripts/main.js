// Minimal particles + mobile nav + last-project renderer + logo fallback (вариант A)
(function(){
  /* ========== Particles (unchanged) ========== */
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas ? canvas.getContext('2d', { alpha: true }) : null;
  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  let particles = [];
  let raf = null;
  let reduced = false;
  let enabled = true;

  function updateReduced(){ reduced = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || false; }
  updateReduced();
  if (window.matchMedia) {
    try { window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => { updateReduced(); resize(); }); } catch(e) {}
  }

  function rand(a,b){ return Math.random()*(b-a)+a; }

  function resize(){
    if (!canvas || !ctx) return;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, window.innerWidth);
    H = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);

    const area = W * H;
    let base = Math.floor(area / 14000);
    if (W < 720) base = Math.min(base, 18);
    if (reduced) base = Math.min(base, 10);
    const count = Math.max(6, Math.min(base, 120));
    initParticles(count);
  }

  function initParticles(n){
    particles = [];
    for (let i=0;i<n;i++){
      particles.push({
        x: rand(0,W),
        y: rand(0,H),
        vx: rand(-0.22,0.22) * (reduced ? 0.45 : 1),
        vy: rand(-0.06,0.06) * (reduced ? 0.45 : 1),
        r: rand(0.6,2.4),
        a: rand(0.04,0.18)
      });
    }
  }

  function render(){
    if (!ctx || !enabled) return;
    ctx.clearRect(0,0,W,H);
    try {
      const g = ctx.createRadialGradient(W*0.75,H*0.25,0,W*0.75,H*0.25,Math.max(W,H)*0.8);
      g.addColorStop(0,'rgba(46,196,255,0.01)');
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,W,H);
    } catch(e){}
    for (let p of particles){
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W+10;
      if (p.x > W+10) p.x = -10;
      if (p.y < -10) p.y = H+10;
      if (p.y > H+10) p.y = -10;
      ctx.beginPath();
      ctx.fillStyle = `rgba(46,196,255,${p.a})`;
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    }
    const n = particles.length;
    const cap = n > 60 ? 30 : n;
    for (let i=0;i<n;i++){
      const a = particles[i];
      for (let j=i+1,lim=Math.min(n,i+cap); j<lim; j++){
        const b = particles[j];
        const dx = a.x-b.x, dy = a.y-b.y;
        const d = Math.sqrt(dx*dx+dy*dy);
        if (d < 80){
          ctx.beginPath();
          ctx.strokeStyle = `rgba(46,196,255,${(1 - d/80) * 0.06})`;
          ctx.lineWidth = 1;
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(render);
  }

  function start(){ if (!enabled) return; if (!raf) render(); }
  function stop(){ if (raf) cancelAnimationFrame(raf); raf = null; if (ctx) ctx.clearRect(0,0,W,H); }

  window.addEventListener('resize', () => { resize(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });

  resize();
  if (!reduced && enabled) start();

  /* ========== Logo fallback variant A (text always visible) ========== */
  (function ensureLogoFallback(){
    function init(){
      const img = document.querySelector('.logo img');
      const text = document.querySelector('.logo-text');
      if (!img) { if (text) text.style.display = 'block'; return; }
      img.addEventListener('error', () => { try { img.style.display = 'none'; } catch(e){} if (text) text.style.display = 'block'; }, { once: true });
      if (img.complete) {
        if (img.naturalWidth === 0) img.dispatchEvent(new Event('error'));
        else if (text) text.style.display = 'block';
      }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  })();

  /* ========== Mobile nav (unchanged) ========== */
  document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('mainNav');
    const toggle = document.getElementById('navToggle');
    let mobileMenu = null;

    function buildMobileMenu(){
      if (mobileMenu) return;
      mobileMenu = document.createElement('div');
      mobileMenu.className = 'mobile-nav';
      Array.from(nav.querySelectorAll('a')).forEach(a => {
        const link = a.cloneNode(true);
        link.addEventListener('click', () => { closeMenu(); });
        mobileMenu.appendChild(link);
      });
      document.body.appendChild(mobileMenu);
    }

    function openMenu(){
      buildMobileMenu();
      mobileMenu.style.display = 'flex';
      toggle.setAttribute('aria-expanded','true');
      toggle.setAttribute('aria-label','Закрыть меню');
    }
    function closeMenu(){
      if (!mobileMenu) return;
      mobileMenu.style.display = 'none';
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Открыть меню');
    }

    toggle.addEventListener('click', () => {
      if (!mobileMenu || mobileMenu.style.display === 'none' || mobileMenu.style.display === '') openMenu();
      else closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 720 && mobileMenu) closeMenu();
    });
  });

  /* ========== Last project renderer ==========
     Попытается загрузить data/projects.json и взять последний элемент.
     Формат ожидается как массив объектов:
     [{id, title, subtitle, description, tags, cover, url}, ...]
  ============================================*/
  (function renderLastProject(){
    const container = document.getElementById('lastProject');
    if (!container) return;

    function render(p){
      const card = container.querySelector('.project-card');
      if (!card) return;
      // thumb
      const thumbEl = card.querySelector('.project-thumb');
      thumbEl.innerHTML = '';
      if (p.cover) {
        const img = document.createElement('img');
        img.src = p.cover;
        img.alt = p.title || 'project';
        img.loading = 'lazy';
        thumbEl.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.className = 'thumb-placeholder';
        ph.textContent = 'Project image';
        thumbEl.appendChild(ph);
      }
      // body
      const title = card.querySelector('.project-title');
      const desc = card.querySelector('.project-desc');
      const meta = card.querySelector('.project-meta');
      const openBtn = document.getElementById('projectOpen');

      if (title) title.textContent = p.title || 'Без названия';
      if (desc) desc.textContent = p.subtitle || p.description || '';
      if (meta) meta.textContent = Array.isArray(p.tags) ? p.tags.join(' • ') : '';
      if (openBtn) {
        if (p.url) openBtn.href = p.url;
        else openBtn.href = '#';
      }
    }

    function fallback(){
      // ничего не делаем — оставляем placeholder, но можно обновить текст
    }

    // try fetch
    fetch('data/projects.json', {cache: 'no-store'}).then(r => {
      if (!r.ok) throw new Error('no projects.json');
      return r.json();
    }).then(data => {
      if (!Array.isArray(data) || data.length === 0) { fallback(); return; }
      const last = data[data.length - 1];
      render(last);
    }).catch(err => {
      // fallback to defaults if fetch failed
      console.info('projects.json not found — using placeholder for last project', err);
      fallback();
    });
  })();

  // set year in footer if exists
  (function setYear(){
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  })();

})();
