/**
 * ULI Studio ERP — Site Visit Management Module (SCREEN 7)
 * ═════════════════════════════════════════════════════════
 * Features:
 *  - Filter visits: All, Scheduled, Completed, Cancelled
 *  - Site visit cards with location & assigned employee
 *  - Form for scheduling visits
 *  - Post-visit recording: Outcome, Measurements, Requirements, Next Action, Next Follow-up
 */

'use strict';

var SiteVisitFilter = 'all';

function initSiteVisitsFilters() {
  var filterButtons = [
    { id: 'btn-v-all', val: 'all' },
    { id: 'btn-v-scheduled', val: 'scheduled' },
    { id: 'btn-v-completed', val: 'completed' }
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
        SiteVisitFilter = item.val;
        renderSiteVisits();
      });
      btn._bound = true;
    }
  });

  var btnSchedule = document.getElementById('btn-schedule-new-visit');
  if (btnSchedule && !btnSchedule._bound) {
    btnSchedule.addEventListener('click', function() {
      openSiteVisitModal();
    });
    btnSchedule._bound = true;
  }
}

function getFilteredSiteVisits() {
  return CRM_SITE_VISITS.filter(function(v) {
    if (SiteVisitFilter === 'scheduled') return v.status === 'Scheduled';
    if (SiteVisitFilter === 'completed') return v.status === 'Completed';
    return true;
  });
}

function renderSiteVisits() {
  initSiteVisitsFilters();

  var container = document.getElementById('site-visits-list-container');
  container.innerHTML = '';

  var list = getFilteredSiteVisits();

  if (list.length === 0) {
    container.innerHTML =
      '<div class="state-message">' +
        '<i data-lucide="map-pin" style="color:var(--text-muted)"></i>' +
        '<h4>No site visits found</h4>' +
        '<p>Click "+ Schedule Site Visit" to arrange an on-site architectural assessment or measurement.</p>' +
      '</div>';
    lucide.createIcons();
    return;
  }

  list.forEach(function(v) {
    var sp = getSalesperson(v.assignedTo);
    var linkedLead = CRM_LEADS.find(function(l) { return l.id === v.leadId; });

    var card = document.createElement('div');
    card.className = 'visit-card';

    var statusBadgeClass = v.status === 'Completed' ? 'badge-status-accepted' : 'badge-status-pending';

    card.innerHTML =
      '<div class="visit-card-header">' +
        '<div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
            '<span class="lead-id-badge" style="cursor:pointer" data-lead-link="' + v.leadId + '">' + escapeHtml(v.leadId) + '</span>' +
            '<span class="badge badge-stage">' + escapeHtml(v.purpose) + '</span>' +
            '<span class="badge ' + statusBadgeClass + '">' + escapeHtml(v.status) + '</span>' +
          '</div>' +
          '<h3 style="font-size:1.05rem;font-weight:700">' + escapeHtml(v.customerName) + (linkedLead ? ' — <span style="font-weight:400;color:var(--text-secondary)">' + escapeHtml(linkedLead.enquiryTitle) + '</span>' : '') + '</h3>' +
          '<div style="font-size:.8rem;color:var(--text-secondary);margin-top:2px;">' +
            '<i data-lucide="map-pin" style="width:13px;height:13px;vertical-align:text-bottom"></i> ' + escapeHtml(v.location) +
            ' &nbsp;|&nbsp; <i data-lucide="calendar" style="width:13px;height:13px;vertical-align:text-bottom"></i> ' + formatDate(v.visitDate) + ' at ' + v.visitTime +
            ' &nbsp;|&nbsp; <i data-lucide="user" style="width:13px;height:13px;vertical-align:text-bottom"></i> Lead: <strong>' + escapeHtml(sp.name) + '</strong>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          (v.status === 'Scheduled' ?
            '<button class="btn btn-sm btn-primary" data-action="outcome"><i data-lucide="clipboard-check"></i> Record Outcome</button>' +
            '<button class="btn btn-sm btn-outline" data-action="edit"><i data-lucide="edit"></i> Edit</button>' :
            '<button class="btn btn-sm btn-outline" data-action="edit"><i data-lucide="eye"></i> View Report</button>') +
        '</div>' +
      '</div>' +

      '<div class="visit-card-body">' +
        '<p style="color:var(--text-secondary)"><strong>Preparation Notes:</strong> ' + escapeHtml(v.notes || 'None') + '</p>' +
        (v.status === 'Completed' ?
          '<div class="visit-outcome-box">' +
            '<div style="margin-bottom:6px"><strong>Visit Outcome:</strong> ' + escapeHtml(v.outcome || '—') + '</div>' +
            (v.measurements ? '<div style="margin-bottom:4px"><strong>Measurements & Observations:</strong> ' + escapeHtml(v.measurements) + '</div>' : '') +
            (v.requirements ? '<div style="margin-bottom:4px"><strong>Customer Requirements:</strong> ' + escapeHtml(v.requirements) + '</div>' : '') +
            (v.nextAction ? '<div style="color:var(--blue);font-weight:600"><strong>Next Action:</strong> ' + escapeHtml(v.nextAction) + (v.followupDate ? ' (By ' + formatDate(v.followupDate) + ')' : '') + '</div>' : '') +
          '</div>' : '') +
      '</div>';

    // Click on lead ID
    var leadLink = card.querySelector('[data-lead-link]');
    if (leadLink) {
      leadLink.addEventListener('click', function(e) {
        e.stopPropagation();
        switchCrmView('lead-detail', { leadId: v.leadId });
      });
    }

    // Action listeners
    var btnOutcome = card.querySelector('[data-action="outcome"]');
    if (btnOutcome) {
      btnOutcome.addEventListener('click', function() {
        promptRecordVisitOutcomeModal(v);
      });
    }

    var btnEdit = card.querySelector('[data-action="edit"]');
    if (btnEdit) {
      btnEdit.addEventListener('click', function() {
        openSiteVisitModal(v);
      });
    }

    container.appendChild(card);
  });

  updateCrmBadges();
  lucide.createIcons();
}

/* ── Modal: Schedule or Edit Site Visit ── */
function openSiteVisitModal(existingVisit, preselectedLeadId) {
  var isEdit = Boolean(existingVisit);

  var leadsOptions = CRM_LEADS.map(function(l) {
    var isSel = (existingVisit && existingVisit.leadId === l.id) || (preselectedLeadId && preselectedLeadId === l.id);
    return '<option value="' + l.id + '" ' + (isSel ? 'selected' : '') + '>' + l.id + ' — ' + l.customerName + ' (' + l.projectLocation + ')</option>';
  }).join('');

  var purposeOptions = CRM_VISIT_PURPOSES.map(function(p) {
    var isSel = existingVisit && existingVisit.purpose === p;
    return '<option value="' + p + '" ' + (isSel ? 'selected' : '') + '>' + p + '</option>';
  }).join('');

  var repOptions = CRM_SALESPEOPLE.map(function(sp) {
    var isSel = existingVisit && existingVisit.assignedTo === sp.id;
    return '<option value="' + sp.id + '" ' + (isSel ? 'selected' : '') + '>' + sp.name + '</option>';
  }).join('');

  var body =
    '<div class="form-group">' +
      '<label>Select Lead <span class="required">*</span></label>' +
      '<select class="form-control" id="modal-visit-lead">' + leadsOptions + '</select>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Site Location / Address <span class="required">*</span></label>' +
      '<input type="text" class="form-control" id="modal-visit-location" placeholder="Full address or landmark" value="' + (existingVisit ? escapeHtml(existingVisit.location) : '') + '" required>' +
    '</div>' +
    '<div class="form-grid">' +
      '<div class="form-group">' +
        '<label>Visit Date <span class="required">*</span></label>' +
        '<input type="date" class="form-control" id="modal-visit-date" value="' + (existingVisit ? existingVisit.visitDate : '') + '" required>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Visit Time <span class="required">*</span></label>' +
        '<input type="time" class="form-control" id="modal-visit-time" value="' + (existingVisit ? existingVisit.visitTime : '10:00') + '" required>' +
      '</div>' +
    '</div>' +
    '<div class="form-grid">' +
      '<div class="form-group">' +
        '<label>Visit Purpose <span class="required">*</span></label>' +
        '<select class="form-control" id="modal-visit-purpose">' + purposeOptions + '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Assigned Designer / Employee <span class="required">*</span></label>' +
        '<select class="form-control" id="modal-visit-rep">' + repOptions + '</select>' +
      '</div>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Access & Preparation Notes</label>' +
      '<textarea class="form-control" id="modal-visit-notes" placeholder="e.g. Bring laser meter, camera, mood board samples, contact security…">' + (existingVisit ? escapeHtml(existingVisit.notes) : '') + '</textarea>' +
    '</div>';

  openModal({
    title: isEdit ? 'Update Site Visit — ' + existingVisit.id : 'Schedule Site Visit',
    body: body,
    confirmText: isEdit ? 'Save Changes' : 'Schedule Visit',
    onConfirm: function() {
      var leadId = document.getElementById('modal-visit-lead').value;
      var loc = document.getElementById('modal-visit-location').value.trim();
      var dateVal = document.getElementById('modal-visit-date').value;
      var timeVal = document.getElementById('modal-visit-time').value;
      var purpose = document.getElementById('modal-visit-purpose').value;
      var rep = document.getElementById('modal-visit-rep').value;
      var notes = document.getElementById('modal-visit-notes').value.trim();

      if (!loc || !dateVal || !timeVal) {
        showToast('Please provide location, visit date and time', 'error');
        return false;
      }

      var lead = CRM_LEADS.find(function(l) { return l.id === leadId; });

      if (isEdit) {
        existingVisit.leadId = leadId;
        existingVisit.customerName = lead ? lead.customerName : existingVisit.customerName;
        existingVisit.location = loc;
        existingVisit.visitDate = dateVal;
        existingVisit.visitTime = timeVal;
        existingVisit.purpose = purpose;
        existingVisit.assignedTo = rep;
        existingVisit.notes = notes;
        showToast('Site visit updated', 'success');
      } else {
        var newV = {
          id: crmUid('SV'),
          leadId: leadId,
          customerName: lead ? lead.customerName : 'Client',
          location: loc,
          visitDate: dateVal,
          visitTime: timeVal,
          purpose: purpose,
          assignedTo: rep,
          status: 'Scheduled',
          notes: notes
        };
        CRM_SITE_VISITS.unshift(newV);

        // Update lead stage to site-visit-scheduled if earlier
        if (lead && (lead.stage === 'new-enquiry' || lead.stage === 'qualified')) {
          lead.stage = 'site-visit-scheduled';
          CRM_STAGE_HISTORY.unshift({
            leadId: lead.id,
            from: 'Qualified',
            to: 'Site Visit Scheduled',
            date: new Date().toISOString(),
            user: 'Priya Sharma',
            notes: 'Site visit scheduled for ' + formatDate(dateVal) + ' at ' + timeVal
          });
        }

        // Log activity
        CRM_ACTIVITIES.unshift({
          id: crmUid('ACT'),
          leadId: leadId,
          type: 'Meeting',
          user: 'Priya Sharma',
          timestamp: new Date().toISOString(),
          summary: 'Site visit scheduled: ' + purpose,
          detail: 'Location: ' + loc + ' on ' + formatDate(dateVal) + ' at ' + timeVal
        });

        showToast('Site visit scheduled successfully', 'success');
      }

      updateCrmBadges();
      if (CrmApp.currentView === 'visits') renderSiteVisits();
      else if (CrmApp.currentView === 'lead-detail') renderLeadSubtab(lead, 'visits');
      return true;
    }
  });
}

/* ── Modal: Record Site Visit Outcome & Measurements ── */
function promptRecordVisitOutcomeModal(visit) {
  var body =
    '<div class="form-group">' +
      '<label>Visit Outcome Summary <span class="required">*</span></label>' +
      '<input type="text" class="form-control" id="modal-outcome-summary" placeholder="e.g. Completed initial measurements; space suitable for modular concepts" required>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Customer Requirements Gathered <span class="required">*</span></label>' +
      '<textarea class="form-control" id="modal-outcome-req" placeholder="Client style preferences, specific room requirements, materials preferred…"></textarea>' +
    '</div>' +
    '<div class="form-group">' +
      '<label>Measurements & Site Observations <span class="required">*</span></label>' +
      '<textarea class="form-control" id="modal-outcome-measurements" placeholder="Ceiling height, floor dimensions, window positions, electrical/plumbing points…"></textarea>' +
    '</div>' +
    '<div class="form-grid">' +
      '<div class="form-group">' +
        '<label>Next Action Required</label>' +
        '<input type="text" class="form-control" id="modal-outcome-next-action" placeholder="e.g. Prepare BOQ and 3D concept renders">' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Next Follow-up Date</label>' +
        '<input type="date" class="form-control" id="modal-outcome-next-date">' +
      '</div>' +
    '</div>';

  openModal({
    title: 'Record Site Visit Report — ' + visit.id,
    body: body,
    confirmText: 'Submit Visit Report',
    onConfirm: function() {
      var summary = document.getElementById('modal-outcome-summary').value.trim();
      var req = document.getElementById('modal-outcome-req').value.trim();
      var meas = document.getElementById('modal-outcome-measurements').value.trim();
      var nextAction = document.getElementById('modal-outcome-next-action').value.trim();
      var nextDate = document.getElementById('modal-outcome-next-date').value;

      if (!summary || !req || !meas) {
        showToast('Please fill out outcome summary, requirements and measurements', 'error');
        return false;
      }

      visit.status = 'Completed';
      visit.completedDate = new Date().toISOString();
      visit.outcome = summary;
      visit.requirements = req;
      visit.measurements = meas;
      visit.nextAction = nextAction;
      visit.followupDate = nextDate;

      // Automatically advance lead stage to site-visit-completed
      var lead = CRM_LEADS.find(function(l) { return l.id === visit.leadId; });
      if (lead && lead.stage === 'site-visit-scheduled') {
        lead.stage = 'site-visit-completed';
        CRM_STAGE_HISTORY.unshift({
          leadId: lead.id,
          from: 'Site Visit Scheduled',
          to: 'Site Visit Completed',
          date: new Date().toISOString(),
          user: 'Priya Sharma',
          notes: 'Site visit completed: ' + summary
        });
      }

      // Log activity
      CRM_ACTIVITIES.unshift({
        id: crmUid('ACT'),
        leadId: visit.leadId,
        type: 'Meeting',
        user: 'Priya Sharma',
        timestamp: new Date().toISOString(),
        summary: 'Site visit completed: ' + visit.purpose,
        detail: 'Outcome: ' + summary + ' | Next Action: ' + nextAction
      });

      // Schedule next follow-up if date provided
      if (nextDate) {
        CRM_FOLLOWUPS.unshift({
          id: crmUid('FU'),
          leadId: visit.leadId,
          customerName: visit.customerName,
          assignedTo: visit.assignedTo,
          date: nextDate + 'T11:00',
          type: 'Call',
          status: 'Pending',
          notes: 'Follow-up regarding ' + (nextAction || 'visit outcome presentation')
        });
        if (lead) lead.nextFollowup = nextDate + 'T11:00';
      }

      showToast('Site visit report saved successfully', 'success');
      renderSiteVisits();
      return true;
    }
  });
}
