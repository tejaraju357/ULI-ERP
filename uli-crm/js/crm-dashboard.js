/**
 * ULI Studio ERP — Leads & CRM Dashboard Module (SCREEN 1)
 * ════════════════════════════════════════════════════════
 * Renders:
 *  - Dynamic KPI cards (New Leads, Pipeline Value, Conversion Rate, Overdue Follow-ups)
 *  - Overdue follow-ups alert table
 *  - Upcoming follow-ups table
 *  - Visual Pipeline Stage Summary
 *  - Acquisition Source Summary
 *  - Recent Activities Timeline
 *  - Responsive Filters (Date, Salesperson, Source)
 */

'use strict';

function initCrmDashboardFilters() {
  var spSelect = document.getElementById('dash-salesperson-filter');
  var srcSelect = document.getElementById('dash-source-filter');

  if (spSelect && spSelect.options.length <= 1) {
    CRM_SALESPEOPLE.forEach(function(sp) {
      var opt = document.createElement('option');
      opt.value = sp.id;
      opt.textContent = sp.name;
      spSelect.appendChild(opt);
    });
  }

  if (srcSelect && srcSelect.options.length <= 1) {
    CRM_SOURCES.forEach(function(src) {
      var opt = document.createElement('option');
      opt.value = src;
      opt.textContent = src;
      srcSelect.appendChild(opt);
    });
  }

  // Bind change events once
  if (spSelect && !spSelect._bound) {
    spSelect.addEventListener('change', renderCrmDashboard);
    spSelect._bound = true;
  }
  if (srcSelect && !srcSelect._bound) {
    srcSelect.addEventListener('change', renderCrmDashboard);
    srcSelect._bound = true;
  }
  var dateSelect = document.getElementById('dash-date-filter');
  if (dateSelect && !dateSelect._bound) {
    dateSelect.addEventListener('change', renderCrmDashboard);
    dateSelect._bound = true;
  }
  var refreshBtn = document.getElementById('dash-refresh-btn');
  if (refreshBtn && !refreshBtn._bound) {
    refreshBtn.addEventListener('click', function() {
      renderCrmDashboard();
      showToast('CRM Dashboard data refreshed', 'success');
    });
    refreshBtn._bound = true;
  }

  // Cross-view shortcuts
  var btnAllFu = document.getElementById('btn-view-all-followups');
  if (btnAllFu && !btnAllFu._bound) {
    btnAllFu.addEventListener('click', function() { switchCrmView('followups'); });
    btnAllFu._bound = true;
  }
  var btnPipeBoard = document.getElementById('btn-view-pipeline-board');
  if (btnPipeBoard && !btnPipeBoard._bound) {
    btnPipeBoard.addEventListener('click', function() { switchCrmView('pipeline'); });
    btnPipeBoard._bound = true;
  }
}

function getFilteredDashboardLeads() {
  var spVal = (document.getElementById('dash-salesperson-filter') || {}).value || 'all';
  var srcVal = (document.getElementById('dash-source-filter') || {}).value || 'all';

  return CRM_LEADS.filter(function(lead) {
    if (spVal !== 'all' && lead.salesperson !== spVal) return false;
    if (srcVal !== 'all' && lead.source !== srcVal) return false;
    return true;
  });
}

function renderCrmDashboard() {
  initCrmDashboardFilters();

  var leads = getFilteredDashboardLeads();

  /* ── 1. KPI Cards ── */
  // Active leads in pipeline (excluding won and lost)
  var activeLeads = leads.filter(function(l) { return l.stage !== 'won' && l.stage !== 'lost'; });
  var totalPipelineVal = activeLeads.reduce(function(acc, l) { return acc + (l.expectedValue || 0); }, 0);

  // New leads in enquiry stage
  var newLeadsCount = leads.filter(function(l) { return l.stage === 'new-enquiry'; }).length;

  // Conversion rate: Won / (Won + Lost)
  var wonCount = leads.filter(function(l) { return l.stage === 'won'; }).length;
  var lostCount = leads.filter(function(l) { return l.stage === 'lost'; }).length;
  var closedCount = wonCount + lostCount;
  var convRate = closedCount > 0 ? ((wonCount / closedCount) * 100).toFixed(1) + '%' : '0.0%';

  // Overdue followups
  var overdueFollowups = CRM_FOLLOWUPS.filter(function(fu) {
    return fu.status === 'Pending' && isDateOverdue(fu.date);
  });

  // Inject KPI values
  document.getElementById('kpi-val-new-leads').textContent = newLeadsCount;
  document.getElementById('kpi-val-pipeline').textContent = formatCurrency(totalPipelineVal);
  document.getElementById('kpi-active-lead-count').textContent = activeLeads.length;
  document.getElementById('kpi-val-conv-rate').textContent = convRate;
  document.getElementById('kpi-val-overdue').textContent = overdueFollowups.length;
  document.getElementById('dash-overdue-count').textContent = overdueFollowups.length + ' Overdue';

  /* ── 2. Overdue Follow-ups Table ── */
  var overdueTbody = document.getElementById('dash-overdue-tbody');
  overdueTbody.innerHTML = '';
  if (overdueFollowups.length === 0) {
    overdueTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--green);padding:24px;"><i data-lucide="check-circle" style="vertical-align:middle;margin-right:6px"></i> All caught up! No overdue follow-ups.</td></tr>';
  } else {
    overdueFollowups.forEach(function(fu) {
      var tr = document.createElement('tr');
      var sp = getSalesperson(fu.assignedTo);
      tr.innerHTML =
        '<td><span class="lead-id-badge" style="cursor:pointer">' + escapeHtml(fu.leadId) + '</span></td>' +
        '<td><span style="font-weight:600">' + escapeHtml(fu.customerName) + '</span></td>' +
        '<td>' + escapeHtml(sp.name) + '</td>' +
        '<td><span class="badge badge-status-overdue">' + formatDateTime(fu.date) + '</span></td>' +
        '<td><span class="badge badge-stage">' + escapeHtml(fu.type) + '</span></td>' +
        '<td><button class="btn btn-sm btn-primary" data-fuid="' + fu.id + '">Action</button></td>';

      // Action button triggers complete or reschedule modal
      tr.querySelector('button').addEventListener('click', function() {
        if (typeof openFollowupModal === 'function') {
          openFollowupModal(fu);
        }
      });
      tr.querySelector('.lead-id-badge').addEventListener('click', function() {
        switchCrmView('lead-detail', { leadId: fu.leadId });
      });
      overdueTbody.appendChild(tr);
    });
  }

  /* ── 3. Upcoming Follow-ups Table ── */
  var upcomingTbody = document.getElementById('dash-upcoming-tbody');
  upcomingTbody.innerHTML = '';
  var upcomingList = CRM_FOLLOWUPS.filter(function(fu) {
    return fu.status === 'Pending' && !isDateOverdue(fu.date);
  }).slice(0, 5);

  if (upcomingList.length === 0) {
    upcomingTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px;">No upcoming follow-ups scheduled</td></tr>';
  } else {
    upcomingList.forEach(function(fu) {
      var tr = document.createElement('tr');
      var sp = getSalesperson(fu.assignedTo);
      tr.innerHTML =
        '<td><span class="lead-id-badge" style="cursor:pointer">' + escapeHtml(fu.leadId) + '</span></td>' +
        '<td><span style="font-weight:600">' + escapeHtml(fu.customerName) + '</span></td>' +
        '<td>' + formatDateTime(fu.date) + '</td>' +
        '<td><span class="badge badge-stage">' + escapeHtml(fu.type) + '</span></td>' +
        '<td>' + escapeHtml(sp.name) + '</td>' +
        '<td><button class="btn btn-sm btn-outline" data-fuid="' + fu.id + '">View</button></td>';

      tr.querySelector('button').addEventListener('click', function() {
        if (typeof openFollowupModal === 'function') {
          openFollowupModal(fu);
        }
      });
      tr.querySelector('.lead-id-badge').addEventListener('click', function() {
        switchCrmView('lead-detail', { leadId: fu.leadId });
      });
      upcomingTbody.appendChild(tr);
    });
  }

  /* ── 4. Pipeline Summary Bar & Stage List ── */
  var barEl = document.getElementById('dash-pipeline-bar');
  var legendEl = document.getElementById('dash-pipeline-legend');
  var stageListEl = document.getElementById('dash-pipeline-stage-list');

  barEl.innerHTML = '';
  legendEl.innerHTML = '';
  stageListEl.innerHTML = '';

  var totalLeads = leads.length || 1;

  CRM_STAGES.forEach(function(stage) {
    var countInStage = leads.filter(function(l) { return l.stage === stage.id; }).length;
    var pct = ((countInStage / totalLeads) * 100);
    var stageVal = leads.filter(function(l) { return l.stage === stage.id; })
                        .reduce(function(a, b) { return a + (b.expectedValue || 0); }, 0);

    if (countInStage > 0) {
      // Bar segment
      var seg = document.createElement('div');
      seg.className = 'pipeline-bar-segment';
      seg.style.width = pct + '%';
      seg.style.background = stage.color;
      seg.title = stage.label + ': ' + countInStage + ' leads (' + formatCurrency(stageVal) + ')';
      barEl.appendChild(seg);

      // Legend entry
      var leg = document.createElement('div');
      leg.className = 'legend-item';
      leg.innerHTML = '<span class="legend-color" style="background:' + stage.color + '"></span>' +
                      '<span>' + stage.label + ' (' + countInStage + ')</span>';
      legendEl.appendChild(leg);
    }

    // List entry
    var row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.padding = '6px 0';
    row.style.borderBottom = '1px solid #f1f5f9';
    row.style.fontSize = '.8rem';
    row.innerHTML =
      '<div style="display:flex;align-items:center;gap:6px;">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:' + stage.color + '"></span>' +
        '<span style="font-weight:500">' + stage.label + '</span>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<span style="color:var(--text-muted)">' + countInStage + ' leads</span>' +
        '<strong style="color:var(--text-primary);min-width:70px;text-align:right">' + formatCurrency(stageVal) + '</strong>' +
      '</div>';
    stageListEl.appendChild(row);
  });

  /* ── 5. Acquisition Sources ── */
  var sourceContainer = document.getElementById('dash-source-breakdown');
  sourceContainer.innerHTML = '';

  var sourceCounts = {};
  CRM_SOURCES.forEach(function(s) { sourceCounts[s] = 0; });
  leads.forEach(function(l) {
    if (sourceCounts[l.source] !== undefined) sourceCounts[l.source]++;
  });

  CRM_SOURCES.forEach(function(src) {
    var cnt = sourceCounts[src] || 0;
    var pct = Math.round((cnt / totalLeads) * 100);

    var item = document.createElement('div');
    item.className = 'source-item';
    item.innerHTML =
      '<span class="source-label" style="width:90px">' + escapeHtml(src) + '</span>' +
      '<div class="source-bar-outer"><div class="source-bar-inner" style="width:' + pct + '%"></div></div>' +
      '<span class="source-meta">' + cnt + ' (' + pct + '%)</span>';
    sourceContainer.appendChild(item);
  });

  /* ── 6. Recent Lead Activities ── */
  var actTimeline = document.getElementById('dash-recent-activities');
  actTimeline.innerHTML = '';
  CRM_ACTIVITIES.slice(0, 5).forEach(function(act) {
    var item = document.createElement('div');
    item.className = 'timeline-item';
    var iconMap = { Note: 'file-text', Meeting: 'calendar', Call: 'phone-call', Email: 'mail', WhatsApp: 'message-square' };
    item.innerHTML =
      '<div class="timeline-dot"><i data-lucide="' + (iconMap[act.type] || 'circle') + '"></i></div>' +
      '<div class="timeline-card" style="padding:10px 12px">' +
        '<div class="timeline-header">' +
          '<span class="timeline-title" style="font-size:.8rem">' + escapeHtml(act.user) + '</span>' +
          '<span class="timeline-time">' + timeAgo(act.timestamp) + '</span>' +
        '</div>' +
        '<div class="timeline-desc" style="font-size:.78rem">' + escapeHtml(act.summary) + '</div>' +
      '</div>';
    actTimeline.appendChild(item);
  });

  updateCrmBadges();
  lucide.createIcons();
}
