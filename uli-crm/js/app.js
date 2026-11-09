/**
 * ULI Studio ERP — Leads & CRM Core Application Controller
 * ════════════════════════════════════════════════════════
 * Handles:
 *  - View switching (11 screens)
 *  - Topbar navigation, search, notifications, profile
 *  - Shared modal & toast systems
 *  - Formatters & shared helper utilities
 */

'use strict';

/* ── DOM Cache ── */
var CrmApp = {
  currentView: 'dashboard',
  selectedLeadId: null,
  selectedQuoteId: null,

  // Topnav elements
  sidebar:          document.getElementById('sidebar'),
  sidebarOverlay:   document.getElementById('sidebar-overlay'),
  hamburgerBtn:     document.getElementById('hamburger-btn'),
  sidebarCloseBtn:  document.getElementById('sidebar-close-btn'),
  breadcrumbView:   document.getElementById('breadcrumb-current-view'),
  pageTitleText:    document.getElementById('page-title-text'),

  // Search
  searchToggleBtn:  document.getElementById('search-toggle-btn'),
  searchExpanded:   document.getElementById('search-expanded'),
  searchInput:      document.getElementById('global-search-input'),
  searchCloseBtn:   document.getElementById('search-close-btn'),
  searchResults:    document.getElementById('global-search-results'),

  // Notifications
  notifBtn:         document.getElementById('notifications-btn'),
  notifDropdown:    document.getElementById('notifications-dropdown'),
  notifBadge:       document.getElementById('notification-badge'),
  notifList:        document.getElementById('notifications-list'),
  markAllReadBtn:   document.getElementById('mark-all-read-btn'),

  // Profile
  profileBtn:       document.getElementById('profile-btn'),
  profileDropdown:  document.getElementById('profile-dropdown'),

  // Modal
  modalOverlay:     document.getElementById('modal-overlay'),
  modal:            document.getElementById('modal'),
  modalTitle:       document.getElementById('modal-title'),
  modalBody:        document.getElementById('modal-body'),
  modalConfirmBtn:  document.getElementById('modal-confirm-btn'),
  modalCancelBtn:   document.getElementById('modal-cancel-btn'),
  modalCloseBtn:    document.getElementById('modal-close-btn'),

  // Toasts
  toastContainer:   document.getElementById('toast-container'),

  // Subnavigation tabs
  mainTabs:         document.getElementById('crm-main-tabs')
};

/* ── Utilities & Formatters ── */
function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  var num = Number(val);
  if (num >= 10000000) {
    return '₹' + (num / 10000000).toFixed(2) + ' Cr';
  }
  if (num >= 100000) {
    return '₹' + (num / 100000).toFixed(2) + ' L';
  }
  return '₹' + num.toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' at ' +
         d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  var now = new Date();
  var then = new Date(dateStr);
  var diffMs = now - then;
  var diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return diffMin + 'm ago';
  var diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + 'h ago';
  var diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  return diffDay + 'd ago';
}

function isDateOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < new Date().getTime();
}

function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function getSalesperson(id) {
  return CRM_SALESPEOPLE.find(function(sp) { return sp.id === id; }) || { name: 'Unassigned', email: '', role: '' };
}

function getStageInfo(stageId) {
  return CRM_STAGES.find(function(s) { return s.id === stageId; }) || { id: stageId, label: stageId, color: '#64748b' };
}

/* ── View Router / View Switching ── */
var VIEW_TITLES = {
  'dashboard':         'CRM Dashboard',
  'leads':             'Leads List',
  'create-lead':       'Create New Lead',
  'lead-detail':       'Lead Workspace',
  'pipeline':          'Pipeline Board',
  'followups':         'Follow-up Management',
  'visits':            'Site Visit Management',
  'funnel':            'Sales Funnel Analysis',
  'quotations':        'Quotations List',
  'quotation-builder': 'Quotation Builder (BOQ)',
  'quotation-detail':  'Quotation Detail & Revisions'
};

function switchCrmView(viewName, params) {
  params = params || {};
  CrmApp.currentView = viewName;

  // 1. Hide all views
  document.querySelectorAll('.crm-view').forEach(function(view) {
    view.classList.remove('active');
  });

  // 2. Show target view
  var target = document.getElementById('view-' + viewName);
  if (target) {
    target.classList.add('active');
  }

  // 3. Update top breadcrumbs & page title
  var title = VIEW_TITLES[viewName] || 'Leads & CRM';
  if (CrmApp.breadcrumbView) CrmApp.breadcrumbView.textContent = title;
  if (CrmApp.pageTitleText) CrmApp.pageTitleText.textContent = title;

  // 4. Update tab bar active state
  document.querySelectorAll('.crm-tab-btn').forEach(function(tab) {
    if (tab.getAttribute('data-view') === viewName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // 5. Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 6. Invoke screen-specific render hooks
  if (viewName === 'dashboard' && typeof renderCrmDashboard === 'function') {
    renderCrmDashboard();
  } else if (viewName === 'leads' && typeof renderLeadsTable === 'function') {
    renderLeadsTable();
  } else if (viewName === 'create-lead' && typeof initCreateLeadForm === 'function') {
    initCreateLeadForm(params.leadIdToEdit);
  } else if (viewName === 'lead-detail' && typeof openLeadDetail === 'function') {
    openLeadDetail(params.leadId || CrmApp.selectedLeadId);
  } else if (viewName === 'pipeline' && typeof renderPipelineBoard === 'function') {
    renderPipelineBoard();
  } else if (viewName === 'followups' && typeof renderFollowups === 'function') {
    renderFollowups();
  } else if (viewName === 'visits' && typeof renderSiteVisits === 'function') {
    renderSiteVisits();
  } else if (viewName === 'funnel' && typeof renderFunnelAnalysis === 'function') {
    renderFunnelAnalysis();
  } else if (viewName === 'quotations' && typeof renderQuotationsTable === 'function') {
    renderQuotationsTable();
  } else if (viewName === 'quotation-builder' && typeof openQuotationBuilder === 'function') {
    openQuotationBuilder(params.quoteId, params.linkedLeadId);
  } else if (viewName === 'quotation-detail' && typeof openQuotationDetail === 'function') {
    openQuotationDetail(params.quoteId || CrmApp.selectedQuoteId);
  }

  // Re-generate Lucide icons on view change
  lucide.createIcons();
}

/* ── Modal System ── */
function openModal(options) {
  options = options || {};
  CrmApp.modalTitle.textContent = options.title || 'Details';
  CrmApp.modalBody.innerHTML = options.body || '';

  // Custom modal size
  CrmApp.modal.className = 'modal' + (options.size ? ' modal-' + options.size : '');

  // Confirm button
  if (options.hideConfirm) {
    CrmApp.modalConfirmBtn.classList.add('hidden');
  } else {
    CrmApp.modalConfirmBtn.classList.remove('hidden');
    CrmApp.modalConfirmBtn.textContent = options.confirmText || 'Confirm';
    CrmApp.modalConfirmBtn.className = 'btn ' + (options.confirmBtnClass || 'btn-primary');
  }

  // Cancel button
  if (options.hideCancel) {
    CrmApp.modalCancelBtn.classList.add('hidden');
  } else {
    CrmApp.modalCancelBtn.classList.remove('hidden');
    CrmApp.modalCancelBtn.textContent = options.cancelText || 'Cancel';
  }

  CrmApp.modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Attach callback
  CrmApp.modalConfirmBtn._onConfirm = options.onConfirm || null;

  // Re-init icons inside modal
  lucide.createIcons({ nodes: CrmApp.modalBody.querySelectorAll('[data-lucide]') });
}

function closeModal() {
  CrmApp.modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  CrmApp.modalConfirmBtn._onConfirm = null;
}

/* ── Toast System ── */
function showToast(message, type) {
  type = type || 'info';
  var iconMap = {
    success: 'check-circle',
    error:   'alert-circle',
    warning: 'alert-triangle',
    info:    'info'
  };
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML =
    '<i data-lucide="' + (iconMap[type] || 'info') + '"></i>' +
    '<span>' + escapeHtml(message) + '</span>';

  CrmApp.toastContainer.appendChild(toast);
  lucide.createIcons({ nodes: toast.querySelectorAll('[data-lucide]') });

  setTimeout(function() {
    toast.classList.add('toast-out');
    setTimeout(function() { toast.remove(); }, 300);
  }, 3500);
}

/* ── Global Search ── */
var searchDebounceTimer = null;
function handleGlobalSearch(query) {
  clearTimeout(searchDebounceTimer);
  query = (query || '').trim().toLowerCase();

  if (!query) {
    CrmApp.searchResults.classList.remove('visible');
    return;
  }

  searchDebounceTimer = setTimeout(function() {
    var matches = [];

    // Search leads
    CRM_LEADS.forEach(function(lead) {
      if (lead.customerName.toLowerCase().indexOf(query) !== -1 ||
          lead.enquiryTitle.toLowerCase().indexOf(query) !== -1 ||
          lead.id.toLowerCase().indexOf(query) !== -1 ||
          lead.phone.indexOf(query) !== -1) {
        matches.push({
          type: 'Lead',
          label: lead.id + ' — ' + lead.customerName,
          sub: lead.enquiryTitle,
          icon: 'user',
          action: function() {
            CrmApp.selectedLeadId = lead.id;
            switchCrmView('lead-detail', { leadId: lead.id });
          }
        });
      }
    });

    // Search quotes
    CRM_QUOTATIONS.forEach(function(q) {
      if (q.id.toLowerCase().indexOf(query) !== -1 ||
          q.customerName.toLowerCase().indexOf(query) !== -1 ||
          q.projectTitle.toLowerCase().indexOf(query) !== -1) {
        matches.push({
          type: 'Quote',
          label: q.id + ' — ' + q.customerName,
          sub: q.projectTitle + ' (v' + q.version + ')',
          icon: 'file-text',
          action: function() {
            CrmApp.selectedQuoteId = q.id;
            switchCrmView('quotation-detail', { quoteId: q.id });
          }
        });
      }
    });

    // Render matches
    CrmApp.searchResults.innerHTML = '';
    if (matches.length === 0) {
      CrmApp.searchResults.innerHTML = '<div class="search-no-results">No CRM records matching "' + escapeHtml(query) + '"</div>';
    } else {
      matches.slice(0, 8).forEach(function(m) {
        var row = document.createElement('div');
        row.className = 'search-result-item';
        row.innerHTML =
          '<i data-lucide="' + m.icon + '"></i>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-weight:600">' + escapeHtml(m.label) + '</div>' +
            '<div style="font-size:.72rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHtml(m.sub) + '</div>' +
          '</div>' +
          '<span class="badge badge-stage">' + m.type + '</span>';

        row.addEventListener('click', function() {
          m.action();
          CrmApp.searchExpanded.classList.remove('visible');
          CrmApp.searchResults.classList.remove('visible');
          CrmApp.searchInput.value = '';
        });
        CrmApp.searchResults.appendChild(row);
      });
    }

    CrmApp.searchResults.classList.add('visible');
    lucide.createIcons({ nodes: CrmApp.searchResults.querySelectorAll('[data-lucide]') });
  }, 180);
}

/* ── Notifications ── */
function renderNotifications() {
  CrmApp.notifList.innerHTML = '';
  var unreadCount = 0;

  CRM_NOTIFICATIONS.forEach(function(n) {
    if (!n.read) unreadCount++;
    var div = document.createElement('div');
    div.className = 'notification-item' + (!n.read ? ' unread' : '');
    div.innerHTML =
      '<div class="notification-dot"></div>' +
      '<div class="notification-content">' +
        '<div class="notification-title">' + escapeHtml(n.title) + '</div>' +
        '<div class="notification-message">' + escapeHtml(n.message) + '</div>' +
        '<div class="notification-time">' + escapeHtml(n.time) + '</div>' +
      '</div>';

    div.addEventListener('click', function() {
      n.read = true;
      div.classList.remove('unread');
      updateNotifBadge();
      showToast(n.title + ': ' + n.message, 'info');
    });
    CrmApp.notifList.appendChild(div);
  });

  updateNotifBadge();
}

function updateNotifBadge() {
  var unread = CRM_NOTIFICATIONS.filter(function(n) { return !n.read; }).length;
  if (unread > 0) {
    CrmApp.notifBadge.classList.add('visible');
  } else {
    CrmApp.notifBadge.classList.remove('visible');
  }
}

/* ── Badge counts across subnav ── */
function updateCrmBadges() {
  // Leads count
  var leadCount = CRM_LEADS.length;
  var badgeLeads = document.getElementById('tab-badge-leads');
  var sidebarCount = document.getElementById('sidebar-lead-count');
  if (badgeLeads) badgeLeads.textContent = leadCount;
  if (sidebarCount) sidebarCount.textContent = leadCount;

  // Overdue followups count
  var overdueFu = CRM_FOLLOWUPS.filter(function(fu) {
    return fu.status === 'Pending' && isDateOverdue(fu.date);
  }).length;
  var fuBadge = document.getElementById('tab-badge-followups');
  var fuChip = document.getElementById('fu-overdue-chip');
  if (fuBadge) fuBadge.textContent = overdueFu;
  if (fuChip) fuChip.textContent = overdueFu;

  // Site visits count
  var scheduledVisits = CRM_SITE_VISITS.filter(function(v) { return v.status === 'Scheduled'; }).length;
  var vBadge = document.getElementById('tab-badge-visits');
  if (vBadge) vBadge.textContent = scheduledVisits;

  // Quotes count
  var qBadge = document.getElementById('tab-badge-quotes');
  if (qBadge) qBadge.textContent = CRM_QUOTATIONS.length;
}

/* ── Bind Event Listeners ── */
function bindAppEvents() {
  // Mobile sidebar
  CrmApp.hamburgerBtn.addEventListener('click', function() {
    CrmApp.sidebar.classList.add('open');
    CrmApp.sidebarOverlay.classList.add('visible');
  });
  CrmApp.sidebarCloseBtn.addEventListener('click', function() {
    CrmApp.sidebar.classList.remove('open');
    CrmApp.sidebarOverlay.classList.remove('visible');
  });
  CrmApp.sidebarOverlay.addEventListener('click', function() {
    CrmApp.sidebar.classList.remove('open');
    CrmApp.sidebarOverlay.classList.remove('visible');
  });

  // Main CRM Tab navigation
  document.querySelectorAll('.crm-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var view = btn.getAttribute('data-view');
      switchCrmView(view);
    });
  });

  // Topbar quick buttons
  document.getElementById('btn-quick-new-lead').addEventListener('click', function() {
    switchCrmView('create-lead');
  });
  document.getElementById('btn-quick-new-quote').addEventListener('click', function() {
    switchCrmView('quotation-builder');
  });

  // Search toggle
  CrmApp.searchToggleBtn.addEventListener('click', function() {
    CrmApp.searchExpanded.classList.add('visible');
    CrmApp.searchInput.focus();
  });
  CrmApp.searchCloseBtn.addEventListener('click', function() {
    CrmApp.searchExpanded.classList.remove('visible');
    CrmApp.searchResults.classList.remove('visible');
    CrmApp.searchInput.value = '';
  });
  CrmApp.searchInput.addEventListener('input', function(e) {
    handleGlobalSearch(e.target.value);
  });

  // Notifications dropdown
  CrmApp.notifBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = CrmApp.notifDropdown.classList.contains('visible');
    closeAllDropdowns();
    if (!isOpen) CrmApp.notifDropdown.classList.add('visible');
  });
  CrmApp.markAllReadBtn.addEventListener('click', function() {
    CRM_NOTIFICATIONS.forEach(function(n) { n.read = true; });
    renderNotifications();
    showToast('All CRM notifications marked as read', 'success');
  });

  // Profile dropdown
  CrmApp.profileBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = CrmApp.profileDropdown.classList.contains('visible');
    closeAllDropdowns();
    if (!isOpen) CrmApp.profileDropdown.classList.add('visible');
  });

  // Close dropdowns on outside click
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown-panel') && !e.target.closest('.topnav-icon-btn') && !e.target.closest('.profile-btn')) {
      closeAllDropdowns();
    }
  });

  // Escape key closes modals & overlays
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal();
      closeAllDropdowns();
      CrmApp.searchExpanded.classList.remove('visible');
      CrmApp.sidebar.classList.remove('open');
      CrmApp.sidebarOverlay.classList.remove('visible');
    }
  });

  // Modal events
  CrmApp.modalCloseBtn.addEventListener('click', closeModal);
  CrmApp.modalCancelBtn.addEventListener('click', closeModal);
  CrmApp.modalConfirmBtn.addEventListener('click', function() {
    if (typeof CrmApp.modalConfirmBtn._onConfirm === 'function') {
      var shouldClose = CrmApp.modalConfirmBtn._onConfirm();
      if (shouldClose !== false) {
        closeModal();
      }
    } else {
      closeModal();
    }
  });
  CrmApp.modalOverlay.addEventListener('click', function(e) {
    if (e.target === CrmApp.modalOverlay) closeModal();
  });
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-panel').forEach(function(d) {
    d.classList.remove('visible');
  });
}

/* ── App Initialization ── */
document.addEventListener('DOMContentLoaded', function() {
  bindAppEvents();
  renderNotifications();
  updateCrmBadges();
  switchCrmView('dashboard');
  lucide.createIcons();
});
