/**
 * ULI Studio ERP — Quotations Module
 * ══════════════════════════════════
 * Implements:
 *  - SCREEN 9:  Quotations List (Filter by status, search, totals)
 *  - SCREEN 10: Quotation Builder (BOQ interactive table, real-time calculations)
 *  - SCREEN 11: Quotation Detail & Revision History (Immutable sent versions, version pills)
 */

'use strict';

var QuoteListState = {
  searchQuery: '',
  statusFilter: 'all'
};

/* ══════════════════════════════════════════════════
   SCREEN 9: QUOTATIONS LIST
   ══════════════════════════════════════════════════ */

function initQuotesListFilters() {
  var statusSelect = document.getElementById('quotes-status-filter');
  var searchInput = document.getElementById('quotes-search-input');

  if (statusSelect && statusSelect.options.length <= 1) {
    CRM_QUOTE_STATUSES.forEach(function(st) {
      var opt = document.createElement('option');
      opt.value = st;
      opt.textContent = st;
      statusSelect.appendChild(opt);
    });
  }

  if (statusSelect && !statusSelect._bound) {
    statusSelect.addEventListener('change', function(e) {
      QuoteListState.statusFilter = e.target.value;
      renderQuotationsTable();
    });
    statusSelect._bound = true;
  }

  if (searchInput && !searchInput._bound) {
    searchInput.addEventListener('input', function(e) {
      QuoteListState.searchQuery = e.target.value;
      renderQuotationsTable();
    });
    searchInput._bound = true;
  }

  var btnCreate = document.getElementById('btn-create-new-quote');
  if (btnCreate && !btnCreate._bound) {
    btnCreate.addEventListener('click', function() {
      switchCrmView('quotation-builder');
    });
    btnCreate._bound = true;
  }
}

function renderQuotationsTable() {
  initQuotesListFilters();

  var tbody = document.getElementById('quotations-table-tbody');
  tbody.innerHTML = '';

  var list = CRM_QUOTATIONS.filter(function(q) {
    if (QuoteListState.statusFilter !== 'all' && q.status !== QuoteListState.statusFilter) return false;
    if (QuoteListState.searchQuery) {
      var s = QuoteListState.searchQuery.toLowerCase();
      var match = q.id.toLowerCase().indexOf(s) !== -1 ||
                  q.customerName.toLowerCase().indexOf(s) !== -1 ||
                  q.projectTitle.toLowerCase().indexOf(s) !== -1;
      if (!match) return false;
    }
    return true;
  });

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:28px;color:var(--text-muted)">No quotations found matching criteria.</td></tr>';
    return;
  }

  list.forEach(function(q) {
    var totals = calcQuoteTotals(q.items || []);
    var creator = getSalesperson(q.createdBy);

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><span class="lead-id-badge" style="cursor:pointer" data-action="view">' + escapeHtml(q.id) + '</span></td>' +
      '<td><div style="font-weight:600">' + escapeHtml(q.customerName) + '</div><div style="font-size:.73rem;color:var(--text-muted)">' + escapeHtml(q.projectTitle) + '</div></td>' +
      '<td><span class="lead-id-badge" style="cursor:pointer" data-lead-link="' + q.leadId + '">' + escapeHtml(q.leadId) + '</span></td>' +
      '<td><span class="badge badge-stage">v' + q.version + '</span></td>' +
      '<td><strong style="color:var(--text-primary)">' + formatCurrency(totals.grandTotal) + '</strong></td>' +
      '<td>' + escapeHtml(creator.name) + '</td>' +
      '<td>' + formatDate(q.createdDate) + '</td>' +
      '<td>' + formatDate(q.validUntil) + '</td>' +
      '<td><span class="badge badge-status-' + q.status.toLowerCase().replace(/\s+/g,'-') + '">' + q.status + '</span></td>' +
      '<td style="text-align:right">' +
        '<div class="table-actions" style="justify-content:flex-end">' +
          '<button class="btn btn-sm btn-outline btn-icon" title="View Quotation" data-action="view"><i data-lucide="eye"></i></button>' +
          '<button class="btn btn-sm btn-outline btn-icon" title="Edit / Revise" data-action="edit"><i data-lucide="edit-3"></i></button>' +
        '</div>' +
      '</td>';

    tr.querySelectorAll('[data-action="view"]').forEach(function(el) {
      el.addEventListener('click', function() {
        switchCrmView('quotation-detail', { quoteId: q.id });
      });
    });

    tr.querySelector('[data-action="edit"]').addEventListener('click', function() {
      // If already sent or accepted, open detail with revision prompt
      if (q.status === 'Sent' || q.status === 'Accepted') {
        promptRevisionConfirmation(q);
      } else {
        switchCrmView('quotation-builder', { quoteId: q.id });
      }
    });

    var leadLink = tr.querySelector('[data-lead-link]');
    if (leadLink) {
      leadLink.addEventListener('click', function() {
        switchCrmView('lead-detail', { leadId: q.leadId });
      });
    }

    tbody.appendChild(tr);
  });

  updateCrmBadges();
  lucide.createIcons();
}

/* ══════════════════════════════════════════════════
   SCREEN 10: QUOTATION BUILDER & BOQ EDITOR
   ══════════════════════════════════════════════════ */

var currentEditingQuote = null;

function openQuotationBuilder(quoteIdToEdit, linkedLeadId) {
  var container = document.getElementById('quotation-builder-container');

  var quote = null;
  if (quoteIdToEdit) {
    quote = CRM_QUOTATIONS.find(function(q) { return q.id === quoteIdToEdit; });
  }

  // If new quote from a lead
  var linkedLead = linkedLeadId ? CRM_LEADS.find(function(l) { return l.id === linkedLeadId; }) : null;

  var isEdit = Boolean(quote);
  var quoteRef = quote ? quote.id : 'QT-2026-Q' + String(CRM_QUOTATIONS.length + 1).padStart(2, '0');
  var quoteVersion = quote ? quote.version : 1;
  var customerName = quote ? quote.customerName : (linkedLead ? linkedLead.customerName : '');
  var projectTitle = quote ? quote.projectTitle : (linkedLead ? linkedLead.enquiryTitle : '');
  var validUntil = quote ? quote.validUntil : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  var scopeOfWork = quote ? quote.scopeOfWork : 'Comprehensive interior architectural design and fitout services as per approved concepts.';
  var terms = quote ? quote.terms : '50% advance on signing, 30% on material delivery, 20% on completion. 12-month defect liability warranty.';

  var items = quote ? JSON.parse(JSON.stringify(quote.items || [])) : [
    { desc: 'Living Room — Italian Marble Flooring', category: 'Flooring', unit: 'sqft', qty: 500, rate: 850, discount: 0, taxId: 'gst-18' },
    { desc: 'Modular Kitchen with Hardware', category: 'Furniture', unit: 'lot', qty: 1, rate: 450000, discount: 5, taxId: 'gst-18' },
    { desc: 'False Ceiling & Cove Lighting', category: 'False Ceiling', unit: 'sqft', qty: 500, rate: 220, discount: 0, taxId: 'gst-18' }
  ];

  currentEditingQuote = {
    id: quoteRef,
    isEdit: isEdit,
    originalQuote: quote,
    leadId: quote ? quote.leadId : (linkedLeadId || 'LD-2026-001'),
    customerName: customerName,
    projectTitle: projectTitle,
    version: quoteVersion,
    validUntil: validUntil,
    scopeOfWork: scopeOfWork,
    terms: terms,
    items: items,
    status: quote ? quote.status : 'Draft'
  };

  var leadsOptions = CRM_LEADS.map(function(l) {
    var isSel = l.id === currentEditingQuote.leadId;
    return '<option value="' + l.id + '" ' + (isSel ? 'selected' : '') + '>' + l.id + ' — ' + l.customerName + '</option>';
  }).join('');

  container.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<button class="lead-back-btn" id="btn-quote-back"><i data-lucide="arrow-left"></i></button>' +
        '<div>' +
          '<h2 style="font-size:1.3rem;font-weight:700;">' + (isEdit ? 'Edit Quotation — ' + quoteRef : 'New Quotation Builder') + '</h2>' +
          '<p style="font-size:.8rem;color:var(--text-secondary);">Interactive BOQ estimation with real-time tax calculation</p>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<button class="btn btn-outline btn-sm" id="btn-quote-save-draft"><i data-lucide="save"></i> Save Draft</button>' +
        '<button class="btn btn-outline btn-sm" id="btn-quote-preview"><i data-lucide="eye"></i> Preview</button>' +
        '<button class="btn btn-primary btn-sm" id="btn-quote-submit-approval"><i data-lucide="shield-check"></i> Submit for Approval</button>' +
      '</div>' +
    '</div>' +

    '<!-- Meta Header Form -->' +
    '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header"><h3 class="card-title"><i data-lucide="file-text"></i> Quotation Metadata</h3>' +
        '<span class="badge badge-stage">Version ' + quoteVersion + '</span></div>' +
      '<div class="card-body">' +
        '<div class="form-grid">' +
          '<div class="form-group">' +
            '<label>Linked Lead</label>' +
            '<select class="form-control" id="builder-lead-select">' + leadsOptions + '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Customer Name</label>' +
            '<input type="text" class="form-control" id="builder-customer-name" value="' + escapeHtml(customerName) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Project Title</label>' +
            '<input type="text" class="form-control" id="builder-project-title" value="' + escapeHtml(projectTitle) + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Validity Until</label>' +
            '<input type="date" class="form-control" id="builder-valid-until" value="' + validUntil + '">' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- BOQ Table Card -->' +
    '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header">' +
        '<h3 class="card-title"><i data-lucide="calculator"></i> Bill of Quantities (BOQ) Items</h3>' +
        '<button class="btn btn-primary btn-sm" id="btn-boq-add-row"><i data-lucide="plus"></i> Add Line Item</button>' +
      '</div>' +
      '<div class="card-body no-padding">' +
        '<div class="table-responsive boq-table-wrapper" style="margin:0;border:none">' +
          '<table class="boq-table" id="boq-items-table">' +
            '<thead>' +
              '<tr>' +
                '<th style="width:40px">#</th>' +
                '<th style="width:160px">Category</th>' +
                '<th>Item Description</th>' +
                '<th style="width:80px">Unit</th>' +
                '<th style="width:90px;text-align:right">Qty</th>' +
                '<th style="width:120px;text-align:right">Rate (₹)</th>' +
                '<th style="width:80px;text-align:right">Disc %</th>' +
                '<th style="width:120px">Tax Rate</th>' +
                '<th style="width:120px;text-align:right">Total (₹)</th>' +
                '<th style="width:40px"></th>' +
              '</tr>' +
            '</thead>' +
            '<tbody id="boq-items-tbody"></tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<!-- Summary & Scope Row -->' +
    '<div class="crm-dash-grid">' +
      '<div class="card">' +
        '<div class="card-header"><h3 class="card-title"><i data-lucide="check-square"></i> Scope & Terms</h3></div>' +
        '<div class="card-body">' +
          '<div class="form-group">' +
            '<label>Scope of Work</label>' +
            '<textarea class="form-control" id="builder-scope" rows="3">' + escapeHtml(scopeOfWork) + '</textarea>' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Terms and Payment Schedule</label>' +
            '<textarea class="form-control" id="builder-terms" rows="3">' + escapeHtml(terms) + '</textarea>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Real-time calculation summary card -->' +
      '<div class="quote-summary-card" id="boq-summary-card">' +
        '<h4 style="font-size:.9rem;font-weight:700;margin-bottom:12px;border-bottom:1px solid var(--card-border);padding-bottom:8px">Quotation Summary</h4>' +
        '<div class="quote-summary-row"><span>Gross Subtotal:</span><strong id="sum-subtotal">₹0</strong></div>' +
        '<div class="quote-summary-row"><span>Total Discounts:</span><span style="color:var(--red)" id="sum-discount">-₹0</span></div>' +
        '<div class="quote-summary-row"><span>Taxable Value:</span><strong id="sum-taxable">₹0</strong></div>' +
        '<div class="quote-summary-row"><span>GST Amount:</span><span id="sum-tax">₹0</span></div>' +
        '<div class="quote-summary-row grand-total"><span>Grand Total:</span><span style="color:var(--blue)" id="sum-grand-total">₹0</span></div>' +
        '<div style="font-size:.7rem;color:var(--text-muted);margin-top:12px;">* Real-time prototype calculation. Values verified on submit.</div>' +
      '</div>' +
    '</div>';

  // Back button
  document.getElementById('btn-quote-back').onclick = function() { switchCrmView('quotations'); };

  // Lead select change auto-updates customer & project
  document.getElementById('builder-lead-select').addEventListener('change', function(e) {
    var selLead = CRM_LEADS.find(function(l){ return l.id === e.target.value; });
    if (selLead) {
      document.getElementById('builder-customer-name').value = selLead.customerName;
      document.getElementById('builder-project-title').value = selLead.enquiryTitle;
      currentEditingQuote.leadId = selLead.id;
      currentEditingQuote.customerName = selLead.customerName;
      currentEditingQuote.projectTitle = selLead.enquiryTitle;
    }
  });

  // Add Row button
  document.getElementById('btn-boq-add-row').addEventListener('click', function() {
    currentEditingQuote.items.push({
      desc: 'New Custom Line Item',
      category: 'Carpentry',
      unit: 'nos',
      qty: 1,
      rate: 10000,
      discount: 0,
      taxId: 'gst-18'
    });
    renderBoqRows();
  });

  // Action buttons
  document.getElementById('btn-quote-save-draft').onclick = function() {
    saveQuotation('Draft');
  };
  document.getElementById('btn-quote-preview').onclick = function() {
    saveQuotation(null, true); // Preview mode
  };
  document.getElementById('btn-quote-submit-approval').onclick = function() {
    saveQuotation('Pending Approval');
  };

  renderBoqRows();
  lucide.createIcons();
}

function renderBoqRows() {
  var tbody = document.getElementById('boq-items-tbody');
  tbody.innerHTML = '';

  var categoryOptions = CRM_BOQ_CATEGORIES.map(function(c) {
    return '<option value="' + c + '">' + c + '</option>';
  }).join('');

  var taxOptions = CRM_TAX_CATEGORIES.map(function(t) {
    return '<option value="' + t.id + '">' + t.label + '</option>';
  }).join('');

  currentEditingQuote.items.forEach(function(item, idx) {
    var line = calcQuoteLine(item);
    var tr = document.createElement('tr');

    tr.innerHTML =
      '<td style="text-align:center;color:var(--text-muted)">' + (idx + 1) + '</td>' +
      '<td>' +
        '<select class="boq-input row-cat">' + categoryOptions + '</select>' +
      '</td>' +
      '<td>' +
        '<input type="text" class="boq-input row-desc" value="' + escapeHtml(item.desc) + '">' +
      '</td>' +
      '<td>' +
        '<input type="text" class="boq-input row-unit" value="' + escapeHtml(item.unit) + '">' +
      '</td>' +
      '<td>' +
        '<input type="number" class="boq-input boq-num row-qty" min="1" value="' + item.qty + '">' +
      '</td>' +
      '<td>' +
        '<input type="number" class="boq-input boq-num row-rate" min="0" value="' + item.rate + '">' +
      '</td>' +
      '<td>' +
        '<input type="number" class="boq-input boq-num row-disc" min="0" max="100" value="' + (item.discount || 0) + '">' +
      '</td>' +
      '<td>' +
        '<select class="boq-input row-tax">' + taxOptions + '</select>' +
      '</td>' +
      '<td class="boq-line-total row-total">' + formatCurrency(line.total) + '</td>' +
      '<td style="text-align:center">' +
        '<button class="btn btn-sm btn-outline btn-icon" style="color:var(--red)" title="Delete Line"><i data-lucide="trash-2"></i></button>' +
      '</td>';

    // Set initial select values
    tr.querySelector('.row-cat').value = item.category;
    tr.querySelector('.row-tax').value = item.taxId;

    // Attach dynamic recalculation listeners
    function updateRowValues() {
      item.category = tr.querySelector('.row-cat').value;
      item.desc = tr.querySelector('.row-desc').value;
      item.unit = tr.querySelector('.row-unit').value;
      item.qty = parseFloat(tr.querySelector('.row-qty').value) || 0;
      item.rate = parseFloat(tr.querySelector('.row-rate').value) || 0;
      item.discount = parseFloat(tr.querySelector('.row-disc').value) || 0;
      item.taxId = tr.querySelector('.row-tax').value;

      var updatedLine = calcQuoteLine(item);
      tr.querySelector('.row-total').textContent = formatCurrency(updatedLine.total);
      updateBoqTotals();
    }

    tr.querySelectorAll('input, select').forEach(function(input) {
      input.addEventListener('input', updateRowValues);
      input.addEventListener('change', updateRowValues);
    });

    // Delete row
    tr.querySelector('button').addEventListener('click', function() {
      currentEditingQuote.items.splice(idx, 1);
      renderBoqRows();
    });

    tbody.appendChild(tr);
  });

  updateBoqTotals();
  lucide.createIcons();
}

function updateBoqTotals() {
  var totals = calcQuoteTotals(currentEditingQuote.items || []);
  document.getElementById('sum-subtotal').textContent = formatCurrency(totals.subtotal);
  document.getElementById('sum-discount').textContent = '- ' + formatCurrency(totals.discount);
  document.getElementById('sum-taxable').textContent = formatCurrency(totals.taxable);
  document.getElementById('sum-tax').textContent = formatCurrency(totals.tax);
  document.getElementById('sum-grand-total').textContent = formatCurrency(totals.grandTotal);
}

function saveQuotation(statusToSet, isPreview) {
  currentEditingQuote.customerName = document.getElementById('builder-customer-name').value.trim();
  currentEditingQuote.projectTitle = document.getElementById('builder-project-title').value.trim();
  currentEditingQuote.validUntil = document.getElementById('builder-valid-until').value;
  currentEditingQuote.scopeOfWork = document.getElementById('builder-scope').value.trim();
  currentEditingQuote.terms = document.getElementById('builder-terms').value.trim();

  if (isPreview) {
    // Open preview modal
    openQuotationDetail(null, currentEditingQuote);
    return;
  }

  if (statusToSet) {
    currentEditingQuote.status = statusToSet;
  }

  if (currentEditingQuote.isEdit && currentEditingQuote.originalQuote) {
    // Update existing quote
    Object.assign(currentEditingQuote.originalQuote, {
      customerName: currentEditingQuote.customerName,
      projectTitle: currentEditingQuote.projectTitle,
      validUntil: currentEditingQuote.validUntil,
      scopeOfWork: currentEditingQuote.scopeOfWork,
      terms: currentEditingQuote.terms,
      items: currentEditingQuote.items,
      status: currentEditingQuote.status
    });
    showToast('Quotation ' + currentEditingQuote.id + ' saved as ' + currentEditingQuote.status, 'success');
    switchCrmView('quotation-detail', { quoteId: currentEditingQuote.id });
  } else {
    // Create new
    var newQ = {
      id: currentEditingQuote.id,
      leadId: currentEditingQuote.leadId,
      customerName: currentEditingQuote.customerName,
      projectTitle: currentEditingQuote.projectTitle,
      version: 1,
      previousVersions: [],
      createdBy: 'sp-01',
      createdDate: new Date().toISOString().slice(0, 10),
      validUntil: currentEditingQuote.validUntil,
      status: currentEditingQuote.status,
      scopeOfWork: currentEditingQuote.scopeOfWork,
      terms: currentEditingQuote.terms,
      items: currentEditingQuote.items
    };
    CRM_QUOTATIONS.unshift(newQ);

    // Record activity on linked lead
    CRM_ACTIVITIES.unshift({
      id: crmUid('ACT'),
      leadId: newQ.leadId,
      type: 'Note',
      user: 'Priya Sharma',
      timestamp: new Date().toISOString(),
      summary: 'Quotation ' + newQ.id + ' created (v1)',
      detail: 'Value: ' + formatCurrency(calcQuoteTotals(newQ.items).grandTotal) + ' | Status: ' + newQ.status
    });

    showToast('Quotation ' + newQ.id + ' created as ' + newQ.status, 'success');
    switchCrmView('quotation-detail', { quoteId: newQ.id });
  }
}

/* ══════════════════════════════════════════════════
   SCREEN 11: QUOTATION DETAIL & REVISION HISTORY
   ══════════════════════════════════════════════════ */

function openQuotationDetail(quoteId, customQuoteObj) {
  var container = document.getElementById('quotation-detail-container');
  var quote = customQuoteObj || CRM_QUOTATIONS.find(function(q) { return q.id === quoteId; });

  if (!quote) {
    container.innerHTML = '<div class="state-message"><h4>Quotation not found</h4><button class="btn btn-outline" onclick="switchCrmView(\'quotations\')">Back to Quotes</button></div>';
    return;
  }

  CrmApp.selectedQuoteId = quote.id;
  var totals = calcQuoteTotals(quote.items || []);
  var creator = getSalesperson(quote.createdBy);

  // Version pills
  var versions = [1];
  if (quote.previousVersions && quote.previousVersions.length > 0) {
    versions = quote.previousVersions.concat([quote.version]);
  } else if (quote.version > 1) {
    for (var v = 1; v <= quote.version; v++) {
      if (versions.indexOf(v) === -1) versions.push(v);
    }
  }

  var versionPillsHtml = versions.map(function(ver) {
    var isActive = ver === quote.version;
    return '<span class="version-pill ' + (isActive ? 'active' : '') + '">Version ' + ver + (isActive ? ' (Current)' : '') + '</span>';
  }).join('');

  // BOQ Item rows
  var itemRows = (quote.items || []).map(function(item, idx) {
    var line = calcQuoteLine(item);
    return '<tr>' +
      '<td>' + (idx + 1) + '</td>' +
      '<td><span class="badge badge-stage">' + escapeHtml(item.category) + '</span></td>' +
      '<td>' + escapeHtml(item.desc) + '</td>' +
      '<td>' + item.qty + ' ' + item.unit + '</td>' +
      '<td style="text-align:right">₹' + item.rate.toLocaleString('en-IN') + '</td>' +
      '<td style="text-align:right">' + (item.discount ? item.discount + '%' : '—') + '</td>' +
      '<td>' + (item.taxId === 'gst-18' ? 'GST 18%' : item.taxId) + '</td>' +
      '<td style="text-align:right;font-weight:600">' + formatCurrency(line.total) + '</td>' +
    '</tr>';
  }).join('');

  container.innerHTML =
    '<!-- Top action bar -->' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
        '<button class="lead-back-btn" id="btn-quote-detail-back"><i data-lucide="arrow-left"></i></button>' +
        '<div>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<span class="lead-id-badge" style="font-size:1rem">' + escapeHtml(quote.id) + '</span>' +
            '<span class="badge badge-status-' + quote.status.toLowerCase().replace(/\s+/g,'-') + '">' + quote.status + '</span>' +
          '</div>' +
          '<h2 style="font-size:1.3rem;font-weight:700;">' + escapeHtml(quote.customerName) + ' — ' + escapeHtml(quote.projectTitle) + '</h2>' +
        '</div>' +
      '</div>' +

      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<button class="btn btn-outline btn-sm" onclick="window.print()"><i data-lucide="printer"></i> Print / PDF</button>' +
        '<button class="btn btn-outline btn-sm" id="btn-revise-quote"><i data-lucide="git-branch"></i> Revise Quote</button>' +
        (quote.status === 'Draft' || quote.status === 'Pending Approval' ?
          '<button class="btn btn-primary btn-sm" id="btn-approve-quote"><i data-lucide="check-circle"></i> Approve Quote</button>' : '') +
        (quote.status === 'Approved' ?
          '<button class="btn btn-success btn-sm" id="btn-send-quote"><i data-lucide="send"></i> Send Quote to Client</button>' : '') +
        (quote.status === 'Sent' ?
          '<button class="btn btn-success btn-sm" id="btn-accept-quote"><i data-lucide="award"></i> Record Acceptance</button>' : '') +
      '</div>' +
    '</div>' +

    '<!-- Version history pills -->' +
    '<div class="quote-version-pills">' +
      '<span style="font-size:.78rem;font-weight:600;color:var(--text-secondary)">Version History:</span>' +
      versionPillsHtml +
    '</div>' +

    '<!-- Document Paper Container -->' +
    '<div class="quote-document-paper">' +
      '<div class="quote-doc-header">' +
        '<div>' +
          '<div class="quote-doc-logo"><i data-lucide="gem" style="vertical-align:middle;color:var(--blue)"></i> ULI STUDIO <span style="font-size:.75rem;font-weight:600;color:var(--text-muted)">ERP</span></div>' +
          '<div style="font-size:.78rem;color:var(--text-secondary);margin-top:4px;">Bespoke Interior Architecture & Execution</div>' +
          '<div style="font-size:.75rem;color:var(--text-muted)">Mumbai · Bengaluru · Gurugram</div>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<h3 style="font-size:1.15rem;font-weight:700">FORMAL QUOTATION</h3>' +
          '<div style="font-size:.82rem;font-weight:600;color:var(--blue)">Ref: ' + escapeHtml(quote.id) + ' (v' + quote.version + ')</div>' +
          '<div style="font-size:.78rem;color:var(--text-secondary)">Date: ' + formatDate(quote.createdDate) + '</div>' +
          '<div style="font-size:.78rem;color:var(--text-secondary)">Valid Until: ' + formatDate(quote.validUntil) + '</div>' +
        '</div>' +
      '</div>' +

      '<!-- Customer & Project Meta in Doc -->' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;font-size:.82rem;">' +
        '<div style="background:#f8fafc;padding:14px;border-radius:var(--radius)">' +
          '<div style="font-weight:700;margin-bottom:4px;color:#0f172a">PREPARED FOR:</div>' +
          '<div style="font-size:.92rem;font-weight:600">' + escapeHtml(quote.customerName) + '</div>' +
          '<div style="color:var(--text-secondary)">Linked Lead: ' + escapeHtml(quote.leadId) + '</div>' +
        '</div>' +
        '<div style="background:#f8fafc;padding:14px;border-radius:var(--radius)">' +
          '<div style="font-weight:700;margin-bottom:4px;color:#0f172a">PROJECT SPECIFICATION:</div>' +
          '<div style="font-size:.92rem;font-weight:600">' + escapeHtml(quote.projectTitle) + '</div>' +
          '<div style="color:var(--text-secondary)">Created by: ' + escapeHtml(creator.name) + ' (' + creator.role + ')</div>' +
        '</div>' +
      '</div>' +

      '<!-- BOQ Table in Doc -->' +
      '<table class="data-table" style="margin-bottom:24px">' +
        '<thead><tr><th>#</th><th>Category</th><th>Item Description</th><th>Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Disc</th><th>Tax</th><th style="text-align:right">Total</th></tr></thead>' +
        '<tbody>' + itemRows + '</tbody>' +
      '</table>' +

      '<!-- Doc Totals Breakdown -->' +
      '<div style="display:flex;justify-content:flex-end;margin-bottom:24px;">' +
        '<div style="width:320px;font-size:.83rem">' +
          '<div style="display:flex;justify-content:space-between;padding:4px 0"><span>Subtotal:</span><strong>' + formatCurrency(totals.subtotal) + '</strong></div>' +
          '<div style="display:flex;justify-content:space-between;padding:4px 0;color:var(--red)"><span>Total Discount:</span><span>-' + formatCurrency(totals.discount) + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:4px 0"><span>Taxable Amount:</span><strong>' + formatCurrency(totals.taxable) + '</strong></div>' +
          '<div style="display:flex;justify-content:space-between;padding:4px 0"><span>Applicable GST:</span><span>' + formatCurrency(totals.tax) + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid #0f172a;font-size:1.1rem;font-weight:800;color:var(--blue)"><span>Grand Total:</span><span>' + formatCurrency(totals.grandTotal) + '</span></div>' +
        '</div>' +
      '</div>' +

      '<!-- Scope and Terms -->' +
      '<div style="font-size:.8rem;color:var(--text-secondary);border-top:1px solid var(--card-border);padding-top:16px;">' +
        '<div style="margin-bottom:10px"><strong>Scope of Work:</strong> ' + escapeHtml(quote.scopeOfWork || 'As per architectural specifications.') + '</div>' +
        '<div><strong>Terms & Conditions:</strong> ' + escapeHtml(quote.terms || 'Standard ULI Studio terms apply.') + '</div>' +
      '</div>' +

      '<!-- Approvals audit trail -->' +
      (quote.approvedBy ?
        '<div style="margin-top:24px;padding:12px 16px;background:var(--blue-light);border-radius:var(--radius);font-size:.78rem;color:#1e40af;display:flex;justify-content:space-between;">' +
          '<span><i data-lucide="shield-check" style="width:14px;height:14px;vertical-align:text-bottom"></i> Approved by: <strong>' + getSalesperson(quote.approvedBy).name + '</strong> on ' + formatDate(quote.approvedDate) + '</span>' +
          (quote.sentDate ? '<span>Sent to Client on ' + formatDate(quote.sentDate) + '</span>' : '') +
        '</div>' : '') +
    '</div>';

  document.getElementById('btn-quote-detail-back').onclick = function() { switchCrmView('quotations'); };

  // Revise quote button
  document.getElementById('btn-revise-quote').onclick = function() {
    promptRevisionConfirmation(quote);
  };

  // Approve quote
  var btnApprove = document.getElementById('btn-approve-quote');
  if (btnApprove) {
    btnApprove.onclick = function() {
      quote.status = 'Approved';
      quote.approvedBy = 'sp-01';
      quote.approvedDate = new Date().toISOString().slice(0, 10);
      showToast('Quotation ' + quote.id + ' approved', 'success');
      openQuotationDetail(quote.id);
    };
  }

  // Send quote to client
  var btnSend = document.getElementById('btn-send-quote');
  if (btnSend) {
    btnSend.onclick = function() {
      quote.status = 'Sent';
      quote.sentDate = new Date().toISOString().slice(0, 10);

      // Advance linked lead to quotation-sent
      var lead = CRM_LEADS.find(function(l) { return l.id === quote.leadId; });
      if (lead && lead.stage === 'quotation-preparation') {
        lead.stage = 'quotation-sent';
      }

      showToast('Quotation sent to client (demo action)', 'success');
      openQuotationDetail(quote.id);
    };
  }

  // Record acceptance
  var btnAccept = document.getElementById('btn-accept-quote');
  if (btnAccept) {
    btnAccept.onclick = function() {
      quote.status = 'Accepted';
      quote.acceptedDate = new Date().toISOString().slice(0, 10);

      // Prompt to advance lead to Won
      var lead = CRM_LEADS.find(function(l) { return l.id === quote.leadId; });
      if (lead) {
        promptStageChangeModal(lead, 'won');
      }

      showToast('Quotation marked as Accepted by customer', 'success');
      openQuotationDetail(quote.id);
    };
  }

  lucide.createIcons();
}

/* ── Business Rule: If a sent quote is edited, create a new version without overwriting ── */
function promptRevisionConfirmation(quote) {
  openModal({
    title: 'Create Quotation Revision',
    body:
      '<div class="alert alert-info">' +
        '<i data-lucide="info"></i>' +
        '<div>' +
          '<strong>Revision Preserves Historical Sent Version</strong><br>' +
          'Quotation <strong>' + quote.id + '</strong> (v' + quote.version + ') was already ' + quote.status.toLowerCase() + '. Creating a revision will archive the current version and generate <strong>Version ' + (quote.version + 1) + '</strong>.' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Reason for Revision <span class="required">*</span></label>' +
        '<input type="text" class="form-control" id="modal-revision-reason" placeholder="e.g. Client requested marble floor upgrade to Statuario" required>' +
      '</div>',
    confirmText: 'Generate Version ' + (quote.version + 1),
    onConfirm: function() {
      var reason = document.getElementById('modal-revision-reason').value.trim();
      if (!reason) {
        showToast('Please state a reason for revision', 'error');
        return false;
      }

      // Archive previous version
      if (!quote.previousVersions) quote.previousVersions = [];
      quote.previousVersions.push(quote.version);

      quote.version += 1;
      quote.status = 'Draft';
      quote.createdDate = new Date().toISOString().slice(0, 10);
      quote.approvedBy = null;
      quote.approvedDate = null;
      quote.sentDate = null;

      CRM_ACTIVITIES.unshift({
        id: crmUid('ACT'),
        leadId: quote.leadId,
        type: 'Note',
        user: 'Priya Sharma',
        timestamp: new Date().toISOString(),
        summary: 'Quotation revised to v' + quote.version,
        detail: 'Reason: ' + reason
      });

      showToast('Quotation revised to Version ' + quote.version, 'success');
      switchCrmView('quotation-builder', { quoteId: quote.id });
      return true;
    }
  });
}
