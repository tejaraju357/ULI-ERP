/**
 * ULI Studio ERP — Vendor Directory & 360° Profile Module (SCREENS 13 & 14)
 * ══════════════════════════════════════════════════════════════════════════
 * Handles:
 *  - Screen 13: Vendor Directory (Search, Category Filter, Add/Edit Vendor)
 *  - Screen 14: Vendor Detail Workspace (Purchase history, Open POs, GRNs, Bills, Masked bank details)
 */

'use strict';

/* ══════════════════════════════════════════════════
   SCREEN 13: VENDOR DIRECTORY
   ══════════════════════════════════════════════════ */

function initVendorFilters() {
  var catSelect = document.getElementById('vendor-category-filter');
  var searchInput = document.getElementById('vendor-search-input');

  if (catSelect && catSelect.options.length <= 1) {
    PURCHASE_CATEGORIES.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      catSelect.appendChild(opt);
    });
  }

  if (catSelect && !catSelect._bound) {
    catSelect.addEventListener('change', renderVendorDirectory);
    catSelect._bound = true;
  }

  if (searchInput && !searchInput._bound) {
    searchInput.addEventListener('input', renderVendorDirectory);
    searchInput._bound = true;
  }

  var btnAdd = document.getElementById('btn-add-vendor');
  if (btnAdd && !btnAdd._bound) {
    btnAdd.addEventListener('click', function() {
      openAddVendorModal();
    });
    btnAdd._bound = true;
  }
}

function renderVendorDirectory() {
  initVendorFilters();

  var tbody = document.getElementById('vendor-table-tbody');
  tbody.innerHTML = '';

  var catVal = (document.getElementById('vendor-category-filter') || {}).value || 'all';
  var searchInput = document.getElementById('vendor-search-input');
  var query = (searchInput ? searchInput.value : '').toLowerCase().trim();

  var list = PURCHASE_VENDORS.filter(function(v) {
    if (catVal !== 'all' && v.category !== catVal) return false;
    if (query) {
      var match = v.name.toLowerCase().indexOf(query) !== -1 ||
                  v.id.toLowerCase().indexOf(query) !== -1 ||
                  v.contactPerson.toLowerCase().indexOf(query) !== -1 ||
                  v.gstin.toLowerCase().indexOf(query) !== -1;
      if (!match) return false;
    }
    return true;
  });

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--text-muted)">No vendors found.</td></tr>';
    return;
  }

  list.forEach(function(v) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><span class="lead-id-badge" style="cursor:pointer" data-view-vnd="' + v.id + '">' + escapeHtml(v.id) + '</span></td>' +
      '<td><strong>' + escapeHtml(v.name) + '</strong></td>' +
      '<td><span class="badge badge-stage">' + escapeHtml(v.category) + '</span></td>' +
      '<td>' + escapeHtml(v.contactPerson) + '</td>' +
      '<td><div>' + escapeHtml(v.phone) + '</div><div style="font-size:.71rem;color:var(--text-muted)">' + escapeHtml(v.email) + '</div></td>' +
      '<td><span style="font-family:monospace;font-size:.78rem">' + escapeHtml(v.gstin) + '</span></td>' +
      '<td>' + escapeHtml(v.paymentTerms) + '</td>' +
      '<td><strong style="color:var(--text-primary)">' + formatCurrency(v.outstandingBalance) + '</strong></td>' +
      '<td><span class="badge badge-status-accepted">' + v.status + '</span></td>' +
      '<td style="text-align:right">' +
        '<div class="table-actions" style="justify-content:flex-end">' +
          '<button class="btn btn-sm btn-outline btn-icon" title="View 360° Profile" data-view-vnd="' + v.id + '"><i data-lucide="eye"></i></button>' +
          '<button class="btn btn-sm btn-outline btn-icon" title="Edit Vendor" data-edit-vnd="' + v.id + '"><i data-lucide="edit-3"></i></button>' +
        '</div>' +
      '</td>';

    tr.querySelectorAll('[data-view-vnd]').forEach(function(el) {
      el.addEventListener('click', function() {
        switchPurView('vendor-detail', { vendorId: v.id });
      });
    });

    tr.querySelector('[data-edit-vnd]').addEventListener('click', function() {
      openAddVendorModal(v);
    });

    tbody.appendChild(tr);
  });

  updatePurBadges();
  lucide.createIcons();
}

function openAddVendorModal(existingVnd) {
  var isEdit = Boolean(existingVnd);
  var catOptions = PURCHASE_CATEGORIES.map(function(c) {
    var isSel = existingVnd && existingVnd.category === c;
    return '<option value="' + c + '" ' + (isSel ? 'selected' : '') + '>' + c + '</option>';
  }).join('');

  var body =
    '<div class="form-grid">' +
      '<div class="form-group form-full">' +
        '<label>Vendor Commercial Trade Name <span class="required">*</span></label>' +
        '<input type="text" class="form-control" id="modal-vnd-name" value="' + (existingVnd ? escapeHtml(existingVnd.name) : '') + '" placeholder="e.g. Italian Stone Works LLP" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Category <span class="required">*</span></label>' +
        '<select class="form-control" id="modal-vnd-cat">' + catOptions + '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Contact Person <span class="required">*</span></label>' +
        '<input type="text" class="form-control" id="modal-vnd-contact" value="' + (existingVnd ? escapeHtml(existingVnd.contactPerson) : '') + '" placeholder="Key contact">' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Phone Number <span class="required">*</span></label>' +
        '<input type="tel" class="form-control" id="modal-vnd-phone" value="' + (existingVnd ? escapeHtml(existingVnd.phone) : '') + '" placeholder="+91 98200 12345">' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Orders / Billing Email</label>' +
        '<input type="email" class="form-control" id="modal-vnd-email" value="' + (existingVnd ? escapeHtml(existingVnd.email) : '') + '" placeholder="billing@vendor.in">' +
      '</div>' +
      '<div class="form-group">' +
        '<label>GSTIN</label>' +
        '<input type="text" class="form-control" id="modal-vnd-gstin" value="' + (existingVnd ? escapeHtml(existingVnd.gstin) : '') + '" placeholder="27AABCV1234Q1Z1">' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Payment Terms</label>' +
        '<input type="text" class="form-control" id="modal-vnd-terms" value="' + (existingVnd ? escapeHtml(existingVnd.paymentTerms) : '30 Days Net') + '">' +
      '</div>' +
      '<div class="form-group form-full">' +
        '<label>Warehouse / Registered Address</label>' +
        '<textarea class="form-control" id="modal-vnd-addr">' + (existingVnd ? escapeHtml(existingVnd.address) : '') + '</textarea>' +
      '</div>' +
    '</div>';

  openModal({
    title: isEdit ? 'Edit Vendor — ' + existingVnd.id : 'Register New Vendor',
    body: body,
    confirmText: isEdit ? 'Save Changes' : 'Register Vendor',
    onConfirm: function() {
      var name = document.getElementById('modal-vnd-name').value.trim();
      var cat = document.getElementById('modal-vnd-cat').value;
      var contact = document.getElementById('modal-vnd-contact').value.trim();
      var phone = document.getElementById('modal-vnd-phone').value.trim();

      if (!name || !contact || !phone) {
        showToast('Please provide vendor name, contact person, and phone number', 'error');
        return false;
      }

      if (isEdit) {
        existingVnd.name = name;
        existingVnd.category = cat;
        existingVnd.contactPerson = contact;
        existingVnd.phone = phone;
        existingVnd.email = document.getElementById('modal-vnd-email').value.trim();
        existingVnd.gstin = document.getElementById('modal-vnd-gstin').value.trim();
        existingVnd.paymentTerms = document.getElementById('modal-vnd-terms').value.trim();
        existingVnd.address = document.getElementById('modal-vnd-addr').value.trim();
        showToast('Vendor ' + existingVnd.id + ' updated', 'success');
      } else {
        var newV = {
          id: 'VND-00' + (PURCHASE_VENDORS.length + 1),
          name: name,
          category: cat,
          contactPerson: contact,
          phone: phone,
          email: document.getElementById('modal-vnd-email').value.trim(),
          gstin: document.getElementById('modal-vnd-gstin').value.trim(),
          paymentTerms: document.getElementById('modal-vnd-terms').value.trim(),
          address: document.getElementById('modal-vnd-addr').value.trim(),
          rating: 4.5,
          onTimeDeliveryRate: 90,
          qualityIssuesCount: 0,
          outstandingBalance: 0,
          status: 'Active',
          bankDetails: {
            bankName: 'HDFC Bank Ltd',
            accountNumber: '••••••••' + Math.floor(1000 + Math.random()*9000),
            ifsc: 'HDFC0000001',
            branch: 'Mumbai Central'
          }
        };
        PURCHASE_VENDORS.unshift(newV);
        showToast('Vendor ' + newV.name + ' registered successfully', 'success');
      }

      updatePurBadges();
      renderVendorDirectory();
      return true;
    }
  });
}

/* ═══════════════════════════════════════
   SCREEN 14: VENDOR DETAIL (360° PROFILE)
   ═══════════════════════════════════════ */

function openVendorDetail(vendorId) {
  PurApp.selectedVendorId = vendorId;
  var container = document.getElementById('vendor-detail-container');
  var v = PURCHASE_VENDORS.find(function(item){ return item.id === vendorId; });

  if (!v) {
    container.innerHTML = '<div class="state-message"><h4>Vendor not found</h4><button class="btn btn-outline" onclick="switchPurView(\'vendors\')">Back to Vendors</button></div>';
    return;
  }

  var vendorPos = PURCHASE_ORDERS.filter(function(p){ return p.vendorId === v.id; });
  var vendorGrns = PURCHASE_GRNS.filter(function(g){ return g.vendorId === v.id; });
  var vendorBills = PURCHASE_VENDOR_BILLS.filter(function(b){ return b.vendorId === v.id; });

  var poRows = vendorPos.map(function(p) {
    return '<tr>' +
      '<td><span class="lead-id-badge" style="cursor:pointer" onclick="switchPurView(\'po-detail\', {poId:\'' + p.id + '\'})">' + p.id + '</span></td>' +
      '<td>' + escapeHtml(p.projectName) + '</td>' +
      '<td>' + formatDate(p.poDate) + '</td>' +
      '<td><strong style="color:var(--text-primary)">' + formatCurrency(p.orderedAmount) + '</strong></td>' +
      '<td><span class="badge badge-status-' + p.status.toLowerCase().replace(/\s+/g,'-') + '">' + p.status + '</span></td>' +
    '</tr>';
  }).join('');

  container.innerHTML =
    '<!-- Header Card -->' +
    '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header">' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<button class="lead-back-btn" id="btn-vnd-detail-back"><i data-lucide="arrow-left"></i></button>' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:8px">' +
              '<span class="lead-id-badge" style="font-size:1rem">' + escapeHtml(v.id) + '</span>' +
              '<span class="badge badge-stage">' + escapeHtml(v.category) + '</span>' +
              '<span class="badge badge-status-accepted">' + v.status + '</span>' +
            '</div>' +
            '<h2 style="font-size:1.35rem;font-weight:700;margin-top:2px;">' + escapeHtml(v.name) + '</h2>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<button class="btn btn-outline btn-sm" id="btn-vnd-edit"><i data-lucide="edit-3"></i> Edit Vendor</button>' +
          '<button class="btn btn-primary btn-sm" id="btn-vnd-new-po"><i data-lucide="plus"></i> New PO for Vendor</button>' +
        '</div>' +
      '</div>' +

      '<div class="card-body">' +
        '<div class="form-grid-3" style="font-size:.83rem">' +
          '<div><span style="color:var(--text-muted)">Contact Person:</span> <strong>' + escapeHtml(v.contactPerson) + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">Phone:</span> <strong>' + escapeHtml(v.phone) + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">Email:</span> <strong>' + escapeHtml(v.email) + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">GSTIN:</span> <strong style="font-family:monospace">' + escapeHtml(v.gstin) + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">Payment Terms:</span> <strong>' + escapeHtml(v.paymentTerms) + '</strong></div>' +
          '<div><span style="color:var(--text-muted)">Outstanding Payables:</span> <strong style="color:var(--blue);font-size:1.1rem">' + formatCurrency(v.outstandingBalance) + '</strong></div>' +
        '</div>' +

        '<div style="margin-top:16px;padding:12px 14px;background:#f8fafc;border-radius:var(--radius);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
          '<div>' +
            '<span style="font-size:.78rem;color:var(--text-muted);display:block">Masked Vendor Bank Credentials (Finance Access Only):</span>' +
            '<span class="bank-masked-pill">' +
              '<i data-lucide="lock" style="width:14px;height:14px;color:var(--amber)"></i> ' +
              escapeHtml(v.bankDetails.bankName) + ' · Account: ' + v.bankDetails.accountNumber + ' · IFSC: ' + v.bankDetails.ifsc +
            '</span>' +
          '</div>' +
          '<div style="display:flex;gap:16px;font-size:.82rem">' +
            '<div>On-Time Delivery: <strong style="color:var(--green)">' + v.onTimeDeliveryRate + '%</strong></div>' +
            '<div>Quality Discrepancies: <strong style="color:' + (v.qualityIssuesCount > 0 ? 'var(--red)' : 'var(--green)') + '">' + v.qualityIssuesCount + ' logged</strong></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- Transaction History Tables -->' +
    '<div class="crm-dash-grid">' +
      '<div class="card">' +
        '<div class="card-header"><h3 class="card-title"><i data-lucide="shopping-bag"></i> Purchase Orders History (' + vendorPos.length + ')</h3></div>' +
        '<div class="card-body no-padding">' +
          '<div class="table-responsive">' +
            '<table class="data-table">' +
              '<thead><tr><th>PO Number</th><th>Project</th><th>Date</th><th>Value</th><th>Status</th></tr></thead>' +
              '<tbody>' + (poRows || '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-muted)">No purchase orders recorded yet.</td></tr>') + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="card-header"><h3 class="card-title"><i data-lucide="git-compare"></i> Invoiced Bills (' + vendorBills.length + ')</h3></div>' +
        '<div class="card-body no-padding">' +
          '<div class="table-responsive">' +
            '<table class="data-table">' +
              '<thead><tr><th>Bill Ref</th><th>Invoice #</th><th>Due Date</th><th>Amount</th><th>Status</th></tr></thead>' +
              '<tbody>' +
                (vendorBills.length > 0 ?
                  vendorBills.map(function(b){
                    return '<tr>' +
                      '<td><span class="lead-id-badge" style="cursor:pointer" onclick="switchPurView(\'3way-match\', {billId:\'' + b.id + '\'})">' + b.id + '</span></td>' +
                      '<td>' + escapeHtml(b.invoiceNumber) + '</td>' +
                      '<td>' + formatDate(b.dueDate) + '</td>' +
                      '<td><strong>' + formatCurrency(b.invoiceAmount) + '</strong></td>' +
                      '<td><span class="badge badge-status-' + (b.matchStatus==='Matched'?'accepted':'mismatch') + '">' + b.matchStatus + '</span></td>' +
                    '</tr>';
                  }).join('') :
                  '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-muted)">No vendor bills recorded.</td></tr>') +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById('btn-vnd-detail-back').onclick = function() { switchPurView('vendors'); };
  document.getElementById('btn-vnd-edit').onclick = function() { openAddVendorModal(v); };
  document.getElementById('btn-vnd-new-po').onclick = function() {
    switchPurView('create-po');
  };

  lucide.createIcons();
}
