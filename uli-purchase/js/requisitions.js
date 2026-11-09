/**
 * ULI Studio ERP — Purchase Requisitions Module (SCREENS 2, 3, 4)
 * ═════════════════════════════════════════════════════════════
 * Handles:
 *  - Screen 2: Requisitions List (Data table, search, filters, pagination)
 *  - Screen 3: Create / Edit Requisition with dynamic line items & auto-totals
 *  - Screen 4: PR Detail Workspace & Tiered Approval Actions (Approve, Reject, Request Changes)
 */

'use strict';

var PrListState = {
  searchQuery: '',
  statusFilter: 'all',
  projectFilter: 'all',
  sortField: 'id',
  sortAsc: false
};

/* ══════════════════════════════════════════════════
   SCREEN 2: REQUISITIONS LIST
   ══════════════════════════════════════════════════ */

function initRequisitionsFilters() {
  var statusSelect = document.getElementById('pr-status-filter');
  var projSelect = document.getElementById('pr-project-filter');
  var searchInput = document.getElementById('pr-search-input');

  if (statusSelect && statusSelect.options.length <= 1) {
    PR_STATUSES.forEach(function(st) {
      var opt = document.createElement('option');
      opt.value = st;
      opt.textContent = st;
      statusSelect.appendChild(opt);
    });
  }

  if (projSelect && projSelect.options.length <= 1) {
    PURCHASE_PROJECTS.forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      projSelect.appendChild(opt);
    });
  }

  if (statusSelect && !statusSelect._bound) {
    statusSelect.addEventListener('change', function(e) {
      PrListState.statusFilter = e.target.value;
      renderRequisitionsList();
    });
    statusSelect._bound = true;
  }

  if (projSelect && !projSelect._bound) {
    projSelect.addEventListener('change', function(e) {
      PrListState.projectFilter = e.target.value;
      renderRequisitionsList();
    });
    projSelect._bound = true;
  }

  if (searchInput && !searchInput._bound) {
    searchInput.addEventListener('input', function(e) {
      PrListState.searchQuery = e.target.value;
      renderRequisitionsList();
    });
    searchInput._bound = true;
  }

  var btnCreate = document.getElementById('btn-pr-create-new');
  if (btnCreate && !btnCreate._bound) {
    btnCreate.addEventListener('click', function() {
      switchPurView('create-pr');
    });
    btnCreate._bound = true;
  }
}

function renderRequisitionsList() {
  initRequisitionsFilters();

  var tbody = document.getElementById('pr-table-tbody');
  var emptyState = document.getElementById('pr-empty-state');
  tbody.innerHTML = '';

  var list = PURCHASE_REQUISITIONS.filter(function(pr) {
    if (PrListState.statusFilter !== 'all' && pr.status !== PrListState.statusFilter) return false;
    if (PrListState.projectFilter !== 'all' && pr.projectId !== PrListState.projectFilter) return false;
    if (PrListState.searchQuery) {
      var q = PrListState.searchQuery.toLowerCase();
      var match = pr.id.toLowerCase().indexOf(q) !== -1 ||
                  pr.projectName.toLowerCase().indexOf(q) !== -1 ||
                  pr.requestedBy.toLowerCase().indexOf(q) !== -1 ||
                  pr.purpose.toLowerCase().indexOf(q) !== -1;
      if (!match) return false;
    }
    return true;
  });

  if (list.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  list.forEach(function(pr) {
    var approver = PURCHASE_USERS.find(function(u){ return u.id === pr.currentApproverId; }) || { name: 'Unassigned' };

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><span class="lead-id-badge" style="cursor:pointer" data-view-pr="' + pr.id + '">' + escapeHtml(pr.id) + '</span></td>' +
      '<td><div style="font-weight:600">' + escapeHtml(pr.projectName) + '</div><div style="font-size:.73rem;color:var(--text-muted)">' + escapeHtml(pr.siteLocation) + '</div></td>' +
      '<td>' + escapeHtml(pr.requestedBy) + '</td>' +
      '<td><span class="badge badge-stage">' + escapeHtml(pr.department) + '</span></td>' +
      '<td>' + formatDate(pr.requiredDate) + '</td>' +
      '<td>' + (pr.items ? pr.items.length : 0) + ' items</td>' +
      '<td><strong style="color:var(--text-primary)">' + formatCurrency(pr.estimatedAmount) + '</strong></td>' +
      '<td><span class="badge badge-status-' + pr.status.toLowerCase().replace(/\s+/g,'-') + '">' + pr.status + '</span></td>' +
      '<td><span style="font-size:.78rem">' + escapeHtml(approver.name) + '</span></td>' +
      '<td style="text-align:right">' +
        '<div class="table-actions" style="justify-content:flex-end">' +
          '<button class="btn btn-sm btn-outline btn-icon" title="View Workspace" data-view-pr="' + pr.id + '"><i data-lucide="eye"></i></button>' +
          (pr.status === 'Draft' ? '<button class="btn btn-sm btn-outline btn-icon" title="Edit Draft" data-edit-pr="' + pr.id + '"><i data-lucide="edit-3"></i></button>' : '') +
          (pr.status === 'Approved' ? '<button class="btn btn-sm btn-primary btn-sm" title="Create PO" data-po-pr="' + pr.id + '"><i data-lucide="shopping-cart"></i> PO</button>' : '') +
        '</div>' +
      '</td>';

    tr.querySelectorAll('[data-view-pr]').forEach(function(el) {
      el.addEventListener('click', function() {
        switchPurView('pr-detail', { prId: pr.id });
      });
    });

    var btnEdit = tr.querySelector('[data-edit-pr]');
    if (btnEdit) {
      btnEdit.addEventListener('click', function() {
        switchPurView('create-pr', { prIdToEdit: pr.id });
      });
    }

    var btnPo = tr.querySelector('[data-po-pr]');
    if (btnPo) {
      btnPo.addEventListener('click', function() {
        switchPurView('create-po', { linkedPrId: pr.id });
      });
    }

    tbody.appendChild(tr);
  });

  updatePurBadges();
  lucide.createIcons();
}

/* ══════════════════════════════════════════════════
   SCREEN 3: CREATE / EDIT PURCHASE REQUISITION
   ══════════════════════════════════════════════════ */

var editingPrItems = [];

function openCreatePrForm(prIdToEdit) {
  var container = document.getElementById('create-pr-form-container');
  var existingPr = prIdToEdit ? PURCHASE_REQUISITIONS.find(function(p){ return p.id === prIdToEdit; }) : null;
  var isEdit = Boolean(existingPr);

  var prId = existingPr ? existingPr.id : 'PR-2026-00' + (PURCHASE_REQUISITIONS.length + 90);

  editingPrItems = existingPr ? JSON.parse(JSON.stringify(existingPr.items || [])) : [
    { name: '', category: 'Tiles & Marble', spec: '', unit: 'sqft', qty: 100, rate: 500, total: 50000 }
  ];

  var projOptions = PURCHASE_PROJECTS.map(function(p) {
    var isSel = existingPr && existingPr.projectId === p.id;
    return '<option value="' + p.id + '" data-site="' + escapeHtml(p.site) + '" ' + (isSel ? 'selected' : '') + '>' + p.name + '</option>';
  }).join('');

  var vendorOptions = '<option value="">-- No Preference (RFQ open to market) --</option>' +
    PURCHASE_VENDORS.map(function(v) {
      var isSel = existingPr && existingPr.preferredVendorId === v.id;
      return '<option value="' + v.id + '" ' + (isSel ? 'selected' : '') + '>' + v.name + ' (' + v.category + ')</option>';
    }).join('');

  var clientChangesList = typeof PURCHASE_CLIENT_CHANGES !== 'undefined' ? PURCHASE_CLIENT_CHANGES : [];
  var clientChangeOptions = '<option value="">-- None (Standard Project Scope BOM) --</option>' +
    clientChangesList.map(function(cr) {
      var isSel = existingPr && existingPr.clientChangeRef === cr.id;
      return '<option value="' + cr.id + '" ' + (isSel ? 'selected' : '') + '>' + cr.id + ': ' + escapeHtml(cr.clientName) + ' — ' + escapeHtml(cr.title) + ' (' + escapeHtml(cr.costImpactFormatted) + ')</option>';
    }).join('');

  container.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<button class="lead-back-btn" id="btn-create-pr-back"><i data-lucide="arrow-left"></i></button>' +
        '<div>' +
          '<h2 style="font-size:1.3rem;font-weight:700;">' + (isEdit ? 'Edit Requisition — ' + prId : 'Create Purchase Requisition') + '</h2>' +
          '<p style="font-size:.8rem;color:var(--text-secondary);">Request material procurement with estimated quantities and budget heads</p>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<button class="btn btn-outline btn-sm" id="btn-pr-save-draft"><i data-lucide="save"></i> Save Draft</button>' +
        '<button class="btn btn-primary btn-sm" id="btn-pr-submit-approval"><i data-lucide="send"></i> Submit for Approval</button>' +
      '</div>' +
    '</div>' +

    '<!-- General Info Card -->' +
    '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header"><h3 class="card-title"><i data-lucide="info"></i> General Requisition Information</h3></div>' +
      '<div class="card-body">' +
        '<div class="form-grid">' +
          '<div class="form-group">' +
            '<label>Project <span class="required">*</span></label>' +
            '<select class="form-control" id="pr-inp-project">' + projOptions + '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Site Delivery Location</label>' +
            '<input type="text" class="form-control" id="pr-inp-site" value="' + (existingPr ? escapeHtml(existingPr.siteLocation) : PURCHASE_PROJECTS[0].site) + '" readonly style="background:#f8fafc">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Requested By <span class="required">*</span></label>' +
            '<input type="text" class="form-control" id="pr-inp-requester" value="' + (existingPr ? escapeHtml(existingPr.requestedBy) : 'Neha Kapoor') + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Department</label>' +
            '<select class="form-control" id="pr-inp-dept">' +
              '<option ' + (existingPr && existingPr.department==='Execution'?'selected':'') + '>Execution</option>' +
              '<option ' + (existingPr && existingPr.department==='Site Operations'?'selected':'') + '>Site Operations</option>' +
              '<option ' + (existingPr && existingPr.department==='Design & Sales'?'selected':'') + '>Design & Sales</option>' +
              '<option ' + (existingPr && existingPr.department==='Purchase & Supply'?'selected':'') + '>Purchase & Supply</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Required By Date <span class="required">*</span></label>' +
            '<input type="date" class="form-control" id="pr-inp-required-date" value="' + (existingPr ? existingPr.requiredDate : new Date(Date.now()+10*86400000).toISOString().slice(0,10)) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Priority</label>' +
            '<select class="form-control" id="pr-inp-priority">' +
              '<option ' + (existingPr && existingPr.priority==='Low'?'selected':'') + '>Low</option>' +
              '<option ' + (existingPr && existingPr.priority==='Medium'?'selected':'') + ' selected>Medium</option>' +
              '<option ' + (existingPr && existingPr.priority==='High'?'selected':'') + '>High</option>' +
              '<option ' + (existingPr && existingPr.priority==='Critical'?'selected':'') + '>Critical</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group form-full">' +
            '<label style="display:flex;align-items:center;gap:6px;"><i data-lucide="sparkles" style="color:#2563eb;width:14px;height:14px;"></i> Triggered by Client Variation Order? (Optional)</label>' +
            '<select class="form-control" id="pr-inp-client-change" style="border-color:#bfdbfe;background:#f8fafc;">' + clientChangeOptions + '</select>' +
          '</div>' +
          '<div class="form-group form-full">' +
            '<label>Purpose / Justification <span class="required">*</span></label>' +
            '<textarea class="form-control" id="pr-inp-purpose" placeholder="Detailed engineering/design justification for this purchase…">' + (existingPr ? escapeHtml(existingPr.purpose) : '') + '</textarea>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- Line Items Card -->' +
    '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header">' +
        '<h3 class="card-title"><i data-lucide="list"></i> Requested Materials & Line Items</h3>' +
        '<button class="btn btn-primary btn-sm" id="btn-pr-add-item-row"><i data-lucide="plus"></i> Add Item Row</button>' +
      '</div>' +
      '<div class="card-body no-padding">' +
        '<div class="table-responsive">' +
          '<table class="pur-item-table" id="pr-items-table">' +
            '<thead>' +
              '<tr>' +
                '<th style="width:35px">#</th>' +
                '<th style="width:180px">Item Name <span class="required">*</span></th>' +
                '<th style="width:160px">Category</th>' +
                '<th>Specification / Grade</th>' +
                '<th style="width:85px">Unit</th>' +
                '<th style="width:90px;text-align:right">Quantity</th>' +
                '<th style="width:110px;text-align:right">Est. Rate (₹)</th>' +
                '<th style="width:120px;text-align:right">Line Total (₹)</th>' +
                '<th style="width:40px"></th>' +
              '</tr>' +
            '</thead>' +
            '<tbody id="pr-items-tbody"></tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- Additional & Totals Row -->' +
    '<div class="pur-dash-grid">' +
      '<div class="card">' +
        '<div class="card-header"><h3 class="card-title"><i data-lucide="paperclip"></i> Sourcing & Attachments</h3></div>' +
        '<div class="card-body">' +
          '<div class="form-group">' +
            '<label>Preferred Vendor (Optional)</label>' +
            '<select class="form-control" id="pr-inp-vendor">' + vendorOptions + '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Specifications / Drawing Attachments</label>' +
            '<div style="border:2px dashed var(--card-border);padding:18px;border-radius:var(--radius);text-align:center;color:var(--text-muted);font-size:.8rem">' +
              '<i data-lucide="upload-cloud" style="width:24px;height:24px;display:block;margin:0 auto 6px"></i>' +
              'Click to browse or drop architectural specification sheets, CAD sketches, or BOQ schedules' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="pur-summary-card">' +
        '<h4 style="font-size:.9rem;font-weight:700;margin-bottom:12px;border-bottom:1px solid var(--card-border);padding-bottom:8px">Estimated Requisition Total</h4>' +
        '<div class="pur-summary-row"><span>Total Items:</span><strong id="pr-sum-item-count">0</strong></div>' +
        '<div class="pur-summary-row grand-total"><span>Estimated Amount:</span><span style="color:var(--blue)" id="pr-sum-grand-total">₹0</span></div>' +
        '<div style="font-size:.72rem;color:var(--text-muted);margin-top:12px;" id="pr-tier-threshold-note">' +
          'Approval tier calculated automatically based on total value.' +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById('btn-create-pr-back').onclick = function() { switchPurView('requisitions'); };

  // Project site auto-fill
  var projSelect = document.getElementById('pr-inp-project');
  projSelect.addEventListener('change', function() {
    var opt = projSelect.options[projSelect.selectedIndex];
    document.getElementById('pr-inp-site').value = opt.getAttribute('data-site') || '';
  });

  // Add Item Row
  document.getElementById('btn-pr-add-item-row').onclick = function() {
    editingPrItems.push({ name: '', category: 'Tiles & Marble', spec: '', unit: 'sqft', qty: 10, rate: 1000, total: 10000 });
    renderPrItemRows();
  };

  // Submit buttons
  document.getElementById('btn-pr-save-draft').onclick = function() {
    savePurchaseRequisition('Draft', isEdit, existingPr, prId);
  };
  document.getElementById('btn-pr-submit-approval').onclick = function() {
    savePurchaseRequisition('Pending Approval', isEdit, existingPr, prId);
  };

  renderPrItemRows();
  lucide.createIcons();
}

function renderPrItemRows() {
  var tbody = document.getElementById('pr-items-tbody');
  tbody.innerHTML = '';

  var categoryOptions = PURCHASE_CATEGORIES.map(function(c) {
    return '<option value="' + c + '">' + c + '</option>';
  }).join('');

  editingPrItems.forEach(function(item, idx) {
    var lineTotal = (item.qty || 0) * (item.rate || 0);
    var tr = document.createElement('tr');

    tr.innerHTML =
      '<td style="text-align:center;color:var(--text-muted)">' + (idx + 1) + '</td>' +
      '<td><input type="text" class="pur-input item-name" placeholder="Item name" value="' + escapeHtml(item.name) + '"></td>' +
      '<td><select class="pur-input item-cat">' + categoryOptions + '</select></td>' +
      '<td><input type="text" class="pur-input item-spec" placeholder="Grade, size, finish" value="' + escapeHtml(item.spec) + '"></td>' +
      '<td><input type="text" class="pur-input item-unit" value="' + escapeHtml(item.unit) + '"></td>' +
      '<td><input type="number" class="pur-input pur-num item-qty" min="1" value="' + item.qty + '"></td>' +
      '<td><input type="number" class="pur-input pur-num item-rate" min="0" value="' + item.rate + '"></td>' +
      '<td style="text-align:right;font-weight:700" class="item-line-total">' + formatCurrency(lineTotal) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-outline btn-icon" style="color:var(--red)"><i data-lucide="trash-2"></i></button></td>';

    tr.querySelector('.item-cat').value = item.category || PURCHASE_CATEGORIES[0];

    function updateRow() {
      item.name = tr.querySelector('.item-name').value.trim();
      item.category = tr.querySelector('.item-cat').value;
      item.spec = tr.querySelector('.item-spec').value.trim();
      item.unit = tr.querySelector('.item-unit').value.trim();
      item.qty = parseFloat(tr.querySelector('.item-qty').value) || 0;
      item.rate = parseFloat(tr.querySelector('.item-rate').value) || 0;
      item.total = item.qty * item.rate;
      tr.querySelector('.item-line-total').textContent = formatCurrency(item.total);
      recalculatePrTotals();
    }

    tr.querySelectorAll('input, select').forEach(function(el) {
      el.addEventListener('input', updateRow);
      el.addEventListener('change', updateRow);
    });

    tr.querySelector('button').addEventListener('click', function() {
      editingPrItems.splice(idx, 1);
      renderPrItemRows();
    });

    tbody.appendChild(tr);
  });

  recalculatePrTotals();
  lucide.createIcons();
}

function recalculatePrTotals() {
  var grandTotal = editingPrItems.reduce(function(a, b) { return a + (b.total || 0); }, 0);
  document.getElementById('pr-sum-item-count').textContent = editingPrItems.length + ' line items';
  document.getElementById('pr-sum-grand-total').textContent = formatCurrency(grandTotal);

  var tierText = '';
  if (grandTotal <= 100000) tierText = '• Qualifies for Level 1 Approval (Project Manager limit ≤ ₹1.0 L)';
  else if (grandTotal <= 1000000) tierText = '• Qualifies for Level 2 Approval (Procurement Head limit ≤ ₹10.0 L)';
  else tierText = '• Exceeds ₹10.0 L. Requires Level 3 Approval (Managing Director authorization)';
  document.getElementById('pr-tier-threshold-note').textContent = tierText;
}

function savePurchaseRequisition(status, isEdit, existingPr, prId) {
  var projId = document.getElementById('pr-inp-project').value;
  var projObj = PURCHASE_PROJECTS.find(function(p){ return p.id === projId; });
  var requester = document.getElementById('pr-inp-requester').value.trim();
  var dept = document.getElementById('pr-inp-dept').value;
  var requiredDate = document.getElementById('pr-inp-required-date').value;
  var priority = document.getElementById('pr-inp-priority').value;
  var purpose = document.getElementById('pr-inp-purpose').value.trim();
  var preferredVendorId = document.getElementById('pr-inp-vendor').value || null;

  if (!requester || !purpose) {
    showToast('Please provide requested by name and requisition justification', 'error');
    return;
  }

  if (editingPrItems.length === 0 || !editingPrItems[0].name) {
    showToast('Please add at least one valid material line item', 'error');
    return;
  }

  var totalAmt = editingPrItems.reduce(function(a, b){ return a + (b.total || 0); }, 0);

  // Determine approval level
  var level = 1;
  var approverId = 'usr-02'; // Rahul Mehta
  if (totalAmt > 1000000) {
    level = 3;
    approverId = 'usr-05'; // Vikram Malhotra (MD)
  } else if (totalAmt > 100000) {
    level = 2;
    approverId = 'usr-03'; // Neha Kapoor
  }

  var clientChangeVal = (document.getElementById('pr-inp-client-change') || {}).value || null;

  if (isEdit && existingPr) {
    existingPr.projectId = projId;
    existingPr.projectName = projObj ? projObj.name : existingPr.projectName;
    existingPr.siteLocation = projObj ? projObj.site : existingPr.siteLocation;
    existingPr.requestedBy = requester;
    existingPr.department = dept;
    existingPr.requiredDate = requiredDate;
    existingPr.priority = priority;
    existingPr.purpose = purpose;
    existingPr.preferredVendorId = preferredVendorId;
    existingPr.clientChangeRef = clientChangeVal;
    existingPr.items = editingPrItems;
    existingPr.estimatedAmount = totalAmt;
    existingPr.status = status;
    existingPr.currentApprovalLevel = level;
    existingPr.currentApproverId = approverId;

    showToast('Requisition ' + existingPr.id + ' updated', 'success');
    switchPurView('pr-detail', { prId: existingPr.id });
  } else {
    var newPr = {
      id: prId,
      requestedBy: requester,
      department: dept,
      projectId: projId,
      projectName: projObj ? projObj.name : 'Interior Project',
      siteLocation: projObj ? projObj.site : 'Site',
      requiredDate: requiredDate,
      priority: priority,
      purpose: purpose,
      preferredVendorId: preferredVendorId,
      clientChangeRef: clientChangeVal,
      status: status,
      currentApproverId: approverId,
      currentApprovalLevel: level,
      submissionDate: status === 'Pending Approval' ? new Date().toISOString() : null,
      createdDate: new Date().toISOString().slice(0, 10),
      items: editingPrItems,
      estimatedAmount: totalAmt,
      approvalHistory: [
        { step: 'Requisition Created', user: requester, date: formatDateTime(new Date().toISOString()), status: status, notes: purpose }
      ],
      comments: []
    };

    PURCHASE_REQUISITIONS.unshift(newPr);

    PURCHASE_ACTIVITIES.unshift({
      id: purUid('ACT'),
      user: requester,
      action: 'created purchase requisition',
      detail: newPr.id + ' — ' + newPr.projectName + ' (' + formatCurrency(totalAmt) + ')',
      timestamp: new Date().toISOString(),
      type: 'pr'
    });

    showToast('Requisition ' + newPr.id + ' created as ' + status, 'success');
    switchPurView('pr-detail', { prId: newPr.id });
  }

  updatePurBadges();
}

/* ══════════════════════════════════════════════════
   SCREEN 4: PR DETAIL & APPROVAL WORKSPACE
   ══════════════════════════════════════════════════ */

function openPrDetail(prId) {
  PurApp.selectedPrId = prId;
  var container = document.getElementById('pr-detail-container');
  var pr = PURCHASE_REQUISITIONS.find(function(p){ return p.id === prId; });

  if (!pr) {
    container.innerHTML = '<div class="state-message"><h4>Requisition not found</h4><button class="btn btn-outline" onclick="switchPurView(\'requisitions\')">Back to PRs</button></div>';
    return;
  }

  var approver = PURCHASE_USERS.find(function(u){ return u.id === pr.currentApproverId; }) || { name: 'Unassigned' };
  var vendor = pr.preferredVendorId ? getVendor(pr.preferredVendorId) : null;

  var itemsHtml = (pr.items || []).map(function(it, idx) {
    return '<tr>' +
      '<td style="text-align:center">' + (idx + 1) + '</td>' +
      '<td><strong>' + escapeHtml(it.name) + '</strong></td>' +
      '<td><span class="badge badge-stage">' + escapeHtml(it.category) + '</span></td>' +
      '<td>' + escapeHtml(it.spec || '—') + '</td>' +
      '<td>' + it.qty + ' ' + it.unit + '</td>' +
      '<td style="text-align:right">₹' + it.rate.toLocaleString('en-IN') + '</td>' +
      '<td style="text-align:right;font-weight:700">' + formatCurrency(it.total) + '</td>' +
    '</tr>';
  }).join('');

  var historyHtml = (pr.approvalHistory || []).map(function(h) {
    return '<tr>' +
      '<td><strong>' + escapeHtml(h.step) + '</strong></td>' +
      '<td>' + escapeHtml(h.user) + '</td>' +
      '<td>' + escapeHtml(h.date) + '</td>' +
      '<td><span class="badge badge-status-' + h.status.toLowerCase() + '">' + h.status + '</span></td>' +
      '<td>' + escapeHtml(h.notes || '—') + '</td>' +
    '</tr>';
  }).join('');

  var clientChangeHtml = '';
  var linkedCr = pr.clientChangeRef ? (typeof PURCHASE_CLIENT_CHANGES !== 'undefined' ? PURCHASE_CLIENT_CHANGES.find(function(c){ return c.id === pr.clientChangeRef; }) : null) : null;
  if (linkedCr) {
    clientChangeHtml =
      '<!-- Client Scope Variation Order Card -->' +
      '<div class="card" style="margin-bottom:20px;border-left:4px solid #2563eb;background:linear-gradient(to right, #eff6ff, #ffffff);">' +
        '<div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#dbeafe;color:#2563eb;"><i data-lucide="sparkles" style="width:18px;height:18px;"></i></span>' +
            '<div>' +
              '<h3 class="card-title" style="margin:0;font-size:.92rem;color:#1e40af;">Triggered by Client Variation Order: ' + escapeHtml(linkedCr.id) + ' (' + escapeHtml(linkedCr.variationCode) + ')</h3>' +
              '<div style="font-size:.75rem;color:#3b82f6;margin-top:2px;">Client: <strong>' + escapeHtml(linkedCr.clientName) + '</strong> (' + escapeHtml(linkedCr.clientPhone) + ') · Signed Approval: <strong>' + escapeHtml(linkedCr.clientApprovalRef) + '</strong></div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span class="badge" style="background:#dbeafe;color:#1e40af;font-weight:700;">Cost Variance: ' + escapeHtml(linkedCr.costImpactFormatted) + '</span>' +
            '<button class="btn btn-sm btn-outline" data-view-cr-btn="' + linkedCr.id + '"><i data-lucide="eye"></i> Full Client History</button>' +
          '</div>' +
        '</div>' +
        '<div class="card-body" style="padding-top:4px;font-size:.82rem;">' +
          '<div style="background:#fff;border:1px solid #bfdbfe;border-radius:var(--radius);padding:10px 14px;margin-bottom:12px;">' +
            '<strong style="color:#1e3a8a;"><i data-lucide="message-square" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> Client Stated Instructions:</strong>' +
            '<div style="color:#1e40af;font-style:italic;margin-top:3px;line-height:1.4;">“' + escapeHtml(linkedCr.clientStatedRequest) + '”</div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
            '<div style="padding:10px 12px;background:#f8fafc;border-radius:var(--radius);border:1px solid #e2e8f0;">' +
              '<span style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Original Base Scope</span>' +
              '<div style="font-size:.78rem;color:var(--text-secondary);margin-top:2px;">' + escapeHtml(linkedCr.originalScope) + '</div>' +
            '</div>' +
            '<div style="padding:10px 12px;background:#eff6ff;border-radius:var(--radius);border:1px solid #bfdbfe;">' +
              '<span style="font-size:.72rem;color:#2563eb;text-transform:uppercase;font-weight:700;">Approved Client Variation</span>' +
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
          '<button class="lead-back-btn" id="btn-pr-detail-back"><i data-lucide="arrow-left"></i></button>' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:8px">' +
              '<span class="lead-id-badge" style="font-size:1rem">' + escapeHtml(pr.id) + '</span>' +
              '<span class="badge badge-status-' + pr.status.toLowerCase().replace(/\s+/g,'-') + '">' + pr.status + '</span>' +
              '<span class="badge badge-priority-' + (pr.priority||'medium').toLowerCase() + '">' + pr.priority + ' Priority</span>' +
              '<span class="approval-tier-badge">Level ' + pr.currentApprovalLevel + ' Tier</span>' +
            '</div>' +
            '<h2 style="font-size:1.3rem;font-weight:700;margin-top:2px;">' + escapeHtml(pr.projectName) + '</h2>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          (pr.status === 'Draft' || pr.status === 'Changes Requested' ?
            '<button class="btn btn-outline btn-sm" id="btn-action-edit-pr"><i data-lucide="edit-3"></i> Edit</button>' +
            '<button class="btn btn-primary btn-sm" id="btn-action-submit-pr"><i data-lucide="send"></i> Submit for Approval</button>' : '') +
          (pr.status === 'Pending Approval' ?
            '<button class="btn btn-outline btn-sm" id="btn-action-request-changes"><i data-lucide="rotate-ccw"></i> Request Changes</button>' +
            '<button class="btn btn-danger btn-sm" id="btn-action-reject"><i data-lucide="x-circle"></i> Reject</button>' +
            '<button class="btn btn-success btn-sm" id="btn-action-approve"><i data-lucide="check-circle"></i> Approve</button>' : '') +
          (pr.status === 'Approved' ?
            '<button class="btn btn-primary btn-sm" id="btn-action-create-po-from-pr"><i data-lucide="shopping-cart"></i> Create Purchase Order</button>' : '') +
        '</div>' +
      '</div>' +

      '<div class="card-body">' +
        '<div class="form-grid-3" style="font-size:.83rem">' +
          '<div><span style="color:var(--text-muted)">Requester:</span> <strong>' + escapeHtml(pr.requestedBy) + '</strong> (' + escapeHtml(pr.department) + ')</div>' +
          '<div><span style="color:var(--text-muted)">Site Location:</span> <strong>' + escapeHtml(pr.siteLocation) + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">Required By:</span> <strong>' + formatDate(pr.requiredDate) + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">Preferred Vendor:</span> <strong>' + (vendor ? escapeHtml(vendor.name) : 'Open to RFQ') + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">Current Approver:</span> <strong>' + escapeHtml(approver.name) + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">Estimated Value:</span> <strong style="color:var(--blue);font-size:1.05rem">' + formatCurrency(pr.estimatedAmount) + '</strong></div>' +
        '</div>' +
        '<div style="margin-top:14px;padding:12px;background:#f8fafc;border-radius:var(--radius);font-size:.81rem">' +
          '<strong>Requisition Justification:</strong> ' + escapeHtml(pr.purpose) +
        '</div>' +
      '</div>' +
    '</div>' +

    clientChangeHtml +

    '<!-- Items Table Card -->' +
    '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header"><h3 class="card-title"><i data-lucide="package"></i> Requested Bill of Materials (' + pr.items.length + ' Items)</h3></div>' +
      '<div class="card-body no-padding">' +
        '<div class="table-responsive">' +
          '<table class="data-table">' +
            '<thead><tr><th>#</th><th>Material Name</th><th>Category</th><th>Specification</th><th>Quantity</th><th style="text-align:right">Estimated Rate</th><th style="text-align:right">Line Total</th></tr></thead>' +
            '<tbody>' + itemsHtml + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- Approval History & Audit Trail Card -->' +
    '<div class="card">' +
      '<div class="card-header"><h3 class="card-title"><i data-lucide="history"></i> Approval History & Audit Trail</h3></div>' +
      '<div class="card-body no-padding">' +
        '<div class="table-responsive">' +
          '<table class="data-table">' +
            '<thead><tr><th>Workflow Step</th><th>Action By</th><th>Date & Time</th><th>Status</th><th>Notes</th></tr></thead>' +
            '<tbody>' + (historyHtml || '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-muted)">No approval transactions recorded.</td></tr>') + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById('btn-pr-detail-back').onclick = function() { switchPurView('requisitions'); };

  // Bind full client history button
  if (linkedCr) {
    var crBtn = container.querySelector('[data-view-cr-btn]');
    if (crBtn) {
      crBtn.onclick = function() {
        if (typeof openClientChangeModal === 'function') openClientChangeModal(linkedCr.id);
      };
    }
  }

  // Button hooks
  var btnEdit = document.getElementById('btn-action-edit-pr');
  if (btnEdit) {
    btnEdit.onclick = function() { switchPurView('create-pr', { prIdToEdit: pr.id }); };
  }

  var btnSubmit = document.getElementById('btn-action-submit-pr');
  if (btnSubmit) {
    btnSubmit.onclick = function() {
      pr.status = 'Pending Approval';
      pr.submissionDate = new Date().toISOString();
      pr.approvalHistory.push({
        step: 'Submitted for Approval',
        user: 'Neha Kapoor',
        date: formatDateTime(new Date().toISOString()),
        status: 'Pending',
        notes: 'Submitted for managerial clearance'
      });
      showToast('Requisition submitted for approval', 'success');
      openPrDetail(pr.id);
    };
  }

  var btnApprove = document.getElementById('btn-action-approve');
  if (btnApprove) {
    btnApprove.onclick = function() {
      promptApprovePr(pr);
    };
  }

  var btnReject = document.getElementById('btn-action-reject');
  if (btnReject) {
    btnReject.onclick = function() {
      promptRejectPr(pr);
    };
  }

  var btnChanges = document.getElementById('btn-action-request-changes');
  if (btnChanges) {
    btnChanges.onclick = function() {
      promptRequestChangesPr(pr);
    };
  }

  var btnCreatePo = document.getElementById('btn-action-create-po-from-pr');
  if (btnCreatePo) {
    btnCreatePo.onclick = function() {
      switchPurView('create-po', { linkedPrId: pr.id });
    };
  }

  lucide.createIcons();
}

/* ── Approval Actions Dialogs ── */
function promptApprovePr(pr) {
  // Enforce rule: Requester cannot approve their own PR
  var currentUser = 'Neha Kapoor'; // Active demo user
  if (pr.requestedBy.toLowerCase() === currentUser.toLowerCase()) {
    openModal({
      title: 'Policy Exception Warning',
      body: '<div class="alert alert-warning"><i data-lucide="alert-triangle"></i><div><strong>Segregation of Duties Conflict</strong><br>Procurement governance policy prohibits a requester from approving their own requisition. Please have another manager or director clear this PR.</div></div>',
      cancelText: 'Understood',
      hideConfirm: true
    });
    return;
  }

  openModal({
    title: 'Approve Requisition — ' + pr.id,
    body:
      '<div class="alert alert-success">' +
        '<i data-lucide="check-circle"></i>' +
        '<div>You are approving <strong>' + escapeHtml(pr.id) + '</strong> for <strong>' + formatCurrency(pr.estimatedAmount) + '</strong> under Level ' + pr.currentApprovalLevel + ' threshold.</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Approval Comments (Optional)</label>' +
        '<input type="text" class="form-control" id="modal-appr-note" placeholder="e.g. Budget verified against Q4 interior allowance">' +
      '</div>',
    confirmText: 'Authorize & Approve',
    onConfirm: function() {
      var note = document.getElementById('modal-appr-note').value.trim();
      pr.status = 'Approved';
      pr.approvalHistory.push({
        step: 'Level ' + pr.currentApprovalLevel + ' Approved',
        user: currentUser,
        date: formatDateTime(new Date().toISOString()),
        status: 'Approved',
        notes: note || 'Approved within authorized limits'
      });

      PURCHASE_ACTIVITIES.unshift({
        id: purUid('ACT'),
        user: currentUser,
        action: 'approved purchase requisition',
        detail: pr.id + ' (' + formatCurrency(pr.estimatedAmount) + ')',
        timestamp: new Date().toISOString(),
        type: 'approval'
      });

      showToast('Requisition ' + pr.id + ' approved! Ready for PO generation.', 'success');
      updatePurBadges();
      openPrDetail(pr.id);
      return true;
    }
  });
}

function promptRejectPr(pr) {
  openModal({
    title: 'Reject Requisition — ' + pr.id,
    body:
      '<div class="form-group">' +
        '<label>Mandatory Rejection Reason <span class="required">*</span></label>' +
        '<textarea class="form-control" id="modal-reject-reason" placeholder="Explain why this requisition is rejected (e.g. budget exceeded, scope cancelled)…" required></textarea>' +
      '</div>',
    confirmText: 'Confirm Rejection',
    confirmBtnClass: 'btn-danger',
    onConfirm: function() {
      var reason = document.getElementById('modal-reject-reason').value.trim();
      if (!reason) {
        showToast('Rejection reason is mandatory', 'error');
        return false;
      }

      pr.status = 'Rejected';
      pr.approvalHistory.push({
        step: 'Rejection',
        user: 'Neha Kapoor',
        date: formatDateTime(new Date().toISOString()),
        status: 'Rejected',
        notes: reason
      });

      PURCHASE_EXCEPTIONS.unshift({
        id: purUid('EXC'),
        refId: pr.id,
        type: 'Approval/Rejection History',
        description: 'PR ' + pr.id + ' was rejected: ' + reason,
        severity: 'Low',
        responsiblePerson: 'Neha Kapoor',
        date: new Date().toISOString().slice(0, 10),
        status: 'Closed',
        resolution: reason,
        auditHistory: [
          { time: formatDateTime(new Date().toISOString()), user: 'Neha Kapoor', action: 'Formal rejection registered.' }
        ]
      });

      showToast('Requisition ' + pr.id + ' marked as Rejected', 'info');
      updatePurBadges();
      openPrDetail(pr.id);
      return true;
    }
  });
}

function promptRequestChangesPr(pr) {
  openModal({
    title: 'Request Changes — ' + pr.id,
    body:
      '<div class="form-group">' +
        '<label>Modifications Required <span class="required">*</span></label>' +
        '<textarea class="form-control" id="modal-changes-note" placeholder="State the required corrections (e.g. adjust quantities, recheck rates, verify existing site stock)…" required></textarea>' +
      '</div>',
    confirmText: 'Return for Changes',
    confirmBtnClass: 'btn-outline',
    onConfirm: function() {
      var note = document.getElementById('modal-changes-note').value.trim();
      if (!note) {
        showToast('Please specify the changes requested', 'error');
        return false;
      }

      pr.status = 'Changes Requested';
      pr.approvalHistory.push({
        step: 'Changes Requested',
        user: 'Neha Kapoor',
        date: formatDateTime(new Date().toISOString()),
        status: 'Returned',
        notes: note
      });

      showToast('Requisition returned to requester for adjustments', 'info');
      updatePurBadges();
      openPrDetail(pr.id);
      return true;
    }
  });
}
