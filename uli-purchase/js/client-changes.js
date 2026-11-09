/**
 * ULI Studio ERP — Client Scope Variations & Change Orders Controller
 * ══════════════════════════════════════════════════════════════════
 * Screen 16: Client Variations & Material Impact Workspace.
 * Tracks client-requested design alterations, verbatim instructions,
 * signed addenda, commercial variances, and linked PR/PO commitments.
 */

'use strict';

function renderClientChangesView() {
  var container = document.getElementById('view-client-changes');
  if (!container) return;

  var changes = typeof PURCHASE_CLIENT_CHANGES !== 'undefined' ? PURCHASE_CLIENT_CHANGES : [];
  var projects = typeof PURCHASE_PROJECTS !== 'undefined' ? PURCHASE_PROJECTS : [];

  var projFilter = document.getElementById('cr-project-filter');
  var statusFilter = document.getElementById('cr-status-filter');
  var searchInput = document.getElementById('cr-search-input');

  var projVal = projFilter ? projFilter.value : 'all';
  var statusVal = statusFilter ? statusFilter.value : 'all';
  var searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';

  if (projFilter && projFilter.options.length <= 1) {
    projects.forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      projFilter.appendChild(opt);
    });
  }

  var filtered = changes.filter(function(cr) {
    if (projVal !== 'all' && cr.projectId !== projVal) return false;
    if (statusVal !== 'all' && cr.status !== statusVal) return false;
    if (searchVal) {
      var matchId = cr.id.toLowerCase().indexOf(searchVal) !== -1;
      var matchCode = (cr.variationCode || '').toLowerCase().indexOf(searchVal) !== -1;
      var matchClient = cr.clientName.toLowerCase().indexOf(searchVal) !== -1;
      var matchProject = cr.projectName.toLowerCase().indexOf(searchVal) !== -1;
      var matchReq = cr.clientStatedRequest.toLowerCase().indexOf(searchVal) !== -1;
      if (!matchId && !matchCode && !matchClient && !matchProject && !matchReq) return false;
    }
    return true;
  });

  var totalCost = filtered.reduce(function(a, b) { return a + (b.costImpact || 0); }, 0);
  var maxDays = filtered.reduce(function(a, b) { return Math.max(a, b.timelineImpactDays || 0); }, 0);
  var linkedPrsCount = filtered.filter(function(c) { return c.linkedPrId; }).length;
  var linkedPosCount = filtered.filter(function(c) { return c.linkedPoId; }).length;

  var countBadge = document.getElementById('cr-total-count');
  if (countBadge) countBadge.textContent = filtered.length;
  var costBadge = document.getElementById('cr-total-cost');
  if (costBadge) costBadge.textContent = '+' + formatCurrency(totalCost);
  var daysBadge = document.getElementById('cr-max-delay');
  if (daysBadge) daysBadge.textContent = '+' + maxDays + ' Days';
  var linkedBadge = document.getElementById('cr-linked-docs');
  if (linkedBadge) linkedBadge.textContent = linkedPrsCount + ' PRs / ' + linkedPosCount + ' POs';

  var cardsContainer = document.getElementById('cr-cards-container');
  if (!cardsContainer) return;
  cardsContainer.innerHTML = '';

  if (filtered.length === 0) {
    cardsContainer.innerHTML =
      '<div class="state-message" style="background:#fff;border:1px solid var(--card-border);border-radius:var(--radius-lg);padding:40px;">' +
        '<i data-lucide="sparkles" style="color:var(--text-muted)"></i>' +
        '<h4>No Client Variation Records Match Filter</h4>' +
        '<p>Try adjusting project, status, or search query.</p>' +
      '</div>';
    safeLucide();
    return;
  }

  filtered.forEach(function(cr) {
    var card = document.createElement('div');
    card.className = 'client-cr-card';

    var statusColor = cr.status === 'Approved' ? 'badge-green' : (cr.status === 'In Procurement Review' ? 'badge-amber' : 'badge-blue');

    card.innerHTML =
      '<div class="client-cr-header">' +
        '<div>' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
            '<span class="lead-id-badge" style="font-size:.82rem;font-weight:700;">' + escapeHtml(cr.id) + '</span>' +
            '<span class="badge" style="background:#e0e7ff;color:#3730a3;font-weight:600;">' + escapeHtml(cr.variationCode) + '</span>' +
            '<span class="badge ' + statusColor + '">' + escapeHtml(cr.status) + '</span>' +
            '<span style="font-size:.78rem;color:var(--text-muted)">Approved on ' + formatDate(cr.approvalDate) + '</span>' +
          '</div>' +
          '<h3 style="font-size:1.05rem;font-weight:700;margin:6px 0 2px;color:var(--text-primary);">' + escapeHtml(cr.title) + '</h3>' +
          '<div style="font-size:.82rem;color:var(--text-secondary);">' +
            '<strong>' + escapeHtml(cr.clientName) + '</strong> (' + escapeHtml(cr.clientPhone) + ') · ' +
            '<span>' + escapeHtml(cr.projectName) + ' — ' + escapeHtml(cr.siteLocation) + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Commercial Variance</div>' +
          '<div style="font-size:1.35rem;font-weight:800;color:var(--amber);">' + escapeHtml(cr.costImpactFormatted) + '</div>' +
          '<div style="font-size:.75rem;color:var(--text-secondary);">' +
            (cr.timelineImpactDays > 0 ? '+' + cr.timelineImpactDays + ' days delivery buffer' : 'Zero schedule slippage') +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="client-cr-quote-box">' +
        '<div style="font-size:.72rem;text-transform:uppercase;font-weight:700;color:#9d174d;margin-bottom:3px;font-style:normal;">' +
          '<i data-lucide="quote" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;"></i> Client Stated Request / Alteration Instructions:' +
        '</div>' +
        '“' + escapeHtml(cr.clientStatedRequest) + '”' +
      '</div>' +

      '<div class="client-cr-scope-grid">' +
        '<div>' +
          '<strong style="color:var(--text-muted);display:block;margin-bottom:2px;font-size:.73rem;text-transform:uppercase;">Contracted Baseline Scope:</strong>' +
          '<div>' + escapeHtml(cr.originalScope) + '</div>' +
        '</div>' +
        '<div>' +
          '<strong style="color:#2563eb;display:block;margin-bottom:2px;font-size:.73rem;text-transform:uppercase;">Revised Client Scope & Materials:</strong>' +
          '<div style="font-weight:600;color:var(--text-primary);">' + escapeHtml(cr.revisedScope) + '</div>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding-top:10px;border-top:1px solid #f1f5f9;">' +
        '<div style="display:flex;align-items:center;gap:12px;font-size:.78rem;flex-wrap:wrap;">' +
          '<div style="display:inline-flex;align-items:center;gap:5px;background:#f8fafc;padding:3px 8px;border-radius:4px;border:1px solid #e2e8f0;font-weight:600;color:#2563eb;">' +
            '<i data-lucide="file-check" style="width:14px;height:14px;"></i> ' + escapeHtml(cr.clientApprovalRef) +
          '</div>' +
          '<span><strong>Architect:</strong> ' + escapeHtml(cr.leadArchitect) + '</span>' +
          '<span><strong>Procurement:</strong> ' + escapeHtml(cr.consultant) + '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          (cr.linkedPrId ? '<button class="btn btn-outline btn-sm" data-btn-pr="' + cr.linkedPrId + '"><i data-lucide="file-text"></i> ' + cr.linkedPrId + ' →</button>' : '') +
          (cr.linkedPoId ? '<button class="btn btn-outline btn-sm" data-btn-po="' + cr.linkedPoId + '"><i data-lucide="shopping-bag"></i> ' + cr.linkedPoId + ' →</button>' : '') +
          '<button class="btn btn-primary btn-sm" data-btn-full="' + cr.id + '"><i data-lucide="eye"></i> Full Audit Trail</button>' +
        '</div>' +
      '</div>';

    var prBtn = card.querySelector('[data-btn-pr]');
    if (prBtn) {
      prBtn.addEventListener('click', function() {
        switchPurView('pr-detail', { prId: cr.linkedPrId });
      });
    }

    var poBtn = card.querySelector('[data-btn-po]');
    if (poBtn) {
      poBtn.addEventListener('click', function() {
        switchPurView('po-detail', { poId: cr.linkedPoId });
      });
    }

    var fullBtn = card.querySelector('[data-btn-full]');
    if (fullBtn) {
      fullBtn.addEventListener('click', function() {
        openClientChangeModal(cr.id);
      });
    }

    cardsContainer.appendChild(card);
  });

  safeLucide();
}

function bindClientChangesEvents() {
  var projFilter = document.getElementById('cr-project-filter');
  var statusFilter = document.getElementById('cr-status-filter');
  var searchInput = document.getElementById('cr-search-input');
  var refreshBtn = document.getElementById('cr-refresh-btn');

  if (projFilter) projFilter.addEventListener('change', renderClientChangesView);
  if (statusFilter) statusFilter.addEventListener('change', renderClientChangesView);
  if (searchInput) searchInput.addEventListener('input', renderClientChangesView);
  if (refreshBtn) refreshBtn.addEventListener('click', function() {
    if (projFilter) projFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    if (searchInput) searchInput.value = '';
    renderClientChangesView();
    showToast('Client variation register refreshed', 'info');
  });
}
