/**
 * ULI Studio ERP — Dashboard Module
 * ══════════════════════════════════
 * Renders all dashboard sections from DEMO_DATA.
 * Depends on: mock-data.js, app.js (loaded first).
 */

'use strict';

/* ───────────────── DOM Cache ───────────────── */
var DashDOM = {
  greeting:       document.getElementById('welcome-greeting'),
  dateDisplay:    document.getElementById('welcome-date'),
  dateRangeSelect:document.getElementById('date-range-select'),
  refreshBtn:     document.getElementById('refresh-btn'),
  kpiSection:     document.getElementById('kpi-section'),
  actionTableBody:document.getElementById('action-table-body'),
  actionCount:    document.getElementById('action-count'),
  actionEmpty:    document.getElementById('action-empty'),
  actionTable:    document.getElementById('action-table'),
  projectList:    document.getElementById('project-list'),
  projectEmpty:   document.getElementById('project-empty'),
  activityTimeline: document.getElementById('activity-timeline'),
  activityEmpty:  document.getElementById('activity-empty'),
  quickActionsGrid: document.getElementById('quick-actions-grid'),
};

/* ───────────────── Welcome Section ───────────────── */
function renderGreeting() {
  var hour = new Date().getHours();
  var greeting;
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  DashDOM.greeting.textContent = greeting + ', ' + DEMO_DATA.user.name.split(' ')[0] + '!';

  var today = new Date();
  DashDOM.dateDisplay.textContent = today.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

/* ───────────────── KPI Cards ───────────────── */
function renderKPIs() {
  DashDOM.kpiSection.innerHTML = '';

  DEMO_DATA.kpis.forEach(function (kpi) {
    var change = kpi.previousValue
      ? (((kpi.value - kpi.previousValue) / kpi.previousValue) * 100)
      : 0;
    var trendDir = change >= 0 ? 'up' : 'down';
    var trendClass = change >= 0 ? 'trend-up' : 'trend-down';
    var trendIcon = change >= 0 ? 'trending-up' : 'trending-down';
    var displayValue = kpi.format === 'currency' ? formatCurrency(kpi.value) : kpi.value.toLocaleString('en-IN');
    var prevDisplay = kpi.format === 'currency' ? formatCurrency(kpi.previousValue) : kpi.previousValue.toLocaleString('en-IN');

    var card = document.createElement('div');
    card.className = 'kpi-card ' + kpi.colorClass;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('data-kpi', kpi.id);
    card.innerHTML =
      '<div class="kpi-top">' +
        '<span class="kpi-label">' + escapeHtml(kpi.label) + '</span>' +
        '<div class="kpi-icon"><i data-lucide="' + kpi.icon + '"></i></div>' +
      '</div>' +
      '<div class="kpi-value">' + displayValue + '</div>' +
      '<div class="kpi-trend ' + trendClass + '">' +
        '<i data-lucide="' + trendIcon + '"></i>' +
        '<span>' + Math.abs(change).toFixed(1) + '% vs previous period</span>' +
      '</div>' +
      '<div class="kpi-prev">Previous: ' + prevDisplay + '</div>';

    card.addEventListener('click', function () { handleKPIClick(kpi); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleKPIClick(kpi);
      }
    });

    DashDOM.kpiSection.appendChild(card);
  });
}

function handleKPIClick(kpi) {
  var displayValue = kpi.format === 'currency' ? formatCurrency(kpi.value) : kpi.value.toLocaleString('en-IN');
  var prevDisplay = kpi.format === 'currency' ? formatCurrency(kpi.previousValue) : kpi.previousValue.toLocaleString('en-IN');
  var change = (((kpi.value - kpi.previousValue) / kpi.previousValue) * 100);

  if (kpi.id === 'purchase-po') {
    openModal({
      title: 'Purchase & PO — Commitments Overview',
      body:
        '<div class="detail-row"><span class="detail-label">Open PO Value</span><span class="detail-value" style="font-weight:700;font-size:1.15rem;color:var(--blue)">' + displayValue + '</span></div>' +
        '<div class="detail-row"><span class="detail-label">Open Orders</span><span class="detail-value"><strong>5 POs</strong> (Kohler, Lumina, Asian Paints, TimberCraft, Marmi)</span></div>' +
        '<div class="detail-row"><span class="detail-label">Pending PR Approvals</span><span class="detail-value"><span class="badge" style="background:#fef3c7;color:#92400e;">3 Requisitions (₹72.7 L)</span></span></div>' +
        '<div class="detail-row"><span class="detail-label">Client Scope Variations</span><span class="detail-value"><span class="badge" style="background:#dbeafe;color:#1e40af;">4 Active Variations</span></span></div>' +
        '<div class="detail-row"><span class="detail-label">3-Way Match Alerts</span><span class="detail-value"><span class="badge" style="background:#fee2e2;color:#991b1b;">2 Discrepancies Flagged</span></span></div>' +
        '<div style="margin-top:16px;padding:12px;background:#eff6ff;border-radius:6px;border:1px solid #bfdbfe;display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="font-size:.82rem;color:#1e40af;">Full 15-screen procurement workspace active:</span>' +
          '<a href="uli-purchase/index.html" class="btn btn-primary btn-sm" style="color:#fff;text-decoration:none;">Open Purchase & PO →</a>' +
        '</div>',
      hideConfirm: true,
      cancelText: 'Close'
    });
    return;
  }

  openModal({
    title: kpi.label + ' — Details',
    body:
      '<div class="detail-row"><span class="detail-label">Metric</span><span class="detail-value">' + escapeHtml(kpi.label) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">Current Value</span><span class="detail-value" style="font-weight:700;font-size:1.1rem">' + displayValue + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">Previous Period</span><span class="detail-value">' + prevDisplay + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">Change</span><span class="detail-value" style="color:' + (change >= 0 ? 'var(--green)' : 'var(--red)') + '">' + (change >= 0 ? '+' : '') + change.toFixed(1) + '%</span></div>' +
      '<div class="detail-row"><span class="detail-label">Period</span><span class="detail-value">Last 30 Days</span></div>' +
      '<p style="margin-top:16px;font-size:.78rem;color:var(--text-muted)">⚠ This is demo data for prototype review only.</p>',
    hideConfirm: true,
    cancelText: 'Close'
  });
}

/* ───────────────── Action Required Table ───────────────── */
function renderActionItems() {
  var items = DEMO_DATA.actionItems;
  DashDOM.actionCount.textContent = items.length + ' items';

  if (items.length === 0) {
    DashDOM.actionTable.classList.add('hidden');
    DashDOM.actionEmpty.classList.remove('hidden');
    return;
  }

  DashDOM.actionTable.classList.remove('hidden');
  DashDOM.actionEmpty.classList.add('hidden');
  DashDOM.actionTableBody.innerHTML = '';

  items.forEach(function (item) {
    var tr = document.createElement('tr');
    var priorityClass = 'badge-' + item.priority.toLowerCase();
    var statusClass = getStatusClass(item.status);

    tr.innerHTML =
      '<td><span class="table-ref">' + escapeHtml(item.id) + '</span></td>' +
      '<td><span class="table-desc" title="' + escapeHtml(item.description) + '">' + escapeHtml(item.description) + '</span></td>' +
      '<td><span class="badge badge-module">' + escapeHtml(item.module) + '</span></td>' +
      '<td>' + escapeHtml(item.assignedTo) + '</td>' +
      '<td>' + formatDate(item.dueDate) + '</td>' +
      '<td><span class="badge ' + priorityClass + '">' + escapeHtml(item.priority) + '</span></td>' +
      '<td><span class="badge-status ' + statusClass + '">' + escapeHtml(item.status) + '</span></td>' +
      '<td><button class="btn-view" data-item-id="' + item.id + '">View</button></td>';

    // Bind view button
    var viewBtn = tr.querySelector('.btn-view');
    viewBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      showActionDetail(item);
    });

    DashDOM.actionTableBody.appendChild(tr);
  });
}

function getStatusClass(status) {
  var s = status.toLowerCase();
  if (s.indexOf('overdue') !== -1) return 'status-overdue';
  if (s.indexOf('awaiting') !== -1) return 'status-awaiting';
  if (s.indexOf('review') !== -1) return 'status-review';
  return 'status-pending';
}

function showActionDetail(item) {
  var isOverdue = item.status.toLowerCase().indexOf('overdue') !== -1;

  openModal({
    title: item.id + ' — ' + item.status,
    body:
      '<div class="detail-row"><span class="detail-label">Reference</span><span class="detail-value" style="font-weight:600">' + escapeHtml(item.id) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">Description</span><span class="detail-value">' + escapeHtml(item.description) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">Module</span><span class="detail-value"><span class="badge badge-module">' + escapeHtml(item.module) + '</span></span></div>' +
      '<div class="detail-row"><span class="detail-label">Assigned To</span><span class="detail-value">' + escapeHtml(item.assignedTo) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">Due Date</span><span class="detail-value" style="' + (isOverdue ? 'color:var(--red);font-weight:600' : '') + '">' + formatDate(item.dueDate) + (isOverdue ? ' (OVERDUE)' : '') + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">Priority</span><span class="detail-value"><span class="badge badge-' + item.priority.toLowerCase() + '">' + escapeHtml(item.priority) + '</span></span></div>' +
      '<div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="badge-status ' + getStatusClass(item.status) + '">' + escapeHtml(item.status) + '</span></span></div>' +
      (item.module === 'Purchase' ?
        '<div style="margin-top:14px;padding:10px 12px;background:#eff6ff;border-radius:6px;border:1px solid #bfdbfe;display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="font-size:.8rem;color:#1e40af;">Manage in Purchase & PO module:</span>' +
          '<a href="uli-purchase/index.html" class="btn btn-primary btn-sm" style="color:#fff;text-decoration:none;">Open Purchase Workspace →</a>' +
        '</div>' : '') +
      '<p style="margin-top:16px;font-size:.78rem;color:var(--text-muted)">⚠ Detail view for prototype review.</p>',
    confirmText: 'Approve',
    cancelText: 'Close',
    onConfirm: function () {
      showToast(item.id + ' approved (demo action)', 'success');
    }
  });
}

/* ───────────────── Project Health ───────────────── */
function renderProjects() {
  var projects = DEMO_DATA.projects;

  if (projects.length === 0) {
    DashDOM.projectList.innerHTML = '';
    DashDOM.projectEmpty.classList.remove('hidden');
    return;
  }

  DashDOM.projectEmpty.classList.add('hidden');
  DashDOM.projectList.innerHTML = '';

  projects.forEach(function (proj) {
    var healthLabel = proj.health.replace('-', ' ');
    healthLabel = healthLabel.charAt(0).toUpperCase() + healthLabel.slice(1);
    var healthClass = 'health-' + proj.health;
    var fillClass = 'fill-' + proj.health;

    var div = document.createElement('div');
    div.className = 'project-item';
    div.innerHTML =
      '<div class="project-top">' +
        '<span class="project-name">' + escapeHtml(proj.name) + '</span>' +
        '<div class="project-meta">' +
          '<span class="project-stage">' + escapeHtml(proj.stage) + '</span>' +
          '<span class="project-health-badge ' + healthClass + '">' + healthLabel + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="progress-bar-container">' +
        '<div class="progress-bar"><div class="progress-bar-fill ' + fillClass + '" style="width:' + proj.completion + '%"></div></div>' +
        '<span class="progress-percent">' + proj.completion + '%</span>' +
      '</div>';

    div.addEventListener('click', function () {
      openModal({
        title: proj.name,
        body:
          '<div class="detail-row"><span class="detail-label">Project</span><span class="detail-value" style="font-weight:600">' + escapeHtml(proj.name) + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Stage</span><span class="detail-value">' + escapeHtml(proj.stage) + '</span></div>' +
          '<div class="detail-row"><span class="detail-label">Completion</span><span class="detail-value">' + proj.completion + '%</span></div>' +
          '<div class="detail-row"><span class="detail-label">Health</span><span class="detail-value"><span class="project-health-badge ' + healthClass + '">' + healthLabel + '</span></span></div>' +
          '<div class="detail-row"><span class="detail-label">Manager</span><span class="detail-value">' + escapeHtml(proj.manager) + '</span></div>' +
          '<p style="margin-top:16px;font-size:.78rem;color:var(--text-muted)">⚠ Full project details will be available in the Project Management module.</p>',
        hideConfirm: true,
        cancelText: 'Close'
      });
    });

    DashDOM.projectList.appendChild(div);
  });
}

/* ───────────────── Recent Activity ───────────────── */
function renderActivity() {
  var activities = DEMO_DATA.recentActivity;

  if (activities.length === 0) {
    DashDOM.activityTimeline.innerHTML = '';
    DashDOM.activityEmpty.classList.remove('hidden');
    return;
  }

  DashDOM.activityEmpty.classList.add('hidden');
  DashDOM.activityTimeline.innerHTML = '';

  activities.forEach(function (act) {
    var div = document.createElement('div');
    div.className = 'activity-item';
    div.innerHTML =
      '<div class="activity-icon type-' + act.type + '"><i data-lucide="' + act.icon + '"></i></div>' +
      '<div class="activity-content">' +
        '<p class="activity-text"><strong>' + escapeHtml(act.user) + '</strong> ' + escapeHtml(act.action) + '</p>' +
        '<p class="activity-detail">' + escapeHtml(act.detail) + '</p>' +
        '<p class="activity-time">' + timeAgo(act.timestamp) + '</p>' +
      '</div>';
    DashDOM.activityTimeline.appendChild(div);
  });
}

/* ───────────────── Quick Actions ───────────────── */
function bindQuickActions() {
  var buttons = DashDOM.quickActionsGrid.querySelectorAll('.quick-action-btn');

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var action = btn.getAttribute('data-action');
      handleQuickAction(action);
    });
  });
}

function handleQuickAction(action) {
  switch (action) {
    case 'create-lead':
      openModal({
        title: 'Create New Lead',
        body:
          '<div class="form-group"><label>Lead Name / Client</label><input type="text" class="form-input" placeholder="e.g. Birla Estate — 3BHK"></div>' +
          '<div class="form-group"><label>Contact Person</label><input type="text" class="form-input" placeholder="Full name"></div>' +
          '<div class="form-group"><label>Email</label><input type="email" class="form-input" placeholder="email@example.com"></div>' +
          '<div class="form-group"><label>Phone</label><input type="tel" class="form-input" placeholder="+91 98765 43210"></div>' +
          '<div class="form-group"><label>Source</label><select class="form-select"><option>Referral</option><option>Website</option><option>Social Media</option><option>Walk-in</option><option>Other</option></select></div>' +
          '<div class="form-group"><label>Notes</label><textarea class="form-textarea" placeholder="Brief description of the lead…"></textarea></div>' +
          '<div style="margin-top:12px;padding:8px 12px;background:#eff6ff;border-radius:6px;font-size:.78rem;color:#1e40af;display:flex;justify-content:space-between;align-items:center;">' +
            '<span>Full Leads & CRM module available:</span>' +
            '<a href="../uli-crm/index.html" style="font-weight:600;color:#2563eb;text-decoration:underline;">Open CRM Module →</a>' +
          '</div>' +
          '<p style="font-size:.74rem;color:var(--text-muted);margin-top:8px">⚠ This is a prototype form. Submission will trigger a demo action only.</p>',
        confirmText: 'Create Lead',
        cancelText: 'Cancel',
        onConfirm: function () {
          showToast('New lead created (demo)', 'success');
        }
      });
      break;

    case 'create-pr':
      openModal({
        title: 'Create Purchase Requisition',
        body:
          '<div style="padding:12px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">' +
            '<div><strong style="color:#1e40af;">Full Purchase Module Active</strong><br><span style="font-size:.78rem;color:#2563eb;">Multi-item BOQ, real-time approval tier check, and vendor RFQ comparison.</span></div>' +
            '<a href="uli-purchase/index.html" class="btn btn-primary btn-sm" style="color:#fff;text-decoration:none;">Launch Purchase Workspace →</a>' +
          '</div>' +
          '<div class="form-group"><label>Item Description</label><input type="text" class="form-input" placeholder="e.g. Italian Marble Tiles — 200 sqft"></div>' +
          '<div class="form-group"><label>Category</label><select class="form-select"><option>Materials</option><option>Fixtures</option><option>Furniture</option><option>Electrical</option><option>Plumbing</option><option>Services</option></select></div>' +
          '<div class="form-group"><label>Estimated Amount (₹)</label><input type="number" class="form-input" placeholder="0.00"></div>' +
          '<div class="form-group"><label>Required By</label><input type="date" class="form-input"></div>' +
          '<div class="form-group"><label>Project</label><select class="form-select"><option>Prestige Tower — Penthouse Suite</option><option>Oberoi Residence — Full Interiors</option><option>Godrej Office — Workspace Fitout</option><option>Brigade Villa — Landscape Design</option></select></div>' +
          '<div class="form-group"><label>Justification</label><textarea class="form-textarea" placeholder="Reason for purchase…"></textarea></div>',
        confirmText: 'Open Full PR Builder',
        cancelText: 'Cancel',
        onConfirm: function () {
          window.location.href = 'uli-purchase/index.html';
        }
      });
      break;

    case 'pending-approvals':
      var pending = DEMO_DATA.actionItems.filter(function (i) {
        return i.status.toLowerCase().indexOf('awaiting') !== -1 || i.status.toLowerCase().indexOf('review') !== -1;
      });
      var listHtml = pending.map(function (item) {
        return '<div class="detail-row" style="cursor:pointer" data-approval-id="' + item.id + '">' +
          '<span class="detail-label" style="width:auto;flex:none"><span class="badge badge-' + item.priority.toLowerCase() + '">' + item.priority + '</span></span>' +
          '<span class="detail-value">' +
            '<strong>' + escapeHtml(item.id) + '</strong> — ' + escapeHtml(item.description) +
            '<br><span style="font-size:.75rem;color:var(--text-muted)">' + escapeHtml(item.status) + ' · Due ' + formatDate(item.dueDate) + '</span>' +
          '</span>' +
        '</div>';
      }).join('');

      openModal({
        title: 'Pending Approvals (' + pending.length + ')',
        body: listHtml || '<p style="color:var(--text-muted);text-align:center;padding:20px">No pending approvals.</p>',
        hideConfirm: true,
        cancelText: 'Close'
      });
      break;

    case 'view-projects':
      var projHtml = DEMO_DATA.projects.map(function (p) {
        var healthClass = 'health-' + p.health;
        var healthLabel = p.health.replace('-', ' ');
        healthLabel = healthLabel.charAt(0).toUpperCase() + healthLabel.slice(1);
        return '<div class="detail-row">' +
          '<span class="detail-label" style="width:auto;flex:1"><strong>' + escapeHtml(p.name) + '</strong><br><span style="font-size:.75rem;color:var(--text-muted)">' + p.stage + '</span></span>' +
          '<span class="detail-value" style="flex:none;text-align:right">' +
            '<span class="project-health-badge ' + healthClass + '">' + healthLabel + '</span>' +
            '<span style="display:block;font-size:.85rem;font-weight:600;margin-top:4px">' + p.completion + '%</span>' +
          '</span>' +
        '</div>';
      }).join('');

      openModal({
        title: 'Active Projects (' + DEMO_DATA.projects.length + ')',
        body: projHtml,
        hideConfirm: true,
        cancelText: 'Close'
      });
      break;

    default:
      showToast('Action not implemented yet', 'info');
  }
}

/* ───────────────── Date Filter ───────────────── */
function bindDateFilter() {
  DashDOM.dateRangeSelect.addEventListener('change', function (e) {
    var range = e.target.value;
    showToast('Date range changed to "' + e.target.options[e.target.selectedIndex].text + '" (demo — data unchanged)', 'info');
  });
}

/* ───────────────── Refresh ───────────────── */
function bindRefresh() {
  DashDOM.refreshBtn.addEventListener('click', function () {
    var icon = DashDOM.refreshBtn.querySelector('svg');
    if (icon) {
      icon.style.transition = 'transform .6s ease';
      icon.style.transform = 'rotate(360deg)';
      setTimeout(function () { icon.style.transform = ''; }, 600);
    }
    showToast('Dashboard data refreshed (demo)', 'success');
  });
}

/* ───────────────── Initialize Dashboard ───────────────── */
function initDashboard() {
  try {
    renderGreeting();
    renderKPIs();
    renderActionItems();
    renderProjects();
    renderActivity();
    bindQuickActions();
    bindDateFilter();
    bindRefresh();

    // Re-initialize all Lucide icons
    lucide.createIcons();

    // Hide loading after a brief simulated delay
    setTimeout(function () {
      hideLoading();
    }, 600);

  } catch (err) {
    console.error('Dashboard init error:', err);
    hideLoading();
    showErrorState();
  }
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', function () {
  initDashboard();
});
