/**
 * ULI Studio ERP — Leads Management Module
 * ═════════════════════════════════════════
 * Implements:
 *  - SCREEN 2: Leads List (Search, Filters, Sorting, Pagination, Actions)
 *  - SCREEN 3: Create / Edit Lead (Form Validation & Duplicate Checking)
 *  - SCREEN 4: Lead Detail Workspace (7 Tabs, Stage Stepper, Activity Composer)
 */

'use strict';

/* ── State for Leads List ── */
var LeadsState = {
  searchQuery: '',
  stageFilter: 'all',
  salespersonFilter: 'all',
  sourceFilter: 'all',
  priorityFilter: 'all',
  sortField: 'id',
  sortAsc: false,
  page: 1,
  pageSize: 8
};

/* ══════════════════════════════════════════════════
   SCREEN 2: LEADS LIST DATA TABLE
   ══════════════════════════════════════════════════ */

function initLeadsFilters() {
  var stageSelect = document.getElementById('leads-stage-filter');
  var spSelect = document.getElementById('leads-salesperson-filter');
  var srcSelect = document.getElementById('leads-source-filter');
  var prioSelect = document.getElementById('leads-priority-filter');
  var searchInput = document.getElementById('leads-search-input');

  if (stageSelect && stageSelect.options.length <= 1) {
    CRM_STAGES.forEach(function(s) {
      var opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.label;
      stageSelect.appendChild(opt);
    });
  }

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

  if (prioSelect && prioSelect.options.length <= 1) {
    CRM_PRIORITIES.forEach(function(p) {
      var opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p + ' Priority';
      prioSelect.appendChild(opt);
    });
  }

  // Filter bindings
  if (searchInput && !searchInput._bound) {
    searchInput.addEventListener('input', function(e) {
      LeadsState.searchQuery = e.target.value;
      LeadsState.page = 1;
      renderLeadsTable();
    });
    searchInput._bound = true;
  }
  if (stageSelect && !stageSelect._bound) {
    stageSelect.addEventListener('change', function(e) {
      LeadsState.stageFilter = e.target.value;
      LeadsState.page = 1;
      renderLeadsTable();
    });
    stageSelect._bound = true;
  }
  if (spSelect && !spSelect._bound) {
    spSelect.addEventListener('change', function(e) {
      LeadsState.salespersonFilter = e.target.value;
      LeadsState.page = 1;
      renderLeadsTable();
    });
    spSelect._bound = true;
  }
  if (srcSelect && !srcSelect._bound) {
    srcSelect.addEventListener('change', function(e) {
      LeadsState.sourceFilter = e.target.value;
      LeadsState.page = 1;
      renderLeadsTable();
    });
    srcSelect._bound = true;
  }
  if (prioSelect && !prioSelect._bound) {
    prioSelect.addEventListener('change', function(e) {
      LeadsState.priorityFilter = e.target.value;
      LeadsState.page = 1;
      renderLeadsTable();
    });
    prioSelect._bound = true;
  }

  // Sorting header click listeners
  document.querySelectorAll('#leads-data-table th.sortable').forEach(function(th) {
    if (!th._bound) {
      th.addEventListener('click', function() {
        var field = th.getAttribute('data-sort');
        if (LeadsState.sortField === field) {
          LeadsState.sortAsc = !LeadsState.sortAsc;
        } else {
          LeadsState.sortField = field;
          LeadsState.sortAsc = true;
        }
        renderLeadsTable();
      });
      th._bound = true;
    }
  });

  // Add lead button in filter bar
  var btnAdd = document.getElementById('btn-leads-add-new');
  if (btnAdd && !btnAdd._bound) {
    btnAdd.addEventListener('click', function() {
      switchCrmView('create-lead');
    });
    btnAdd._bound = true;
  }
}

function getFilteredAndSortedLeads() {
  var list = CRM_LEADS.filter(function(lead) {
    // Search query across ID, customer name, enquiry title, phone, email
    if (LeadsState.searchQuery) {
      var q = LeadsState.searchQuery.toLowerCase();
      var match = lead.id.toLowerCase().indexOf(q) !== -1 ||
                  lead.customerName.toLowerCase().indexOf(q) !== -1 ||
                  lead.enquiryTitle.toLowerCase().indexOf(q) !== -1 ||
                  (lead.phone && lead.phone.indexOf(q) !== -1) ||
                  (lead.email && lead.email.toLowerCase().indexOf(q) !== -1);
      if (!match) return false;
    }

    if (LeadsState.stageFilter !== 'all' && lead.stage !== LeadsState.stageFilter) return false;
    if (LeadsState.salespersonFilter !== 'all' && lead.salesperson !== LeadsState.salespersonFilter) return false;
    if (LeadsState.sourceFilter !== 'all' && lead.source !== LeadsState.sourceFilter) return false;
    if (LeadsState.priorityFilter !== 'all' && lead.priority !== LeadsState.priorityFilter) return false;

    return true;
  });

  // Sort
  list.sort(function(a, b) {
    var valA = a[LeadsState.sortField];
    var valB = b[LeadsState.sortField];
    if (LeadsState.sortField === 'customer') {
      valA = a.customerName;
      valB = b.customerName;
    } else if (LeadsState.sortField === 'value') {
      valA = a.expectedValue || 0;
      valB = b.expectedValue || 0;
    }

    if (valA < valB) return LeadsState.sortAsc ? -1 : 1;
    if (valA > valB) return LeadsState.sortAsc ? 1 : -1;
    return 0;
  });

  return list;
}

function renderLeadsTable() {
  initLeadsFilters();

  var leads = getFilteredAndSortedLeads();
  var tbody = document.getElementById('leads-table-tbody');
  var emptyState = document.getElementById('leads-empty-state');
  var paginationInfo = document.getElementById('leads-pagination-info');
  var paginationControls = document.getElementById('leads-pagination-controls');

  tbody.innerHTML = '';

  if (leads.length === 0) {
    emptyState.classList.remove('hidden');
    paginationInfo.textContent = 'Showing 0 leads';
    paginationControls.innerHTML = '';
    return;
  }
  emptyState.classList.add('hidden');

  // Pagination slice
  var totalPages = Math.ceil(leads.length / LeadsState.pageSize);
  if (LeadsState.page > totalPages) LeadsState.page = totalPages;
  var startIdx = (LeadsState.page - 1) * LeadsState.pageSize;
  var pageItems = leads.slice(startIdx, startIdx + LeadsState.pageSize);

  paginationInfo.textContent = 'Showing ' + (startIdx + 1) + ' to ' + Math.min(startIdx + LeadsState.pageSize, leads.length) + ' of ' + leads.length + ' leads';

  // Render rows
  pageItems.forEach(function(lead) {
    var stage = getStageInfo(lead.stage);
    var sp = getSalesperson(lead.salesperson);
    var isOverdue = lead.nextFollowup && isDateOverdue(lead.nextFollowup);

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><span class="lead-id-badge" style="cursor:pointer" title="View Lead">' + escapeHtml(lead.id) + '</span></td>' +
      '<td>' +
        '<div class="lead-customer-cell">' +
          '<span class="lead-customer-name" data-lead-id="' + lead.id + '">' + escapeHtml(lead.customerName) + '</span>' +
          '<span class="lead-project-title">' + escapeHtml(lead.enquiryTitle) + '</span>' +
        '</div>' +
      '</td>' +
      '<td>' +
        '<div class="lead-contact-info">' +
          '<div>' + escapeHtml(lead.phone) + '</div>' +
          '<div style="color:var(--text-muted);font-size:.71rem">' + escapeHtml(lead.email || '—') + '</div>' +
        '</div>' +
      '</td>' +
      '<td>' +
        '<div>' + escapeHtml(lead.enquiryType) + '</div>' +
        '<span class="badge badge-stage" style="margin-top:2px">' + escapeHtml(lead.source) + '</span>' +
      '</td>' +
      '<td>' +
        '<div style="font-weight:500">' + escapeHtml(sp.name) + '</div>' +
        '<span class="badge badge-priority-' + (lead.priority || 'medium').toLowerCase() + '">' + lead.priority + '</span>' +
      '</td>' +
      '<td>' +
        '<span class="badge badge-stage" style="border-left: 3px solid ' + stage.color + '">' +
          escapeHtml(stage.label) +
        '</span>' +
      '</td>' +
      '<td><span class="lead-value">' + formatCurrency(lead.expectedValue) + '</span></td>' +
      '<td>' +
        (lead.nextFollowup ?
          '<span class="next-followup-badge ' + (isOverdue ? 'next-followup-overdue' : '') + '">' +
            '<i data-lucide="' + (isOverdue ? 'alert-circle' : 'calendar') + '" style="width:12px;height:12px"></i>' +
            formatDate(lead.nextFollowup) +
          '</span>' : '<span style="color:var(--text-muted)">—</span>') +
      '</td>' +
      '<td style="font-size:.75rem;color:var(--text-muted)">' + formatDate(lead.createdDate) + '</td>' +
      '<td style="text-align:right">' +
        '<div class="table-actions" style="justify-content:flex-end">' +
          '<button class="btn btn-sm btn-outline btn-icon" title="View Workspace" data-action="view"><i data-lucide="eye"></i></button>' +
          '<button class="btn btn-sm btn-outline btn-icon" title="Change Stage" data-action="stage"><i data-lucide="git-pull-request"></i></button>' +
          '<button class="btn btn-sm btn-outline btn-icon" title="Assign Salesperson" data-action="assign"><i data-lucide="user-check"></i></button>' +
        '</div>' +
      '</td>';

    // Click on customer or view icon
    tr.querySelector('.lead-customer-name').addEventListener('click', function() {
      switchCrmView('lead-detail', { leadId: lead.id });
    });
    tr.querySelector('.lead-id-badge').addEventListener('click', function() {
      switchCrmView('lead-detail', { leadId: lead.id });
    });
    tr.querySelector('[data-action="view"]').addEventListener('click', function() {
      switchCrmView('lead-detail', { leadId: lead.id });
    });

    // Change stage action
    tr.querySelector('[data-action="stage"]').addEventListener('click', function() {
      promptStageChangeModal(lead);
    });

    // Reassign salesperson action
    tr.querySelector('[data-action="assign"]').addEventListener('click', function() {
      promptAssignModal(lead);
    });

    tbody.appendChild(tr);
  });

  // Render pagination buttons
  paginationControls.innerHTML = '';
  for (var i = 1; i <= totalPages; i++) {
    (function(pageIndex) {
      var btn = document.createElement('button');
      btn.className = 'page-btn' + (pageIndex === LeadsState.page ? ' active' : '');
      btn.textContent = pageIndex;
      btn.addEventListener('click', function() {
        LeadsState.page = pageIndex;
        renderLeadsTable();
      });
      paginationControls.appendChild(btn);
    })(i);
  }

  lucide.createIcons();
}

/* ══════════════════════════════════════════════════
   SCREEN 3: CREATE & EDIT LEAD
   ══════════════════════════════════════════════════ */

function populateCreateLeadSelects() {
  var enqTypeSelect = document.getElementById('inp-lead-enquiry-type');
  var propTypeSelect = document.getElementById('inp-lead-property-type');
  var srvSelect = document.getElementById('inp-lead-service');
  var budgetSelect = document.getElementById('inp-lead-budget');
  var srcSelect = document.getElementById('inp-lead-source');
  var spSelect = document.getElementById('inp-lead-salesperson');
  var prioSelect = document.getElementById('inp-lead-priority');

  function fillSelect(sel, items) {
    if (sel && sel.options.length === 0) {
      items.forEach(function(item) {
        var opt = document.createElement('option');
        if (typeof item === 'object') {
          opt.value = item.id;
          opt.textContent = item.name;
        } else {
          opt.value = item;
          opt.textContent = item;
        }
        sel.appendChild(opt);
      });
    }
  }

  fillSelect(enqTypeSelect, CRM_ENQUIRY_TYPES);
  fillSelect(propTypeSelect, CRM_PROPERTY_TYPES);
  fillSelect(srvSelect, CRM_SERVICES);
  fillSelect(budgetSelect, CRM_BUDGET_RANGES);
  fillSelect(srcSelect, CRM_SOURCES);
  fillSelect(spSelect, CRM_SALESPEOPLE);
  fillSelect(prioSelect, CRM_PRIORITIES);
}

function initCreateLeadForm(leadIdToEdit) {
  populateCreateLeadSelects();

  var form = document.getElementById('create-lead-form');
  var dupWarning = document.getElementById('duplicate-customer-warning');
  var dupText = document.getElementById('duplicate-warning-text');
  dupWarning.classList.add('hidden');

  form.reset();

  // If editing an existing lead, prefill
  var isEdit = Boolean(leadIdToEdit);
  var existingLead = isEdit ? CRM_LEADS.find(function(l){ return l.id === leadIdToEdit; }) : null;

  if (existingLead) {
    document.getElementById('inp-lead-name').value = existingLead.customerName || '';
    document.getElementById('inp-lead-phone').value = existingLead.phone || '';
    document.getElementById('inp-lead-email').value = existingLead.email || '';
    document.getElementById('inp-lead-alt-phone').value = existingLead.altContact || '';
    document.getElementById('inp-lead-address').value = existingLead.address || '';
    document.getElementById('inp-lead-title').value = existingLead.enquiryTitle || '';
    document.getElementById('inp-lead-enquiry-type').value = existingLead.enquiryType || CRM_ENQUIRY_TYPES[0];
    document.getElementById('inp-lead-property-type').value = existingLead.propertyType || CRM_PROPERTY_TYPES[0];
    document.getElementById('inp-lead-location').value = existingLead.projectLocation || '';
    document.getElementById('inp-lead-service').value = existingLead.serviceRequired || CRM_SERVICES[0];
    document.getElementById('inp-lead-area').value = existingLead.approxArea || '';
    document.getElementById('inp-lead-budget').value = existingLead.budgetRange || CRM_BUDGET_RANGES[0];
    document.getElementById('inp-lead-value').value = existingLead.expectedValue || '';
    document.getElementById('inp-lead-start-date').value = existingLead.expectedStartDate || '';
    document.getElementById('inp-lead-source').value = existingLead.source || CRM_SOURCES[0];
    document.getElementById('inp-lead-salesperson').value = existingLead.salesperson || CRM_SALESPEOPLE[0].id;
    document.getElementById('inp-lead-priority').value = existingLead.priority || 'Medium';
    document.getElementById('inp-lead-stage').value = existingLead.stage || 'new-enquiry';
    document.getElementById('inp-lead-desc').value = existingLead.description || '';
    if (existingLead.nextFollowup) {
      document.getElementById('inp-lead-next-followup').value = existingLead.nextFollowup.slice(0, 16);
    }
  }

  // Real-time duplicate customer detector
  var nameInput = document.getElementById('inp-lead-name');
  var phoneInput = document.getElementById('inp-lead-phone');

  function checkDuplicates() {
    var nameVal = (nameInput.value || '').trim().toLowerCase();
    var phoneVal = (phoneInput.value || '').trim();

    if (nameVal.length < 3 && phoneVal.length < 5) {
      dupWarning.classList.add('hidden');
      return;
    }

    var duplicate = CRM_LEADS.find(function(l) {
      if (existingLead && l.id === existingLead.id) return false;
      var nameMatch = nameVal.length >= 3 && l.customerName.toLowerCase().indexOf(nameVal) !== -1;
      var phoneMatch = phoneVal.length >= 7 && l.phone.replace(/\D/g,'').indexOf(phoneVal.replace(/\D/g,'')) !== -1;
      return nameMatch || phoneMatch;
    });

    if (duplicate) {
      dupWarning.classList.remove('hidden');
      dupText.innerHTML = 'Customer <strong>' + escapeHtml(duplicate.customerName) + '</strong> already exists under lead <strong>' + duplicate.id + '</strong> (' + duplicate.enquiryTitle + '). Phone: ' + duplicate.phone;
    } else {
      dupWarning.classList.add('hidden');
    }
  }

  nameInput.oninput = checkDuplicates;
  phoneInput.oninput = checkDuplicates;

  // Back button
  document.getElementById('btn-create-lead-back').onclick = function() { switchCrmView('leads'); };
  document.getElementById('btn-create-lead-cancel').onclick = function() { switchCrmView('leads'); };

  // Form submission with validation
  form.onsubmit = function(e) {
    e.preventDefault();

    var name = nameInput.value.trim();
    var phone = phoneInput.value.trim();
    var title = document.getElementById('inp-lead-title').value.trim();
    var value = parseFloat(document.getElementById('inp-lead-value').value);

    // Validate
    var hasError = false;
    if (!name) {
      document.getElementById('fg-customerName').classList.add('has-error');
      hasError = true;
    } else {
      document.getElementById('fg-customerName').classList.remove('has-error');
    }

    if (!phone || phone.length < 8) {
      document.getElementById('fg-customerPhone').classList.add('has-error');
      hasError = true;
    } else {
      document.getElementById('fg-customerPhone').classList.remove('has-error');
    }

    if (!title) {
      document.getElementById('fg-enquiryTitle').classList.add('has-error');
      hasError = true;
    } else {
      document.getElementById('fg-enquiryTitle').classList.remove('has-error');
    }

    if (isNaN(value) || value <= 0) {
      document.getElementById('inp-lead-value').parentElement.classList.add('has-error');
      hasError = true;
    } else {
      document.getElementById('inp-lead-value').parentElement.classList.remove('has-error');
    }

    if (hasError) {
      showToast('Please fix required validation errors', 'error');
      return;
    }

    if (isEdit && existingLead) {
      // Update
      existingLead.customerName = name;
      existingLead.phone = phone;
      existingLead.email = document.getElementById('inp-lead-email').value.trim();
      existingLead.altContact = document.getElementById('inp-lead-alt-phone').value.trim();
      existingLead.address = document.getElementById('inp-lead-address').value.trim();
      existingLead.enquiryTitle = title;
      existingLead.enquiryType = document.getElementById('inp-lead-enquiry-type').value;
      existingLead.propertyType = document.getElementById('inp-lead-property-type').value;
      existingLead.projectLocation = document.getElementById('inp-lead-location').value.trim();
      existingLead.serviceRequired = document.getElementById('inp-lead-service').value;
      existingLead.approxArea = document.getElementById('inp-lead-area').value.trim();
      existingLead.budgetRange = document.getElementById('inp-lead-budget').value;
      existingLead.expectedValue = value;
      existingLead.expectedStartDate = document.getElementById('inp-lead-start-date').value;
      existingLead.source = document.getElementById('inp-lead-source').value;
      existingLead.salesperson = document.getElementById('inp-lead-salesperson').value;
      existingLead.priority = document.getElementById('inp-lead-priority').value;
      existingLead.description = document.getElementById('inp-lead-desc').value.trim();
      existingLead.nextFollowup = document.getElementById('inp-lead-next-followup').value || null;
      existingLead.updatedDate = new Date().toISOString();

      showToast('Lead ' + existingLead.id + ' updated successfully', 'success');
      switchCrmView('lead-detail', { leadId: existingLead.id });
    } else {
      // Create new lead with unique ID
      var newId = 'LD-2026-' + String(CRM_LEADS.length + 1).padStart(3, '0');
      var now = new Date().toISOString();

      var newLead = {
        id: newId,
        customerName: name,
        phone: phone,
        email: document.getElementById('inp-lead-email').value.trim(),
        altContact: document.getElementById('inp-lead-alt-phone').value.trim(),
        address: document.getElementById('inp-lead-address').value.trim(),
        enquiryTitle: title,
        enquiryType: document.getElementById('inp-lead-enquiry-type').value,
        propertyType: document.getElementById('inp-lead-property-type').value,
        projectLocation: document.getElementById('inp-lead-location').value.trim(),
        serviceRequired: document.getElementById('inp-lead-service').value,
        approxArea: document.getElementById('inp-lead-area').value.trim(),
        budgetRange: document.getElementById('inp-lead-budget').value,
        expectedValue: value,
        expectedStartDate: document.getElementById('inp-lead-start-date').value,
        source: document.getElementById('inp-lead-source').value,
        salesperson: document.getElementById('inp-lead-salesperson').value,
        priority: document.getElementById('inp-lead-priority').value,
        stage: document.getElementById('inp-lead-stage').value || 'new-enquiry',
        description: document.getElementById('inp-lead-desc').value.trim(),
        notes: '',
        nextFollowup: document.getElementById('inp-lead-next-followup').value || null,
        createdDate: now,
        updatedDate: now
      };

      CRM_LEADS.unshift(newLead);

      // Record activity
      CRM_ACTIVITIES.unshift({
        id: crmUid('ACT'),
        leadId: newId,
        type: 'Note',
        user: 'Priya Sharma',
        timestamp: now,
        summary: 'Lead created in CRM',
        detail: 'Initial enquiry captured from source: ' + newLead.source
      });

      // Record stage history
      CRM_STAGE_HISTORY.unshift({
        leadId: newId,
        from: null,
        to: newLead.stage,
        date: now,
        user: 'Priya Sharma',
        notes: 'Lead initiated in system.'
      });

      // If next followup date entered, create followup record
      if (newLead.nextFollowup) {
        CRM_FOLLOWUPS.unshift({
          id: crmUid('FU'),
          leadId: newId,
          customerName: newLead.customerName,
          assignedTo: newLead.salesperson,
          date: newLead.nextFollowup,
          type: 'Call',
          status: 'Pending',
          notes: 'First discovery call with customer.'
        });
      }

      updateCrmBadges();
      showToast('Lead ' + newId + ' created successfully!', 'success');
      switchCrmView('lead-detail', { leadId: newId });
    }
  };
}

/* ══════════════════════════════════════════════════
   SCREEN 4: LEAD DETAIL WORKSPACE
   ══════════════════════════════════════════════════ */

function openLeadDetail(leadId) {
  CrmApp.selectedLeadId = leadId;
  var container = document.getElementById('lead-detail-container');
  var lead = CRM_LEADS.find(function(l) { return l.id === leadId; });

  if (!lead) {
    container.innerHTML = '<div class="state-message"><h4>Lead not found</h4><button class="btn btn-outline" onclick="switchCrmView(\'leads\')">Back to Leads</button></div>';
    return;
  }

  var sp = getSalesperson(lead.salesperson);
  var stage = getStageInfo(lead.stage);

  // Build stage stepper milestones
  var currentStageOrder = stage.order || 1;
  var stepperHtml = '<div class="stage-stepper">';
  CRM_STAGES.forEach(function(s, idx) {
    var isCurrent = s.id === lead.stage;
    var isPast = s.order < currentStageOrder && lead.stage !== 'lost';
    var isLost = s.id === 'lost' && lead.stage === 'lost';

    var cls = 'stage-step';
    if (isCurrent) cls += ' active';
    else if (isPast) cls += ' completed';
    else if (isLost) cls += ' lost-stage';

    stepperHtml +=
      '<button class="' + cls + '" data-step-stage="' + s.id + '" title="Click to move stage">' +
        (isPast ? '<i data-lucide="check" style="width:12px;height:12px"></i>' : '') +
        escapeHtml(s.label) +
      '</button>';

    if (idx < CRM_STAGES.length - 1) {
      stepperHtml += '<i data-lucide="chevron-right" class="stage-arrow"></i>';
    }
  });
  stepperHtml += '</div>';

  container.innerHTML =
    '<!-- Header Card -->' +
    '<div class="lead-detail-header">' +
      '<div class="lead-detail-top">' +
        '<div class="lead-detail-title-group">' +
          '<button class="lead-back-btn" id="btn-detail-back" title="Back to Leads List"><i data-lucide="arrow-left"></i></button>' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:8px">' +
              '<span class="lead-id-badge" style="font-size:.9rem">' + escapeHtml(lead.id) + '</span>' +
              '<span class="badge badge-priority-' + (lead.priority||'medium').toLowerCase() + '">' + lead.priority + ' Priority</span>' +
              (lead.stage === 'won' ? '<span class="badge badge-status-accepted"><i data-lucide="check-circle" style="width:12px;height:12px"></i> Won Deal</span>' : '') +
              (lead.stage === 'lost' ? '<span class="badge badge-status-overdue"><i data-lucide="x-circle" style="width:12px;height:12px"></i> Lost: ' + escapeHtml(lead.lostReason||'Unspecified') + '</span>' : '') +
            '</div>' +
            '<h2 class="lead-detail-name">' + escapeHtml(lead.customerName) + '</h2>' +
            '<div class="lead-detail-subtitle">' + escapeHtml(lead.enquiryTitle) + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
          '<button class="btn btn-outline btn-sm" id="btn-detail-edit"><i data-lucide="edit-3"></i> Edit Lead</button>' +
          '<button class="btn btn-outline btn-sm" id="btn-detail-reassign"><i data-lucide="user-check"></i> Assign Rep</button>' +
          '<button class="btn btn-outline btn-sm" id="btn-detail-schedule-fu"><i data-lucide="calendar-plus"></i> Follow-up</button>' +
          '<button class="btn btn-primary btn-sm" id="btn-detail-new-quote"><i data-lucide="file-plus"></i> Create Quote</button>' +
        '</div>' +
      '</div>' +

      '<!-- Interactive Stage Stepper -->' +
      stepperHtml +

      '<!-- Key detail chips -->' +
      '<div class="detail-chips">' +
        '<div class="detail-chip"><i data-lucide="indian-rupee"></i> Expected: <strong>' + formatCurrency(lead.expectedValue) + '</strong></div>' +
        '<div class="detail-chip"><i data-lucide="user"></i> Owner: <strong>' + escapeHtml(sp.name) + '</strong></div>' +
        '<div class="detail-chip"><i data-lucide="phone"></i> Phone: <strong>' + escapeHtml(lead.phone) + '</strong></div>' +
        '<div class="detail-chip"><i data-lucide="mail"></i> Email: <strong>' + escapeHtml(lead.email || '—') + '</strong></div>' +
        '<div class="detail-chip"><i data-lucide="calendar"></i> Next Action: <strong>' + (lead.nextFollowup ? formatDateTime(lead.nextFollowup) : 'None scheduled') + '</strong></div>' +
      '</div>' +
    '</div>' +

    '<!-- Won Project Handoff Alert -->' +
    (lead.stage === 'won' ?
      '<div class="alert alert-success" style="margin-bottom:20px;">' +
        '<i data-lucide="trophy"></i>' +
        '<div>' +
          '<strong>Deal Won & Client Accepted!</strong>' +
          '<div>' + (lead.wonNotes || 'Customer accepted formal quotation.') + ' In full ERP production, this action will automatically trigger a new project workspace in the Project Management module.</div>' +
        '</div>' +
      '</div>' : '') +

    '<!-- 7 Detail Tabs -->' +
    '<div class="lead-detail-tabs" id="lead-subtabs">' +
      '<button class="lead-subtab-btn active" data-tab="overview"><i data-lucide="info"></i> Overview</button>' +
      '<button class="lead-subtab-btn" data-tab="activities"><i data-lucide="activity"></i> Activities</button>' +
      '<button class="lead-subtab-btn" data-tab="followups"><i data-lucide="calendar-clock"></i> Follow-ups</button>' +
      '<button class="lead-subtab-btn" data-tab="visits"><i data-lucide="map-pin"></i> Site Visits</button>' +
      '<button class="lead-subtab-btn" data-tab="quotations"><i data-lucide="file-text"></i> Quotations</button>' +
      '<button class="lead-subtab-btn" data-tab="history"><i data-lucide="history"></i> Stage History</button>' +
      '<button class="lead-subtab-btn" data-tab="documents"><i data-lucide="folder"></i> Documents</button>' +
    '</div>' +

    '<!-- Tab Content Pane -->' +
    '<div id="lead-subtab-content"></div>';

  // Bind Stepper Click
  container.querySelectorAll('[data-step-stage]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var targetStage = btn.getAttribute('data-step-stage');
      if (targetStage !== lead.stage) {
        promptStageChangeModal(lead, targetStage);
      }
    });
  });

  // Top header button listeners
  document.getElementById('btn-detail-back').onclick = function() { switchCrmView('leads'); };
  document.getElementById('btn-detail-edit').onclick = function() { switchCrmView('create-lead', { leadIdToEdit: lead.id }); };
  document.getElementById('btn-detail-reassign').onclick = function() { promptAssignModal(lead); };
  document.getElementById('btn-detail-schedule-fu').onclick = function() {
    if (typeof openFollowupModal === 'function') openFollowupModal(null, lead.id);
  };
  document.getElementById('btn-detail-new-quote').onclick = function() {
    switchCrmView('quotation-builder', { linkedLeadId: lead.id });
  };

  // Subtab switching
  var subtabs = container.querySelectorAll('.lead-subtab-btn');
  subtabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      subtabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      renderLeadSubtab(lead, tab.getAttribute('data-tab'));
    });
  });

  // Initial render: Overview subtab
  renderLeadSubtab(lead, 'overview');
  lucide.createIcons();
}

function renderLeadSubtab(lead, tabName) {
  var content = document.getElementById('lead-subtab-content');
  if (!content) return;

  if (tabName === 'overview') {
    content.innerHTML =
      '<div class="crm-dash-grid">' +
        '<div class="card">' +
          '<div class="card-header"><h3 class="card-title"><i data-lucide="home"></i> Project & Space Specifications</h3></div>' +
          '<div class="card-body">' +
            '<div class="detail-row"><span class="detail-label">Project Title:</span><span class="detail-value"><strong>' + escapeHtml(lead.enquiryTitle) + '</strong></span></div>' +
            '<div class="detail-row"><span class="detail-label">Property Type:</span><span class="detail-value">' + escapeHtml(lead.propertyType) + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">Location:</span><span class="detail-value">' + escapeHtml(lead.projectLocation || '—') + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">Service Required:</span><span class="detail-value">' + escapeHtml(lead.serviceRequired) + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">Approx Area:</span><span class="detail-value">' + escapeHtml(lead.approxArea || '—') + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">Budget Range:</span><span class="detail-value">' + escapeHtml(lead.budgetRange) + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">Expected Value:</span><span class="detail-value" style="font-weight:700;color:var(--blue)">' + formatCurrency(lead.expectedValue) + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">Expected Start:</span><span class="detail-value">' + formatDate(lead.expectedStartDate) + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">Scope Description:</span><span class="detail-value">' + escapeHtml(lead.description || 'No detailed scope recorded') + '</span></div>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card-header"><h3 class="card-title"><i data-lucide="user"></i> Customer & Acquisition Profile</h3></div>' +
          '<div class="card-body">' +
            '<div class="detail-row"><span class="detail-label">Customer Name:</span><span class="detail-value"><strong>' + escapeHtml(lead.customerName) + '</strong></span></div>' +
            '<div class="detail-row"><span class="detail-label">Phone:</span><span class="detail-value">' + escapeHtml(lead.phone) + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">Email:</span><span class="detail-value">' + escapeHtml(lead.email || '—') + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">Alt Contact:</span><span class="detail-value">' + escapeHtml(lead.altContact || '—') + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">Address:</span><span class="detail-value">' + escapeHtml(lead.address || '—') + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">Acquisition Source:</span><span class="detail-value"><span class="badge badge-stage">' + escapeHtml(lead.source) + '</span></span></div>' +
            '<div class="detail-row"><span class="detail-label">Created Date:</span><span class="detail-value">' + formatDate(lead.createdDate) + '</span></div>' +
            '<div class="detail-row"><span class="detail-label">Internal Notes:</span><span class="detail-value">' + escapeHtml(lead.notes || '—') + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  } else if (tabName === 'activities') {
    // Activity Composer + Activities List
    var leadActivities = CRM_ACTIVITIES.filter(function(a) { return a.leadId === lead.id; });

    content.innerHTML =
      '<!-- Composer Card -->' +
      '<div class="activity-composer">' +
        '<div class="composer-types" id="composer-types">' +
          '<button class="composer-type-btn active" data-act-type="Call"><i data-lucide="phone"></i> Log Call</button>' +
          '<button class="composer-type-btn" data-act-type="Email"><i data-lucide="mail"></i> Log Email</button>' +
          '<button class="composer-type-btn" data-act-type="Meeting"><i data-lucide="users"></i> Meeting</button>' +
          '<button class="composer-type-btn" data-act-type="WhatsApp"><i data-lucide="message-square"></i> WhatsApp</button>' +
          '<button class="composer-type-btn" data-act-type="Note"><i data-lucide="file-text"></i> Quick Note</button>' +
        '</div>' +
        '<input type="text" class="form-control" id="composer-summary" placeholder="Summary (e.g. Discussed ceiling lighting preferences)" style="margin-bottom:8px">' +
        '<textarea class="form-control" id="composer-detail" placeholder="Detailed interaction notes, key takeaways, action points…"></textarea>' +
        '<div style="display:flex;justify-content:flex-end;margin-top:10px">' +
          '<button class="btn btn-primary btn-sm" id="btn-save-activity"><i data-lucide="send"></i> Post Activity</button>' +
        '</div>' +
      '</div>' +

      '<!-- Timeline -->' +
      '<div class="timeline" id="lead-activity-timeline">';

    var timelineContainer = content.querySelector('#lead-activity-timeline');
    if (leadActivities.length === 0) {
      timelineContainer.innerHTML = '<div style="color:var(--text-muted);padding:16px 0;">No activities logged yet for this lead.</div>';
    } else {
      var iconMap = { Note: 'file-text', Meeting: 'calendar', Call: 'phone-call', Email: 'mail', WhatsApp: 'message-square' };
      leadActivities.forEach(function(act) {
        var itm = document.createElement('div');
        itm.className = 'timeline-item';
        itm.innerHTML =
          '<div class="timeline-dot"><i data-lucide="' + (iconMap[act.type] || 'circle') + '"></i></div>' +
          '<div class="timeline-card">' +
            '<div class="timeline-header">' +
              '<span class="timeline-title"><strong>' + escapeHtml(act.user) + '</strong> · ' + escapeHtml(act.type) + '</span>' +
              '<span class="timeline-time">' + formatDateTime(act.timestamp) + ' (' + timeAgo(act.timestamp) + ')</span>' +
            '</div>' +
            '<div style="font-weight:600;font-size:.82rem;margin-bottom:3px">' + escapeHtml(act.summary) + '</div>' +
            '<div class="timeline-desc">' + escapeHtml(act.detail) + '</div>' +
          '</div>';
        timelineContainer.appendChild(itm);
      });
    }

    // Composer type switching
    var activeType = 'Call';
    content.querySelectorAll('.composer-type-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        content.querySelectorAll('.composer-type-btn').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        activeType = btn.getAttribute('data-act-type');
      });
    });

    // Save activity
    content.querySelector('#btn-save-activity').addEventListener('click', function() {
      var sum = document.getElementById('composer-summary').value.trim();
      var det = document.getElementById('composer-detail').value.trim();
      if (!sum) {
        showToast('Please provide an activity summary', 'warning');
        return;
      }

      CRM_ACTIVITIES.unshift({
        id: crmUid('ACT'),
        leadId: lead.id,
        type: activeType,
        user: 'Priya Sharma',
        timestamp: new Date().toISOString(),
        summary: sum,
        detail: det
      });

      showToast('Activity recorded', 'success');
      renderLeadSubtab(lead, 'activities');
    });

  } else if (tabName === 'followups') {
    var leadFus = CRM_FOLLOWUPS.filter(function(f) { return f.leadId === lead.id; });
    var html =
      '<div style="display:flex;justify-content:flex-end;margin-bottom:14px;">' +
        '<button class="btn btn-primary btn-sm" id="btn-tab-add-fu"><i data-lucide="plus"></i> Schedule Follow-up</button>' +
      '</div>' +
      '<div class="card"><div class="card-body no-padding"><div class="table-responsive">' +
      '<table class="data-table"><thead><tr><th>ID</th><th>Type</th><th>Scheduled Date & Time</th><th>Status</th><th>Notes</th><th>Action</th></tr></thead><tbody>';

    if (leadFus.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No follow-ups recorded for this lead.</td></tr>';
    } else {
      leadFus.forEach(function(fu) {
        var isOverdue = fu.status === 'Pending' && isDateOverdue(fu.date);
        html +=
          '<tr>' +
            '<td><span class="lead-id-badge">' + fu.id + '</span></td>' +
            '<td><span class="badge badge-stage">' + fu.type + '</span></td>' +
            '<td><span class="' + (isOverdue ? 'badge badge-status-overdue' : '') + '">' + formatDateTime(fu.date) + '</span></td>' +
            '<td><span class="badge badge-status-' + fu.status.toLowerCase() + '">' + fu.status + '</span></td>' +
            '<td>' + escapeHtml(fu.notes || '—') + '</td>' +
            '<td><button class="btn btn-sm btn-outline" onclick="openFollowupModal(null, \'' + lead.id + '\')">Update</button></td>' +
          '</tr>';
      });
    }
    html += '</tbody></table></div></div></div>';
    content.innerHTML = html;

    content.querySelector('#btn-tab-add-fu').addEventListener('click', function() {
      if (typeof openFollowupModal === 'function') openFollowupModal(null, lead.id);
    });

  } else if (tabName === 'visits') {
    var visits = CRM_SITE_VISITS.filter(function(v) { return v.leadId === lead.id; });
    var vHtml =
      '<div style="display:flex;justify-content:flex-end;margin-bottom:14px;">' +
        '<button class="btn btn-primary btn-sm" id="btn-tab-add-visit"><i data-lucide="plus"></i> Schedule Site Visit</button>' +
      '</div>';

    if (visits.length === 0) {
      vHtml += '<div class="card"><div class="card-body" style="text-align:center;color:var(--text-muted);padding:32px">No site visits on record. Click above to schedule one.</div></div>';
    } else {
      visits.forEach(function(v) {
        vHtml +=
          '<div class="visit-card">' +
            '<div class="visit-card-header">' +
              '<div>' +
                '<h4 style="font-size:.9rem;font-weight:700">' + escapeHtml(v.purpose) + '</h4>' +
                '<div style="font-size:.78rem;color:var(--text-secondary)">' + formatDate(v.visitDate) + ' at ' + v.visitTime + ' · ' + escapeHtml(v.location) + '</div>' +
              '</div>' +
              '<span class="badge badge-status-' + v.status.toLowerCase() + '">' + v.status + '</span>' +
            '</div>' +
            (v.outcome ?
              '<div class="visit-outcome-box">' +
                '<strong>Measurements & Outcome:</strong> ' + escapeHtml(v.outcome) +
                (v.requirements ? '<br><strong>Requirements:</strong> ' + escapeHtml(v.requirements) : '') +
              '</div>' :
              '<div style="margin-top:10px"><button class="btn btn-sm btn-primary" onclick="openSiteVisitModal(null, \'' + lead.id + '\')">Record Measurements & Outcome</button></div>') +
          '</div>';
      });
    }
    content.innerHTML = vHtml;

    content.querySelector('#btn-tab-add-visit').addEventListener('click', function() {
      if (typeof openSiteVisitModal === 'function') openSiteVisitModal(null, lead.id);
    });

  } else if (tabName === 'quotations') {
    var quotes = CRM_QUOTATIONS.filter(function(q) { return q.leadId === lead.id; });
    var qHtml =
      '<div style="display:flex;justify-content:flex-end;margin-bottom:14px;">' +
        '<button class="btn btn-primary btn-sm" id="btn-tab-create-quote"><i data-lucide="file-plus"></i> Prepare New Quotation</button>' +
      '</div>' +
      '<div class="card"><div class="card-body no-padding"><div class="table-responsive">' +
      '<table class="data-table"><thead><tr><th>Quote Ref</th><th>Version</th><th>Value</th><th>Status</th><th>Valid Until</th><th>Action</th></tr></thead><tbody>';

    if (quotes.length === 0) {
      qHtml += '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No quotations generated yet for this lead.</td></tr>';
    } else {
      quotes.forEach(function(q) {
        var totals = calcQuoteTotals(q.items || []);
        qHtml +=
          '<tr>' +
            '<td><span class="lead-id-badge" style="cursor:pointer" onclick="switchCrmView(\'quotation-detail\', {quoteId:\'' + q.id + '\'})">' + q.id + '</span></td>' +
            '<td><span class="badge badge-stage">v' + q.version + '</span></td>' +
            '<td><strong style="color:var(--text-primary)">' + formatCurrency(totals.grandTotal) + '</strong></td>' +
            '<td><span class="badge badge-status-' + q.status.toLowerCase().replace(/\s+/g,'-') + '">' + q.status + '</span></td>' +
            '<td>' + formatDate(q.validUntil) + '</td>' +
            '<td><button class="btn btn-sm btn-outline" onclick="switchCrmView(\'quotation-detail\', {quoteId:\'' + q.id + '\'})">View / Revise</button></td>' +
          '</tr>';
      });
    }
    qHtml += '</tbody></table></div></div></div>';
    content.innerHTML = qHtml;

    content.querySelector('#btn-tab-create-quote').addEventListener('click', function() {
      switchCrmView('quotation-builder', { linkedLeadId: lead.id });
    });

  } else if (tabName === 'history') {
    var historyList = CRM_STAGE_HISTORY.filter(function(h) { return h.leadId === lead.id; });
    var hHtml =
      '<div class="card"><div class="card-body no-padding"><div class="table-responsive">' +
      '<table class="data-table"><thead><tr><th>Transition Date</th><th>From Stage</th><th>To Stage</th><th>Changed By</th><th>Transition Notes</th></tr></thead><tbody>';

    if (historyList.length === 0) {
      hHtml += '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">No stage transitions recorded yet.</td></tr>';
    } else {
      historyList.forEach(function(h) {
        hHtml +=
          '<tr>' +
            '<td>' + formatDateTime(h.date) + '</td>' +
            '<td>' + (h.from ? '<span class="badge badge-stage">' + escapeHtml(h.from) + '</span>' : '<span style="color:var(--text-muted)">Initial</span>') + '</td>' +
            '<td><span class="badge badge-stage" style="font-weight:700">' + escapeHtml(h.to) + '</span></td>' +
            '<td>' + escapeHtml(h.user) + '</td>' +
            '<td>' + escapeHtml(h.notes || '—') + '</td>' +
          '</tr>';
      });
    }
    hHtml += '</tbody></table></div></div></div>';
    content.innerHTML = hHtml;

  } else if (tabName === 'documents') {
    content.innerHTML =
      '<div class="card">' +
        '<div class="card-header"><h3 class="card-title"><i data-lucide="file-stack"></i> Project Drawings & Files</h3>' +
        '<button class="btn btn-outline btn-sm" onclick="showToast(\'Document upload dialog simulated\', \'info\')"><i data-lucide="upload"></i> Upload Document</button></div>' +
        '<div class="card-body">' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:14px;">' +
            '<div style="border:1px solid var(--card-border);border-radius:var(--radius);padding:14px;background:#f8fafc">' +
              '<div style="font-weight:600;font-size:.82rem;margin-bottom:4px"><i data-lucide="file" style="width:16px;height:16px;vertical-align:middle;color:var(--blue)"></i> Architectural_Plan_v2.pdf</div>' +
              '<div style="font-size:.72rem;color:var(--text-muted)">Added 4 days ago · 4.2 MB</div>' +
            '</div>' +
            '<div style="border:1px solid var(--card-border);border-radius:var(--radius);padding:14px;background:#f8fafc">' +
              '<div style="font-weight:600;font-size:.82rem;margin-bottom:4px"><i data-lucide="image" style="width:16px;height:16px;vertical-align:middle;color:var(--purple)"></i> Site_Measurements_Photos.zip</div>' +
              '<div style="font-size:.72rem;color:var(--text-muted)">Added 2 days ago · 18.5 MB</div>' +
            '</div>' +
            '<div style="border:1px solid var(--card-border);border-radius:var(--radius);padding:14px;background:#f8fafc">' +
              '<div style="font-weight:600;font-size:.82rem;margin-bottom:4px"><i data-lucide="file-text" style="width:16px;height:16px;vertical-align:middle;color:var(--green)"></i> Client_Moodboard_Approved.pdf</div>' +
              '<div style="font-size:.72rem;color:var(--text-muted)">Added 6 days ago · 8.1 MB</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  lucide.createIcons();
}

/* ── Stage Change Dialog with Business Rules (Lost reason / Won confirmation) ── */
function promptStageChangeModal(lead, preselectedStage) {
  var stageOptionsHtml = CRM_STAGES.map(function(s) {
    var isSel = (preselectedStage && preselectedStage === s.id) || (!preselectedStage && lead.stage === s.id);
    return '<option value="' + s.id + '" ' + (isSel ? 'selected' : '') + '>' + s.order + '. ' + s.label + '</option>';
  }).join('');

  var lossReasonHtml = CRM_LOSS_REASONS.map(function(r) {
    return '<option value="' + r + '">' + r + '</option>';
  }).join('');

  var body =
    '<div class="form-group">' +
      '<label>Current Stage:</label>' +
      '<div><span class="badge badge-stage">' + getStageInfo(lead.stage).label + '</span></div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Move to New Stage <span class="required">*</span></label>' +
      '<select class="form-control" id="modal-select-stage">' + stageOptionsHtml + '</select>' +
    '</div>' +

    '<!-- Loss Reason Container -->' +
    '<div id="modal-loss-container" class="' + (preselectedStage === 'lost' ? '' : 'hidden') + '">' +
      '<div class="form-group">' +
        '<label>Reason for Loss <span class="required">*</span></label>' +
        '<select class="form-control" id="modal-loss-reason">' + lossReasonHtml + '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Competitor / Loss Details <span class="required">*</span></label>' +
        '<textarea class="form-control" id="modal-loss-notes" placeholder="Explain why the deal was lost, competitor pricing, or client feedback…"></textarea>' +
      '</div>' +
    '</div>' +

    '<!-- Won Confirmation Container -->' +
    '<div id="modal-won-container" class="' + (preselectedStage === 'won' ? '' : 'hidden') + '">' +
      '<div class="alert alert-success">' +
        '<i data-lucide="check-circle"></i>' +
        '<div><strong>Documented Customer Acceptance Required</strong><br>Moving to Won confirms contract signing / quotation acceptance. A project will be created in future modules.</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Contract / Acceptance Notes <span class="required">*</span></label>' +
        '<textarea class="form-control" id="modal-won-notes" placeholder="e.g. Client signed revised quotation v3 via email on Nov 09. Advance received."></textarea>' +
      '</div>' +
    '</div>' +

    '<div class="form-group">' +
      '<label>Transition Audit Note</label>' +
      '<input type="text" class="form-control" id="modal-stage-note" placeholder="Optional rationale for moving stage">' +
    '</div>';

  openModal({
    title: 'Update Stage — ' + lead.id,
    body: body,
    confirmText: 'Update Stage',
    onConfirm: function() {
      var newStageId = document.getElementById('modal-select-stage').value;
      if (newStageId === lead.stage) {
        showToast('Stage is already ' + getStageInfo(newStageId).label, 'info');
        return true;
      }

      var fromStageLabel = getStageInfo(lead.stage).label;
      var toStageLabel = getStageInfo(newStageId).label;
      var note = document.getElementById('modal-stage-note').value.trim();

      // Business rule: Lost stage requires loss reason
      if (newStageId === 'lost') {
        var reason = document.getElementById('modal-loss-reason').value;
        var lossNotes = document.getElementById('modal-loss-notes').value.trim();
        if (!lossNotes) {
          showToast('Please provide details for deal loss', 'error');
          return false; // prevent modal close
        }
        lead.lostReason = reason;
        lead.lostDate = new Date().toISOString();
        note = 'Lost Reason: ' + reason + ' — ' + lossNotes;
      }

      // Business rule: Won stage requires customer acceptance note
      if (newStageId === 'won') {
        var wonNotes = document.getElementById('modal-won-notes').value.trim();
        if (!wonNotes) {
          showToast('Customer acceptance documentation note is required to mark Won', 'error');
          return false;
        }
        lead.wonDate = new Date().toISOString();
        lead.wonNotes = wonNotes;
        note = 'Won Deal: ' + wonNotes;
      }

      lead.stage = newStageId;
      lead.updatedDate = new Date().toISOString();

      // Record stage transition audit
      CRM_STAGE_HISTORY.unshift({
        leadId: lead.id,
        from: fromStageLabel,
        to: toStageLabel,
        date: new Date().toISOString(),
        user: 'Priya Sharma',
        notes: note || 'Stage transitioned from ' + fromStageLabel + ' to ' + toStageLabel
      });

      // Record activity
      CRM_ACTIVITIES.unshift({
        id: crmUid('ACT'),
        leadId: lead.id,
        type: 'Note',
        user: 'Priya Sharma',
        timestamp: new Date().toISOString(),
        summary: 'Stage changed to ' + toStageLabel,
        detail: note
      });

      showToast('Lead ' + lead.id + ' moved to ' + toStageLabel, 'success');
      updateCrmBadges();

      if (CrmApp.currentView === 'lead-detail') {
        openLeadDetail(lead.id);
      } else if (CrmApp.currentView === 'pipeline') {
        if (typeof renderPipelineBoard === 'function') renderPipelineBoard();
      } else {
        renderLeadsTable();
      }

      return true;
    }
  });

  // Toggle dynamic fields when select changes
  var stageSelect = document.getElementById('modal-select-stage');
  stageSelect.addEventListener('change', function() {
    var v = stageSelect.value;
    var lossEl = document.getElementById('modal-loss-container');
    var wonEl = document.getElementById('modal-won-container');
    if (v === 'lost') lossEl.classList.remove('hidden');
    else lossEl.classList.add('hidden');

    if (v === 'won') wonEl.classList.remove('hidden');
    else wonEl.classList.add('hidden');
  });
}

/* ── Assign Salesperson Dialog ── */
function promptAssignModal(lead) {
  var optionsHtml = CRM_SALESPEOPLE.map(function(sp) {
    return '<option value="' + sp.id + '" ' + (lead.salesperson === sp.id ? 'selected' : '') + '>' + sp.name + ' (' + sp.role + ')</option>';
  }).join('');

  openModal({
    title: 'Assign Owner — ' + lead.id,
    body:
      '<div class="form-group">' +
        '<label>Select Assigned Salesperson <span class="required">*</span></label>' +
        '<select class="form-control" id="modal-assign-rep">' + optionsHtml + '</select>' +
      '</div>',
    confirmText: 'Reassign',
    onConfirm: function() {
      var newRepId = document.getElementById('modal-assign-rep').value;
      lead.salesperson = newRepId;
      var repName = getSalesperson(newRepId).name;

      CRM_ACTIVITIES.unshift({
        id: crmUid('ACT'),
        leadId: lead.id,
        type: 'Note',
        user: 'Priya Sharma',
        timestamp: new Date().toISOString(),
        summary: 'Lead reassigned to ' + repName,
        detail: 'Ownership updated.'
      });

      showToast(lead.id + ' assigned to ' + repName, 'success');
      if (CrmApp.currentView === 'lead-detail') openLeadDetail(lead.id);
      else renderLeadsTable();
      return true;
    }
  });
}
