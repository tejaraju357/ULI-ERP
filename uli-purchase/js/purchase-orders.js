/**
 * ULI Studio ERP — Purchase Orders Module (SCREENS 7, 8, 9)
 * ════════════════════════════════════════════════════════
 * Handles:
 *  - Screen 7: Purchase Orders Register (Search, Filters, Status Tracking)
 *  - Screen 8: Create Purchase Order (Auto-population from Approved PR, BOQ calculation)
 *  - Screen 9: PO Detail Workspace (Partial receipts tracking, Amendments history, Issue PO)
 */

'use strict';

var PoListState = {
  searchQuery: '',
  statusFilter: 'all'
};

/* ══════════════════════════════════════════════════
   SCREEN 7: PURCHASE ORDERS LIST
   ══════════════════════════════════════════════════ */

function initPoListFilters() {
  var statusSelect = document.getElementById('po-status-filter');
  var searchInput = document.getElementById('po-search-input');

  if (statusSelect && statusSelect.options.length <= 1) {
    PO_STATUSES.forEach(function(st) {
      var opt = document.createElement('option');
      opt.value = st;
      opt.textContent = st;
      statusSelect.appendChild(opt);
    });
  }

  if (statusSelect && !statusSelect._bound) {
    statusSelect.addEventListener('change', function(e) {
      PoListState.statusFilter = e.target.value;
      renderPurchaseOrdersList();
    });
    statusSelect._bound = true;
  }

  if (searchInput && !searchInput._bound) {
    searchInput.addEventListener('input', function(e) {
      PoListState.searchQuery = e.target.value;
      renderPurchaseOrdersList();
    });
    searchInput._bound = true;
  }

  var btnCreate = document.getElementById('btn-create-po-view');
  if (btnCreate && !btnCreate._bound) {
    btnCreate.addEventListener('click', function() {
      switchPurView('create-po');
    });
    btnCreate._bound = true;
  }
}

function renderPurchaseOrdersList() {
  initPoListFilters();

  var tbody = document.getElementById('po-table-tbody');
  tbody.innerHTML = '';

  var list = PURCHASE_ORDERS.filter(function(po) {
    if (PoListState.statusFilter !== 'all' && po.status !== PoListState.statusFilter) return false;
    if (PoListState.searchQuery) {
      var q = PoListState.searchQuery.toLowerCase();
      var match = po.id.toLowerCase().indexOf(q) !== -1 ||
                  po.vendorName.toLowerCase().indexOf(q) !== -1 ||
                  po.projectName.toLowerCase().indexOf(q) !== -1;
      if (!match) return false;
    }
    return true;
  });

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted)">No purchase orders found matching criteria.</td></tr>';
    return;
  }

  list.forEach(function(po) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><span class="lead-id-badge" style="cursor:pointer" data-view-po="' + po.id + '">' + escapeHtml(po.id) + '</span></td>' +
      '<td><strong>' + escapeHtml(po.vendorName) + '</strong></td>' +
      '<td>' + escapeHtml(po.projectName) + '</td>' +
      '<td>' + formatDate(po.poDate) + '</td>' +
      '<td>' + formatDate(po.expectedDeliveryDate) + '</td>' +
      '<td><strong style="color:var(--text-primary)">' + formatCurrency(po.orderedAmount) + '</strong></td>' +
      '<td>' + formatCurrency(po.receivedAmount) + '</td>' +
      '<td><span class="badge badge-status-' + po.status.toLowerCase().replace(/\s+/g,'-') + '">' + po.status + '</span></td>' +
      '<td style="text-align:right">' +
        '<div class="table-actions" style="justify-content:flex-end">' +
          '<button class="btn btn-sm btn-outline btn-icon" title="View PO Details" data-view-po="' + po.id + '"><i data-lucide="eye"></i></button>' +
          (po.status === 'Issued' || po.status === 'Partially Received' ?
            '<button class="btn btn-sm btn-primary btn-sm" title="Receive Goods" data-grn-po="' + po.id + '"><i data-lucide="package-check"></i> GRN</button>' : '') +
        '</div>' +
      '</td>';

    tr.querySelectorAll('[data-view-po]').forEach(function(el) {
      el.addEventListener('click', function() {
        switchPurView('po-detail', { poId: po.id });
      });
    });

    var btnGrn = tr.querySelector('[data-grn-po]');
    if (btnGrn) {
      btnGrn.addEventListener('click', function() {
        switchPurView('create-grn', { poId: po.id });
      });
    }

    tbody.appendChild(tr);
  });

  updatePurBadges();
  lucide.createIcons();
}

/* ═══════════════════════════════════════
   SCREEN 8: CREATE PURCHASE ORDER
   ═══════════════════════════════════════ */

var currentPoItems = [];

function openCreatePoForm(linkedPrId) {
  var container = document.getElementById('create-po-form-container');

  var newPoId = 'PO-2026-0' + (PURCHASE_ORDERS.length + 175);
  var linkedPr = linkedPrId ? PURCHASE_REQUISITIONS.find(function(p){ return p.id === linkedPrId; }) : null;

  var approvedPrs = PURCHASE_REQUISITIONS.filter(function(p){ return p.status === 'Approved' || p.id === linkedPrId; });
  var prOptions = '<option value="">-- Direct PO (Exception / Without PR) --</option>' +
    approvedPrs.map(function(p) {
      var isSel = linkedPr && linkedPr.id === p.id;
      return '<option value="' + p.id + '" ' + (isSel ? 'selected' : '') + '>' + p.id + ' — ' + p.projectName + ' (' + formatCurrency(p.estimatedAmount) + ')</option>';
    }).join('');

  var vendorOptions = PURCHASE_VENDORS.map(function(v) {
    var isSel = linkedPr && linkedPr.preferredVendorId === v.id;
    return '<option value="' + v.id + '" ' + (isSel ? 'selected' : '') + '>' + v.name + ' (' + v.category + ')</option>';
  }).join('');

  var projectOptions = PURCHASE_PROJECTS.map(function(p) {
    var isSel = linkedPr && linkedPr.projectId === p.id;
    return '<option value="' + p.id + '" ' + (isSel ? 'selected' : '') + '>' + p.name + '</option>';
  }).join('');

  if (linkedPr && linkedPr.items) {
    currentPoItems = linkedPr.items.map(function(it) {
      return {
        desc: it.name + (it.spec ? ' — ' + it.spec : ''),
        unit: it.unit || 'sqft',
        qty: it.qty || 1,
        rate: it.rate || 1000,
        discount: 5,
        taxPct: 18,
        total: 0
      };
    });
  } else {
    currentPoItems = [
      { desc: 'Calacatta Gold Italian Marble Slabs 20mm', unit: 'sqft', qty: 2400, rate: 1850, discount: 5, taxPct: 18, total: 4977840 }
    ];
  }

  container.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<button class="lead-back-btn" id="btn-create-po-back"><i data-lucide="arrow-left"></i></button>' +
        '<div>' +
          '<h2 style="font-size:1.3rem;font-weight:700;">Generate Purchase Order — ' + newPoId + '</h2>' +
          '<p style="font-size:.8rem;color:var(--text-secondary);">Issue formal contractual procurement order to selected supplier</p>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<button class="btn btn-outline btn-sm" id="btn-po-save-draft"><i data-lucide="save"></i> Save Draft</button>' +
        '<button class="btn btn-primary btn-sm" id="btn-po-issue"><i data-lucide="send"></i> Approve & Issue PO</button>' +
      '</div>' +
    '</div>' +

    '<!-- Meta Header Form -->' +
    '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header"><h3 class="card-title"><i data-lucide="file-text"></i> PO Order & Shipping Terms</h3></div>' +
      '<div class="card-body">' +
        '<div class="form-grid">' +
          '<div class="form-group">' +
            '<label>Linked Approved Requisition</label>' +
            '<select class="form-control" id="po-inp-linked-pr">' + prOptions + '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Vendor / Supplier <span class="required">*</span></label>' +
            '<select class="form-control" id="po-inp-vendor">' + vendorOptions + '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Project Allocation <span class="required">*</span></label>' +
            '<select class="form-control" id="po-inp-project">' + projectOptions + '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Expected Delivery Date <span class="required">*</span></label>' +
            '<input type="date" class="form-control" id="po-inp-del-date" value="' + new Date(Date.now()+14*86400000).toISOString().slice(0,10) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Site Delivery Address <span class="required">*</span></label>' +
            '<input type="text" class="form-control" id="po-inp-del-addr" value="' + (linkedPr ? escapeHtml(linkedPr.siteLocation) : 'Worli Sea Face, Penthouse Tower, Mumbai') + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Payment & Commercial Terms <span class="required">*</span></label>' +
            '<input type="text" class="form-control" id="po-inp-terms" value="30 Days Net from GRN inspection clearance">' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- PO Items Table Card -->' +
    '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header">' +
        '<h3 class="card-title"><i data-lucide="package"></i> Order Line Items</h3>' +
        '<button class="btn btn-primary btn-sm" id="btn-po-add-row"><i data-lucide="plus"></i> Add Line</button>' +
      '</div>' +
      '<div class="card-body no-padding">' +
        '<div class="table-responsive">' +
          '<table class="pur-item-table" id="po-builder-items-table">' +
            '<thead>' +
              '<tr>' +
                '<th style="width:35px">#</th>' +
                '<th>Item Description</th>' +
                '<th style="width:85px">Unit</th>' +
                '<th style="width:90px;text-align:right">Qty</th>' +
                '<th style="width:110px;text-align:right">Rate (₹)</th>' +
                '<th style="width:80px;text-align:right">Disc %</th>' +
                '<th style="width:90px;text-align:right">GST %</th>' +
                '<th style="width:120px;text-align:right">Line Total (₹)</th>' +
                '<th style="width:40px"></th>' +
              '</tr>' +
            '</thead>' +
            '<tbody id="po-builder-tbody"></tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- Summary Calculation Card -->' +
    '<div class="crm-dash-grid">' +
      '<div class="card">' +
        '<div class="card-header"><h3 class="card-title"><i data-lucide="truck"></i> Logistics & Shipping Charges</h3></div>' +
        '<div class="card-body">' +
          '<div class="form-group">' +
            '<label>Freight / Transit Insurance Surcharge (₹)</label>' +
            '<input type="number" class="form-control" id="po-inp-shipping" value="8500" min="0">' +
          '</div>' +
          '<div class="alert alert-info" style="font-size:.78rem;margin-bottom:0">' +
            '<i data-lucide="info"></i>' +
            '<div><strong>Governance Notice:</strong> Creating a Purchase Order commits budget but does <em>not</em> increase warehouse stock. Inventory increments only occur upon formal GRN physical acceptance.</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="pur-summary-card">' +
        '<h4 style="font-size:.9rem;font-weight:700;margin-bottom:12px;border-bottom:1px solid var(--card-border);padding-bottom:8px">Purchase Order Total</h4>' +
        '<div class="pur-summary-row"><span>Gross Subtotal:</span><strong id="po-sum-subtotal">₹0</strong></div>' +
        '<div class="pur-summary-row"><span>Discounts:</span><span style="color:var(--red)" id="po-sum-discount">-₹0</span></div>' +
        '<div class="pur-summary-row"><span>GST Amount:</span><span id="po-sum-tax">₹0</span></div>' +
        '<div class="pur-summary-row"><span>Shipping / Freight:</span><span id="po-sum-shipping">₹8,500</span></div>' +
        '<div class="pur-summary-row grand-total"><span>Grand Total:</span><span style="color:var(--blue)" id="po-sum-grand-total">₹0</span></div>' +
      '</div>' +
    '</div>';

  document.getElementById('btn-create-po-back').onclick = function() { switchPurView('purchase-orders'); };

  // Add line item row
  document.getElementById('btn-po-add-row').onclick = function() {
    currentPoItems.push({ desc: 'New Custom Material', unit: 'nos', qty: 10, rate: 500, discount: 0, taxPct: 18, total: 5900 });
    renderPoBuilderRows();
  };

  // Shipping change
  document.getElementById('po-inp-shipping').addEventListener('input', recalculatePoTotals);

  // Save buttons
  document.getElementById('btn-po-save-draft').onclick = function() {
    savePurchaseOrder('Draft', newPoId, linkedPrId);
  };
  document.getElementById('btn-po-issue').onclick = function() {
    savePurchaseOrder('Issued', newPoId, linkedPrId);
  };

  renderPoBuilderRows();
  lucide.createIcons();
}

function renderPoBuilderRows() {
  var tbody = document.getElementById('po-builder-tbody');
  tbody.innerHTML = '';

  currentPoItems.forEach(function(item, idx) {
    var gross = (item.qty || 0) * (item.rate || 0);
    var discAmt = gross * ((item.discount || 0) / 100);
    var taxable = gross - discAmt;
    var taxAmt = taxable * ((item.taxPct || 18) / 100);
    item.total = taxable + taxAmt;

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td style="text-align:center;color:var(--text-muted)">' + (idx + 1) + '</td>' +
      '<td><input type="text" class="pur-input po-desc" value="' + escapeHtml(item.desc) + '"></td>' +
      '<td><input type="text" class="pur-input po-unit" value="' + escapeHtml(item.unit) + '"></td>' +
      '<td><input type="number" class="pur-input pur-num po-qty" min="1" value="' + item.qty + '"></td>' +
      '<td><input type="number" class="pur-input pur-num po-rate" min="0" value="' + item.rate + '"></td>' +
      '<td><input type="number" class="pur-input pur-num po-disc" min="0" max="100" value="' + (item.discount||0) + '"></td>' +
      '<td><input type="number" class="pur-input pur-num po-tax" min="0" max="28" value="' + (item.taxPct||18) + '"></td>' +
      '<td style="text-align:right;font-weight:700" class="po-row-total">' + formatCurrency(item.total) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-outline btn-icon" style="color:var(--red)"><i data-lucide="trash-2"></i></button></td>';

    function updateRow() {
      item.desc = tr.querySelector('.po-desc').value;
      item.unit = tr.querySelector('.po-unit').value;
      item.qty = parseFloat(tr.querySelector('.po-qty').value) || 0;
      item.rate = parseFloat(tr.querySelector('.po-rate').value) || 0;
      item.discount = parseFloat(tr.querySelector('.po-disc').value) || 0;
      item.taxPct = parseFloat(tr.querySelector('.po-tax').value) || 18;

      var g = item.qty * item.rate;
      var d = g * (item.discount / 100);
      var t = g - d;
      item.total = t + (t * (item.taxPct / 100));
      tr.querySelector('.po-row-total').textContent = formatCurrency(item.total);
      recalculatePoTotals();
    }

    tr.querySelectorAll('input').forEach(function(el) {
      el.addEventListener('input', updateRow);
    });

    tr.querySelector('button').addEventListener('click', function() {
      currentPoItems.splice(idx, 1);
      renderPoBuilderRows();
    });

    tbody.appendChild(tr);
  });

  recalculatePoTotals();
  lucide.createIcons();
}

function recalculatePoTotals() {
  var subtotal = 0, totalDisc = 0, totalTax = 0, grandTotal = 0;
  var shipping = parseFloat((document.getElementById('po-inp-shipping')||{}).value) || 0;

  currentPoItems.forEach(function(item) {
    var g = (item.qty || 0) * (item.rate || 0);
    var d = g * ((item.discount || 0) / 100);
    var taxable = g - d;
    var tax = taxable * ((item.taxPct || 18) / 100);

    subtotal += g;
    totalDisc += d;
    totalTax += tax;
  });

  grandTotal = (subtotal - totalDisc) + totalTax + shipping;

  document.getElementById('po-sum-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('po-sum-discount').textContent = '- ' + formatCurrency(totalDisc);
  document.getElementById('po-sum-tax').textContent = formatCurrency(totalTax);
  document.getElementById('po-sum-shipping').textContent = formatCurrency(shipping);
  document.getElementById('po-sum-grand-total').textContent = formatCurrency(grandTotal);
}

function savePurchaseOrder(status, poId, linkedPrId) {
  var vndId = document.getElementById('po-inp-vendor').value;
  var vndObj = PURCHASE_VENDORS.find(function(v){ return v.id === vndId; });
  var projId = document.getElementById('po-inp-project').value;
  var projObj = PURCHASE_PROJECTS.find(function(p){ return p.id === projId; });
  var delDate = document.getElementById('po-inp-del-date').value;
  var delAddr = document.getElementById('po-inp-del-addr').value;
  var terms = document.getElementById('po-inp-terms').value;
  var shipping = parseFloat(document.getElementById('po-inp-shipping').value) || 0;

  var subtotal = 0, totalDisc = 0, totalTax = 0, grandTotal = 0;
  var formattedItems = currentPoItems.map(function(item, idx) {
    var g = item.qty * item.rate;
    var d = g * (item.discount / 100);
    var taxable = g - d;
    var tax = taxable * (item.taxPct / 100);
    subtotal += g; totalDisc += d; totalTax += tax;

    return {
      id: idx + 1,
      desc: item.desc,
      unit: item.unit,
      qty: item.qty,
      receivedQty: 0,
      rate: item.rate,
      discount: item.discount,
      taxPct: item.taxPct,
      total: taxable + tax
    };
  });

  grandTotal = (subtotal - totalDisc) + totalTax + shipping;

  var newPo = {
    id: poId,
    linkedPrId: linkedPrId || null,
    vendorId: vndId,
    vendorName: vndObj ? vndObj.name : 'Selected Supplier',
    projectId: projId,
    projectName: projObj ? projObj.name : 'Interior Project',
    poDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: delDate,
    deliveryAddress: delAddr,
    billingAddress: 'ULI Studio Pvt Ltd, Andheri East, Mumbai 400069',
    paymentTerms: terms,
    status: status,
    orderedAmount: grandTotal,
    receivedAmount: 0,
    items: formattedItems,
    shippingCharges: shipping,
    subtotal: subtotal,
    discountAmount: totalDisc,
    taxAmount: totalTax,
    grandTotal: grandTotal,
    approvalHistory: [
      { step: 'PO Created & ' + status, user: 'Neha Kapoor', date: formatDateTime(new Date().toISOString()) }
    ],
    amendments: [],
    linkedGrns: []
  };

  PURCHASE_ORDERS.unshift(newPo);

  // Update linked PR status to PO Created
  if (linkedPrId) {
    var pr = PURCHASE_REQUISITIONS.find(function(p){ return p.id === linkedPrId; });
    if (pr) pr.status = 'PO Created';
  }

  PURCHASE_ACTIVITIES.unshift({
    id: purUid('ACT'),
    user: 'Neha Kapoor',
    action: status === 'Issued' ? 'issued purchase order' : 'drafted purchase order',
    detail: newPo.id + ' to ' + newPo.vendorName + ' (' + formatCurrency(grandTotal) + ')',
    timestamp: new Date().toISOString(),
    type: 'po'
  });

  showToast('Purchase Order ' + newPo.id + ' ' + (status === 'Issued' ? 'issued to supplier!' : 'saved as Draft'), 'success');
  updatePurBadges();
  switchPurView('po-detail', { poId: newPo.id });
}

/* ═══════════════════════════════════════
   SCREEN 9: PURCHASE ORDER DETAIL & AMENDMENTS
   ═══════════════════════════════════════ */

function openPoDetail(poId) {
  PurApp.selectedPoId = poId;
  var container = document.getElementById('po-detail-container');
  var po = PURCHASE_ORDERS.find(function(p){ return p.id === poId; });

  if (!po) {
    container.innerHTML = '<div class="state-message"><h4>PO not found</h4><button class="btn btn-outline" onclick="switchPurView(\'purchase-orders\')">Back to POs</button></div>';
    return;
  }

  var vendor = getVendor(po.vendorId);

  var itemsHtml = (po.items || []).map(function(it, idx) {
    var outstanding = it.qty - (it.receivedQty || 0);
    var pctRecv = Math.round(((it.receivedQty || 0) / it.qty) * 100);

    return '<tr>' +
      '<td style="text-align:center">' + (idx + 1) + '</td>' +
      '<td><strong>' + escapeHtml(it.desc) + '</strong></td>' +
      '<td>' + it.qty + ' ' + it.unit + '</td>' +
      '<td style="font-weight:600;color:var(--green)">' + (it.receivedQty || 0) + '</td>' +
      '<td style="font-weight:700;color:var(--blue)">' + outstanding + '</td>' +
      '<td>' +
        '<div style="width:100px;background:#e2e8f0;height:6px;border-radius:999px;overflow:hidden;margin-bottom:2px">' +
          '<div style="width:' + pctRecv + '%;background:var(--green);height:100%"></div>' +
        '</div>' +
        '<span style="font-size:.7rem;color:var(--text-muted)">' + pctRecv + '% delivered</span>' +
      '</td>' +
      '<td style="text-align:right">₹' + it.rate.toLocaleString('en-IN') + '</td>' +
      '<td style="text-align:right;font-weight:700">' + formatCurrency(it.total) + '</td>' +
    '</tr>';
  }).join('');

  var amendmentsHtml = (po.amendments || []).map(function(am) {
    return '<tr>' +
      '<td><span class="badge badge-stage">' + escapeHtml(am.version) + '</span></td>' +
      '<td>' + escapeHtml(am.date) + '</td>' +
      '<td>' + escapeHtml(am.changedBy) + '</td>' +
      '<td>' + escapeHtml(am.reason) + '</td>' +
    '</tr>';
  }).join('');

  var clientChangeHtml = '';
  var linkedCr = po.clientChangeRef ? (typeof PURCHASE_CLIENT_CHANGES !== 'undefined' ? PURCHASE_CLIENT_CHANGES.find(function(c){ return c.id === po.clientChangeRef; }) : null) : null;
  if (linkedCr) {
    clientChangeHtml =
      '<!-- Client Scope Variation Order Card -->' +
      '<div class="card" style="margin-bottom:20px;border-left:4px solid #2563eb;background:linear-gradient(to right, #eff6ff, #ffffff);">' +
        '<div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#dbeafe;color:#2563eb;"><i data-lucide="sparkles" style="width:18px;height:18px;"></i></span>' +
            '<div>' +
              '<h3 class="card-title" style="margin:0;font-size:.92rem;color:#1e40af;">Contract Amendment Driven by Client Variation: ' + escapeHtml(linkedCr.id) + ' (' + escapeHtml(linkedCr.variationCode) + ')</h3>' +
              '<div style="font-size:.75rem;color:#3b82f6;margin-top:2px;">Client: <strong>' + escapeHtml(linkedCr.clientName) + '</strong> (' + escapeHtml(linkedCr.clientPhone) + ') · Signed Order: <strong>' + escapeHtml(linkedCr.clientApprovalRef) + '</strong></div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span class="badge" style="background:#dbeafe;color:#1e40af;font-weight:700;">Cost Variance: ' + escapeHtml(linkedCr.costImpactFormatted) + '</span>' +
            '<button class="btn btn-sm btn-outline" data-view-po-cr-btn="' + linkedCr.id + '"><i data-lucide="eye"></i> Full Client History</button>' +
          '</div>' +
        '</div>' +
        '<div class="card-body" style="padding-top:4px;font-size:.82rem;">' +
          '<div style="background:#fff;border:1px solid #bfdbfe;border-radius:var(--radius);padding:10px 14px;margin-bottom:12px;">' +
            '<strong style="color:#1e3a8a;"><i data-lucide="message-square" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Client Stated Instructions:</strong>' +
            '<div style="color:#1e40af;font-style:italic;margin-top:3px;line-height:1.4;">“' + escapeHtml(linkedCr.clientStatedRequest) + '”</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
            '<div style="padding:10px 12px;background:#f8fafc;border-radius:var(--radius);border:1px solid #e2e8f0;">' +
              '<span style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Contract Baseline Scope</span>' +
              '<div style="font-size:.78rem;color:var(--text-secondary);margin-top:2px;">' + escapeHtml(linkedCr.originalScope) + '</div>' +
            '</div>' +
            '<div style="padding:10px 12px;background:#eff6ff;border-radius:var(--radius);border:1px solid #bfdbfe;">' +
              '<span style="font-size:.72rem;color:#2563eb;text-transform:uppercase;font-weight:700;">Amended Scope in PO (' + (po.amendments.length > 0 ? po.amendments[0].version : 'v1.1') + ')</span>' +
              '<div style="font-size:.78rem;color:#1e40af;font-weight:600;margin-top:2px;">' + escapeHtml(linkedCr.revisedScope) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  container.innerHTML =
    '<!-- Header Card -->' +
    '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header">' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<button class="lead-back-btn" id="btn-po-detail-back"><i data-lucide="arrow-left"></i></button>' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:8px">' +
              '<span class="lead-id-badge" style="font-size:1.05rem">' + escapeHtml(po.id) + '</span>' +
              '<span class="badge badge-status-' + po.status.toLowerCase().replace(/\s+/g,'-') + '">' + po.status + '</span>' +
              (po.linkedPrId ? '<span class="badge badge-stage">From ' + po.linkedPrId + '</span>' : '') +
              (po.amendments.length > 0 ? '<span class="badge badge-priority-medium">' + po.amendments[po.amendments.length - 1].version + '</span>' : '') +
            '</div>' +
            '<h2 style="font-size:1.3rem;font-weight:700;margin-top:2px;">' + escapeHtml(po.vendorName) + '</h2>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          '<button class="btn btn-outline btn-sm" onclick="window.print()"><i data-lucide="printer"></i> Print PO</button>' +
          '<button class="btn btn-outline btn-sm" id="btn-amend-po"><i data-lucide="git-branch"></i> Amend PO</button>' +
          (po.status === 'Issued' || po.status === 'Partially Received' ?
            '<button class="btn btn-primary btn-sm" id="btn-po-receive-goods"><i data-lucide="package-check"></i> Receive Goods (GRN)</button>' : '') +
        '</div>' +
      '</div>' +

      '<div class="card-body">' +
        '<div class="form-grid-3" style="font-size:.83rem">' +
          '<div><span style="color:var(--text-muted)">Project:</span> <strong>' + escapeHtml(po.projectName) + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">Delivery Address:</span> <strong>' + escapeHtml(po.deliveryAddress) + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">Order Date:</span> <strong>' + formatDate(po.poDate) + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">Expected Delivery:</span> <strong>' + formatDate(po.expectedDeliveryDate) + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">Payment Terms:</span> <strong>' + escapeHtml(po.paymentTerms) + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">PO Grand Total:</span> <strong style="color:var(--blue);font-size:1.1rem">' + formatCurrency(po.orderedAmount) + '</strong></div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    clientChangeHtml +

    '<!-- Items & Partial Delivery Progress -->' +
    '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header"><h3 class="card-title"><i data-lucide="truck"></i> Ordered Line Items & Partial Delivery Tracking</h3></div>' +
      '<div class="card-body no-padding">' +
        '<div class="table-responsive">' +
          '<table class="data-table">' +
            '<thead><tr><th>#</th><th>Item Description</th><th>Ordered</th><th>Received</th><th>Outstanding</th><th>Progress</th><th style="text-align:right">Rate</th><th style="text-align:right">Total</th></tr></thead>' +
            '<tbody>' + itemsHtml + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- Amendments & Linked GRNs -->' +
    '<div class="crm-dash-grid">' +
      '<div class="card">' +
        '<div class="card-header"><h3 class="card-title"><i data-lucide="git-commit"></i> PO Amendments History</h3></div>' +
        '<div class="card-body no-padding">' +
          '<div class="table-responsive">' +
            '<table class="data-table">' +
              '<thead><tr><th>Version</th><th>Date</th><th>Amended By</th><th>Reason / Changes</th></tr></thead>' +
              '<tbody>' + (amendmentsHtml || '<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--text-muted)">No amendments. Original PO contract intact.</td></tr>') + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-header"><h3 class="card-title"><i data-lucide="package-check"></i> Linked Goods Receipts (GRN)</h3></div>' +
        '<div class="card-body">' +
          (po.linkedGrns && po.linkedGrns.length > 0 ?
            po.linkedGrns.map(function(grnId) {
              return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--card-border)">' +
                '<span class="lead-id-badge" style="cursor:pointer" onclick="switchPurView(\'grn-list\')">' + grnId + '</span>' +
                '<span class="badge badge-status-accepted">Inspected</span>' +
              '</div>';
            }).join('') :
            '<div style="color:var(--text-muted);font-size:.82rem;padding:12px 0">No goods receipts registered yet against this PO.</div>') +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById('btn-po-detail-back').onclick = function() { switchPurView('purchase-orders'); };

  // Bind Client Variation Order button
  if (linkedCr) {
    var crBtn = container.querySelector('[data-view-po-cr-btn]');
    if (crBtn) {
      crBtn.onclick = function() {
        if (typeof openClientChangeModal === 'function') openClientChangeModal(linkedCr.id);
      };
    }
  }

  // Amend PO Button
  document.getElementById('btn-amend-po').onclick = function() {
    promptAmendPo(po);
  };

  // Receive goods action
  var btnRecv = document.getElementById('btn-po-receive-goods');
  if (btnRecv) {
    btnRecv.onclick = function() {
      switchPurView('create-grn', { poId: po.id });
    };
  }

  if (typeof safeLucide === 'function') safeLucide();
  else if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') lucide.createIcons();
}

/* ── Business Rule: PO Amendments must create visible version entry & exception record ── */
function promptAmendPo(po) {
  openModal({
    title: 'Amend Purchase Order — ' + po.id,
    body:
      '<div class="alert alert-warning">' +
        '<i data-lucide="alert-triangle"></i>' +
        '<div><strong>PO Amendment Policy:</strong> Modifying an issued contract generates an incremental amendment revision and logs an audit exception. Previous contractual versions remain preserved.</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Amendment Reason / Contract Change <span class="required">*</span></label>' +
        '<textarea class="form-control" id="modal-amend-reason" placeholder="e.g. Authorized split shipment or modified delivery milestone terms…" required></textarea>' +
      '</div>',
    confirmText: 'Generate PO Amendment',
    onConfirm: function() {
      var reason = document.getElementById('modal-amend-reason').value.trim();
      if (!reason) {
        showToast('Please state the amendment justification', 'error');
        return false;
      }

      var nextVer = 'v1.' + ((po.amendments ? po.amendments.length : 0) + 1);
      if (!po.amendments) po.amendments = [];

      po.amendments.push({
        version: nextVer,
        date: new Date().toISOString().slice(0, 10),
        changedBy: 'Neha Kapoor',
        reason: reason
      });

      // Record in exceptions register
      PURCHASE_EXCEPTIONS.unshift({
        id: purUid('EXC'),
        refId: po.id,
        type: 'PO Amendment',
        description: 'Contract amendment ' + nextVer + ' on ' + po.id + ': ' + reason,
        severity: 'Medium',
        responsiblePerson: 'Neha Kapoor',
        date: new Date().toISOString().slice(0, 10),
        status: 'Resolved',
        resolution: 'Amendment recorded and acknowledged by supplier.',
        auditHistory: [
          { time: formatDateTime(new Date().toISOString()), user: 'Neha Kapoor', action: 'PO amendment generated.' }
        ]
      });

      showToast('PO Amendment ' + nextVer + ' recorded successfully', 'success');
      updatePurBadges();
      openPoDetail(po.id);
      return true;
    }
  });
}
