// main.js — подгружает data/projects.json и рендерит карточки.
// Показ заглушек, если projects.json отсутствует.
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
      card.className = 'project-card';
      card.innerHTML = `
        <div class="project-thumb" aria-hidden="true"></div>
        <h3 class="project-title">Название проекта</h3>
        <p class="project-desc">Короткое описание проекта. Добавь реальные данные через admin.html.</p>
        <div class="project-tags small muted">HTML • CSS • JS</div>
      `;
      grid.appendChild(card);
    }
  }

  function renderProjects(projects){
    grid.innerHTML = '';
    projects.forEach(p => {
      const card = document.createElement('article');
      card.className = 'project-card';
      const thumbHtml = p.cover ? `<img loading="lazy" src="${p.cover}" alt="${escapeHtml(p.title)}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:10px">` : `<div class="project-thumb" aria-hidden="true"></div>`;
      card.innerHTML = `
        ${thumbHtml}
        <h3 class="project-title">${escapeHtml(p.title || 'Без названия')}</h3>
        <p class="project-desc">${escapeHtml(p.description || '')}</p>
        <div class="project-tags small muted">${Array.isArray(p.tags)? p.tags.join(' • '): ''}</div>
      `;
      card.tabIndex = 0;
      card.addEventListener('click', () => openModal(p));
      card.addEventListener('keypress', (e) => { if(e.key === 'Enter') openModal(p); });
      grid.appendChild(card);
    });
  }

  function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
});
