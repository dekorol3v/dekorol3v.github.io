// main.js — подгружает data/projects.json, рендерит карточки и добавляет анимации (parallax + reveal)
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  toggle.addEventListener('click', () => {
    const isHidden = sidebar.style.display === 'none' || getComputedStyle(sidebar).display === 'none';
    sidebar.style.display = isHidden ? 'block' : 'none';
  });

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
    let mouseX = 0, mouseY = 0, cx = 0, cy = 0;
    heroCard.addEventListener('mousemove', (e) => {
      const rect = heroCard.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) - rect.width/2;
      mouseY = (e.clientY - rect.top) - rect.height/2;
      // subtle mapping
      cx = (mouseX / rect.width) * 10;
      cy = (mouseY / rect.height) * 8;
      heroImage.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(1.02) rotateZ(${cx * 0.02}deg)`;
    });
    heroCard.addEventListener('mouseleave', () => {
      heroImage.style.transform = `translate3d(0,0,0) scale(1) rotateZ(0)`;
    });
  }

  // reveal on scroll using IntersectionObserver
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.15});

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // load projects and render with reveal class on cards
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
        <div class="project-thumb">${thumbHtml}</div>
        <h3 class="project-title">${escapeHtml(p.title || 'Без названия')}</h3>
        <p class="project-desc">${escapeHtml(p.description || '')}</p>
        <div class="project-tags small muted">${Array.isArray(p.tags)? p.tags.join(' • '): ''}</div>
      `;
      // card interactions: click opens modal
      card.tabIndex = 0;
      card.addEventListener('click', () => openModal(p));
      card.addEventListener('keypress', (e) => { if(e.key === 'Enter') openModal(p); });

      // small hover-parallax for image inside card
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
      observer.observe(card);
    });
  }

  function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
});
