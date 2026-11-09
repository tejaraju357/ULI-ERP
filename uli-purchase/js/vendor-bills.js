/**
 * ULI Studio ERP — 3-Way Matching & Exceptions Module (SCREENS 12 & 15)
 * ═════════════════════════════════════════════════════════════════════
 * Handles:
 *  - Screen 12: Vendor Bills & 3-Way Matching (PO vs GRN vs Vendor Invoice)
 *  - Highlights Quantity Mismatches, Rate Mismatches, Tax Differences
 *  - Enforces rule: Never auto-approve a mismatch; Payment belongs to Finance
 *  - Screen 15: Procurement Exceptions Register & Audit Trail
 */

'use strict';

/* ══════════════════════════════════════════════════
   SCREEN 12: 3-WAY MATCHING & BILL VERIFICATION
   ══════════════════════════════════════════════════ */

function renderThreeWayMatch(preselectedBillId) {
  var container = document.getElementById('threeway-match-container');
  var activeBill = preselectedBillId ?
    (PURCHASE_VENDOR_BILLS.find(function(b){ return b.id === preselectedBillId; }) || PURCHASE_VENDOR_BILLS[0]) :
    PURCHASE_VENDOR_BILLS[0];

  if (!activeBill) {
    container.innerHTML = '<div class="state-message"><h4>No vendor bills available for 3-way matching</h4></div>';
    return;
  }

  var billSelectorHtml = PURCHASE_VENDOR_BILLS.map(function(b) {
    var isSel = b.id === activeBill.id;
    var badgeClass = b.matchStatus === 'Matched' ? 'badge-status-accepted' : 'badge-status-mismatch';
    return '<button class="btn btn-sm ' + (isSel ? 'btn-primary' : 'btn-outline') + '" data-select-bill="' + b.id + '">' +
      b.id + ' (' + b.vendorName + ') <span class="badge ' + badgeClass + '" style="margin-left:6px">' + b.matchStatus + '</span>' +
    '</button>';
  }).join(' ');

  var po = PURCHASE_ORDERS.find(function(p){ return p.id === activeBill.linkedPoId; }) || { grandTotal: activeBill.invoiceAmount, items: [] };
  var grn = PURCHASE_GRNS.find(function(g){ return g.id === activeBill.linkedGrnId; }) || { totalAccepted: 0, totalRejected: 0 };

  var lineComparisonsHtml = (activeBill.lines || []).map(function(l, idx) {
    var isQtyMismatch = l.grnAcceptedQty !== l.invQty;
    var isRateMismatch = l.poRate !== l.invRate;
    var isMatched = l.status === 'Matched';

    return '<tr>' +
      '<td>' + (idx + 1) + '</td>' +
      '<td><strong>' + escapeHtml(l.item) + '</strong></td>' +
      '<td>' + l.poQty + ' pcs @ ₹' + l.poRate.toLocaleString('en-IN') + '</td>' +
      '<td><span class="grn-qty-badge grn-qty-accepted">' + l.grnAcceptedQty + ' pcs accepted</span></td>' +
      '<td><span class="' + (isQtyMismatch ? 'match-diff-highlight' : 'match-ok-highlight') + '">' + l.invQty + ' pcs</span> @ <span class="' + (isRateMismatch ? 'match-diff-highlight' : '') + '">₹' + l.invRate.toLocaleString('en-IN') + '</span></td>' +
      '<td style="text-align:right">₹' + l.poTotal.toLocaleString('en-IN') + '</td>' +
      '<td style="text-align:right"><strong>₹' + l.invTotal.toLocaleString('en-IN') + '</strong></td>' +
      '<td><span class="badge ' + (isMatched ? 'badge-status-accepted' : 'badge-status-mismatch') + '">' + l.status + '</span></td>' +
    '</tr>';
  }).join('');

  var auditRows = (activeBill.resolutionAudit || []).map(function(a) {
    return '<div style="padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:.78rem">' +
      '<strong>' + escapeHtml(a.user) + '</strong> (' + escapeHtml(a.date) + '): ' + escapeHtml(a.note) +
    '</div>';
  }).join('');

  var isDiscrepancy = activeBill.matchStatus.indexOf('Mismatch') !== -1;

  container.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">' +
      '<div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<span class="lead-id-badge" style="font-size:1rem">' + escapeHtml(activeBill.id) + '</span>' +
          '<span class="badge ' + (isDiscrepancy ? 'badge-status-mismatch' : 'badge-status-accepted') + '">' + activeBill.matchStatus + '</span>' +
          '<span style="font-size:.8rem;color:var(--text-muted)">Invoice Ref: <strong>' + escapeHtml(activeBill.invoiceNumber) + '</strong></span>' +
        '</div>' +
        '<h2 style="font-size:1.3rem;font-weight:700;margin-top:2px;">' + escapeHtml(activeBill.vendorName) + ' — Bill Verification</h2>' +
      '</div>' +

      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<button class="btn btn-outline btn-sm" id="btn-match-explanation"><i data-lucide="message-square"></i> Add Explanation</button>' +
        '<button class="btn btn-danger btn-sm" id="btn-request-credit-note"><i data-lucide="corner-up-left"></i> Demand Correction / Debit Note</button>' +
        '<button class="btn ' + (isDiscrepancy ? 'btn-outline disabled' : 'btn-success') + ' btn-sm" id="btn-approve-match" ' + (isDiscrepancy ? 'disabled title="Mismatches must be resolved before approval"' : '') + '>' +
          '<i data-lucide="check-check"></i> ' + (isDiscrepancy ? 'Mismatch Blocked' : 'Approve for Finance Release') +
        '</button>' +
      '</div>' +
    '</div>' +

    '<!-- Bill Switcher Tabs -->' +
    '<div style="display:flex;gap:8px;margin-bottom:20px;overflow-x:auto;padding-bottom:4px">' +
      billSelectorHtml +
    '</div>' +

    (isDiscrepancy ?
      '<div class="alert alert-danger" style="margin-bottom:20px">' +
        '<i data-lucide="alert-triangle"></i>' +
        '<div><strong>3-Way Matching Discrepancy Detected!</strong><br>' + escapeHtml(activeBill.discrepancyNote) +
        '<br><em>Governance Rule: The ERP system never automatically approves invoices with rate or quantity variance. Financial release is halted until documented resolution.</em></div>' +
      '</div>' :
      '<div class="alert alert-success" style="margin-bottom:20px">' +
        '<i data-lucide="check-circle-2"></i>' +
        '<div><strong>Perfect 3-Way Match Verified!</strong><br>All invoiced quantities correspond 1:1 with accepted goods receipt items (GRN) and contracted PO line item rates.</div>' +
      '</div>') +

    '<!-- 3 Comparative Pillars: PO vs GRN vs Vendor Bill -->' +
    '<div class="match-comparison-grid">' +
      '<div class="match-pillar">' +
        '<div class="match-pillar-header">' +
          '<span>1. Purchase Order</span>' +
          '<span class="lead-id-badge" style="cursor:pointer" onclick="switchPurView(\'po-detail\', {poId:\'' + activeBill.linkedPoId + '\'})">' + activeBill.linkedPoId + '</span>' +
        '</div>' +
        '<div style="font-size:.82rem;line-height:1.7">' +
          '<div>Authorized PO Value: <strong>' + formatCurrency(po.orderedAmount || activeBill.invoiceAmount) + '</strong></div>' +
          '<div>Order Date: ' + formatDate(po.poDate || '2026-10-15') + '</div>' +
          '<div>Payment Terms: ' + escapeHtml(po.paymentTerms || '30 Days Net') + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="match-pillar">' +
        '<div class="match-pillar-header">' +
          '<span>2. Goods Receipt (GRN)</span>' +
          '<span class="lead-id-badge" style="cursor:pointer" onclick="switchPurView(\'grn-list\')">' + activeBill.linkedGrnId + '</span>' +
        '</div>' +
        '<div style="font-size:.82rem;line-height:1.7">' +
          '<div>Accepted Quantity: <strong style="color:var(--green)">' + grn.totalAccepted + ' Items</strong></div>' +
          '<div>Damaged / Rejected: <strong style="color:var(--red)">' + grn.totalRejected + ' Items</strong></div>' +
          '<div>Receipt Inspected on: ' + formatDate(grn.receivedDate || '2026-11-08') + '</div>' +
        '</div>' +
      '</div>' +

      '<div class="match-pillar">' +
        '<div class="match-pillar-header">' +
          '<span>3. Vendor Tax Invoice</span>' +
          '<span style="font-weight:700;color:var(--blue)">' + escapeHtml(activeBill.invoiceNumber) + '</span>' +
        '</div>' +
        '<div style="font-size:.82rem;line-height:1.7">' +
          '<div>Billed Grand Total: <strong style="color:var(--text-primary);font-size:1.05rem">' + formatCurrency(activeBill.invoiceAmount) + '</strong></div>' +
          '<div>Invoice Date: ' + formatDate(activeBill.invoiceDate) + '</div>' +
          '<div>Due Date: <strong>' + formatDate(activeBill.dueDate) + '</strong></div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- Detailed Line Item Comparison -->' +
    '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header"><h3 class="card-title"><i data-lucide="scale"></i> Line Item Level Reconciliation</h3></div>' +
      '<div class="card-body no-padding">' +
        '<div class="table-responsive">' +
          '<table class="data-table">' +
            '<thead><tr><th>#</th><th>Material Line</th><th>PO Qty & Rate</th><th>GRN Accepted</th><th>Invoiced Billed</th><th style="text-align:right">PO Cost</th><th style="text-align:right">Billed Cost</th><th>Variance</th></tr></thead>' +
            '<tbody>' + lineComparisonsHtml + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- Resolution Audit History -->' +
    '<div class="card">' +
      '<div class="card-header"><h3 class="card-title"><i data-lucide="history"></i> Resolution & Discrepancy Audit Trail</h3></div>' +
      '<div class="card-body">' +
        (auditRows || '<div style="color:var(--text-muted);font-size:.8rem">No resolution transactions recorded yet.</div>') +
      '</div>' +
    '</div>';

  // Bill switcher listeners
  container.querySelectorAll('[data-select-bill]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      renderThreeWayMatch(btn.getAttribute('data-select-bill'));
    });
  });

  // Action: Add explanation
  document.getElementById('btn-match-explanation').onclick = function() {
    openModal({
      title: 'Add Discrepancy Explanation — ' + activeBill.id,
      body:
        '<div class="form-group">' +
          '<label>Clarification / Sourcing Explanation <span class="required">*</span></label>' +
          '<textarea class="form-control" id="modal-match-explanation" placeholder="Record reason for quantity or rate variance…"></textarea>' +
        '</div>',
      confirmText: 'Save Explanation',
      onConfirm: function() {
        var exp = document.getElementById('modal-match-explanation').value.trim();
        if (!exp) return false;

        if (!activeBill.resolutionAudit) activeBill.resolutionAudit = [];
        activeBill.resolutionAudit.push({
          user: 'Neha Kapoor',
          date: formatDateTime(new Date().toISOString()),
          note: exp
        });

        showToast('Explanation added to 3-way match audit log', 'success');
        renderThreeWayMatch(activeBill.id);
        return true;
      }
    });
  };

  // Action: Demand credit note
  document.getElementById('btn-request-credit-note').onclick = function() {
    openModal({
      title: 'Demand Credit Note / Invoice Correction',
      body:
        '<p>Send formal debit notice to <strong>' + escapeHtml(activeBill.vendorName) + '</strong> for invoice <strong>' + escapeHtml(activeBill.invoiceNumber) + '</strong>.</p>' +
        '<div class="form-group" style="margin-top:12px">' +
          '<label>Correction Demand Reason <span class="required">*</span></label>' +
          '<textarea class="form-control" id="modal-credit-reason" placeholder="State difference details to be credited…">' + escapeHtml(activeBill.discrepancyNote) + '</textarea>' +
        '</div>',
      confirmText: 'Issue Debit Note Notice',
      confirmBtnClass: 'btn-danger',
      onConfirm: function() {
        var note = document.getElementById('modal-credit-reason').value.trim();
        if (!note) return false;

        activeBill.matchStatus = 'Under Review';
        activeBill.resolutionAudit.push({
          user: 'Neha Kapoor',
          date: formatDateTime(new Date().toISOString()),
          note: 'Debit note / revision requested: ' + note
        });

        // Add to exceptions
        PURCHASE_EXCEPTIONS.unshift({
          id: purUid('EXC'),
          refId: activeBill.id,
          type: 'Price Difference',
          description: 'Debit note demanded for ' + activeBill.id + ': ' + note,
          severity: 'High',
          responsiblePerson: 'Neha Kapoor',
          date: new Date().toISOString().slice(0, 10),
          status: 'Credit Note Requested',
          resolution: 'Payment blocked until supplier submits revised invoice.',
          auditHistory: [
            { time: formatDateTime(new Date().toISOString()), user: 'Neha Kapoor', action: 'Formal debit note demand sent.' }
          ]
        });

        showToast('Correction notice dispatched. Bill status set to Under Review', 'warning');
        updatePurBadges();
        renderThreeWayMatch(activeBill.id);
        return true;
      }
    });
  };

  // Action: Approve match
  var btnApprove = document.getElementById('btn-approve-match');
  if (btnApprove && !isDiscrepancy) {
    btnApprove.onclick = function() {
      openModal({
        title: 'Approve 3-Way Match — ' + activeBill.id,
        body:
          '<div class="alert alert-success"><i data-lucide="check-circle"></i><div>All items matched. Ready to hand off to Finance module.</div></div>' +
          '<p style="font-size:.82rem;color:var(--text-secondary)">Note: Actual payment processing will be executed by Accounting & Finance when that module is enabled. No funds are disbursed in this prototype.</p>',
        confirmText: 'Confirm Hand-off to Finance',
        onConfirm: function() {
          activeBill.matchStatus = 'Approved for Payment';
          showToast('Bill ' + activeBill.id + ' approved for finance release!', 'success');
          renderThreeWayMatch(activeBill.id);
          return true;
        }
      });
    };
  }

  lucide.createIcons();
}

/* ═══════════════════════════════════════
   SCREEN 15: EXCEPTIONS & AUDIT TRAIL
   ═══════════════════════════════════════ */

function renderExceptionsRegister() {
  var tbody = document.getElementById('exceptions-table-tbody');
  tbody.innerHTML = '';

  var searchInput = document.getElementById('exception-search-input');
  var query = (searchInput ? searchInput.value : '').toLowerCase().trim();

  var list = PURCHASE_EXCEPTIONS.filter(function(exc) {
    if (query) {
      var match = exc.id.toLowerCase().indexOf(query) !== -1 ||
                  exc.refId.toLowerCase().indexOf(query) !== -1 ||
                  exc.type.toLowerCase().indexOf(query) !== -1 ||
                  exc.description.toLowerCase().indexOf(query) !== -1;
      if (!match) return false;
    }
    return true;
  });

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted)">No exceptions recorded.</td></tr>';
    return;
  }

  list.forEach(function(exc) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><span class="lead-id-badge" style="cursor:pointer" data-view-exc="' + exc.id + '">' + escapeHtml(exc.id) + '</span></td>' +
      '<td><span class="lead-id-badge">' + escapeHtml(exc.refId) + '</span></td>' +
      '<td><strong>' + escapeHtml(exc.type) + '</strong></td>' +
      '<td><span class="badge badge-priority-' + exc.severity.toLowerCase() + '">' + exc.severity + '</span></td>' +
      '<td>' + escapeHtml(exc.description) + '</td>' +
      '<td>' + escapeHtml(exc.responsiblePerson) + '</td>' +
      '<td>' + formatDate(exc.date) + '</td>' +
      '<td><span class="badge badge-stage">' + escapeHtml(exc.status) + '</span></td>' +
      '<td style="text-align:right">' +
        '<button class="btn btn-sm btn-outline" data-view-exc="' + exc.id + '"><i data-lucide="eye"></i> Audit</button>' +
      '</td>';

    tr.querySelectorAll('[data-view-exc]').forEach(function(el) {
      el.addEventListener('click', function() {
        openExceptionDetailModal(exc);
      });
    });

    tbody.appendChild(tr);
  });

  if (searchInput && !searchInput._bound) {
    searchInput.addEventListener('input', renderExceptionsRegister);
    searchInput._bound = true;
  }

  updatePurBadges();
  lucide.createIcons();
}

function openExceptionDetailModal(exc) {
  var auditHtml = (exc.auditHistory || []).map(function(a) {
    return '<tr><td>' + escapeHtml(a.time) + '</td><td><strong>' + escapeHtml(a.user) + '</strong></td><td>' + escapeHtml(a.action) + '</td></tr>';
  }).join('');

  var body =
    '<div class="form-grid-3" style="font-size:.82rem;margin-bottom:14px">' +
      '<div><span style="color:var(--text-muted)">Linked Ref:</span> <strong>' + escapeHtml(exc.refId) + '</strong></div>' +
      '<div><span style="color:var(--text-muted)">Issue Category:</span> <strong>' + escapeHtml(exc.type) + '</strong></div>' +
      '<div><span style="color:var(--text-muted)">Severity:</span> <span class="badge badge-priority-' + exc.severity.toLowerCase() + '">' + exc.severity + '</span></div>' +
      '<div><span style="color:var(--text-muted)">Responsible:</span> ' + escapeHtml(exc.responsiblePerson) + '</div>' +
      '<div><span style="color:var(--text-muted)">Date Flagged:</span> ' + formatDate(exc.date) + '</div>' +
      '<div><span style="color:var(--text-muted)">Status:</span> <strong>' + escapeHtml(exc.status) + '</strong></div>' +
    '</div>' +
    '<div style="padding:10px 12px;background:#fef2f2;border-radius:var(--radius);font-size:.82rem;margin-bottom:14px;border:1px solid var(--red-border)">' +
      '<strong>Issue Description:</strong> ' + escapeHtml(exc.description) +
    '</div>' +
    '<div style="padding:10px 12px;background:#f8fafc;border-radius:var(--radius);font-size:.82rem;margin-bottom:16px">' +
      '<strong>Documented Resolution:</strong> ' + escapeHtml(exc.resolution || 'Pending formal supplier response') +
    '</div>' +
    '<h4 style="font-size:.88rem;font-weight:700;margin-bottom:8px">Immutable Audit Log</h4>' +
    '<table class="data-table"><thead><tr><th>Timestamp</th><th>User</th><th>Audit Event</th></tr></thead><tbody>' + auditHtml + '</tbody></table>';

  openModal({
    title: 'Procurement Exception Record — ' + exc.id,
    body: body,
    size: 'lg',
    cancelText: 'Close',
    hideConfirm: true
  });
}
