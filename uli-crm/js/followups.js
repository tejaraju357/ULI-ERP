/**
 * ULI Studio ERP — Follow-up Management Module (SCREEN 6)
 * ═══════════════════════════════════════════════════════
 * Handles:
 *  - Categorized Views: Today's, Upcoming, Overdue, Completed, All
 *  - Follow-up cards with lead context
 *  - Scheduling, Rescheduling, Completing with outcome, Reassigning, Cancelling
 */

'use strict';

var FollowupFilter = 'all';

function initFollowupsFilters() {
  var filterButtons = [
    { id: 'btn-fu-all', val: 'all' },
    { id: 'btn-fu-today', val: 'today' },
    { id: 'btn-fu-upcoming', val: 'upcoming' },
    { id: 'btn-fu-overdue', val: 'overdue' },
    { id: 'btn-fu-completed', val: 'completed' }
  ];

  filterButtons.forEach(function(item) {
    var btn = document.getElementById(item.id);
    if (btn && !btn._bound) {
      btn.addEventListener('click', function() {
        filterButtons.forEach(function(b) {
          var el = document.getElementById(b.id);
          if (el) el.classList.remove('active');
        });
        btn.classList.add('active');
        FollowupFilter = item.val;
        renderFollowups();
      });
      btn._bound = true;
    }
  });

  var btnSchedule = document.getElementById('btn-schedule-new-followup');
  if (btnSchedule && !btnSchedule._bound) {
    btnSchedule.addEventListener('click', function() {
      openFollowupModal();
    });
    btnSchedule._bound = true;
  }
}

function getFilteredFollowups() {
  var now = new Date();
  var todayStr = now.toISOString().slice(0, 10);

  return CRM_FOLLOWUPS.filter(function(fu) {
    var isOverdue = fu.status === 'Pending' && isDateOverdue(fu.date);
    var isToday = fu.date && fu.date.slice(0, 10) === todayStr;

    if (FollowupFilter === 'today') {
      return fu.status === 'Pending' && isToday;
    } else if (FollowupFilter === 'upcoming') {
      return fu.status === 'Pending' && !isOverdue && !isToday;
    } else if (FollowupFilter === 'overdue') {
      return isOverdue;
    } else if (FollowupFilter === 'completed') {
      return fu.status === 'Completed';
    }
    return true; // 'all'
  });
}

function renderFollowups() {
  initFollowupsFilters();

  var container = document.getElementById('followups-list-container');
  container.innerHTML = '';

  var list = getFilteredFollowups();

  if (list.length === 0) {
    container.innerHTML =
      '<div class="state-message">' +
        '<i data-lucide="check-circle-2" style="color:var(--green)"></i>' +
        '<h4>No follow-ups match this filter</h4>' +
        '<p>You are all caught up! Click "+ Schedule Follow-up" to schedule a customer call or meeting.</p>' +
      '</div>';
    lucide.createIcons();
    return;
  }

  var iconMap = {
    'Call': 'phone-call',
    'Email': 'mail',
    'Meeting': 'users',
    'Site Visit': 'map-pin',
    'WhatsApp': 'message-square',
    'Video Call': 'video'
  };

  list.forEach(function(fu) {
    var isOverdue = fu.status === 'Pending' && isDateOverdue(fu.date);
    var sp = getSalesperson(fu.assignedTo);
    var linkedLead = CRM_LEADS.find(function(l) { return l.id === fu.leadId; });

    var card = document.createElement('div');
    card.className = 'followup-card';
    card.innerHTML =
      '<div class="followup-left">' +
        '<div class="followup-type-icon" style="background:var(--blue-light);color:var(--blue)">' +
          '<i data-lucide="' + (iconMap[fu.type] || 'calendar') + '"></i>' +
        '</div>' +
        '<div class="followup-info">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">' +
            '<span class="lead-id-badge" style="cursor:pointer" data-lead-link="' + fu.leadId + '">' + escapeHtml(fu.leadId) + '</span>' +
            '<span class="badge badge-stage">' + escapeHtml(fu.type) + '</span>' +
            (isOverdue ? '<span class="badge badge-status-overdue">OVERDUE</span>' : '') +
            (fu.status === 'Completed' ? '<span class="badge badge-status-accepted">Completed</span>' : '') +
            (fu.status === 'Cancelled' ? '<span class="badge badge-status-rejected">Cancelled</span>' : '') +
          '</div>' +
          '<h4>' + escapeHtml(fu.customerName) + (linkedLead ? ' — <span style="font-weight:400;color:var(--text-secondary)">' + escapeHtml(linkedLead.enquiryTitle) + '</span>' : '') + '</h4>' +
          '<p>' + escapeHtml(fu.notes || 'No description provided') + '</p>' +
          (fu.outcome ? '<p style="color:var(--green);font-weight:500;margin-top:2px;">Outcome: ' + escapeHtml(fu.outcome) + '</p>' : '') +
          '<div class="followup-meta">' +
            '<span><i data-lucide="clock" style="width:12px;height:12px;vertical-align:text-bottom"></i> ' + formatDateTime(fu.date) + '</span>' +
            '<span><i data-lucide="user" style="width:12px;height:12px;vertical-align:text-bottom"></i> Assigned to <strong>' + escapeHtml(sp.name) + '</strong></span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="followup-actions">' +
        (fu.status === 'Pending' ?
          '<button class="btn btn-sm btn-success" data-action="complete"><i data-lucide="check"></i> Complete</button>' +
          '<button class="btn btn-sm btn-outline" data-action="reschedule"><i data-lucide="calendar"></i> Reschedule</button>' +
          '<button class="btn btn-sm btn-outline btn-icon" title="More Options" data-action="edit"><i data-lucide="more-horizontal"></i></button>' :
          '<button class="btn btn-sm btn-outline" data-action="view"><i data-lucide="eye"></i> Details</button>') +
      '</div>';

    // Click lead link
    var leadLink = card.querySelector('[data-lead-link]');
    if (leadLink) {
      leadLink.addEventListener('click', function(e) {
        e.stopPropagation();
        switchCrmView('lead-detail', { leadId: fu.leadId });
      });
    }

    // Action buttons
    var btnComplete = card.querySelector('[data-action="complete"]');
    if (btnComplete) {
      btnComplete.addEventListener('click', function() {
        promptCompleteFollowupModal(fu);
      });
    }

    var btnReschedule = card.querySelector('[data-action="reschedule"]');
    if (btnReschedule) {
      btnReschedule.addEventListener('click', function() {
        promptRescheduleFollowupModal(fu);
      });
    }

    var btnEdit = card.querySelector('[data-action="edit"]');
    if (btnEdit) {
      btnEdit.addEventListener('click', function() {
        openFollowupModal(fu);
      });
    }

    var btnView = card.querySelector('[data-action="view"]');
    if (btnView) {
      btnView.addEventListener('click', function() {
        openFollowupModal(fu);
      });
    }

    container.appendChild(card);
  });

  updateCrmBadges();
  lucide.createIcons();
}

/* ── Modal to Schedule or Edit Follow-up ── */
function openFollowupModal(existingFu, preselectedLeadId) {
  var isEdit = Boolean(existingFu);

  var leadsOptions = CRM_LEADS.map(function(l) {
    var isSel = (existingFu && existingFu.leadId === l.id) || (preselectedLeadId && preselectedLeadId === l.id);
    return '<option value="' + l.id + '" ' + (isSel ? 'selected' : '') + '>' + l.id + ' — ' + l.customerName + ' (' + l.enquiryTitle + ')</option>';
  }).join('');

  var typeOptions = CRM_FOLLOWUP_TYPES.map(function(t) {
    var isSel = existingFu && existingFu.type === t;
    return '<option value="' + t + '" ' + (isSel ? 'selected' : '') + '>' + t + '</option>';
  }).join('');

  var repOptions = CRM_SALESPEOPLE.map(function(sp) {
    var isSel = existingFu && existingFu.assignedTo === sp.id;
    return '<option value="' + sp.id + '" ' + (isSel ? 'selected' : '') + '>' + sp.name + '</option>';
  }).join('');

  var defaultDate = existingFu ? (existingFu.date || '').slice(0, 16) : new Date(Date.now() + 86400000).toISOString().slice(0, 16);

  var body =
    '<div class="form-group">' +
      '<label>Linked Lead / Customer <span class="required">*</span></label>' +
      '<select class="form-control" id="modal-fu-lead">' + leadsOptions + '</select>' +
    '</div>' +
    '<div class="form-grid">' +
      '<div class="form-group">' +
        '<label>Follow-up Type <span class="required">*</span></label>' +
        '<select class="form-control" id="modal-fu-type">' + typeOptions + '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Assigned Rep <span class="required">*</span></label>' +
        '<select class="form-control" id="modal-fu-rep">' + repOptions + '</select>' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Scheduled Date & Time <span class="required">*</span></label>' +
      '<input type="datetime-local" class="form-control" id="modal-fu-date" value="' + defaultDate + '" required>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Agenda / Discussion Notes <span class="required">*</span></label>' +
      '<textarea class="form-control" id="modal-fu-notes" placeholder="Purpose of this follow-up call/meeting…">' + (existingFu ? escapeHtml(existingFu.notes) : '') + '</textarea>' +
    '</div>' +
    (isEdit ?
      '<div class="form-group">' +
        '<label>Status</label>' +
        '<select class="form-control" id="modal-fu-status">' +
          '<option value="Pending" ' + (existingFu.status === 'Pending' ? 'selected' : '') + '>Pending</option>' +
          '<option value="Completed" ' + (existingFu.status === 'Completed' ? 'selected' : '') + '>Completed</option>' +
          '<option value="Cancelled" ' + (existingFu.status === 'Cancelled' ? 'selected' : '') + '>Cancelled</option>' +
        '</select>' +
      '</div>' : '');

  openModal({
    title: isEdit ? 'Update Follow-up — ' + existingFu.id : 'Schedule New Follow-up',
    body: body,
    confirmText: isEdit ? 'Save Changes' : 'Schedule',
    onConfirm: function() {
      var leadId = document.getElementById('modal-fu-lead').value;
      var type = document.getElementById('modal-fu-type').value;
      var rep = document.getElementById('modal-fu-rep').value;
      var dateVal = document.getElementById('modal-fu-date').value;
      var notes = document.getElementById('modal-fu-notes').value.trim();

      if (!dateVal || !notes) {
        showToast('Please provide scheduled date and discussion notes', 'error');
        return false;
      }

      var leadObj = CRM_LEADS.find(function(l) { return l.id === leadId; });

      if (isEdit) {
        existingFu.leadId = leadId;
        existingFu.customerName = leadObj ? leadObj.customerName : existingFu.customerName;
        existingFu.type = type;
        existingFu.assignedTo = rep;
        existingFu.date = dateVal;
        existingFu.notes = notes;
        existingFu.status = document.getElementById('modal-fu-status').value;
        showToast('Follow-up ' + existingFu.id + ' updated', 'success');
      } else {
        var newFu = {
          id: crmUid('FU'),
          leadId: leadId,
          customerName: leadObj ? leadObj.customerName : 'Customer',
          assignedTo: rep,
          date: dateVal,
          type: type,
          status: 'Pending',
          notes: notes
        };
        CRM_FOLLOWUPS.unshift(newFu);

        // Update lead's next follow-up date
        if (leadObj) {
          leadObj.nextFollowup = dateVal;
        }

        // Record activity
        CRM_ACTIVITIES.unshift({
          id: crmUid('ACT'),
          leadId: leadId,
          type: type,
          user: 'Priya Sharma',
          timestamp: new Date().toISOString(),
          summary: 'Follow-up scheduled: ' + type,
          detail: notes + ' (Due: ' + formatDateTime(dateVal) + ')'
        });

        showToast('Follow-up scheduled successfully', 'success');
      }

      updateCrmBadges();
      if (CrmApp.currentView === 'followups') renderFollowups();
      else if (CrmApp.currentView === 'lead-detail') renderLeadSubtab(leadObj, 'followups');
      return true;
    }
  });
}

function promptCompleteFollowupModal(fu) {
  openModal({
    title: 'Complete Follow-up — ' + fu.id,
    body:
      '<div class="form-group">' +
        '<label>Discussion Outcome & Key Notes <span class="required">*</span></label>' +
        '<textarea class="form-control" id="modal-complete-outcome" placeholder="Describe the result of the conversation, client sentiment, decisions made…"></textarea>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Schedule Next Follow-up (Optional)</label>' +
        '<input type="datetime-local" class="form-control" id="modal-next-fu-date">' +
      '</div>',
    confirmText: 'Mark Completed',
    onConfirm: function() {
      var outcome = document.getElementById('modal-complete-outcome').value.trim();
      if (!outcome) {
        showToast('Please record the outcome of the follow-up', 'error');
        return false;
      }

      fu.status = 'Completed';
      fu.completedDate = new Date().toISOString();
      fu.outcome = outcome;

      // Log activity
      CRM_ACTIVITIES.unshift({
        id: crmUid('ACT'),
        leadId: fu.leadId,
        type: fu.type,
        user: 'Priya Sharma',
        timestamp: new Date().toISOString(),
        summary: fu.type + ' completed with ' + fu.customerName,
        detail: outcome
      });

      // Optional next followup
      var nextDate = document.getElementById('modal-next-fu-date').value;
      if (nextDate) {
        CRM_FOLLOWUPS.unshift({
          id: crmUid('FU'),
          leadId: fu.leadId,
          customerName: fu.customerName,
          assignedTo: fu.assignedTo,
          date: nextDate,
          type: fu.type,
          status: 'Pending',
          notes: 'Next follow-up after completing ' + fu.id
        });
        var lead = CRM_LEADS.find(function(l) { return l.id === fu.leadId; });
        if (lead) lead.nextFollowup = nextDate;
      }

      showToast('Follow-up marked completed', 'success');
      renderFollowups();
      return true;
    }
  });
}

function promptRescheduleFollowupModal(fu) {
  openModal({
    title: 'Reschedule Follow-up — ' + fu.id,
    body:
      '<div class="form-group">' +
        '<label>New Date & Time <span class="required">*</span></label>' +
        '<input type="datetime-local" class="form-control" id="modal-reschedule-date" value="' + (fu.date || '').slice(0, 16) + '" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Reason for Rescheduling</label>' +
        '<input type="text" class="form-control" id="modal-reschedule-reason" placeholder="e.g. Client requested postponement to Friday">' +
      '</div>',
    confirmText: 'Confirm Reschedule',
    onConfirm: function() {
      var newDate = document.getElementById('modal-reschedule-date').value;
      var reason = document.getElementById('modal-reschedule-reason').value.trim();
      if (!newDate) {
        showToast('Please enter new date and time', 'error');
        return false;
      }

      fu.date = newDate;
      fu.status = 'Pending';
      if (reason) fu.notes = (fu.notes ? fu.notes + ' | ' : '') + 'Rescheduled: ' + reason;

      var lead = CRM_LEADS.find(function(l) { return l.id === fu.leadId; });
      if (lead) lead.nextFollowup = newDate;

      showToast('Follow-up rescheduled to ' + formatDateTime(newDate), 'success');
      renderFollowups();
      return true;
    }
  });
}
