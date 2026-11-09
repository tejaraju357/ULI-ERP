/**
 * ULI Studio ERP — Approval Queue & Vendor RFQ Comparison (SCREENS 5 & 6)
 * ══════════════════════════════════════════════════════════════════════
 * Implements:
 *  - Screen 5: Centralized Approval Queue (with multi-tier threshold governance)
 *  - Screen 6: Vendor Comparison / RFQ Matrix (side-by-side rates, taxes, delivery times)
 */

'use strict';

/* ══════════════════════════════════════════════════
   SCREEN 5: APPROVAL QUEUE
   ══════════════════════════════════════════════════ */

function renderApprovalQueue() {
  var tbody = document.getElementById('approvals-table-tbody');
  tbody.innerHTML = '';

  var pendingPrs = PURCHASE_REQUISITIONS.filter(function(pr) {
    return pr.status === 'Pending Approval';
  });

  var countBadge = document.getElementById('approvals-queue-count');
  if (countBadge) countBadge.textContent = pendingPrs.length + ' Pending';

  if (pendingPrs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--green);padding:32px;"><i data-lucide="check-circle-2" style="width:28px;height:28px;margin-bottom:6px;display:block;margin:0 auto"></i> All requisitions cleared! No pending approvals.</td></tr>';
    lucide.createIcons();
    return;
  }

  pendingPrs.forEach(function(pr) {
    var approver = PURCHASE_USERS.find(function(u){ return u.id === pr.currentApproverId; }) || { name: 'Unassigned' };
    var pendingDuration = pr.submissionDate ? timeAgo(pr.submissionDate) : 'Recently';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><span class="lead-id-badge" style="cursor:pointer" data-view-pr="' + pr.id + '">' + escapeHtml(pr.id) + '</span></td>' +
      '<td>' + escapeHtml(pr.requestedBy) + '</td>' +
      '<td><div style="font-weight:600">' + escapeHtml(pr.projectName) + '</div><div style="font-size:.72rem;color:var(--text-muted)">' + escapeHtml(pr.siteLocation) + '</div></td>' +
      '<td><strong style="color:var(--text-primary);font-size:.9rem">' + formatCurrency(pr.estimatedAmount) + '</strong></td>' +
      '<td>' + formatDate(pr.submissionDate || pr.createdDate) + '</td>' +
      '<td><span class="approval-tier-badge">Level ' + pr.currentApprovalLevel + '</span></td>' +
      '<td><strong>' + escapeHtml(approver.name) + '</strong></td>' +
      '<td><span style="color:var(--amber);font-weight:600">' + escapeHtml(pendingDuration) + '</span></td>' +
      '<td style="text-align:right">' +
        '<div class="table-actions" style="justify-content:flex-end">' +
          '<button class="btn btn-sm btn-outline" data-action="view"><i data-lucide="eye"></i> View</button>' +
          '<button class="btn btn-sm btn-outline" style="color:var(--amber)" data-action="changes">Changes</button>' +
          '<button class="btn btn-sm btn-danger btn-sm" data-action="reject">Reject</button>' +
          '<button class="btn btn-sm btn-success btn-sm" data-action="approve">Approve</button>' +
        '</div>' +
      '</td>';

    tr.querySelectorAll('[data-view-pr], [data-action="view"]').forEach(function(el) {
      el.addEventListener('click', function() {
        switchPurView('pr-detail', { prId: pr.id });
      });
    });

    tr.querySelector('[data-action="approve"]').addEventListener('click', function() {
      promptApprovePr(pr);
    });

    tr.querySelector('[data-action="reject"]').addEventListener('click', function() {
      promptRejectPr(pr);
    });

    tr.querySelector('[data-action="changes"]').addEventListener('click', function() {
      promptRequestChangesPr(pr);
    });

    tbody.appendChild(tr);
  });

  updatePurBadges();
  lucide.createIcons();
}

/* ══════════════════════════════════════════════════
   SCREEN 6: VENDOR COMPARISON / RFQ MATRIX
   ══════════════════════════════════════════════════ */

function renderRfqComparison(prId) {
  var container = document.getElementById('rfq-container');
  var rfq = PURCHASE_RFQS[0]; // Active demo RFQ

  if (!rfq) {
    container.innerHTML = '<div class="state-message"><h4>No active RFQ comparison</h4></div>';
    return;
  }

  var quotesHtml = rfq.quotes.map(function(q) {
    var colCls = q.isRecommended ? 'rfq-col-recommended' : '';

    return '<div class="card ' + colCls + '" style="flex:1;min-width:300px;display:flex;flex-direction:column">' +
      '<div class="card-header" style="flex-direction:column;align-items:flex-start;gap:4px">' +
        (q.isRecommended ? '<span class="recommendation-ribbon"><i data-lucide="award" style="width:13px;height:13px"></i> Recommended Quote</span>' : '') +
        '<h3 style="font-size:1.05rem;font-weight:700">' + escapeHtml(q.vendorName) + '</h3>' +
        '<div style="font-size:1.35rem;font-weight:800;color:var(--blue);margin:4px 0">' + formatCurrency(q.totalCost) + '</div>' +
        '<div style="font-size:.76rem;color:var(--text-muted)">₹' + q.unitRate.toLocaleString('en-IN') + ' / sqft (+ ' + q.taxPct + '% GST)</div>' +
      '</div>' +
      '<div class="card-body" style="flex:1;font-size:.82rem;line-height:1.6">' +
        '<div style="margin-bottom:8px"><strong>Lead Time:</strong> <span style="font-weight:600">' + q.deliveryDays + ' Business Days</span></div>' +
        '<div style="margin-bottom:8px"><strong>Payment Terms:</strong> ' + escapeHtml(q.paymentTerms) + '</div>' +
        '<div style="margin-bottom:8px"><strong>Warranty / Guarantee:</strong> ' + escapeHtml(q.warranty) + '</div>' +
        '<div style="margin-bottom:8px"><strong>Availability:</strong> ' + escapeHtml(q.availability) + '</div>' +
        '<div style="margin-bottom:12px"><strong>Sourcing Remarks:</strong> ' + escapeHtml(q.remarks) + '</div>' +
        (q.recommendationReason ? '<div class="alert alert-info" style="font-size:.75rem;padding:8px 10px;margin-bottom:0"><strong>Analysis Note:</strong> ' + escapeHtml(q.recommendationReason) + '</div>' : '') +
      '</div>' +
      '<div class="modal-footer" style="background:transparent;padding:14px 20px">' +
        '<button class="btn ' + (q.isRecommended ? 'btn-primary' : 'btn-outline') + ' btn-sm" style="width:100%" data-select-vendor="' + q.vendorId + '">' +
          '<i data-lucide="check"></i> Select ' + (q.isRecommended ? 'Recommended' : '') + ' Vendor' +
        '</button>' +
      '</div>' +
    '</div>';
  }).join('');

  container.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">' +
      '<div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span class="lead-id-badge" style="font-size:1rem">' + escapeHtml(rfq.id) + '</span>' +
          '<span class="badge badge-stage">' + escapeHtml(rfq.status) + '</span>' +
        '</div>' +
        '<h2 style="font-size:1.3rem;font-weight:700;margin-top:2px;">' + escapeHtml(rfq.title) + '</h2>' +
        '<div style="font-size:.8rem;color:var(--text-secondary)">Linked Requisition: <strong>' + escapeHtml(rfq.prId) + '</strong> (' + escapeHtml(rfq.projectName) + ')</div>' +
      '</div>' +
      '<div class="badge badge-soon">Configurable RFQ Workflow</div>' +
    '</div>' +

    '<div class="alert alert-warning" style="margin-bottom:24px">' +
      '<i data-lucide="alert-triangle"></i>' +
      '<div><strong>Configurable Procurement Policy:</strong> The studio\'s formal vendor quotation threshold rules are in review. The system highlights algorithmically scored recommendations based on price and transit lead time, but procurement officers retain full manual discretion to select any approved supplier.</div>' +
    '</div>' +

    '<!-- 3-Way Vendor Side-by-Side Cards -->' +
    '<div style="display:flex;gap:20px;margin-bottom:24px;flex-wrap:wrap">' +
      quotesHtml +
    '</div>';

  // Bind vendor selection action
  container.querySelectorAll('[data-select-vendor]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var vndId = btn.getAttribute('data-select-vendor');
      var q = rfq.quotes.find(function(item){ return item.vendorId === vndId; });
      openModal({
        title: 'Confirm Vendor Selection',
        body: '<p>You have selected <strong>' + escapeHtml(q.vendorName) + '</strong> at total cost of <strong>' + formatCurrency(q.totalCost) + '</strong>.</p><p style="margin-top:8px;font-size:.82rem;color:var(--text-secondary)">Would you like to advance directly to generate the Purchase Order?</p>',
        confirmText: 'Generate Purchase Order',
        onConfirm: function() {
          showToast('Vendor ' + q.vendorName + ' selected for PO creation', 'success');
          switchPurView('create-po', { linkedPrId: rfq.prId });
          return true;
        }
      });
    });
  });

  lucide.createIcons();
}
