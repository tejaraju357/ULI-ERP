/**
 * ULI Studio ERP — Purchase Dashboard Module (SCREEN 1)
 * ═════════════════════════════════════════════════════
 * Renders:
 *  - 4 KPI Cards (PRs Awaiting, Open POs, GRNs Pending, Payables Due)
 *  - Pending PR Approvals Table
 *  - Open Purchase Orders Table
 *  - 3-Way Match Mismatches Table
 *  - Procurement Lifecycle Workflow Summary
 *  - Recent Activities Timeline Feed
 *  - Responsive Filters (Project, Vendor, Date)
 */

'use strict';

function initPurchaseDashboardFilters() {
  var projSelect = document.getElementById('dash-project-filter');
  var vndSelect = document.getElementById('dash-vendor-filter');

  if (projSelect && projSelect.options.length <= 1) {
    PURCHASE_PROJECTS.forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      projSelect.appendChild(opt);
    });
  }

  if (vndSelect && vndSelect.options.length <= 1) {
    PURCHASE_VENDORS.forEach(function(v) {
      var opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.name;
      vndSelect.appendChild(opt);
    });
  }

  if (projSelect && !projSelect._bound) {
    projSelect.addEventListener('change', renderPurchaseDashboard);
    projSelect._bound = true;
  }
  if (vndSelect && !vndSelect._bound) {
    vndSelect.addEventListener('change', renderPurchaseDashboard);
    vndSelect._bound = true;
  }
  var dateSelect = document.getElementById('dash-date-filter');
  if (dateSelect && !dateSelect._bound) {
    dateSelect.addEventListener('change', renderPurchaseDashboard);
    dateSelect._bound = true;
  }
  var refreshBtn = document.getElementById('dash-refresh-btn');
  if (refreshBtn && !refreshBtn._bound) {
    refreshBtn.addEventListener('click', function() {
      renderPurchaseDashboard();
      showToast('Purchase Dashboard refreshed', 'success');
    });
    refreshBtn._bound = true;
  }

  var btnApprovals = document.getElementById('btn-dash-open-approvals');
  if (btnApprovals && !btnApprovals._bound) {
    btnApprovals.addEventListener('click', function() { switchPurView('approvals'); });
    btnApprovals._bound = true;
  }

  var btnOpenPos = document.getElementById('btn-dash-open-pos');
  if (btnOpenPos && !btnOpenPos._bound) {
    btnOpenPos.addEventListener('click', function() { switchPurView('purchase-orders'); });
    btnOpenPos._bound = true;
  }
}

function renderPurchaseDashboard() {
  initPurchaseDashboardFilters();

  var projVal = (document.getElementById('dash-project-filter') || {}).value || 'all';
  var vndVal = (document.getElementById('dash-vendor-filter') || {}).value || 'all';

  // Filter datasets
  var prs = PURCHASE_REQUISITIONS.filter(function(pr) {
    if (projVal !== 'all' && pr.projectId !== projVal) return false;
    if (vndVal !== 'all' && pr.preferredVendorId !== vndVal) return false;
    return true;
  });

  var pos = PURCHASE_ORDERS.filter(function(po) {
    if (projVal !== 'all' && po.projectId !== projVal) return false;
    if (vndVal !== 'all' && po.vendorId !== vndVal) return false;
    return true;
  });

  /* ── 1. KPI Calculations ── */
  var pendingPrs = prs.filter(function(pr) { return pr.status === 'Pending Approval'; });
  var pendingPrsVal = pendingPrs.reduce(function(a, b) { return a + (b.estimatedAmount || 0); }, 0);

  var openPos = pos.filter(function(po) {
    return po.status === 'Issued' || po.status === 'Partially Received' || po.status === 'Pending Approval';
  });

  var pendingGrns = PURCHASE_GRNS.filter(function(grn) {
    return grn.status === 'Pending Inspection' || grn.status === 'Partially Rejected';
  });

  var payables7Days = PURCHASE_VENDOR_BILLS.reduce(function(acc, bill) {
    return acc + (bill.invoiceAmount || 0);
  }, 0);

  document.getElementById('kpi-val-pending-prs').textContent = pendingPrs.length;
  document.getElementById('kpi-val-pending-prs-amt').textContent = formatCurrency(pendingPrsVal);
  document.getElementById('kpi-val-open-pos').textContent = openPos.length;
  document.getElementById('kpi-val-grns').textContent = pendingGrns.length;
  document.getElementById('kpi-val-payables').textContent = formatCurrency(payables7Days);

  // 5th KPI: Client Variations
  var clientChanges = (typeof PURCHASE_CLIENT_CHANGES !== 'undefined' ? PURCHASE_CLIENT_CHANGES : []).filter(function(cr) {
    if (projVal !== 'all' && cr.projectId !== projVal) return false;
    return true;
  });
  var totalCostImpact = clientChanges.reduce(function(a, b) { return a + (b.costImpact || 0); }, 0);

  var kpiClientCount = document.getElementById('kpi-val-client-changes');
  if (kpiClientCount) kpiClientCount.textContent = clientChanges.length;
  var kpiClientAmt = document.getElementById('kpi-val-client-changes-amt');
  if (kpiClientAmt) kpiClientAmt.textContent = '+' + formatCurrency(totalCostImpact);

  var kpiClientCard = document.getElementById('kpi-client-changes');
  if (kpiClientCard) {
    kpiClientCard.onclick = function() {
      switchPurView('client-changes');
    };
  }

  // Spotlight Banner Actions
  var btnLatestChange = document.getElementById('btn-dash-open-latest-change');
  if (btnLatestChange) {
    btnLatestChange.onclick = function() {
      openClientChangeModal('CR-2026-0041');
    };
  }
  var btnAllChanges = document.getElementById('btn-dash-all-changes');
  if (btnAllChanges) {
    btnAllChanges.onclick = function() {
      switchPurView('client-changes');
    };
  }
  var btnOpenClientTable = document.getElementById('btn-dash-open-client-table');
  if (btnOpenClientTable) {
    btnOpenClientTable.onclick = function() {
      switchPurView('client-changes');
    };
  }

  /* ── 2. Pending PR Approvals Table ── */
  var prTbody = document.getElementById('dash-pending-prs-tbody');
  prTbody.innerHTML = '';
  if (pendingPrs.length === 0) {
    prTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--green);padding:20px;"><i data-lucide="check-circle" style="vertical-align:middle;margin-right:6px"></i> No requisitions awaiting your approval.</td></tr>';
  } else {
    pendingPrs.forEach(function(pr) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span class="lead-id-badge" style="cursor:pointer" data-pr="' + pr.id + '">' + escapeHtml(pr.id) + '</span></td>' +
        '<td><div style="font-weight:600">' + escapeHtml(pr.projectName) + '</div><div style="font-size:.72rem;color:var(--text-muted)">' + escapeHtml(pr.siteLocation) + '</div></td>' +
        '<td>' + escapeHtml(pr.requestedBy) + '</td>' +
        '<td><strong style="color:var(--text-primary)">' + formatCurrency(pr.estimatedAmount) + '</strong></td>' +
        '<td><span class="approval-tier-badge">Level ' + pr.currentApprovalLevel + '</span></td>' +
        '<td><button class="btn btn-sm btn-primary" data-action="review">Review</button></td>';

      tr.querySelector('[data-pr]').addEventListener('click', function() {
        switchPurView('pr-detail', { prId: pr.id });
      });
      tr.querySelector('[data-action="review"]').addEventListener('click', function() {
        switchPurView('pr-detail', { prId: pr.id });
      });
      prTbody.appendChild(tr);
    });
  }

  /* ── 3. Open Purchase Orders Table ── */
  var poTbody = document.getElementById('dash-open-pos-tbody');
  poTbody.innerHTML = '';
  if (openPos.length === 0) {
    poTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px;">No open purchase orders currently.</td></tr>';
  } else {
    openPos.forEach(function(po) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span class="lead-id-badge" style="cursor:pointer" data-po="' + po.id + '">' + escapeHtml(po.id) + '</span></td>' +
        '<td><strong>' + escapeHtml(po.vendorName) + '</strong></td>' +
        '<td>' + escapeHtml(po.projectName) + '</td>' +
        '<td>' + formatCurrency(po.orderedAmount) + '</td>' +
        '<td>' + formatDate(po.expectedDeliveryDate) + '</td>' +
        '<td><span class="badge badge-status-' + po.status.toLowerCase().replace(/\s+/g,'-') + '">' + po.status + '</span></td>';

      tr.querySelector('[data-po]').addEventListener('click', function() {
        switchPurView('po-detail', { poId: po.id });
      });
      poTbody.appendChild(tr);
    });
  }

  /* ── 4. Overdue & Mismatched Bills Table ── */
  var mismatchTbody = document.getElementById('dash-mismatches-tbody');
  mismatchTbody.innerHTML = '';
  var discrepancies = PURCHASE_VENDOR_BILLS.filter(function(b) {
    return b.matchStatus.indexOf('Mismatch') !== -1;
  });

  if (discrepancies.length === 0) {
    mismatchTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--green);padding:20px;">All vendor bills matched with PO and GRN.</td></tr>';
  } else {
    discrepancies.forEach(function(bill) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><span class="lead-id-badge" style="cursor:pointer" data-bill="' + bill.id + '">' + escapeHtml(bill.id) + '</span></td>' +
        '<td>' + escapeHtml(bill.vendorName) + '</td>' +
        '<td>' + formatDate(bill.dueDate) + '</td>' +
        '<td><strong style="color:var(--text-primary)">' + formatCurrency(bill.invoiceAmount) + '</strong></td>' +
        '<td><span class="badge badge-status-mismatch">' + escapeHtml(bill.matchStatus) + '</span></td>' +
        '<td><button class="btn btn-sm btn-outline" data-bill-action="' + bill.id + '">3-Way Match</button></td>';

      tr.querySelector('[data-bill]').addEventListener('click', function() {
        switchPurView('3way-match', { billId: bill.id });
      });
      tr.querySelector('[data-bill-action]').addEventListener('click', function() {
        switchPurView('3way-match', { billId: bill.id });
      });
      mismatchTbody.appendChild(tr);
    });
  }

  /* ── 5. Procurement Lifecycle Stages Breakdown ── */
  var pipelineList = document.getElementById('dash-pipeline-stages-list');
  pipelineList.innerHTML = '';

  var stages = [
    { label: 'Requisitions Raised', count: PURCHASE_REQUISITIONS.length, color: '#6366f1' },
    { label: 'Awaiting Approvals', count: pendingPrs.length, color: '#d97706' },
    { label: 'Purchase Orders Issued', count: PURCHASE_ORDERS.filter(function(p){ return p.status==='Issued'; }).length, color: '#2563eb' },
    { label: 'Goods Receipts Logged', count: PURCHASE_GRNS.length, color: '#0d9488' },
    { label: '3-Way Verified Bills', count: PURCHASE_VENDOR_BILLS.filter(function(b){ return b.matchStatus==='Matched'; }).length, color: '#16a34a' }
  ];

  stages.forEach(function(s) {
    var row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.padding = '6px 0';
    row.style.borderBottom = '1px solid #f1f5f9';
    row.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="width:9px;height:9px;border-radius:50%;background:' + s.color + ';flex-shrink:0;"></span>' +
        '<span style="font-size:.82rem;">' + s.label + '</span>' +
      '</div>' +
      '<span class="badge" style="background:#f1f5f9;color:var(--text-primary);font-weight:700;font-size:.75rem;padding:2px 8px;border-radius:999px;">' + s.count + '</span>';
    pipelineList.appendChild(row);
  });

  /* ── 6. Client Scope Variations & Change Orders ── */
  var crTbody = document.getElementById('dash-client-changes-tbody');
  var clientChanges = (typeof PURCHASE_CLIENT_CHANGES !== 'undefined' ? PURCHASE_CLIENT_CHANGES : []).filter(function(cr) {
    if (projVal !== 'all' && cr.projectId !== projVal) return false;
    return true;
  });

  var crCountBadge = document.getElementById('dash-client-changes-count');
  if (crCountBadge) crCountBadge.textContent = clientChanges.length + ' Active Variations';

  if (crTbody) {
    crTbody.innerHTML = '';
    if (clientChanges.length === 0) {
      crTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:20px;">No client-requested variations for selected filter.</td></tr>';
    } else {
      clientChanges.forEach(function(cr) {
        var tr = document.createElement('tr');
        var linkedRefs = [];
        if (cr.linkedPrId) linkedRefs.push('<span class="lead-id-badge" style="cursor:pointer" data-link-pr="' + cr.linkedPrId + '">' + cr.linkedPrId + '</span>');
        if (cr.linkedPoId) linkedRefs.push('<span class="lead-id-badge" style="cursor:pointer" data-link-po="' + cr.linkedPoId + '">' + cr.linkedPoId + '</span>');

        tr.innerHTML =
          '<td><span class="lead-id-badge" style="cursor:pointer" data-view-cr="' + cr.id + '">' + escapeHtml(cr.id) + '</span><div style="font-size:.7rem;color:var(--text-muted)">' + escapeHtml(cr.variationCode) + '</div></td>' +
          '<td><strong>' + escapeHtml(cr.clientName) + '</strong><div style="font-size:.72rem;color:var(--text-muted)">' + escapeHtml(cr.projectName) + '</div></td>' +
          '<td><div style="font-weight:600;font-size:.78rem;max-width:280px;line-height:1.4;">' + escapeHtml(cr.title) + '</div><div style="font-size:.72rem;color:var(--text-secondary);margin-top:2px;">' + escapeHtml(cr.category) + ' · ' + formatDate(cr.requestDate) + '</div></td>' +
          '<td><strong style="color:var(--amber);font-size:.85rem;">' + escapeHtml(cr.costImpactFormatted) + '</strong><div style="font-size:.7rem;color:var(--text-muted)">' + (cr.timelineImpactDays > 0 ? '+' + cr.timelineImpactDays + 'd timeline' : '0d delay') + '</div></td>' +
          '<td><span class="badge badge-stage">' + escapeHtml(cr.status) + '</span></td>' +
          '<td><div style="display:flex;flex-direction:column;gap:3px">' + (linkedRefs.join(' ') || '—') + '</div></td>' +
          '<td style="text-align:right"><button class="btn btn-sm btn-outline" data-action-cr="' + cr.id + '"><i data-lucide="eye"></i> View</button></td>';

        tr.querySelectorAll('[data-view-cr], [data-action-cr]').forEach(function(el) {
          el.addEventListener('click', function() {
            if (typeof openClientChangeModal === 'function') openClientChangeModal(cr.id);
          });
        });

        var prLink = tr.querySelector('[data-link-pr]');
        if (prLink) {
          prLink.addEventListener('click', function() {
            switchPurView('pr-detail', { prId: cr.linkedPrId });
          });
        }

        var poLink = tr.querySelector('[data-link-po]');
        if (poLink) {
          poLink.addEventListener('click', function() {
            switchPurView('po-detail', { poId: cr.linkedPoId });
          });
        }

        crTbody.appendChild(tr);
      });
    }
  }

  /* ── 7. Recent Activities Feed ── */
  var actTimeline = document.getElementById('dash-activities-timeline');
  actTimeline.innerHTML = '';
  var iconMap = { pr: 'file-text', po: 'shopping-bag', grn: 'package-check', match: 'git-compare', approval: 'check-circle' };

  PURCHASE_ACTIVITIES.slice(0, 5).forEach(function(act) {
    var itm = document.createElement('div');
    itm.className = 'pur-timeline-item';
    itm.innerHTML =
      '<div class="pur-timeline-dot"><i data-lucide="' + (iconMap[act.type] || 'circle') + '"></i></div>' +
      '<div style="background:#fff;border:1px solid var(--card-border);padding:10px 12px;border-radius:var(--radius);">' +
        '<div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:3px">' +
          '<strong>' + escapeHtml(act.user) + '</strong>' +
          '<span style="color:var(--text-muted)">' + timeAgo(act.timestamp) + '</span>' +
        '</div>' +
        '<div style="font-size:.75rem;color:var(--text-secondary)">' + escapeHtml(act.action) + ': <strong>' + escapeHtml(act.detail) + '</strong></div>' +
      '</div>';
    actTimeline.appendChild(itm);
  });

  updatePurBadges();
  if (typeof safeLucide === 'function') safeLucide();
  else if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
}
