// main.js — particles + UI (robust and with fallbacks)

// ------------------------
// Particles system (lightweight, adaptive, always some effect even with reduced-motion)
// ------------------------
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  let particles = [];
  let animationId = null;
  let paused = false;
  const mqReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = !!(mqReduced && mqReduced.matches);

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, canvas.clientWidth || window.innerWidth);
    H = Math.max(1, canvas.clientHeight || window.innerHeight);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // adaptive count
    const area = W * H;
    let baseCount = Math.floor(area / 11000);
    if (W < 720) baseCount = Math.min(baseCount, 18);
    if (reducedMotion) baseCount = Math.min(baseCount, 10);
    const count = Math.max(8, Math.min(baseCount, 120));
    initParticles(count);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function initParticles(n) {
    particles = [];
    for (let i = 0; i < n; i++) {
      particles.push({
        x: rand(0, W),
        y: rand(0, H),
        vx: rand(-0.18, 0.18) * (reducedMotion ? 0.4 : 1),
        vy: rand(-0.04, 0.04) * (reducedMotion ? 0.4 : 1),
        r: rand(0.6, 2.6),
        alpha: rand(0.05, 0.26)
      });
    }
  }

  function render() {
    if (paused) return;
    ctx.clearRect(0, 0, W, H);

    // soft radial color hint
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

    // optional connecting lines, lightweight
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
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

    animationId = requestAnimationFrame(render);
  }

  function start() {
    if (!animationId) {
      paused = false;
      render();
    }
  }
  function stop() {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;
    paused = true;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  window.addEventListener('resize', () => resize());
  window.addEventListener('orientationchange', () => resize());

  resize();
  const isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 720;
  // if user prefers reduced motion, still run minimal effect (not completely off)
  if (!reducedMotion) {
    if (!isMobile) start();
    else { initParticles(Math.min(18, particles.length)); start(); }
  } else {
    // reduced: very lightweight
    initParticles(Math.min(14, particles.length));
    start();
  }
})();


// ------------------------
// UI logic (safe, with fallbacks)
// ------------------------
document.addEventListener('DOMContentLoaded', () => {
  // set year safely
  const yearEl = document.getElementById('year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  // modal handlers (guarded)
  const modal = document.getElementById('modal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalClose = document.getElementById('modalClose');
  function closeModal(){ if(modal) modal.setAttribute('aria-hidden','true'); }
  function openModal(project){
    if(!modal) return;
    modal.setAttribute('aria-hidden','false');
    const t = document.getElementById('modalTitle'); if(t) t.textContent = project.title || '';
    const d = document.getElementById('modalDesc'); if(d) d.textContent = project.description || '';
    const link = document.getElementById('modalLink'); if(link) link.href = project.url || '#';
    const gallery = document.getElementById('modalGallery'); if(!gallery) return;
    gallery.innerHTML = '';
    const imgs = (project.gallery && project.gallery.length) ? project.gallery : (project.cover ? [project.cover] : []);
    imgs.forEach(src => {
      const img = document.createElement('img'); img.src = src; img.alt = project.title || ''; gallery.appendChild(img);
    });
  }
  if(modalClose) modalClose.addEventListener('click', closeModal);
  if(modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  // hero parallax (guard)
  const heroCard = document.getElementById('heroCard');
  const heroImage = document.getElementById('heroImage');
  if(heroCard && heroImage){
    heroCard.addEventListener('mousemove', (e) => {
      const rect = heroCard.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) - rect.width/2;
      const mouseY = (e.clientY - rect.top) - rect.height/2;
      const cx = (mouseX / rect.width) * 10;
      const cy = (mouseY / rect.height) * 8;
      heroImage.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(1.02) rotateZ(${cx * 0.02}deg)`;
    });
    heroCard.addEventListener('mouseleave', () => { heroImage.style.transform = `translate3d(0,0,0) scale(1) rotateZ(0)`; });
  }

  // reveal on scroll with robust fallback
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  // hide them initially by adding class is-hidden (CSS handles transition)
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
    // if element already visible in viewport, show immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < (window.innerHeight || document.documentElement.clientHeight) - 40) {
      el.classList.add('in-view'); el.classList.remove('is-hidden');
    } else if (observer) {
      observer.observe(el);
    } else {
      // no observer support -> still reveal
      el.classList.add('in-view'); el.classList.remove('is-hidden');
    }
  });

  // load projects
  const grid = document.getElementById('projects-grid');
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
      if (observer) observer.observe(card);
      else card.classList.add('in-view');
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

      // hover image parallax
      const img = card.querySelector('img');
      if(img){
        card.addEventListener('mousemove', (ev) => {
          const r = card.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width - 0.5;
          const py = (ev.clientY - r.top) / r.height - 0.5;
          img.style.transform = `translate3d(${px*8}px, ${py*6}px, 0) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => { img.style.transform = 'translate3d(0,0,0) scale(1)'; });
        img.style.transition = 'transform .35s cubic-bezier(.2,.9,.2,1)';
      }

      grid.appendChild(card);
      if(observer) observer.observe(card);
      else card.classList.add('in-view');
    });
  }

  // try fetching projects.json — if fails show placeholders
  (function loadProjects(){
    if(!grid){ return; }
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

  function escapeHtml(s){ if(!s) return ''; return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
});
