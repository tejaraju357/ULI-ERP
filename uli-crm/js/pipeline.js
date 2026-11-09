/**
 * ULI Studio ERP — Pipeline Kanban Board Module (SCREEN 5)
 * ═════════════════════════════════════════════════════════
 * Features:
 *  - 9 Kanban stage columns (New Enquiry → Won/Lost)
 *  - Column summaries (count, total expected value)
 *  - Drag-and-drop HTML5 stage progression
 *  - Business rules for Lost (loss reason) and Won (acceptance confirmation)
 *  - Filter controls by Salesperson, Source, Priority
 *  - Switch to List View toggle
 */

'use strict';

var PipelineFilterState = {
  salesperson: 'all',
  source: 'all',
  priority: 'all'
};

var draggedLeadId = null;

function initPipelineFilters() {
  var spSelect = document.getElementById('pipeline-salesperson-filter');
  var srcSelect = document.getElementById('pipeline-source-filter');
  var prioSelect = document.getElementById('pipeline-priority-filter');

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

  if (spSelect && !spSelect._bound) {
    spSelect.addEventListener('change', function(e) {
      PipelineFilterState.salesperson = e.target.value;
      renderPipelineBoard();
    });
    spSelect._bound = true;
  }
  if (srcSelect && !srcSelect._bound) {
    srcSelect.addEventListener('change', function(e) {
      PipelineFilterState.source = e.target.value;
      renderPipelineBoard();
    });
    srcSelect._bound = true;
  }
  if (prioSelect && !prioSelect._bound) {
    prioSelect.addEventListener('change', function(e) {
      PipelineFilterState.priority = e.target.value;
      renderPipelineBoard();
    });
    prioSelect._bound = true;
  }

  // Switch to list view button
  var btnSwitchList = document.getElementById('btn-pipeline-toggle-list');
  if (btnSwitchList && !btnSwitchList._bound) {
    btnSwitchList.addEventListener('click', function() {
      switchCrmView('leads');
    });
    btnSwitchList._bound = true;
  }

  // Add lead button
  var btnAddLead = document.getElementById('btn-pipeline-add-lead');
  if (btnAddLead && !btnAddLead._bound) {
    btnAddLead.addEventListener('click', function() {
      switchCrmView('create-lead');
    });
    btnAddLead._bound = true;
  }
}

function getFilteredPipelineLeads() {
  return CRM_LEADS.filter(function(lead) {
    if (PipelineFilterState.salesperson !== 'all' && lead.salesperson !== PipelineFilterState.salesperson) return false;
    if (PipelineFilterState.source !== 'all' && lead.source !== PipelineFilterState.source) return false;
    if (PipelineFilterState.priority !== 'all' && lead.priority !== PipelineFilterState.priority) return false;
    return true;
  });
}

function renderPipelineBoard() {
  initPipelineFilters();

  var boardEl = document.getElementById('pipeline-board-el');
  boardEl.innerHTML = '';

  var leads = getFilteredPipelineLeads();

  // Create 9 stage columns
  CRM_STAGES.forEach(function(stage) {
    var colLeads = leads.filter(function(l) { return l.stage === stage.id; });
    var stageVal = colLeads.reduce(function(acc, l) { return acc + (l.expectedValue || 0); }, 0);

    var col = document.createElement('div');
    col.className = 'pipeline-col';
    col.setAttribute('data-stage-id', stage.id);

    col.innerHTML =
      '<div class="pipeline-col-header">' +
        '<div class="col-header-top">' +
          '<span class="col-title">' +
            '<span style="width:10px;height:10px;border-radius:50%;background:' + stage.color + '"></span>' +
            escapeHtml(stage.label) +
          '</span>' +
          '<span class="col-count-badge">' + colLeads.length + '</span>' +
        '</div>' +
        '<div class="col-total-value">' + formatCurrency(stageVal) + '</div>' +
      '</div>' +
      '<div class="pipeline-cards-list" data-stage-id="' + stage.id + '">' +
      '</div>';

    var cardsList = col.querySelector('.pipeline-cards-list');

    // Drag-over event listeners on the column cards list
    cardsList.addEventListener('dragover', function(e) {
      e.preventDefault();
      col.classList.add('drag-over');
    });
    cardsList.addEventListener('dragleave', function() {
      col.classList.remove('drag-over');
    });
    cardsList.addEventListener('drop', function(e) {
      e.preventDefault();
      col.classList.remove('drag-over');
      if (draggedLeadId) {
        var droppedLead = CRM_LEADS.find(function(l) { return l.id === draggedLeadId; });
        if (droppedLead && droppedLead.stage !== stage.id) {
          promptStageChangeModal(droppedLead, stage.id);
        }
      }
    });

    // Populate lead cards
    colLeads.forEach(function(lead) {
      var card = createKanbanCard(lead);
      cardsList.appendChild(card);
    });

    boardEl.appendChild(col);
  });

  lucide.createIcons();
}

function createKanbanCard(lead) {
  var sp = getSalesperson(lead.salesperson);
  var isOverdue = lead.nextFollowup && isDateOverdue(lead.nextFollowup);

  var card = document.createElement('div');
  card.className = 'kanban-card';
  card.setAttribute('draggable', 'true');
  card.setAttribute('data-lead-id', lead.id);

  card.innerHTML =
    '<div class="kanban-card-top">' +
      '<span class="kanban-lead-id">' + escapeHtml(lead.id) + '</span>' +
      '<span class="badge badge-priority-' + (lead.priority || 'medium').toLowerCase() + '">' + lead.priority + '</span>' +
    '</div>' +
    '<div class="kanban-lead-name">' + escapeHtml(lead.customerName) + '</div>' +
    '<div class="kanban-project-title">' + escapeHtml(lead.enquiryTitle) + '</div>' +
    '<div class="kanban-card-value">' + formatCurrency(lead.expectedValue) + '</div>' +
    '<div class="kanban-card-footer">' +
      '<div class="kanban-assignee">' +
        '<div class="kanban-avatar" title="' + escapeHtml(sp.name) + '">' +
          escapeHtml(sp.name.split(' ').map(function(n){ return n[0]; }).join('')) +
        '</div>' +
        '<span>' + escapeHtml(sp.name.split(' ')[0]) + '</span>' +
      '</div>' +
      (lead.nextFollowup ?
        '<span class="next-followup-badge ' + (isOverdue ? 'next-followup-overdue' : '') + '">' +
          '<i data-lucide="' + (isOverdue ? 'alert-circle' : 'calendar') + '" style="width:11px;height:11px"></i>' +
          formatDate(lead.nextFollowup) +
        '</span>' : '') +
    '</div>';

  // Dragstart / Dragend
  card.addEventListener('dragstart', function(e) {
    draggedLeadId = lead.id;
    card.classList.add('is-dragging');
    e.dataTransfer.setData('text/plain', lead.id);
    e.dataTransfer.effectAllowed = 'move';
  });
  card.addEventListener('dragend', function() {
    draggedLeadId = null;
    card.classList.remove('is-dragging');
  });

  // Card click navigates to workspace
  card.addEventListener('click', function() {
    switchCrmView('lead-detail', { leadId: lead.id });
  });

  return card;
}
