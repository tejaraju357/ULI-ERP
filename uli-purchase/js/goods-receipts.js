/**
 * ULI Studio ERP — Goods Receipt & Inspection Module (SCREENS 10 & 11)
 * ═════════════════════════════════════════════════════════════════════
 * Handles:
 *  - Screen 10: Goods Receipt Notes (GRN) Register
 *  - Screen 11: Create & Inspect GRN (Strict quantity validation: Accepted + Rejected ≤ Current Received)
 *  - Partial deliveries, damaged goods logging, and automatic exception generation
 */

'use strict';

/* ══════════════════════════════════════════════════
   SCREEN 10: GOODS RECEIPT LIST (GRN)
   ══════════════════════════════════════════════════ */

function renderGrnList() {
  var tbody = document.getElementById('grn-table-tbody');
  tbody.innerHTML = '';

  var searchInput = document.getElementById('grn-search-input');
  var query = (searchInput ? searchInput.value : '').toLowerCase().trim();

  var list = PURCHASE_GRNS.filter(function(g) {
    if (query) {
      var match = g.id.toLowerCase().indexOf(query) !== -1 ||
                  g.poId.toLowerCase().indexOf(query) !== -1 ||
                  g.vendorName.toLowerCase().indexOf(query) !== -1;
      if (!match) return false;
    }
    return true;
  });

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-muted)">No goods receipts logged yet.</td></tr>';
    return;
  }

  list.forEach(function(grn) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><span class="lead-id-badge" style="cursor:pointer" data-view-grn="' + grn.id + '">' + escapeHtml(grn.id) + '</span></td>' +
      '<td><span class="lead-id-badge" style="cursor:pointer" data-view-po="' + grn.poId + '">' + escapeHtml(grn.poId) + '</span></td>' +
      '<td><strong>' + escapeHtml(grn.vendorName) + '</strong></td>' +
      '<td>' + escapeHtml(grn.projectName) + '</td>' +
      '<td>' + formatDate(grn.receivedDate) + '</td>' +
      '<td>' + escapeHtml(grn.receivedBy) + '</td>' +
      '<td><span class="grn-qty-badge grn-qty-accepted">' + grn.totalAccepted + ' pcs</span></td>' +
      '<td><span class="grn-qty-badge ' + (grn.totalRejected > 0 ? 'grn-qty-rejected' : 'grn-qty-ordered') + '">' + grn.totalRejected + ' pcs</span></td>' +
      '<td><span class="badge badge-status-' + grn.status.toLowerCase().replace(/\s+/g,'-') + '">' + grn.status + '</span></td>' +
      '<td style="text-align:right">' +
        '<button class="btn btn-sm btn-outline btn-icon" title="View Inspection Report" data-view-grn="' + grn.id + '"><i data-lucide="eye"></i></button>' +
      '</td>';

    tr.querySelectorAll('[data-view-grn]').forEach(function(el) {
      el.addEventListener('click', function() {
        openGrnInspectionModal(grn);
      });
    });

    tr.querySelector('[data-view-po]').addEventListener('click', function() {
      switchPurView('po-detail', { poId: grn.poId });
    });

    tbody.appendChild(tr);
  });

  var btnNew = document.getElementById('btn-new-grn');
  if (btnNew && !btnNew._bound) {
    btnNew.addEventListener('click', function() {
      switchPurView('create-grn');
    });
    btnNew._bound = true;
  }

  if (searchInput && !searchInput._bound) {
    searchInput.addEventListener('input', renderGrnList);
    searchInput._bound = true;
  }

  updatePurBadges();
  lucide.createIcons();
}

/* ══════════════════════════════════════════════════
   SCREEN 11: CREATE & INSPECT GRN
   ══════════════════════════════════════════════════ */

var grnReceiptItems = [];

function openCreateGrnForm(preselectedPoId) {
  var container = document.getElementById('create-grn-container');

  var eligiblePos = PURCHASE_ORDERS.filter(function(p){
    return p.status === 'Issued' || p.status === 'Partially Received' || p.id === preselectedPoId;
  });

  if (eligiblePos.length === 0) {
    container.innerHTML =
      '<div class="state-message">' +
        '<i data-lucide="package-x" style="color:var(--text-muted)"></i>' +
        '<h4>No open Purchase Orders ready for receiving</h4>' +
        '<p>Please issue an approved Purchase Order before logging goods receipts.</p>' +
        '<button class="btn btn-outline" style="margin-top:12px" onclick="switchPurView(\'purchase-orders\')">View Purchase Orders</button>' +
      '</div>';
    lucide.createIcons();
    return;
  }

  var activePo = preselectedPoId ?
    (PURCHASE_ORDERS.find(function(p){ return p.id === preselectedPoId; }) || eligiblePos[0]) :
    eligiblePos[0];

  var newGrnId = 'GRN-2026-0' + (PURCHASE_GRNS.length + 99);

  var poOptions = eligiblePos.map(function(p) {
    var isSel = p.id === activePo.id;
    return '<option value="' + p.id + '" ' + (isSel ? 'selected' : '') + '>' + p.id + ' — ' + p.vendorName + ' (' + p.projectName + ')</option>';
  }).join('');

  grnReceiptItems = (activePo.items || []).map(function(item) {
    var outstanding = item.qty - (item.receivedQty || 0);
    return {
      poItemId: item.id,
      desc: item.desc,
      orderedQty: item.qty,
      prevReceivedQty: item.receivedQty || 0,
      outstandingQty: outstanding,
      currentReceivedQty: outstanding,
      acceptedQty: outstanding,
      rejectedQty: 0,
      rejectionReason: '',
      remarks: 'Inspected upon arrival at site.'
    };
  });

  container.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<button class="lead-back-btn" id="btn-create-grn-back"><i data-lucide="arrow-left"></i></button>' +
        '<div>' +
          '<h2 style="font-size:1.3rem;font-weight:700;">Receive Goods Note — ' + newGrnId + '</h2>' +
          '<p style="font-size:.8rem;color:var(--text-secondary);">Verify physical delivery, inspect materials, and quarantine damaged items</p>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<button class="btn btn-primary btn-sm" id="btn-submit-grn"><i data-lucide="check-circle-2"></i> Submit Goods Inspection</button>' +
      '</div>' +
    '</div>' +

    '<!-- Header Info Card -->' +
    '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header"><h3 class="card-title"><i data-lucide="file-text"></i> Consignment & Delivery Details</h3></div>' +
      '<div class="card-body">' +
        '<div class="form-grid">' +
          '<div class="form-group">' +
            '<label>Receiving Against Purchase Order <span class="required">*</span></label>' +
            '<select class="form-control" id="grn-select-po">' + poOptions + '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Vendor / Supplier</label>' +
            '<input type="text" class="form-control" id="grn-disp-vendor" value="' + escapeHtml(activePo.vendorName) + '" readonly style="background:#f8fafc">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Project Site Destination</label>' +
            '<input type="text" class="form-control" id="grn-disp-project" value="' + escapeHtml(activePo.projectName) + '" readonly style="background:#f8fafc">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Inspection / Received Date <span class="required">*</span></label>' +
            '<input type="date" class="form-control" id="grn-inp-date" value="' + new Date().toISOString().slice(0,10) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Vendor Delivery Challan / Lorry Receipt No. <span class="required">*</span></label>' +
            '<input type="text" class="form-control" id="grn-inp-dc" placeholder="e.g. DC-77189" value="DC-' + Math.floor(1000 + Math.random()*9000) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Inspected & Received By <span class="required">*</span></label>' +
            '<input type="text" class="form-control" id="grn-inp-receiver" value="Deepak Singh (Site Engineer)">' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- Inspection Table Card -->' +
    '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header">' +
        '<h3 class="card-title"><i data-lucide="package-search"></i> Physical Item Inspection & Quantity Verification</h3>' +
        '<span class="badge badge-stage">Validation Rule: Accepted + Rejected ≤ Current Received</span>' +
      '</div>' +
      '<div class="card-body no-padding">' +
        '<div class="table-responsive">' +
          '<table class="pur-item-table" id="grn-items-table">' +
            '<thead>' +
              '<tr>' +
                '<th style="width:35px">#</th>' +
                '<th>Item Description</th>' +
                '<th style="width:75px;text-align:center">Ordered</th>' +
                '<th style="width:75px;text-align:center">Prev Recv</th>' +
                '<th style="width:75px;text-align:center">Outstanding</th>' +
                '<th style="width:95px;text-align:right">Current Recv</th>' +
                '<th style="width:95px;text-align:right">Accepted Qty</th>' +
                '<th style="width:95px;text-align:right">Rejected Qty</th>' +
                '<th>Inspection Notes & Rejection Reason</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody id="grn-inspection-tbody"></tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- Overall remarks -->' +
    '<div class="card">' +
      '<div class="card-header"><h3 class="card-title"><i data-lucide="clipboard-check"></i> Overall Consignment Remarks & Photos</h3></div>' +
      '<div class="card-body">' +
        '<div class="form-group">' +
          '<label>Inspection Summary / Storage Location</label>' +
          '<textarea class="form-control" id="grn-inp-general-remarks" placeholder="Condition of packaging, unloading notes, storage room allocated on site…">Materials unloaded safely and verified against PO delivery specifications.</textarea>' +
        '</div>' +
        '<div class="alert alert-info" style="font-size:.78rem;margin-bottom:0">' +
          '<i data-lucide="shield-check"></i>' +
          '<div><strong>Inventory Control Rule:</strong> Stock will increment strictly for the <strong>Accepted Quantity</strong>. Rejected quantities are quarantined and automatically routed to the Exceptions register for vendor credit notes or replacements.</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById('btn-create-grn-back').onclick = function() { switchPurView('grn-list'); };

  // Switching PO in select re-populates items
  document.getElementById('grn-select-po').addEventListener('change', function(e) {
    openCreateGrnForm(e.target.value);
  });

  // Submit GRN
  document.getElementById('btn-submit-grn').onclick = function() {
    saveGoodsReceiptNote(newGrnId, activePo);
  };

  renderGrnInspectionRows();
  lucide.createIcons();
}

function renderGrnInspectionRows() {
  var tbody = document.getElementById('grn-inspection-tbody');
  tbody.innerHTML = '';

  grnReceiptItems.forEach(function(item, idx) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td style="text-align:center;color:var(--text-muted)">' + (idx + 1) + '</td>' +
      '<td><strong>' + escapeHtml(item.desc) + '</strong></td>' +
      '<td style="text-align:center"><span class="grn-qty-badge grn-qty-ordered">' + item.orderedQty + '</span></td>' +
      '<td style="text-align:center">' + item.prevReceivedQty + '</td>' +
      '<td style="text-align:center"><span class="grn-qty-badge grn-qty-outstanding">' + item.outstandingQty + '</span></td>' +
      '<td><input type="number" class="pur-input pur-num grn-cur-recv" min="0" max="' + item.outstandingQty + '" value="' + item.currentReceivedQty + '"></td>' +
      '<td><input type="number" class="pur-input pur-num grn-acc" min="0" value="' + item.acceptedQty + '" style="border-color:var(--green)"></td>' +
      '<td><input type="number" class="pur-input pur-num grn-rej" min="0" value="' + item.rejectedQty + '" style="border-color:var(--red)"></td>' +
      '<td><input type="text" class="pur-input grn-notes" placeholder="Condition notes / reason if rejected" value="' + escapeHtml(item.remarks) + '"></td>';

    var curRecvInput = tr.querySelector('.grn-cur-recv');
    var accInput = tr.querySelector('.grn-acc');
    var rejInput = tr.querySelector('.grn-rej');
    var notesInput = tr.querySelector('.grn-notes');

    function validateQuantities() {
      var cur = parseFloat(curRecvInput.value) || 0;
      var acc = parseFloat(accInput.value) || 0;
      var rej = parseFloat(rejInput.value) || 0;

      // Rule: Accepted + Rejected must not exceed Current Received
      if (acc + rej > cur) {
        tr.style.background = '#fef2f2';
        accInput.style.borderColor = 'var(--red)';
        rejInput.style.borderColor = 'var(--red)';
      } else {
        tr.style.background = '';
        accInput.style.borderColor = 'var(--green)';
        rejInput.style.borderColor = rej > 0 ? 'var(--red)' : 'var(--card-border)';
      }

      item.currentReceivedQty = cur;
      item.acceptedQty = acc;
      item.rejectedQty = rej;
      item.remarks = notesInput.value.trim();
    }

    [curRecvInput, accInput, rejInput, notesInput].forEach(function(inp) {
      inp.addEventListener('input', validateQuantities);
    });

    tbody.appendChild(tr);
  });

  lucide.createIcons();
}

function saveGoodsReceiptNote(newGrnId, activePo) {
  var dcNumber = document.getElementById('grn-inp-dc').value.trim();
  var receiver = document.getElementById('grn-inp-receiver').value.trim();
  var recvDate = document.getElementById('grn-inp-date').value;
  var generalRemarks = document.getElementById('grn-inp-general-remarks').value.trim();

  if (!dcNumber || !receiver) {
    showToast('Please provide delivery challan number and inspector name', 'error');
    return;
  }

  // Enforce validation: Accepted + Rejected <= Current Received across all lines
  var hasInvalidQty = false;
  var totalAccepted = 0;
  var totalRejected = 0;

  grnReceiptItems.forEach(function(item) {
    if (item.acceptedQty + item.rejectedQty > item.currentReceivedQty) {
      hasInvalidQty = true;
    }
    totalAccepted += item.acceptedQty;
    totalRejected += item.rejectedQty;
  });

  if (hasInvalidQty) {
    showToast('Validation Error: Accepted + Rejected quantity cannot exceed Current Received quantity on line items!', 'error');
    return;
  }

  var overallStatus = totalRejected > 0 ? (totalAccepted > 0 ? 'Partially Rejected' : 'Rejected') : 'Accepted';

  var newGrn = {
    id: newGrnId,
    poId: activePo.id,
    vendorId: activePo.vendorId,
    vendorName: activePo.vendorName,
    projectId: activePo.projectId,
    projectName: activePo.projectName,
    receivedDate: recvDate,
    receivedBy: receiver,
    status: overallStatus,
    deliveryChallanNumber: dcNumber,
    carrierName: 'Consignment Carrier',
    vehicleNumber: 'Site Vehicle Gate In',
    generalRemarks: generalRemarks,
    items: JSON.parse(JSON.stringify(grnReceiptItems)),
    totalAccepted: totalAccepted,
    totalRejected: totalRejected
  };

  PURCHASE_GRNS.unshift(newGrn);

  // Update Parent PO items receivedQty & status
  var totalOrderedAll = 0;
  var totalReceivedAll = 0;

  activePo.items.forEach(function(poItem) {
    var matchItem = grnReceiptItems.find(function(it){ return it.poItemId === poItem.id; });
    if (matchItem) {
      poItem.receivedQty = (poItem.receivedQty || 0) + matchItem.acceptedQty;
    }
    totalOrderedAll += poItem.qty;
    totalReceivedAll += poItem.receivedQty || 0;
  });

  if (totalReceivedAll >= totalOrderedAll) {
    activePo.status = 'Fully Received';
  } else if (totalReceivedAll > 0) {
    activePo.status = 'Partially Received';
  }

  if (!activePo.linkedGrns) activePo.linkedGrns = [];
  activePo.linkedGrns.push(newGrnId);

  // Log activity
  PURCHASE_ACTIVITIES.unshift({
    id: purUid('ACT'),
    user: receiver,
    action: 'received goods against PO',
    detail: newGrnId + ' for ' + activePo.id + ' (' + totalAccepted + ' accepted, ' + totalRejected + ' rejected)',
    timestamp: new Date().toISOString(),
    type: 'grn'
  });

  // If damaged/rejected goods, log Exception
  if (totalRejected > 0) {
    PURCHASE_EXCEPTIONS.unshift({
      id: purUid('EXC'),
      refId: newGrnId,
      type: 'Damaged Goods',
      description: totalRejected + ' items rejected during inspection for ' + activePo.vendorName + ' (' + activePo.id + ')',
      severity: 'High',
      responsiblePerson: receiver,
      date: recvDate,
      status: 'Under Investigation',
      resolution: 'Quarantine tag applied. Credit note or warranty replacement demanded from vendor.',
      auditHistory: [
        { time: formatDateTime(new Date().toISOString()), user: receiver, action: 'Rejection logged during GRN creation.' }
      ]
    });
    showToast('GRN ' + newGrnId + ' logged with ' + totalRejected + ' rejected items (Exception created)', 'warning');
  } else {
    showToast('GRN ' + newGrnId + ' approved and accepted 100%!', 'success');
  }

  updatePurBadges();
  switchPurView('grn-list');
}

/* ── Modal to View GRN Inspection Report ── */
function openGrnInspectionModal(grn) {
  var rows = grn.items.map(function(item, idx) {
    return '<tr>' +
      '<td>' + (idx + 1) + '</td>' +
      '<td><strong>' + escapeHtml(item.desc) + '</strong></td>' +
      '<td style="text-align:center">' + item.orderedQty + '</td>' +
      '<td style="text-align:center">' + item.currentReceivedQty + '</td>' +
      '<td style="text-align:center;font-weight:700;color:var(--green)">' + item.acceptedQty + '</td>' +
      '<td style="text-align:center;font-weight:700;color:var(--red)">' + item.rejectedQty + '</td>' +
      '<td>' + escapeHtml(item.remarks || item.rejectionReason || '—') + '</td>' +
    '</tr>';
  }).join('');

  var body =
    '<div class="form-grid-3" style="font-size:.82rem;margin-bottom:16px">' +
      '<div><span style="color:var(--text-muted)">PO Reference:</span> <strong>' + escapeHtml(grn.poId) + '</strong></div>' +
      '<div><span style="color:var(--text-muted)">Supplier:</span> <strong>' + escapeHtml(grn.vendorName) + '</strong></div>' +
      '<div><span style="color:var(--text-muted)">Project:</span> <strong>' + escapeHtml(grn.projectName) + '</strong></div>' +
      '<div><span style="color:var(--text-muted)">Challan No:</span> <strong>' + escapeHtml(grn.deliveryChallanNumber) + '</strong></div>' +
      '<div><span style="color:var(--text-muted)">Inspected By:</span> <strong>' + escapeHtml(grn.receivedBy) + '</strong></div>' +
      '<div><span style="color:var(--text-muted)">Received Date:</span> <strong>' + formatDate(grn.receivedDate) + '</strong></div>' +
    '</div>' +
    '<table class="data-table" style="margin-bottom:14px">' +
      '<thead><tr><th>#</th><th>Material</th><th>Ordered</th><th>Received</th><th>Accepted</th><th>Rejected</th><th>Remarks</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>' +
    '<div style="padding:10px 12px;background:#f8fafc;border-radius:var(--radius);font-size:.8rem">' +
      '<strong>Overall Inspector Remarks:</strong> ' + escapeHtml(grn.generalRemarks || 'None') +
    '</div>';

  openModal({
    title: 'Goods Receipt Inspection — ' + grn.id,
    body: body,
    size: 'lg',
    cancelText: 'Close',
    hideConfirm: true
  });
}
