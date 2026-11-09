/**
 * ULI Studio ERP — Purchase & PO Core Application Controller
 * ══════════════════════════════════════════════════════════
 * Manages view switching for 15 procurement screens, global search,
 * modals, toast notifications, formatters, and sub-nav badges.
 */

'use strict';

var PurApp = {
  currentView: 'dashboard',
  selectedPrId: null,
  selectedPoId: null,
  selectedVendorId: null,
  selectedGrnId: null,

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
  mainTabs:         document.getElementById('pur-main-tabs')
};

/* ── Formatters & Helper Utilities ── */
function formatCurrency(val) {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  var num = Number(val);
  if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2) + ' Cr';
  if (num >= 100000) return '₹' + (num / 100000).toFixed(2) + ' L';
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
  var diffMs = new Date() - new Date(dateStr);
  var diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return diffMin + 'm ago';
  var diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + 'h ago';
  var diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  return diffDay + 'd ago';
}

function escapeHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function getVendor(id) {
  return PURCHASE_VENDORS.find(function(v) { return v.id === id; }) || { name: 'Direct Market Purchase', category: 'General', phone: '', email: '' };
}

function getProject(id) {
  return PURCHASE_PROJECTS.find(function(p) { return p.id === id; }) || { name: 'General Studio Inventory', site: 'Warehouse' };
}

/* ── Safe Lucide Icons Executor ── */
function safeLucide(options) {
  if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
    try {
      lucide.createIcons(options);
    } catch (e) {
      console.warn('Lucide icon rendering notice:', e);
    }
  }
}

/* ── Client Change Order / Variation Modal Viewer ── */
function openClientChangeModal(changeId) {
  var cr = (typeof PURCHASE_CLIENT_CHANGES !== 'undefined' ? PURCHASE_CLIENT_CHANGES : []).find(function(c) { return c.id === changeId; });
  if (!cr) {
    showToast('Client change record not found', 'warning');
    return;
  }

  var html =
    '<div class="modal-pr-detail" style="font-size:.85rem;">' +
      '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:var(--radius);padding:12px 14px;margin-bottom:16px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
          '<strong><i data-lucide="sparkles" style="color:#2563eb;vertical-align:middle;margin-right:4px;"></i> Client Variation Order: ' + escapeHtml(cr.id) + ' (' + escapeHtml(cr.variationCode) + ')</strong>' +
          '<span class="badge badge-stage">' + escapeHtml(cr.status) + '</span>' +
        '</div>' +
        '<div style="font-size:.8rem;color:#1e40af;"><strong>' + escapeHtml(cr.clientName) + '</strong> · ' + escapeHtml(cr.projectName) + ' (' + escapeHtml(cr.siteLocation) + ')</div>' +
      '</div>' +

      '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">' +
        '<div class="form-group"><label style="font-size:.73rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Client Contact</label><div style="font-weight:600">' + escapeHtml(cr.clientPhone) + '<br><span style="font-size:.78rem;color:var(--text-secondary)">' + escapeHtml(cr.clientEmail) + '</span></div></div>' +
        '<div class="form-group"><label style="font-size:.73rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Signed Variation Doc</label><div style="display:inline-flex;align-items:center;gap:6px;background:#f8fafc;padding:4px 8px;border-radius:4px;border:1px solid #e2e8f0;font-weight:600;color:#2563eb"><i data-lucide="file-check"></i> ' + escapeHtml(cr.clientApprovalRef) + '</div></div>' +
        '<div class="form-group"><label style="font-size:.73rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Commercial Cost Variance</label><div style="font-size:1.05rem;font-weight:700;color:var(--amber);">' + escapeHtml(cr.costImpactFormatted) + '</div></div>' +
        '<div class="form-group"><label style="font-size:.73rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Site Schedule Impact</label><div style="font-weight:600;">' + (cr.timelineImpactDays > 0 ? '+' + cr.timelineImpactDays + ' days delivery buffer' : '0 days (Critical milestone preserved)') + '</div></div>' +
      '</div>' +

      '<div style="margin-bottom:14px;background:#fdf2f8;border:1px solid #fbcfe8;border-radius:var(--radius);padding:10px 12px;">' +
        '<div style="font-size:.73rem;text-transform:uppercase;font-weight:700;color:#9d174d;margin-bottom:4px;"><i data-lucide="quote" style="width:14px;height:14px;vertical-align:middle;margin-right:3px;"></i> Client Stated Request / Instructions</div>' +
        '<div style="font-style:italic;color:#831843;line-height:1.5;">“' + escapeHtml(cr.clientStatedRequest) + '”</div>' +
      '</div>' +

      '<div class="card" style="margin-bottom:14px;border:1px solid var(--card-border);">' +
        '<div class="card-header" style="padding:8px 12px;background:#f8fafc;"><h4 style="font-size:.82rem;font-weight:700;margin:0;">Scope Alteration Analysis</h4></div>' +
        '<div class="card-body" style="padding:10px 12px;font-size:.8rem;line-height:1.6;">' +
          '<div><strong style="color:var(--text-muted)">Original Contracted Scope:</strong> ' + escapeHtml(cr.originalScope) + '</div>' +
          '<div style="margin-top:6px;"><strong style="color:#2563eb">Revised Client Scope:</strong> ' + escapeHtml(cr.revisedScope) + '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;padding:10px 12px;border-radius:var(--radius);border:1px solid #e2e8f0;font-size:.78rem;flex-wrap:wrap;gap:8px;">' +
        '<div><strong>Lead Architect:</strong> ' + escapeHtml(cr.leadArchitect) + '</div>' +
        '<div><strong>Procurement Lead:</strong> ' + escapeHtml(cr.consultant) + '</div>' +
        (cr.linkedPrId ? '<div><span class="lead-id-badge" style="cursor:pointer" onclick="closeModal();switchPurView(\'pr-detail\', {prId:\'' + cr.linkedPrId + '\'})">View ' + cr.linkedPrId + ' →</span></div>' : '') +
        (cr.linkedPoId ? '<div><span class="lead-id-badge" style="cursor:pointer" onclick="closeModal();switchPurView(\'po-detail\', {poId:\'' + cr.linkedPoId + '\'})">View ' + cr.linkedPoId + ' →</span></div>' : '') +
      '</div>' +
    '</div>';

  openModal({
    title: 'Client Variation Order — ' + cr.id,
    body: html,
    size: 'lg',
    hideConfirm: true,
    cancelText: 'Close'
  });
}

/* ── View Router / View Switching (15 Screens) ── */
var PUR_VIEW_TITLES = {
  'dashboard':        'Purchase Dashboard',
  'requisitions':     'Purchase Requisitions (PR)',
  'create-pr':        'Create Purchase Requisition',
  'pr-detail':        'Requisition Detail & Approval',
  'approvals':        'Procurement Approval Queue',
  'rfq':              'Vendor Comparison & RFQ Analysis',
  'purchase-orders':  'Purchase Orders (PO)',
  'create-po':        'Create Purchase Order',
  'po-detail':        'Purchase Order Detail & Amendments',
  'grn-list':         'Goods Receipt Register (GRN)',
  'create-grn':       'Receive Goods & Inspect Receipt',
  '3way-match':       'Vendor Bills & 3-Way Matching',
  'vendors':          'Vendor Directory',
  'vendor-detail':    'Vendor 360° Profile',
  'exceptions':       'Procurement Exceptions & Audit Trail',
  'client-changes':   'Client Scope Variations & Change Orders'
};

function switchPurView(viewName, params) {
  params = params || {};
  PurApp.currentView = viewName;

  // 1. Hide all views
  document.querySelectorAll('.pur-view').forEach(function(v) {
    v.classList.remove('active');
  });

  // 2. Activate target view
  var target = document.getElementById('view-' + viewName);
  if (target) {
    target.classList.add('active');
  }

  // 3. Update titles & breadcrumb
  var title = PUR_VIEW_TITLES[viewName] || 'Purchase & PO';
  if (PurApp.breadcrumbView) PurApp.breadcrumbView.textContent = title;
  if (PurApp.pageTitleText) PurApp.pageTitleText.textContent = title;

  // 4. Update tab bar active state
  document.querySelectorAll('.pur-tab-btn').forEach(function(tab) {
    if (tab.getAttribute('data-view') === viewName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // 5. Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 6. Invoke screen-specific renderers
  if (viewName === 'dashboard' && typeof renderPurchaseDashboard === 'function') {
    renderPurchaseDashboard();
  } else if (viewName === 'requisitions' && typeof renderRequisitionsList === 'function') {
    renderRequisitionsList();
  } else if (viewName === 'create-pr' && typeof openCreatePrForm === 'function') {
    openCreatePrForm(params.prIdToEdit);
  } else if (viewName === 'pr-detail' && typeof openPrDetail === 'function') {
    openPrDetail(params.prId || PurApp.selectedPrId);
  } else if (viewName === 'approvals' && typeof renderApprovalQueue === 'function') {
    renderApprovalQueue();
  } else if (viewName === 'rfq' && typeof renderRfqComparison === 'function') {
    renderRfqComparison(params.prId);
  } else if (viewName === 'purchase-orders' && typeof renderPurchaseOrdersList === 'function') {
    renderPurchaseOrdersList();
  } else if (viewName === 'create-po' && typeof openCreatePoForm === 'function') {
    openCreatePoForm(params.linkedPrId);
  } else if (viewName === 'po-detail' && typeof openPoDetail === 'function') {
    openPoDetail(params.poId || PurApp.selectedPoId);
  } else if (viewName === 'grn-list' && typeof renderGrnList === 'function') {
    renderGrnList();
  } else if (viewName === 'create-grn' && typeof openCreateGrnForm === 'function') {
    openCreateGrnForm(params.poId);
  } else if (viewName === '3way-match' && typeof renderThreeWayMatch === 'function') {
    renderThreeWayMatch(params.billId);
  } else if (viewName === 'vendors' && typeof renderVendorDirectory === 'function') {
    renderVendorDirectory();
  } else if (viewName === 'vendor-detail' && typeof openVendorDetail === 'function') {
    openVendorDetail(params.vendorId || PurApp.selectedVendorId);
  } else if (viewName === 'exceptions' && typeof renderExceptionsRegister === 'function') {
    renderExceptionsRegister();
  } else if (viewName === 'client-changes' && typeof renderClientChangesView === 'function') {
    renderClientChangesView();
  }

  safeLucide();
}

/* ── Modal System ── */
function openModal(options) {
  options = options || {};
  PurApp.modalTitle.textContent = options.title || 'Details';
  PurApp.modalBody.innerHTML = options.body || '';

  PurApp.modal.className = 'modal' + (options.size ? ' modal-' + options.size : '');

  if (options.hideConfirm) {
    PurApp.modalConfirmBtn.classList.add('hidden');
  } else {
    PurApp.modalConfirmBtn.classList.remove('hidden');
    PurApp.modalConfirmBtn.textContent = options.confirmText || 'Confirm';
    PurApp.modalConfirmBtn.className = 'btn ' + (options.confirmBtnClass || 'btn-primary');
  }

  if (options.hideCancel) {
    PurApp.modalCancelBtn.classList.add('hidden');
  } else {
    PurApp.modalCancelBtn.classList.remove('hidden');
    PurApp.modalCancelBtn.textContent = options.cancelText || 'Cancel';
  }

  PurApp.modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  PurApp.modalConfirmBtn._onConfirm = options.onConfirm || null;
  safeLucide({ nodes: PurApp.modalBody.querySelectorAll('[data-lucide]') });
}

function closeModal() {
  PurApp.modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  PurApp.modalConfirmBtn._onConfirm = null;
}

/* ── Toast Notifications ── */
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

  PurApp.toastContainer.appendChild(toast);
  safeLucide({ nodes: toast.querySelectorAll('[data-lucide]') });

  setTimeout(function() {
    toast.classList.add('toast-out');
    setTimeout(function() { toast.remove(); }, 300);
  }, 3500);
}

/* ── Global Search ── */
var searchDebounceTimer = null;
function handlePurGlobalSearch(query) {
  clearTimeout(searchDebounceTimer);
  query = (query || '').trim().toLowerCase();

  if (!query) {
    PurApp.searchResults.classList.remove('visible');
    return;
  }

  searchDebounceTimer = setTimeout(function() {
    var matches = [];

    // Search PRs
    PURCHASE_REQUISITIONS.forEach(function(pr) {
      if (pr.id.toLowerCase().indexOf(query) !== -1 ||
          pr.projectName.toLowerCase().indexOf(query) !== -1 ||
          pr.requestedBy.toLowerCase().indexOf(query) !== -1) {
        matches.push({
          type: 'PR',
          label: pr.id + ' — ' + pr.projectName,
          sub: 'By ' + pr.requestedBy + ' · ' + formatCurrency(pr.estimatedAmount),
          icon: 'file-text',
          action: function() { switchPurView('pr-detail', { prId: pr.id }); }
        });
      }
    });

    // Search POs
    PURCHASE_ORDERS.forEach(function(po) {
      if (po.id.toLowerCase().indexOf(query) !== -1 ||
          po.vendorName.toLowerCase().indexOf(query) !== -1 ||
          po.projectName.toLowerCase().indexOf(query) !== -1) {
        matches.push({
          type: 'PO',
          label: po.id + ' — ' + po.vendorName,
          sub: po.projectName + ' · ' + formatCurrency(po.orderedAmount),
          icon: 'shopping-bag',
          action: function() { switchPurView('po-detail', { poId: po.id }); }
        });
      }
    });

    // Search Vendors
    PURCHASE_VENDORS.forEach(function(v) {
      if (v.name.toLowerCase().indexOf(query) !== -1 ||
          v.id.toLowerCase().indexOf(query) !== -1 ||
          v.category.toLowerCase().indexOf(query) !== -1 ||
          v.gstin.toLowerCase().indexOf(query) !== -1) {
        matches.push({
          type: 'Vendor',
          label: v.name,
          sub: v.category + ' · ' + v.gstin,
          icon: 'truck',
          action: function() { switchPurView('vendor-detail', { vendorId: v.id }); }
        });
      }
    });

    // Render matches
    PurApp.searchResults.innerHTML = '';
    if (matches.length === 0) {
      PurApp.searchResults.innerHTML = '<div class="search-no-results">No procurement records matching "' + escapeHtml(query) + '"</div>';
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
          PurApp.searchExpanded.classList.remove('visible');
          PurApp.searchResults.classList.remove('visible');
          PurApp.searchInput.value = '';
        });
        PurApp.searchResults.appendChild(row);
      });
    }

    PurApp.searchResults.classList.add('visible');
    lucide.createIcons({ nodes: PurApp.searchResults.querySelectorAll('[data-lucide]') });
  }, 180);
}

/* ── Notifications ── */
function renderPurNotifications() {
  PurApp.notifList.innerHTML = '';
  var unreadCount = 0;

  PURCHASE_NOTIFICATIONS.forEach(function(n) {
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
      updatePurBadges();
      showToast(n.title, 'info');
    });
    PurApp.notifList.appendChild(div);
  });

  if (unreadCount > 0) PurApp.notifBadge.classList.add('visible');
  else PurApp.notifBadge.classList.remove('visible');
}

/* ── Badges across tabs & sidebar ── */
function updatePurBadges() {
  // Requisitions count
  var badgePr = document.getElementById('badge-pr-count');
  if (badgePr) badgePr.textContent = PURCHASE_REQUISITIONS.length;

  // Pending approvals count
  var pendingPrs = PURCHASE_REQUISITIONS.filter(function(pr) { return pr.status === 'Pending Approval'; });
  var badgeAppr = document.getElementById('badge-approvals-count');
  var queueBadge = document.getElementById('approvals-queue-count');
  if (badgeAppr) badgeAppr.textContent = pendingPrs.length;
  if (queueBadge) queueBadge.textContent = pendingPrs.length + ' Pending';

  // PO count
  var badgePo = document.getElementById('badge-po-count');
  var sidebarPo = document.getElementById('sidebar-po-badge');
  if (badgePo) badgePo.textContent = PURCHASE_ORDERS.length;
  if (sidebarPo) sidebarPo.textContent = PURCHASE_ORDERS.length;

  // GRN count
  var badgeGrn = document.getElementById('badge-grn-count');
  if (badgeGrn) badgeGrn.textContent = PURCHASE_GRNS.length;

  // 3-Way Match discrepancy count
  var mismatches = PURCHASE_VENDOR_BILLS.filter(function(b) {
    return b.matchStatus.indexOf('Mismatch') !== -1;
  });
  var badgeMatch = document.getElementById('badge-match-count');
  if (badgeMatch) badgeMatch.textContent = mismatches.length;

  // Vendor count
  var badgeVendors = document.getElementById('badge-vendor-count');
  if (badgeVendors) badgeVendors.textContent = PURCHASE_VENDORS.length;

  // Exceptions count
  var badgeExc = document.getElementById('badge-exception-count');
  if (badgeExc) badgeExc.textContent = PURCHASE_EXCEPTIONS.length;

  // Client variations count
  var badgeChanges = document.getElementById('badge-client-changes-count');
  if (badgeChanges && typeof PURCHASE_CLIENT_CHANGES !== 'undefined') {
    badgeChanges.textContent = PURCHASE_CLIENT_CHANGES.length;
  }
}

/* ── App Initialization & Bindings ── */
function bindPurEvents() {
  // Mobile sidebar
  PurApp.hamburgerBtn.addEventListener('click', function() {
    PurApp.sidebar.classList.add('open');
    PurApp.sidebarOverlay.classList.add('visible');
  });
  PurApp.sidebarCloseBtn.addEventListener('click', function() {
    PurApp.sidebar.classList.remove('open');
    PurApp.sidebarOverlay.classList.remove('visible');
  });
  PurApp.sidebarOverlay.addEventListener('click', function() {
    PurApp.sidebar.classList.remove('open');
    PurApp.sidebarOverlay.classList.remove('visible');
  });

  // Client changes bindings
  if (typeof bindClientChangesEvents === 'function') {
    bindClientChangesEvents();
  }

  // Root sidebar link
  var navRoot = document.getElementById('nav-purchase-root');
  if (navRoot) {
    navRoot.addEventListener('click', function(e) {
      e.preventDefault();
      switchPurView('dashboard');
    });
  }

  // Tab switching
  document.querySelectorAll('.pur-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      switchPurView(btn.getAttribute('data-view'));
    });
  });

  // Quick Action Buttons
  document.getElementById('btn-top-create-pr').addEventListener('click', function() {
    switchPurView('create-pr');
  });
  document.getElementById('btn-top-create-po').addEventListener('click', function() {
    switchPurView('create-po');
  });

  // Search toggle
  PurApp.searchToggleBtn.addEventListener('click', function() {
    PurApp.searchExpanded.classList.add('visible');
    PurApp.searchInput.focus();
  });
  PurApp.searchCloseBtn.addEventListener('click', function() {
    PurApp.searchExpanded.classList.remove('visible');
    PurApp.searchResults.classList.remove('visible');
    PurApp.searchInput.value = '';
  });
  PurApp.searchInput.addEventListener('input', function(e) {
    handlePurGlobalSearch(e.target.value);
  });

  // Notifications
  PurApp.notifBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = PurApp.notifDropdown.classList.contains('visible');
    closePurDropdowns();
    if (!isOpen) PurApp.notifDropdown.classList.add('visible');
  });
  PurApp.markAllReadBtn.addEventListener('click', function() {
    PURCHASE_NOTIFICATIONS.forEach(function(n) { n.read = true; });
    renderPurNotifications();
    showToast('All procurement notifications marked read', 'success');
  });

  // Profile
  PurApp.profileBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = PurApp.profileDropdown.classList.contains('visible');
    closePurDropdowns();
    if (!isOpen) PurApp.profileDropdown.classList.add('visible');
  });

  // Close dropdowns on outside click
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown-panel') && !e.target.closest('.topnav-icon-btn') && !e.target.closest('.profile-btn')) {
      closePurDropdowns();
    }
  });

  // Escape key closes modals
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal();
      closePurDropdowns();
      PurApp.searchExpanded.classList.remove('visible');
      PurApp.sidebar.classList.remove('open');
      PurApp.sidebarOverlay.classList.remove('visible');
    }
  });

  // Modal events
  PurApp.modalCloseBtn.addEventListener('click', closeModal);
  PurApp.modalCancelBtn.addEventListener('click', closeModal);
  PurApp.modalConfirmBtn.addEventListener('click', function() {
    if (typeof PurApp.modalConfirmBtn._onConfirm === 'function') {
      var res = PurApp.modalConfirmBtn._onConfirm();
      if (res !== false) closeModal();
    } else {
      closeModal();
    }
  });
  PurApp.modalOverlay.addEventListener('click', function(e) {
    if (e.target === PurApp.modalOverlay) closeModal();
  });
}

function closePurDropdowns() {
  document.querySelectorAll('.dropdown-panel').forEach(function(d) {
    d.classList.remove('visible');
  });
}

function initPurApp() {
  bindPurEvents();
  renderPurNotifications();
  updatePurBadges();
  switchPurView('dashboard');
  safeLucide();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPurApp);
} else {
  initPurApp();
}
