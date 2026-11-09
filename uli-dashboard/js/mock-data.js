/**
 * ULI Studio ERP — Mock Data Module
 * ──────────────────────────────────
 * All values are DEMO DATA for prototype purposes only.
 * No real company financial figures are represented.
 *
 * This module is the single source of truth for all demo data
 * consumed by dashboard.js and app.js.
 */

'use strict';

const DEMO_DATA = Object.freeze({

  /* ───── User ───── */
  user: {
    name: 'Priya Sharma',
    initials: 'PS',
    role: 'Admin',
    email: 'priya@ulistudio.com',
    avatar: null
  },

  /* ───── KPI Cards ───── */
  kpis: [
    {
      id: 'revenue-fy',
      label: 'Revenue FY',
      value: 18450000,
      previousValue: 15200000,
      format: 'currency',
      icon: 'indian-rupee',
      colorClass: 'kpi-blue'
    },
    {
      id: 'receivables',
      label: 'Receivables',
      value: 4320000,
      previousValue: 3890000,
      format: 'currency',
      icon: 'wallet',
      colorClass: 'kpi-amber'
    },
    {
      id: 'active-projects',
      label: 'Active Projects',
      value: 12,
      previousValue: 9,
      format: 'number',
      icon: 'folder-kanban',
      colorClass: 'kpi-green'
    },
    {
      id: 'open-leads',
      label: 'Open Leads',
      value: 27,
      previousValue: 31,
      format: 'number',
      icon: 'users',
      colorClass: 'kpi-purple'
    },
    {
      id: 'purchase-po',
      label: 'Purchase & PO',
      value: 8684000,
      previousValue: 6200000,
      format: 'currency',
      icon: 'shopping-bag',
      colorClass: 'kpi-teal'
    }
  ],

  /* ───── Action Required ───── */
  actionItems: [
    {
      id: 'PR-2026-0089',
      description: 'Purchase Requisition — Italian Marble Tiles',
      module: 'Purchase',
      assignedTo: 'Rahul Mehta',
      dueDate: '2026-11-10',
      priority: 'High',
      status: 'Awaiting Approval'
    },
    {
      id: 'INV-2026-0234',
      description: 'Supplier Invoice — Lightworks Pvt Ltd',
      module: 'Accounting',
      assignedTo: 'Neha Kapoor',
      dueDate: '2026-11-08',
      priority: 'Critical',
      status: 'Review Required'
    },
    {
      id: 'QT-2026-0156',
      description: 'Quotation — Oberoi Residence Interiors',
      module: 'CRM',
      assignedTo: 'Amit Verma',
      dueDate: '2026-11-12',
      priority: 'Medium',
      status: 'Awaiting Approval'
    },
    {
      id: 'LD-2026-0312',
      description: 'Follow-up Overdue — Taj Hotel Lobby Redesign',
      module: 'CRM',
      assignedTo: 'Priya Sharma',
      dueDate: '2026-11-06',
      priority: 'High',
      status: 'Overdue'
    },
    {
      id: 'PO-2026-0178',
      description: 'Purchase Order — Custom Wooden Panels',
      module: 'Purchase',
      assignedTo: 'Deepak Singh',
      dueDate: '2026-11-14',
      priority: 'Low',
      status: 'Pending Review'
    }
  ],

  /* ───── Project Health ───── */
  projects: [
    {
      id: 'proj-001',
      name: 'Prestige Tower — Penthouse Suite',
      stage: 'Execution',
      completion: 72,
      health: 'on-track',
      manager: 'Rahul Mehta'
    },
    {
      id: 'proj-002',
      name: 'Oberoi Residence — Full Interiors',
      stage: 'Design Development',
      completion: 35,
      health: 'at-risk',
      manager: 'Amit Verma'
    },
    {
      id: 'proj-003',
      name: 'Godrej Office — Workspace Fitout',
      stage: 'Handover',
      completion: 94,
      health: 'on-track',
      manager: 'Neha Kapoor'
    },
    {
      id: 'proj-004',
      name: 'Brigade Villa — Landscape Design',
      stage: 'Concept',
      completion: 15,
      health: 'delayed',
      manager: 'Deepak Singh'
    }
  ],

  /* ───── Recent Activity ───── */
  recentActivity: [
    {
      user: 'Priya Sharma',
      action: 'created a new lead',
      detail: 'Birla Estate — 4BHK Interiors',
      timestamp: '2026-11-09T10:45:00',
      icon: 'user-plus',
      type: 'lead'
    },
    {
      user: 'Amit Verma',
      action: 'updated quotation',
      detail: 'QT-2026-0156 — Oberoi Residence',
      timestamp: '2026-11-09T09:30:00',
      icon: 'file-text',
      type: 'quotation'
    },
    {
      user: 'Rahul Mehta',
      action: 'submitted purchase requisition',
      detail: 'PR-2026-0089 — Italian Marble Tiles',
      timestamp: '2026-11-08T16:20:00',
      icon: 'shopping-cart',
      type: 'purchase'
    },
    {
      user: 'Neha Kapoor',
      action: 'approved purchase order',
      detail: 'PO-2026-0171 — Sanitary Fixtures',
      timestamp: '2026-11-08T14:10:00',
      icon: 'check-circle',
      type: 'approval'
    },
    {
      user: 'Deepak Singh',
      action: 'recorded goods received',
      detail: 'GRN-2026-0098 — Electrical Fittings',
      timestamp: '2026-11-08T11:45:00',
      icon: 'package',
      type: 'goods'
    }
  ],

  /* ───── Notifications ───── */
  notifications: [
    {
      id: 1,
      title: 'Purchase Requisition Approval',
      message: 'PR-2026-0089 requires your approval',
      time: '10 min ago',
      read: false,
      type: 'approval'
    },
    {
      id: 2,
      title: 'Invoice Overdue',
      message: 'INV-2026-0220 payment is 5 days overdue',
      time: '1 hour ago',
      read: false,
      type: 'warning'
    },
    {
      id: 3,
      title: 'Project Milestone Reached',
      message: 'Godrej Office — Workspace Fitout reached 94%',
      time: '3 hours ago',
      read: true,
      type: 'info'
    },
    {
      id: 4,
      title: 'New Lead Assigned',
      message: 'Birla Estate lead assigned to you',
      time: '5 hours ago',
      read: true,
      type: 'info'
    }
  ],

  /* ───── Sidebar Navigation ───── */
  navItems: [
    { id: 'overview',       label: 'Overview',              icon: 'layout-dashboard', active: true,  implemented: true },
    { id: 'crm',            label: 'Leads & CRM',           icon: 'handshake',        active: false, implemented: true, href: '../uli-crm/index.html' },
    { id: 'purchase',       label: 'Purchase & PO',         icon: 'shopping-bag',     active: false, implemented: true, href: '../uli-purchase/index.html' },
    { id: 'projects',       label: 'Project Management',    icon: 'kanban',           active: false, implemented: false },
    { id: 'documents',      label: 'Drawings & Documents',  icon: 'file-stack',       active: false, implemented: false },
    { id: 'accounting',     label: 'Accounting & Finance',  icon: 'calculator',       active: false, implemented: false },
    { id: 'hr',             label: 'HR & Payroll',           icon: 'badge-check',      active: false, implemented: false },
    { id: 'roles',          label: 'Roles & Approvals',     icon: 'shield-check',     active: false, implemented: false }
  ]
});
