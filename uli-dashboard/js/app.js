/**
 * ULI Studio ERP — Core Application Module
 * ═════════════════════════════════════════
 * Handles: sidebar, top-nav dropdowns, search, notifications,
 *          profile, modal system, toast system, loading state,
 *          responsive behaviour.
 */

'use strict';

/* ───────────────── DOM Cache ───────────────── */
const DOM = {
  // Loading
  loadingOverlay:    document.getElementById('loading-overlay'),

  // Sidebar
  sidebar:           document.getElementById('sidebar'),
  sidebarNav:        document.getElementById('sidebar-nav'),
  sidebarOverlay:    document.getElementById('sidebar-overlay'),
  sidebarCloseBtn:   document.getElementById('sidebar-close-btn'),
  hamburgerBtn:      document.getElementById('hamburger-btn'),

  // Search
  searchToggleBtn:   document.getElementById('search-toggle-btn'),
  searchExpanded:    document.getElementById('search-expanded'),
  searchInput:       document.getElementById('search-input'),
  searchCloseBtn:    document.getElementById('search-close-btn'),
  searchResults:     document.getElementById('search-results'),

  // Notifications
  notificationsBtn:  document.getElementById('notifications-btn'),
  notificationsDropdown: document.getElementById('notifications-dropdown'),
  notificationBadge: document.getElementById('notification-badge'),
  notificationsList: document.getElementById('notifications-list'),
  markAllReadBtn:    document.getElementById('mark-all-read-btn'),

  // Profile
  profileBtn:        document.getElementById('profile-btn'),
  profileDropdown:   document.getElementById('profile-dropdown'),
  profileName:       document.getElementById('profile-name'),
  profileRole:       document.getElementById('profile-role'),
  userAvatar:        document.getElementById('user-avatar'),
  dropdownAvatar:    document.getElementById('dropdown-avatar'),
  dropdownName:      document.getElementById('dropdown-name'),
  dropdownEmail:     document.getElementById('dropdown-email'),

  // Modal
  modalOverlay:      document.getElementById('modal-overlay'),
  modal:             document.getElementById('modal'),
  modalTitle:        document.getElementById('modal-title'),
  modalBody:         document.getElementById('modal-body'),
  modalFooter:       document.getElementById('modal-footer'),
  modalCloseBtn:     document.getElementById('modal-close-btn'),
  modalCancelBtn:    document.getElementById('modal-cancel-btn'),
  modalConfirmBtn:   document.getElementById('modal-confirm-btn'),

  // Toast
  toastContainer:    document.getElementById('toast-container'),

  // Error state
  dashboardContent:  document.getElementById('dashboard-content'),
  errorState:        document.getElementById('error-state'),
  errorRetryBtn:     document.getElementById('error-retry-btn'),
};

/* ───────────────── Sidebar ───────────────── */
function buildSidebar() {
  const nav = DOM.sidebarNav;
  nav.innerHTML = '';

  DEMO_DATA.navItems.forEach(function (item) {
    const el = document.createElement('div');
    el.className = 'nav-item' + (item.active ? ' active' : '') + (!item.implemented ? ' disabled' : '');
    el.setAttribute('data-nav', item.id);
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', item.implemented ? '0' : '-1');
    el.innerHTML =
      '<i data-lucide="' + item.icon + '"></i>' +
      '<span class="nav-label">' + item.label + '</span>' +
      (!item.implemented ? '<span class="nav-coming-soon">Soon</span>' : '');

    el.addEventListener('click', function () {
      handleNavClick(item);
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNavClick(item);
      }
    });

    nav.appendChild(el);
  });
}

function handleNavClick(item) {
  if (item.href) {
    window.location.href = item.href;
    return;
  }
  if (!item.implemented) {
    showToast(item.label + ' module is coming soon.', 'info');
    return;
  }
  // Set active state
  document.querySelectorAll('.nav-item').forEach(function (el) {
    el.classList.remove('active');
  });
  var target = document.querySelector('[data-nav="' + item.id + '"]');
  if (target) target.classList.add('active');

  // Close mobile sidebar
  closeSidebar();
}

function openSidebar() {
  DOM.sidebar.classList.add('open');
  DOM.sidebarOverlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  DOM.sidebar.classList.remove('open');
  DOM.sidebarOverlay.classList.remove('visible');
  document.body.style.overflow = '';
}

/* ───────────────── Search ───────────────── */
var searchDebounceTimer = null;

var searchableItems = [
  { label: 'Overview Dashboard', icon: 'layout-dashboard', type: 'Page' },
  { label: 'Leads & CRM', icon: 'handshake', type: 'Module' },
  { label: 'Purchase & PO', icon: 'shopping-bag', type: 'Module' },
  { label: 'Project Management', icon: 'kanban', type: 'Module' },
  { label: 'Drawings & Documents', icon: 'file-stack', type: 'Module' },
  { label: 'Accounting & Finance', icon: 'calculator', type: 'Module' },
  { label: 'HR & Payroll', icon: 'badge-check', type: 'Module' },
  { label: 'Roles & Approvals', icon: 'shield-check', type: 'Module' },
  { label: 'Prestige Tower — Penthouse Suite', icon: 'folder-kanban', type: 'Project' },
  { label: 'Oberoi Residence — Full Interiors', icon: 'folder-kanban', type: 'Project' },
  { label: 'Godrej Office — Workspace Fitout', icon: 'folder-kanban', type: 'Project' },
  { label: 'PR-2026-0089 — Italian Marble Tiles', icon: 'shopping-cart', type: 'Requisition' },
  { label: 'QT-2026-0156 — Oberoi Residence', icon: 'file-text', type: 'Quotation' },
];

function openSearch() {
  DOM.searchExpanded.classList.add('visible');
  DOM.searchInput.focus();
}

function closeSearch() {
  DOM.searchExpanded.classList.remove('visible');
  DOM.searchResults.classList.remove('visible');
  DOM.searchInput.value = '';
}

function handleSearch(e) {
  var query = e.target.value.trim().toLowerCase();
  clearTimeout(searchDebounceTimer);

  if (!query) {
    DOM.searchResults.classList.remove('visible');
    return;
  }

  searchDebounceTimer = setTimeout(function () {
    var results = searchableItems.filter(function (item) {
      return item.label.toLowerCase().indexOf(query) !== -1;
    });

    DOM.searchResults.innerHTML = '';

    if (results.length === 0) {
      DOM.searchResults.innerHTML = '<div class="search-no-results">No results for "' + escapeHtml(query) + '"</div>';
    } else {
      results.forEach(function (result) {
        var div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML =
          '<i data-lucide="' + result.icon + '"></i>' +
          '<span>' + highlightMatch(result.label, query) + '</span>' +
          '<span class="badge badge-module" style="margin-left:auto">' + result.type + '</span>';
        div.addEventListener('click', function () {
          showToast('Navigating to ' + result.label, 'info');
          closeSearch();
        });
        DOM.searchResults.appendChild(div);
      });
    }

    DOM.searchResults.classList.add('visible');
    lucide.createIcons({ nodes: DOM.searchResults.querySelectorAll('[data-lucide]') });
  }, 200);
}

function highlightMatch(text, query) {
  var idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return escapeHtml(text);
  return escapeHtml(text.substring(0, idx)) +
    '<strong>' + escapeHtml(text.substring(idx, idx + query.length)) + '</strong>' +
    escapeHtml(text.substring(idx + query.length));
}

/* ───────────────── Notifications ───────────────── */
function buildNotifications() {
  var unreadCount = 0;
  DOM.notificationsList.innerHTML = '';

  DEMO_DATA.notifications.forEach(function (n) {
    if (!n.read) unreadCount++;
    var div = document.createElement('div');
    div.className = 'notification-item' + (!n.read ? ' unread' : '');
    div.innerHTML =
      '<div class="notification-dot"></div>' +
      '<div class="notification-content">' +
        '<p class="notification-title">' + escapeHtml(n.title) + '</p>' +
        '<p class="notification-message">' + escapeHtml(n.message) + '</p>' +
        '<p class="notification-time">' + escapeHtml(n.time) + '</p>' +
      '</div>';
    div.addEventListener('click', function () {
      div.classList.remove('unread');
      n.read = true;
      updateNotificationBadge();
      showToast(n.title, 'info');
    });
    DOM.notificationsList.appendChild(div);
  });

  updateNotificationBadge();
}

function updateNotificationBadge() {
  var unread = DEMO_DATA.notifications.filter(function (n) { return !n.read; }).length;
  if (unread > 0) {
    DOM.notificationBadge.classList.add('visible');
  } else {
    DOM.notificationBadge.classList.remove('visible');
  }
}

function markAllRead() {
  DEMO_DATA.notifications.forEach(function (n) { n.read = true; });
  document.querySelectorAll('.notification-item').forEach(function (el) {
    el.classList.remove('unread');
  });
  updateNotificationBadge();
  showToast('All notifications marked as read', 'success');
}

/* ───────────────── Profile ───────────────── */
function buildProfile() {
  var user = DEMO_DATA.user;
  DOM.profileName.textContent = user.name;
  DOM.profileRole.textContent = user.role;
  DOM.userAvatar.textContent = user.initials;
  DOM.dropdownAvatar.textContent = user.initials;
  DOM.dropdownName.textContent = user.name;
  DOM.dropdownEmail.textContent = user.email;
}

/* ───────────────── Dropdowns ───────────────── */
function toggleDropdown(panel) {
  var isVisible = panel.classList.contains('visible');
  closeAllDropdowns();
  if (!isVisible) {
    panel.classList.add('visible');
    lucide.createIcons({ nodes: panel.querySelectorAll('[data-lucide]') });
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-panel').forEach(function (el) {
    el.classList.remove('visible');
  });
  DOM.searchResults.classList.remove('visible');
}

/* ───────────────── Modal System ───────────────── */
function openModal(options) {
  DOM.modalTitle.textContent = options.title || 'Details';
  DOM.modalBody.innerHTML = options.body || '';

  if (options.hideConfirm) {
    DOM.modalConfirmBtn.classList.add('hidden');
  } else {
    DOM.modalConfirmBtn.classList.remove('hidden');
    DOM.modalConfirmBtn.textContent = options.confirmText || 'Confirm';
  }

  if (options.hideCancel) {
    DOM.modalCancelBtn.classList.add('hidden');
  } else {
    DOM.modalCancelBtn.classList.remove('hidden');
    DOM.modalCancelBtn.textContent = options.cancelText || 'Close';
  }

  DOM.modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Re-initialize icons inside modal
  lucide.createIcons({ nodes: DOM.modalBody.querySelectorAll('[data-lucide]') });

  // Store callback
  DOM.modalConfirmBtn._callback = options.onConfirm || null;
}

function closeModal() {
  DOM.modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  DOM.modalConfirmBtn._callback = null;
}

/* ───────────────── Toast System ───────────────── */
function showToast(message, type) {
  type = type || 'info';
  var iconMap = { success: 'check-circle', error: 'alert-circle', info: 'info' };
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = '<i data-lucide="' + (iconMap[type] || 'info') + '"></i><span>' + escapeHtml(message) + '</span>';

  DOM.toastContainer.appendChild(toast);
  lucide.createIcons({ nodes: toast.querySelectorAll('[data-lucide]') });

  setTimeout(function () {
    toast.classList.add('toast-out');
    setTimeout(function () { toast.remove(); }, 300);
  }, 3500);
}

/* ───────────────── Loading State ───────────────── */
function hideLoading() {
  DOM.loadingOverlay.classList.add('fade-out');
  setTimeout(function () {
    DOM.loadingOverlay.classList.add('hidden');
  }, 400);
}

function showErrorState() {
  DOM.dashboardContent.classList.add('hidden');
  DOM.errorState.classList.remove('hidden');
}

function hideErrorState() {
  DOM.errorState.classList.add('hidden');
  DOM.dashboardContent.classList.remove('hidden');
}

/* ───────────────── Utility ───────────────── */
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function formatCurrency(value) {
  if (value >= 10000000) {
    return '\u20B9' + (value / 10000000).toFixed(2) + ' Cr';
  }
  if (value >= 100000) {
    return '\u20B9' + (value / 100000).toFixed(2) + ' L';
  }
  return '\u20B9' + value.toLocaleString('en-IN');
}

function formatDate(dateStr) {
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(timestamp) {
  var now = new Date();
  var then = new Date(timestamp);
  var diffMs = now - then;
  var diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return diffMin + ' min ago';
  var diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + 'h ago';
  var diffDay = Math.floor(diffHr / 24);
  return diffDay + 'd ago';
}

/* ───────────────── Event Binding ───────────────── */
function bindAppEvents() {
  // Sidebar
  DOM.hamburgerBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    openSidebar();
  });
  DOM.sidebarCloseBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    closeSidebar();
  });
  DOM.sidebarOverlay.addEventListener('click', function () {
    closeSidebar();
  });

  // Search
  DOM.searchToggleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    openSearch();
  });
  DOM.searchCloseBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    closeSearch();
  });
  DOM.searchInput.addEventListener('input', function (e) {
    handleSearch(e);
  });

  // Notifications
  DOM.notificationsBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleDropdown(DOM.notificationsDropdown);
  });
  DOM.markAllReadBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    markAllRead();
  });

  // Profile
  DOM.profileBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleDropdown(DOM.profileDropdown);
  });

  // Close dropdowns on outside click
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown-panel') && !e.target.closest('.topnav-icon-btn') && !e.target.closest('.profile-btn')) {
      closeAllDropdowns();
    }
    if (!e.target.closest('.search-expanded') && !e.target.closest('#search-toggle-btn')) {
      closeSearch();
    }
  });

  // Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      closeSearch();
      closeModal();
      closeSidebar();
    }
  });

  // Modal
  DOM.modalCloseBtn.addEventListener('click', function () { closeModal(); });
  DOM.modalCancelBtn.addEventListener('click', function () { closeModal(); });
  DOM.modalConfirmBtn.addEventListener('click', function () {
    if (typeof DOM.modalConfirmBtn._callback === 'function') {
      DOM.modalConfirmBtn._callback();
    }
    closeModal();
    showToast('Action confirmed (demo)', 'success');
  });
  DOM.modalOverlay.addEventListener('click', function (e) {
    if (e.target === DOM.modalOverlay) closeModal();
  });

  // Error retry
  DOM.errorRetryBtn.addEventListener('click', function () {
    hideErrorState();
    if (typeof initDashboard === 'function') {
      initDashboard();
    }
  });

  // Responsive: close sidebar on resize to desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
      closeSidebar();
    }
  });
}

/* ───────────────── Initialization ───────────────── */
function initApp() {
  buildSidebar();
  buildNotifications();
  buildProfile();
  bindAppEvents();
  lucide.createIcons();
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', function () {
  initApp();
});
