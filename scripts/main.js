// main.js — particles + UI (sidebar toggle removed)
// ------------------------
// Particles system (lightweight, adaptive)
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
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const area = W * H;
    let baseCount = Math.floor(area / 9000);
    if (W < 720) baseCount = Math.min(baseCount, 18);
    if (reducedMotion) baseCount = Math.min(baseCount, 8);
    const count = Math.max(12, Math.min(baseCount, 120));
    initParticles(count);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function initParticles(n) {
    particles = [];
    for (let i = 0; i < n; i++) {
      particles.push({
        x: rand(0, W),
        y: rand(0, H),
        vx: rand(-0.2, 0.2),
        vy: rand(-0.05, 0.05),
        r: rand(0.6, 2.6),
        alpha: rand(0.06, 0.26)
      });
    }
  }

  function render() {
    if (paused) return;
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
    if (reducedMotion) return;
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
  if (!reducedMotion && !isMobile) start();
  if (!reducedMotion && isMobile) {
    initParticles(Math.min(20, particles.length));
    start();
  }
})();

// ------------------------
// Rest of UI logic (modal, hero parallax, reveal, project rendering)
// ------------------------
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  // modal handlers
  const modal = document.getElementById('modal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalClose = document.getElementById('modalClose');
  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);

  function openModal(project){
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('modalTitle').textContent = project.title || '';
    document.getElementById('modalDesc').textContent = project.description || '';
    document.getElementById('modalLink').href = project.url || '#';
    const gallery = document.getElementById('modalGallery');
    gallery.innerHTML = '';
    const imgs = project.gallery && project.gallery.length ? project.gallery : (project.cover ? [project.cover] : []);
    imgs.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = project.title || '';
      gallery.appendChild(img);
    });
  }
  function closeModal(){
    modal.setAttribute('aria-hidden','true');
  }

  // hero parallax (mouse move)
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
    heroCard.addEventListener('mouseleave', () => {
      heroImage.style.transform = `translate3d(0,0,0) scale(1) rotateZ(0)`;
    });
  }

  // reveal on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.15});
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // load projects
  const grid = document.getElementById('projects-grid');
  fetch('data/projects.json', {cache: 'no-store'}).then(r => {
    if(!r.ok) throw new Error('no projects.json');
    return r.json();
  }).then(data => {
    if(!Array.isArray(data) || data.length === 0){
      renderPlaceholders(6);
    } else {
      renderProjects(data);
    }
  }).catch(err => {
    console.warn('projects.json not found — rendering placeholders', err);
    renderPlaceholders(6);
  });

  function renderPlaceholders(n){
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
      observer.observe(card);
    }
  }

  function renderProjects(projects){
    grid.innerHTML = '';
    projects.forEach((p, idx) => {
      const card = document.createElement('article');
      card.className = 'project-card reveal';
      const thumbHtml = p.cover ? `<img loading="lazy" src="${p.cover}" alt="${escapeHtml(p.title)}">` : `<div class="project-thumb" aria-hidden="true"></div>`;
      card.innerHTML = `
        <div class="
