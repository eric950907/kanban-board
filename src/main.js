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
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  subtask: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>`,
  undo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
};

// ========================================
// State
// ========================================

let state = {
  projects: [],
  labels: [],
  tasks: [],
  currentProject: null,
  draggedTask: null,
  editingTask: null,
  isEditingMode: false,
  searchQuery: '',
  deletedTask: null, // For undo
};

const STATUSES = [
  { id: 'backlog', name: 'Backlog', color: 'backlog' },
  { id: 'todo', name: 'Todo', color: 'todo' },
  { id: 'progress', name: 'In Progress', color: 'progress' },
  { id: 'review', name: 'Review', color: 'review' },
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
// Utility Functions
// ========================================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function generateId() {
  return 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function getTasksByStatus(status) {
  let tasks = state.tasks.filter(t => t.status === status);
  if (state.currentProject) {
    tasks = tasks.filter(t => t.projectId === state.currentProject);
  }
  if (state.searchQuery) {
    const query = state.searchQuery.toLowerCase();
    tasks = tasks.filter(t => 
      t.title.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query))
    );
  }
  return tasks;
}

function getProjectById(id) {
  return state.projects.find(p => p.id === id);
}

function getLabelById(id) {
  return state.labels.find(l => l.id === id);
}

function getTaskById(id) {
  return state.tasks.find(t => t.id === id);
}

function getCompletedSubtasks(task) {
  if (!task.subtasks || task.subtasks.length === 0) return null;
  const completed = task.subtasks.filter(s => s.completed).length;
  return { completed, total: task.subtasks.length };
}

// ========================================
// Data Management
// ========================================

const STORAGE_KEY = 'kanban-board-data';

async function loadData() {
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
  
  try {
    const response = await fetch('/data/data.json');
    const data = await response.json();
    state.projects = data.projects || [];
    state.labels = data.labels || [];
    state.tasks = data.tasks || [];
    saveData();
  } catch (e) {
    console.error('Failed to load data:', e);
    state.projects = [];
    state.labels = [];
    state.tasks = [];
  }
}

const saveData = debounce(() => {
  const data = {
    projects: state.projects,
    labels: state.labels,
    tasks: state.tasks,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}, 300);

function saveDataImmediate() {
  const data = {
    projects: state.projects,
    labels: state.labels,
    tasks: state.tasks,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ========================================
// Toast Notifications
// ========================================

let toastTimeout = null;

function showToast(message, action = null, actionLabel = null) {
  hideToast();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.id = 'toast';
  toast.innerHTML = `
    <span class="toast-message">${escapeHtml(message)}</span>
    ${action ? `<button class="toast-action" id="toast-action">${escapeHtml(actionLabel)}</button>` : ''}
    <button class="toast-close" data-action="close-toast">${Icons.close}</button>
  `;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => toast.classList.add('visible'));
  
  if (action) {
    document.getElementById('toast-action')?.addEventListener('click', () => {
      action();
      hideToast();
    });
  }
  
  toastTimeout = setTimeout(hideToast, 5000);
}

function hideToast() {
  clearTimeout(toastTimeout);
  const toast = document.getElementById('toast');
  if (toast) {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 200);
  }
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
    ${renderTaskModal()}
  `;
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
          <div class="nav-section-header">
            <div class="nav-section-title">项目</div>
            <button class="nav-add-btn" data-action="new-project" title="新建项目">
              ${Icons.plus}
            </button>
          </div>
          ${state.projects.map(project => `
            <div class="nav-item ${state.currentProject === project.id ? 'active' : ''}" data-action="select-project" data-project-id="${project.id}">
              <span class="project-color" style="background: var(--accent-${project.color})"></span>
              <span>${escapeHtml(project.name)}</span>
            </div>
          `).join('')}
        </div>
      </nav>
    </aside>
  `;
}

function renderHeader() {
  const currentProject = state.currentProject ? getProjectById(state.currentProject) : null;
  const title = currentProject ? escapeHtml(currentProject.name) : '所有任务';
  
  return `
    <header class="header">
      <div class="header-left">
        <h1 class="header-title">${title}</h1>
      </div>
      <div class="header-actions">
        <div class="search-box ${state.searchQuery ? 'active' : ''}">
          ${Icons.search}
          <input type="text" class="search-input" id="search-input" placeholder="搜索任务..." value="${escapeHtml(state.searchQuery)}">
          ${state.searchQuery ? `<button class="search-clear" data-action="clear-search">${Icons.close}</button>` : ''}
        </div>
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
      <p>拖拽任务到这里</p>
    </div>
  `;
}

function renderTaskCard(task) {
  const project = getProjectById(task.projectId);
  const subtaskProgress = getCompletedSubtasks(task);
  
  return `
    <div class="task-card" draggable="true" data-task-id="${task.id}" data-action="open-task">
      <div class="task-priority ${task.priority}"></div>
      <div class="task-header">
        <span class="task-id">${task.id.split('-').pop().toUpperCase()}</span>
        <span class="task-title">${escapeHtml(task.title)}</span>
      </div>
      <div class="task-meta">
        <div class="task-labels">
          ${(task.labels || []).map(labelId => {
            const label = getLabelById(labelId);
            return label ? `<span class="task-label ${label.color}">${escapeHtml(label.name)}</span>` : '';
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
            <span>${escapeHtml(project.name)}</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderTaskModal() {
  const isEdit = !!state.editingTask;
  const task = state.editingTask || {};
  const isViewMode = isEdit && !state.isEditingMode;
  
  if (isEdit && isViewMode) {
    return renderTaskDetailView(task);
  }
  
  return `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal" id="modal">
        <div class="modal-header">
          <h2 class="modal-title">${isEdit ? '编辑任务' : '新建任务'}</h2>
          <button class="modal-close" data-action="close-modal">
            ${Icons.close}
          </button>
        </div>
        <div class="modal-body">
          <form id="task-form">
            <input type="hidden" name="taskId" value="${task.id || ''}">
            
            <div class="form-group">
              <label class="form-label">标题</label>
              <input type="text" class="form-input" name="title" placeholder="任务标题" value="${escapeHtml(task.title || '')}" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea class="form-input" name="description" placeholder="任务描述（可选）">${escapeHtml(task.description || '')}</textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label">操作流程</label>
              <textarea class="form-input form-textarea-lg" name="instructions" placeholder="详细描述如何完成这个任务...&#10;&#10;例如：&#10;1. 第一步做什么&#10;2. 第二步做什么&#10;3. 验收标准">${escapeHtml(task.instructions || '')}</textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">项目</label>
                <select class="form-select" name="projectId">
                  <option value="">无项目</option>
                  ${state.projects.map(p => `
                    <option value="${p.id}" ${task.projectId === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>
                  `).join('')}
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">状态</label>
                <select class="form-select" name="status">
                  ${STATUSES.map(s => `
                    <option value="${s.id}" ${task.status === s.id ? 'selected' : ''}>${s.name}</option>
                  `).join('')}
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">优先级</label>
                <select class="form-select" name="priority">
                  ${PRIORITIES.map(p => `
                    <option value="${p.id}" ${task.priority === p.id ? 'selected' : ''}>${p.name}</option>
                  `).join('')}
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">标签</label>
              <div class="label-selector">
                ${state.labels.map(label => `
                  <label class="label-option">
                    <input type="checkbox" name="labels" value="${label.id}" 
                      ${(task.labels || []).includes(label.id) ? 'checked' : ''}>
                    <span class="label-chip ${label.color}">${escapeHtml(label.name)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">子任务</label>
              <div class="subtasks-list" id="subtasks-list">
                ${(task.subtasks || []).map((sub, idx) => `
                  <div class="subtask-item" data-subtask-idx="${idx}">
                    <input type="checkbox" class="subtask-checkbox" ${sub.completed ? 'checked' : ''} data-action="toggle-subtask" data-idx="${idx}">
                    <input type="text" class="subtask-input" value="${escapeHtml(sub.title)}" data-idx="${idx}">
                    <button type="button" class="subtask-delete" data-action="delete-subtask" data-idx="${idx}">${Icons.close}</button>
                  </div>
                `).join('')}
              </div>
              <button type="button" class="add-subtask-btn" data-action="add-subtask">
                ${Icons.plus}
                <span>添加子任务</span>
              </button>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          ${isEdit ? `
            <button class="btn-danger" data-action="delete-task">
              ${Icons.trash}
              <span>删除</span>
            </button>
            <div class="modal-footer-spacer"></div>
          ` : ''}
          <button class="btn-secondary" data-action="close-modal">取消</button>
          <button class="btn-primary" data-action="save-task">${isEdit ? '保存' : '创建任务'}</button>
        </div>
      </div>
    </div>
  `;
}

function renderTaskDetailView(task) {
  const project = getProjectById(task.projectId);
  const status = STATUSES.find(s => s.id === task.status);
  const priority = PRIORITIES.find(p => p.id === task.priority);
  const subtaskProgress = getCompletedSubtasks(task);
  
  return `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal modal-lg" id="modal">
        <div class="modal-header">
          <div class="detail-header-left">
            <span class="detail-task-id">${task.id.split('-').pop().toUpperCase()}</span>
            ${project ? `
              <span class="detail-project">
                <span class="project-dot" style="background: var(--accent-${project.color})"></span>
                ${escapeHtml(project.name)}
              </span>
            ` : ''}
          </div>
          <div class="detail-header-actions">
            <button class="icon-btn" data-action="edit-mode" title="编辑">
              ${Icons.edit}
            </button>
            <button class="modal-close" data-action="close-modal">
              ${Icons.close}
            </button>
          </div>
        </div>
        
        <div class="modal-body detail-body">
          <div class="detail-main">
            <h1 class="detail-title">${escapeHtml(task.title)}</h1>
            
            ${task.description ? `
              <div class="detail-section">
                <h3 class="detail-section-title">描述</h3>
                <p class="detail-description">${escapeHtml(task.description)}</p>
              </div>
            ` : ''}
            
            ${task.instructions ? `
              <div class="detail-section">
                <h3 class="detail-section-title">📋 操作流程</h3>
                <div class="detail-instructions">${formatInstructions(task.instructions)}</div>
              </div>
            ` : `
              <div class="detail-section">
                <h3 class="detail-section-title">📋 操作流程</h3>
                <p class="detail-empty">暂无操作流程，点击编辑添加</p>
              </div>
            `}
            
            ${task.subtasks && task.subtasks.length > 0 ? `
              <div class="detail-section">
                <h3 class="detail-section-title">
                  子任务
                  ${subtaskProgress ? `<span class="subtask-count">${subtaskProgress.completed}/${subtaskProgress.total}</span>` : ''}
                </h3>
                <div class="detail-subtasks">
                  ${task.subtasks.map((sub, idx) => `
                    <div class="detail-subtask ${sub.completed ? 'completed' : ''}" data-action="toggle-subtask-detail" data-idx="${idx}">
                      <span class="subtask-check">${sub.completed ? Icons.check : ''}</span>
                      <span class="subtask-title">${escapeHtml(sub.title)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          
          <div class="detail-sidebar">
            <div class="detail-meta-item">
              <span class="meta-label">状态</span>
              <span class="meta-value status-badge ${status?.color || ''}">${status?.name || '未知'}</span>
            </div>
            
            <div class="detail-meta-item">
              <span class="meta-label">优先级</span>
              <span class="meta-value priority-badge ${priority?.id || ''}">${priority?.name || '无'}</span>
            </div>
            
            ${task.labels && task.labels.length > 0 ? `
              <div class="detail-meta-item">
                <span class="meta-label">标签</span>
                <div class="meta-labels">
                  ${task.labels.map(labelId => {
                    const label = getLabelById(labelId);
                    return label ? `<span class="task-label ${label.color}">${escapeHtml(label.name)}</span>` : '';
                  }).join('')}
                </div>
              </div>
            ` : ''}
            
            <div class="detail-meta-item">
              <span class="meta-label">创建时间</span>
              <span class="meta-value">${formatDate(task.createdAt)}</span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-danger" data-action="delete-task">
            ${Icons.trash}
            <span>删除</span>
          </button>
          <div class="modal-footer-spacer"></div>
          <button class="btn-secondary" data-action="close-modal">关闭</button>
          <button class="btn-primary" data-action="edit-mode">
            ${Icons.edit}
            <span>编辑</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function formatInstructions(text) {
  if (!text) return '';
  
  // Convert line breaks to HTML and handle numbered lists
  const lines = text.split('\n');
  let html = '';
  let inList = false;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        html += '</ol>';
        inList = false;
      }
      html += '<br>';
      return;
    }
    
    // Check for numbered list (1. 2. 3. etc)
    const listMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (listMatch) {
      if (!inList) {
        html += '<ol class="instruction-list">';
        inList = true;
      }
      html += `<li>${escapeHtml(listMatch[2])}</li>`;
    } else {
      if (inList) {
        html += '</ol>';
        inList = false;
      }
      // Check for bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        html += `<div class="instruction-bullet">• ${escapeHtml(trimmed.slice(2))}</div>`;
      } else {
        html += `<p>${escapeHtml(trimmed)}</p>`;
      }
    }
  });
  
  if (inList) {
    html += '</ol>';
  }
  
  return html;
}

function formatDate(dateStr) {
  if (!dateStr) return '未知';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '未知';
  }
}

// ========================================
// Event Handling (Single Delegation)
// ========================================

let listenersAttached = false;

function attachGlobalListeners() {
  if (listenersAttached) return;
  listenersAttached = true;
  
  // Click delegation
  document.addEventListener('click', handleClick);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeydown);
  
  // Input delegation
  document.addEventListener('input', handleInput);
  
  // Drag events delegation
  document.addEventListener('dragstart', handleDragStart);
  document.addEventListener('dragend', handleDragEnd);
  document.addEventListener('dragover', handleDragOver);
  document.addEventListener('dragleave', handleDragLeave);
  document.addEventListener('drop', handleDrop);
}

function handleClick(e) {
  const target = e.target;
  const actionEl = target.closest('[data-action]');
  const action = actionEl?.dataset.action;
  
  switch (action) {
    case 'new-task':
      openModal();
      break;
    case 'add-task-column':
      openModal(actionEl.dataset.status);
      break;
    case 'open-task':
      e.preventDefault();
      const taskId = actionEl.dataset.taskId;
      const task = getTaskById(taskId);
      if (task) {
        state.isEditingMode = false;
        openModal(null, task);
      }
      break;
    case 'edit-mode':
      state.isEditingMode = true;
      openModal(null, state.editingTask);
      break;
    case 'close-modal':
      closeModal();
      break;
    case 'save-task':
      saveTask();
      break;
    case 'delete-task':
      deleteTask();
      break;
    case 'view-all':
      state.currentProject = null;
      renderApp();
      break;
    case 'select-project':
      state.currentProject = actionEl.dataset.projectId;
      renderApp();
      break;
    case 'clear-search':
      state.searchQuery = '';
      renderApp();
      break;
    case 'close-toast':
      hideToast();
      break;
    case 'new-project':
      createNewProject();
      break;
    case 'add-subtask':
      addSubtask();
      break;
    case 'delete-subtask':
      deleteSubtask(parseInt(actionEl.dataset.idx));
      break;
    case 'toggle-subtask':
      toggleSubtask(parseInt(actionEl.dataset.idx), target.checked);
      break;
    case 'toggle-subtask-detail':
      const idx = parseInt(actionEl.dataset.idx);
      if (state.editingTask && state.editingTask.subtasks[idx]) {
        state.editingTask.subtasks[idx].completed = !state.editingTask.subtasks[idx].completed;
        // Update the actual task
        const actualTask = state.tasks.find(t => t.id === state.editingTask.id);
        if (actualTask) {
          actualTask.subtasks = [...state.editingTask.subtasks];
          saveDataImmediate();
        }
        openModal(null, state.editingTask);
      }
      break;
  }
  
  // Close modal on overlay click
  if (target.id === 'modal-overlay') {
    closeModal();
  }
}

function handleKeydown(e) {
  const overlay = document.getElementById('modal-overlay');
  const isModalOpen = overlay?.classList.contains('active');
  
  // Escape = Close modal
  if (e.key === 'Escape') {
    if (isModalOpen) {
      closeModal();
    } else {
      state.searchQuery = '';
      renderApp();
    }
  }
  
  // Don't trigger shortcuts when typing
  if (e.target.closest('input, textarea, select')) return;
  
  // N = New task
  if (e.key === 'n' && !isModalOpen) {
    e.preventDefault();
    openModal();
  }
  
  // / = Focus search
  if (e.key === '/' && !isModalOpen) {
    e.preventDefault();
    document.getElementById('search-input')?.focus();
  }
  
  // ? = Show shortcuts (future)
}

function handleInput(e) {
  const target = e.target;
  
  // Search input
  if (target.id === 'search-input') {
    state.searchQuery = target.value;
    // Re-render board only (not full app to keep focus)
    const boardContainer = document.querySelector('.board-container');
    if (boardContainer) {
      boardContainer.outerHTML = renderBoard();
      attachDragToCards();
    }
  }
}

// ========================================
// Drag & Drop
// ========================================

function attachDragToCards() {
  // Delegated events handle this now
}

function handleDragStart(e) {
  const card = e.target.closest('.task-card');
  if (!card) return;
  
  const taskId = card.dataset.taskId;
  state.draggedTask = taskId;
  card.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', taskId);
}

function handleDragEnd(e) {
  const card = e.target.closest('.task-card');
  if (card) card.classList.remove('dragging');
  state.draggedTask = null;
  
  document.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
}

function handleDragOver(e) {
  const column = e.target.closest('.column-content');
  if (!column) return;
  
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  column.classList.add('drag-over');
}

function handleDragLeave(e) {
  const column = e.target.closest('.column-content');
  if (column && !column.contains(e.relatedTarget)) {
    column.classList.remove('drag-over');
  }
}

function handleDrop(e) {
  const column = e.target.closest('.column-content');
  if (!column) return;
  
  e.preventDefault();
  column.classList.remove('drag-over');
  
  const taskId = e.dataTransfer.getData('text/plain');
  const newStatus = column.dataset.status;
  
  const task = state.tasks.find(t => t.id === taskId);
  if (task && task.status !== newStatus) {
    task.status = newStatus;
    saveDataImmediate();
    renderApp();
  }
}

// ========================================
// Modal Functions
// ========================================

function openModal(defaultStatus = 'todo', task = null) {
  state.editingTask = task ? { ...task, subtasks: [...(task.subtasks || [])] } : null;
  
  // Re-render modal content
  const modalContainer = document.querySelector('.modal-overlay').parentElement;
  document.querySelector('.modal-overlay').remove();
  modalContainer.insertAdjacentHTML('beforeend', renderTaskModal());
  
  const overlay = document.getElementById('modal-overlay');
  const form = document.getElementById('task-form');
  
  if (!task && form) {
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
  state.editingTask = null;
}

function saveTask() {
  const form = document.getElementById('task-form');
  if (!form) return;
  
  const title = form.elements.title.value.trim();
  if (!title) {
    form.elements.title.focus();
    return;
  }
  
  const taskId = form.elements.taskId.value;
  const isEdit = !!taskId;
  
  // Collect labels
  const labelCheckboxes = form.querySelectorAll('input[name="labels"]:checked');
  const labels = Array.from(labelCheckboxes).map(cb => cb.value);
  
  // Get instructions
  const instructions = form.elements.instructions?.value?.trim() || '';
  
  // Collect subtasks (for edit mode)
  let subtasks = [];
  if (isEdit && state.editingTask) {
    const subtaskInputs = form.querySelectorAll('.subtask-input');
    const subtaskChecks = form.querySelectorAll('.subtask-checkbox');
    subtaskInputs.forEach((input, idx) => {
      if (input.value.trim()) {
        subtasks.push({
          id: state.editingTask.subtasks[idx]?.id || `sub-${Date.now()}-${idx}`,
          title: input.value.trim(),
          completed: subtaskChecks[idx]?.checked || false,
        });
      }
    });
  }
  
  if (isEdit) {
    // Update existing task
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task.title = title;
      task.description = form.elements.description.value.trim();
      task.instructions = instructions;
      task.projectId = form.elements.projectId.value || null;
      task.status = form.elements.status.value;
      task.priority = form.elements.priority.value;
      task.labels = labels;
      task.subtasks = subtasks;
    }
  } else {
    // Create new task
    const task = {
      id: generateId(),
      projectId: form.elements.projectId.value || null,
      title: title,
      description: form.elements.description.value.trim(),
      instructions: instructions,
      status: form.elements.status.value,
      priority: form.elements.priority.value,
      labels: labels,
      subtasks: [],
      createdAt: new Date().toISOString(),
    };
    state.tasks.push(task);
  }
  
  saveDataImmediate();
  closeModal();
  renderApp();
}

function deleteTask() {
  if (!state.editingTask) return;
  
  const taskId = state.editingTask.id;
  const taskIndex = state.tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) return;
  
  // Store for undo
  state.deletedTask = { task: state.tasks[taskIndex], index: taskIndex };
  
  // Remove task
  state.tasks.splice(taskIndex, 1);
  saveDataImmediate();
  closeModal();
  renderApp();
  
  // Show undo toast
  showToast('任务已删除', undoDelete, '撤销');
}

function undoDelete() {
  if (!state.deletedTask) return;
  
  state.tasks.splice(state.deletedTask.index, 0, state.deletedTask.task);
  state.deletedTask = null;
  saveDataImmediate();
  renderApp();
}

// ========================================
// Subtask Functions
// ========================================

function addSubtask() {
  if (!state.editingTask) return;
  
  state.editingTask.subtasks = state.editingTask.subtasks || [];
  state.editingTask.subtasks.push({
    id: `sub-${Date.now()}`,
    title: '',
    completed: false,
  });
  
  // Re-render subtasks list
  const list = document.getElementById('subtasks-list');
  if (list) {
    const idx = state.editingTask.subtasks.length - 1;
    const sub = state.editingTask.subtasks[idx];
    list.insertAdjacentHTML('beforeend', `
      <div class="subtask-item" data-subtask-idx="${idx}">
        <input type="checkbox" class="subtask-checkbox" data-action="toggle-subtask" data-idx="${idx}">
        <input type="text" class="subtask-input" value="" data-idx="${idx}" placeholder="子任务标题...">
        <button type="button" class="subtask-delete" data-action="delete-subtask" data-idx="${idx}">${Icons.close}</button>
      </div>
    `);
    list.querySelector(`.subtask-item:last-child .subtask-input`)?.focus();
  }
}

function deleteSubtask(idx) {
  if (!state.editingTask) return;
  
  state.editingTask.subtasks.splice(idx, 1);
  
  // Re-render modal
  openModal(null, state.editingTask);
}

function toggleSubtask(idx, completed) {
  if (!state.editingTask || !state.editingTask.subtasks[idx]) return;
  state.editingTask.subtasks[idx].completed = completed;
}

// ========================================
// Project Functions
// ========================================

function createNewProject() {
  const name = prompt('项目名称:');
  if (!name?.trim()) return;
  
  const colors = ['blue', 'purple', 'green', 'yellow', 'orange', 'red', 'pink', 'cyan'];
  const color = colors[state.projects.length % colors.length];
  
  const project = {
    id: 'proj-' + Date.now(),
    name: name.trim(),
    color: color,
    createdAt: new Date().toISOString(),
  };
  
  state.projects.push(project);
  saveDataImmediate();
  renderApp();
}

// ========================================
// Initialize
// ========================================

async function init() {
  await loadData();
  renderApp();
  attachGlobalListeners();
}

init();
