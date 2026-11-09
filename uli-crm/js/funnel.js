/**
 * ULI Studio ERP — Sales Funnel Analysis Module (SCREEN 8)
 * ═════════════════════════════════════════════════════════
 * Implements:
 *  - 6-Stage Sales Funnel: Enquiry → Qualified → Site Visit → Quotation → Negotiation → Won
 *  - Clear denominator metrics (Stage Conversion %, Drop-off %, Overall Conversion %)
 *  - Interactive colored funnel bars with proportional widths
 *  - Performance breakdown by Salesperson
 *  - Performance breakdown by Lead Source
 *  - Filters: Date Range, Salesperson, Lead Source
 */

'use strict';

function initFunnelFilters() {
  var spSelect = document.getElementById('funnel-salesperson-filter');
  var srcSelect = document.getElementById('funnel-source-filter');
  var dateSelect = document.getElementById('funnel-date-filter');

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

  if (spSelect && !spSelect._bound) {
    spSelect.addEventListener('change', renderFunnelAnalysis);
    spSelect._bound = true;
  }
  if (srcSelect && !srcSelect._bound) {
    srcSelect.addEventListener('change', renderFunnelAnalysis);
    srcSelect._bound = true;
  }
  if (dateSelect && !dateSelect._bound) {
    dateSelect.addEventListener('change', renderFunnelAnalysis);
    dateSelect._bound = true;
  }
}

function getFilteredFunnelLeads() {
  var sp = (document.getElementById('funnel-salesperson-filter') || {}).value || 'all';
  var src = (document.getElementById('funnel-source-filter') || {}).value || 'all';

  return CRM_LEADS.filter(function(lead) {
    if (sp !== 'all' && lead.salesperson !== sp) return false;
    if (src !== 'all' && lead.source !== src) return false;
    return true;
  });
}

function renderFunnelAnalysis() {
  initFunnelFilters();

  var leads = getFilteredFunnelLeads();
  var container = document.getElementById('funnel-chart-bars');
  container.innerHTML = '';

  /* ── Define 6 Funnel Steps ── */
  // An enquiry has reached a step if its current or past stage has progressed up to or beyond that step.
  var funnelSteps = [
    {
      id: 'enquiry',
      name: '1. Inbound Enquiry',
      color: '#6366f1',
      matcher: function() { return true; } // All leads start as enquiries
    },
    {
      id: 'qualified',
      name: '2. Qualified Prospect',
      color: '#2563eb',
      matcher: function(l) { return l.stage !== 'new-enquiry'; }
    },
    {
      id: 'site-visit',
      name: '3. Site Visit Conducted',
      color: '#0891b2',
      matcher: function(l) {
        return ['site-visit-scheduled','site-visit-completed','quotation-preparation','quotation-sent','negotiation','won'].indexOf(l.stage) !== -1 ||
               CRM_SITE_VISITS.some(function(v){ return v.leadId === l.id; });
      }
    },
    {
      id: 'quotation',
      name: '4. Quotation Prepared',
      color: '#ca8a04',
      matcher: function(l) {
        return ['quotation-preparation','quotation-sent','negotiation','won'].indexOf(l.stage) !== -1 ||
               CRM_QUOTATIONS.some(function(q){ return q.leadId === l.id; });
      }
    },
    {
      id: 'negotiation',
      name: '5. Negotiation',
      color: '#ea580c',
      matcher: function(l) {
        return ['negotiation','won'].indexOf(l.stage) !== -1;
      }
    },
    {
      id: 'won',
      name: '6. Won & Contracted',
      color: '#16a34a',
      matcher: function(l) {
        return l.stage === 'won';
      }
    }
  ];

  var initialCount = leads.length || 1;
  var prevCount = initialCount;

  funnelSteps.forEach(function(step, idx) {
    var count = leads.filter(step.matcher).length;
    var pctOfInitial = Math.round((count / initialCount) * 100);

    // Stage conversion percentage (Denominator: preceding step count)
    var stageConv = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
    var dropoff = 100 - stageConv;
    if (idx === 0) { stageConv = 100; dropoff = 0; }

    var row = document.createElement('div');
    row.className = 'funnel-stage-row';

    var widthPct = Math.max(pctOfInitial, 14); // Min visual bar width

    row.innerHTML =
      '<div class="funnel-stage-name">' + escapeHtml(step.name) + '</div>' +
      '<div class="funnel-bar-container">' +
        '<div class="funnel-bar" style="width:' + widthPct + '%;background:' + step.color + '">' +
          '<span>' + count + ' leads (' + pctOfInitial + '%)</span>' +
        '</div>' +
      '</div>' +
      '<div class="funnel-stats">' +
        '<div class="funnel-conv" title="Conversion from previous stage">' +
          (idx === 0 ? 'Baseline (100%)' : '↑ ' + stageConv + '% conv') +
        '</div>' +
        '<div class="funnel-dropoff" title="Drop-off from previous stage">' +
          (idx === 0 ? '' : '↓ ' + dropoff + '% drop') +
        '</div>' +
      '</div>';

    container.appendChild(row);
    prevCount = count;
  });

  // Overall Conversion Badge
  var wonCount = leads.filter(function(l) { return l.stage === 'won'; }).length;
  var overallConvPct = ((wonCount / initialCount) * 100).toFixed(1);
  var overallBadge = document.getElementById('funnel-overall-conv');
  if (overallBadge) {
    overallBadge.textContent = 'Overall Conversion: ' + overallConvPct + '% (' + wonCount + '/' + leads.length + ')';
  }

  /* ── Performance by Salesperson Table ── */
  var repTbody = document.getElementById('funnel-rep-tbody');
  repTbody.innerHTML = '';

  CRM_SALESPEOPLE.forEach(function(sp) {
    var repLeads = leads.filter(function(l) { return l.salesperson === sp.id; });
    var visitsCount = CRM_SITE_VISITS.filter(function(v) { return v.assignedTo === sp.id; }).length;
    var quotesCount = CRM_QUOTATIONS.filter(function(q) { return q.createdBy === sp.id; }).length;
    var wonDeals = repLeads.filter(function(l) { return l.stage === 'won'; }).length;
    var winRate = repLeads.length > 0 ? ((wonDeals / repLeads.length) * 100).toFixed(1) + '%' : '0.0%';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><span style="font-weight:600">' + escapeHtml(sp.name) + '</span><div style="font-size:.72rem;color:var(--text-muted)">' + escapeHtml(sp.role) + '</div></td>' +
      '<td>' + repLeads.length + '</td>' +
      '<td>' + visitsCount + '</td>' +
      '<td>' + quotesCount + '</td>' +
      '<td><strong style="color:var(--green)">' + wonDeals + '</strong></td>' +
      '<td><span class="badge ' + (wonDeals > 0 ? 'badge-status-accepted' : 'badge-stage') + '">' + winRate + '</span></td>';

    repTbody.appendChild(tr);
  });

  /* ── Performance by Lead Source Table ── */
  var srcTbody = document.getElementById('funnel-source-tbody');
  srcTbody.innerHTML = '';

  CRM_SOURCES.forEach(function(src) {
    var srcLeads = leads.filter(function(l) { return l.source === src; });
    var pipeVal = srcLeads.reduce(function(a, b) { return a + (b.expectedValue || 0); }, 0);
    var wonDeals = srcLeads.filter(function(l) { return l.stage === 'won'; }).length;
    var convPct = srcLeads.length > 0 ? ((wonDeals / srcLeads.length) * 100).toFixed(1) + '%' : '0.0%';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><span style="font-weight:600">' + escapeHtml(src) + '</span></td>' +
      '<td>' + srcLeads.length + '</td>' +
      '<td>' + formatCurrency(pipeVal) + '</td>' +
      '<td>' + wonDeals + '</td>' +
      '<td><span class="badge badge-stage">' + convPct + '</span></td>';

    srcTbody.appendChild(tr);
  });

  lucide.createIcons();
}
