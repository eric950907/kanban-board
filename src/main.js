// ========================================
// Kanban Board - Main Application
// ========================================

// Icons (inline SVG)
const Icons = {
  logo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
  moreH: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
  inbox: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  subtask: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>`,
};

// State
let state = {
  projects: [],
  labels: [],
  tasks: [],
  currentProject: null,
  draggedTask: null,
};

const STATUSES = [
  { id: 'backlog', name: 'Backlog', color: 'backlog' },
  { id: 'todo', name: 'Todo', color: 'todo' },
  { id: 'progress', name: 'In Progress', color: 'progress' },
  { id: 'done', name: 'Done', color: 'done' },
];

const PRIORITIES = [
  { id: 'urgent', name: '紧急', color: 'urgent' },
  { id: 'high', name: '高', color: 'high' },
  { id: 'medium', name: '中', color: 'medium' },
  { id: 'low', name: '低', color: 'low' },
  { id: 'none', name: '无', color: 'none' },
];

// ========================================
// Data Management
// ========================================

const STORAGE_KEY = 'kanban-board-data';

async function loadData() {
  // Try localStorage first
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      state.projects = data.projects || [];
      state.labels = data.labels || [];
      state.tasks = data.tasks || [];
      return;
    } catch (e) {
      console.warn('Failed to parse stored data:', e);
    }
  }
  
  // Fall back to data.json
  try {
    const response = await fetch('/data/data.json');
    const data = await response.json();
    state.projects = data.projects || [];
    state.labels = data.labels || [];
    state.tasks = data.tasks || [];
    saveData(); // Save to localStorage
  } catch (e) {
    console.error('Failed to load data:', e);
    state.projects = [];
    state.labels = [];
    state.tasks = [];
  }
}

function saveData() {
  const data = {
    projects: state.projects,
    labels: state.labels,
    tasks: state.tasks,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ========================================
// Utility Functions
// ========================================

function generateId() {
  return 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function getTasksByStatus(status) {
  let tasks = state.tasks.filter(t => t.status === status);
  if (state.currentProject) {
    tasks = tasks.filter(t => t.projectId === state.currentProject);
  }
  return tasks;
}

function getProjectById(id) {
  return state.projects.find(p => p.id === id);
}

function getLabelById(id) {
  return state.labels.find(l => l.id === id);
}

function getCompletedSubtasks(task) {
  if (!task.subtasks || task.subtasks.length === 0) return null;
  const completed = task.subtasks.filter(s => s.completed).length;
  return { completed, total: task.subtasks.length };
}

// ========================================
// Render Functions
// ========================================

function renderApp() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      ${renderHeader()}
      ${renderBoard()}
    </div>
    ${renderModal()}
  `;
  
  attachEventListeners();
}

function renderSidebar() {
  return `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          ${Icons.logo}
          <span>Kanban</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">视图</div>
          <div class="nav-item ${!state.currentProject ? 'active' : ''}" data-action="view-all">
            ${Icons.inbox}
            <span>所有任务</span>
          </div>
        </div>
        <div class="nav-section">
          <div class="nav-section-title">项目</div>
          ${state.projects.map(project => `
            <div class="nav-item ${state.currentProject === project.id ? 'active' : ''}" data-action="select-project" data-project-id="${project.id}">
              <span class="project-color" style="background: var(--accent-${project.color})"></span>
              <span>${project.name}</span>
            </div>
          `).join('')}
        </div>
      </nav>
    </aside>
  `;
}

function renderHeader() {
  const currentProject = state.currentProject ? getProjectById(state.currentProject) : null;
  const title = currentProject ? currentProject.name : '所有任务';
  
  return `
    <header class="header">
      <div class="header-left">
        <h1 class="header-title">${title}</h1>
      </div>
      <div class="header-actions">
        <button class="icon-btn" title="搜索">
          ${Icons.search}
        </button>
        <button class="icon-btn" title="筛选">
          ${Icons.filter}
        </button>
        <button class="btn-primary" data-action="new-task">
          ${Icons.plus}
          <span>新建任务</span>
        </button>
      </div>
    </header>
  `;
}

function renderBoard() {
  return `
    <div class="board-container">
      <div class="board">
        ${STATUSES.map(status => renderColumn(status)).join('')}
      </div>
    </div>
  `;
}

function renderColumn(status) {
  const tasks = getTasksByStatus(status.id);
  
  return `
    <div class="column" data-status="${status.id}">
      <div class="column-header">
        <div class="column-title">
          <span class="column-status-dot ${status.color}"></span>
          <span class="column-name">${status.name}</span>
          <span class="column-count">${tasks.length}</span>
        </div>
        <div class="column-actions">
          <button class="icon-btn" data-action="add-task-column" data-status="${status.id}">
            ${Icons.plus}
          </button>
        </div>
      </div>
      <div class="column-content" data-status="${status.id}">
        ${tasks.map(task => renderTaskCard(task)).join('')}
        ${tasks.length === 0 ? renderEmptyColumn() : ''}
      </div>
    </div>
  `;
}

function renderEmptyColumn() {
  return `
    <div class="empty-state">
      <p>暂无任务</p>
    </div>
  `;
}

function renderTaskCard(task) {
  const project = getProjectById(task.projectId);
  const subtaskProgress = getCompletedSubtasks(task);
  
  return `
    <div class="task-card" draggable="true" data-task-id="${task.id}">
      <div class="task-priority ${task.priority}"></div>
      <div class="task-header">
        <span class="task-id">${task.id.split('-').pop().toUpperCase()}</span>
        <span class="task-title">${task.title}</span>
      </div>
      <div class="task-meta">
        <div class="task-labels">
          ${task.labels.map(labelId => {
            const label = getLabelById(labelId);
            return label ? `<span class="task-label ${label.color}">${label.name}</span>` : '';
          }).join('')}
        </div>
        ${subtaskProgress ? `
          <div class="subtask-progress">
            ${Icons.check}
            <span>${subtaskProgress.completed}/${subtaskProgress.total}</span>
          </div>
        ` : ''}
      </div>
      ${project ? `
        <div class="task-footer">
          <div class="task-project">
            <span class="task-project-dot" style="background: var(--accent-${project.color})"></span>
            <span>${project.name}</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderModal() {
  return `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal" id="modal">
        <div class="modal-header">
          <h2 class="modal-title">新建任务</h2>
          <button class="modal-close" data-action="close-modal">
            ${Icons.close}
          </button>
        </div>
        <div class="modal-body">
          <form id="task-form">
            <div class="form-group">
              <label class="form-label">标题</label>
              <input type="text" class="form-input" name="title" placeholder="任务标题" required>
            </div>
            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea class="form-input" name="description" placeholder="任务描述（可选）"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">项目</label>
              <select class="form-select" name="projectId">
                <option value="">无项目</option>
                ${state.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <select class="form-select" name="status">
                ${STATUSES.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">优先级</label>
              <select class="form-select" name="priority">
                ${PRIORITIES.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-action="close-modal">取消</button>
          <button class="btn-primary" data-action="save-task">创建任务</button>
        </div>
      </div>
    </div>
  `;
}

// ========================================
// Event Handlers
// ========================================

function attachEventListeners() {
  // Delegation for clicks
  document.addEventListener('click', handleClick);
  
  // Form submission
  const form = document.getElementById('task-form');
  if (form) {
    form.addEventListener('submit', e => e.preventDefault());
  }
  
  // Drag and drop
  attachDragListeners();
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeydown);
}

function handleClick(e) {
  const action = e.target.closest('[data-action]')?.dataset.action;
  
  switch (action) {
    case 'new-task':
    case 'add-task-column':
      openModal(e.target.closest('[data-status]')?.dataset.status);
      break;
    case 'close-modal':
      closeModal();
      break;
    case 'save-task':
      saveTask();
      break;
    case 'view-all':
      state.currentProject = null;
      renderApp();
      break;
    case 'select-project':
      state.currentProject = e.target.closest('[data-project-id]').dataset.projectId;
      renderApp();
      break;
  }
  
  // Close modal on overlay click
  if (e.target.id === 'modal-overlay') {
    closeModal();
  }
}

function handleKeydown(e) {
  // N = New task
  if (e.key === 'n' && !e.target.closest('input, textarea')) {
    e.preventDefault();
    openModal();
  }
  
  // Escape = Close modal
  if (e.key === 'Escape') {
    closeModal();
  }
}

// ========================================
// Modal Functions
// ========================================

function openModal(defaultStatus = 'todo') {
  const overlay = document.getElementById('modal-overlay');
  const form = document.getElementById('task-form');
  
  if (form) {
    form.reset();
    form.elements.status.value = defaultStatus;
    if (state.currentProject) {
      form.elements.projectId.value = state.currentProject;
    }
  }
  
  overlay?.classList.add('active');
  form?.elements.title.focus();
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay?.classList.remove('active');
}

function saveTask() {
  const form = document.getElementById('task-form');
  if (!form) return;
  
  const title = form.elements.title.value.trim();
  if (!title) {
    form.elements.title.focus();
    return;
  }
  
  const task = {
    id: generateId(),
    projectId: form.elements.projectId.value || null,
    title: title,
    description: form.elements.description.value.trim(),
    status: form.elements.status.value,
    priority: form.elements.priority.value,
    labels: [],
    subtasks: [],
    createdAt: new Date().toISOString(),
  };
  
  state.tasks.push(task);
  saveData();
  closeModal();
  renderApp();
}

// ========================================
// Drag & Drop
// ========================================

function attachDragListeners() {
  const cards = document.querySelectorAll('.task-card');
  const columns = document.querySelectorAll('.column-content');
  
  cards.forEach(card => {
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
  });
  
  columns.forEach(column => {
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('dragleave', handleDragLeave);
    column.addEventListener('drop', handleDrop);
  });
}

function handleDragStart(e) {
  const taskId = e.target.dataset.taskId;
  state.draggedTask = taskId;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', taskId);
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  state.draggedTask = null;
  
  // Remove all drag-over states
  document.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  
  const column = e.target.closest('.column-content');
  if (column) {
    column.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  const column = e.target.closest('.column-content');
  if (column && !column.contains(e.relatedTarget)) {
    column.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();
  
  const column = e.target.closest('.column-content');
  if (!column) return;
  
  column.classList.remove('drag-over');
  
  const taskId = e.dataTransfer.getData('text/plain');
  const newStatus = column.dataset.status;
  
  // Update task status
  const task = state.tasks.find(t => t.id === taskId);
  if (task && task.status !== newStatus) {
    task.status = newStatus;
    saveData();
    renderApp();
  }
}

// ========================================
// Initialize
// ========================================

async function init() {
  await loadData();
  renderApp();
}

init();
