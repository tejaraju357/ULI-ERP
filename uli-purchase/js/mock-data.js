/**
 * ULI Studio ERP — Purchase & PO Mock Data Module
 * ═══════════════════════════════════════════════
 * Single source of truth for procurement demo data.
 * All financial numbers and vendors are realistic demo data.
 */

'use strict';

/* ── Lookup Enums & Configurable Rules ── */
var PURCHASE_PROJECTS = [
  { id: 'proj-001', name: 'Prestige Tower — Penthouse Suite', site: 'Worli, Mumbai' },
  { id: 'proj-002', name: 'Oberoi Residence — Full Interiors', site: 'Juhu, Mumbai' },
  { id: 'proj-003', name: 'Godrej Office — Workspace Fitout', site: 'BKC, Mumbai' },
  { id: 'proj-004', name: 'Brigade Villa — Landscape Design', site: 'Whitefield, Bengaluru' },
  { id: 'proj-005', name: 'DLF Camellias — Luxury Penthouse', site: 'Sector 42, Gurugram' }
];

var PURCHASE_CATEGORIES = [
  'Tiles & Marble',
  'Timber & Woodwork',
  'Sanitary & Plumbing',
  'Electrical & Automation',
  'Lighting & Fixtures',
  'Paints & Wall Finishes',
  'Glass & Metal Fabrication',
  'Hardware & Fasteners',
  'Furnishings & Fabrics'
];

var PR_STATUSES = ['Draft', 'Pending Approval', 'Approved', 'Changes Requested', 'Rejected', 'PO Created'];
var PO_STATUSES = ['Draft', 'Pending Approval', 'Approved', 'Issued', 'Partially Received', 'Fully Received', 'Closed', 'Cancelled'];
var GRN_STATUSES = ['Pending Inspection', 'Accepted', 'Partially Rejected', 'Rejected'];
var MATCH_STATUSES = ['Matched', 'Quantity Mismatch', 'Rate Mismatch', 'Tax Mismatch', 'Under Review', 'Approved for Payment'];
var EXCEPTION_TYPES = ['Short Delivery', 'Excess Delivery', 'Damaged Goods', 'Price Difference', 'Tax Difference', 'Delayed Delivery', 'PO Amendment'];

var APPROVAL_LIMIT_RULES = [
  { level: 1, title: 'Project Manager Approval', limit: 100000, desc: 'Requisitions up to ₹1,00,000 approved by Project Manager' },
  { level: 2, title: 'Procurement Head Approval', limit: 1000000, desc: 'Requisitions up to ₹10,00,000 approved by Procurement Head' },
  { level: 3, title: 'Director / MD Approval', limit: Infinity, desc: 'Requisitions exceeding ₹10,00,000 require Managing Director approval' }
];

var PURCHASE_USERS = [
  { id: 'usr-01', name: 'Priya Sharma', role: 'Sales Lead / Admin', dept: 'Design & Sales' },
  { id: 'usr-02', name: 'Rahul Mehta', role: 'Project Manager', dept: 'Execution' },
  { id: 'usr-03', name: 'Neha Kapoor', role: 'Procurement Manager', dept: 'Purchase & Supply' },
  { id: 'usr-04', name: 'Deepak Singh', role: 'Site Engineer', dept: 'Site Operations' },
  { id: 'usr-05', name: 'Vikram Malhotra', role: 'Managing Director', dept: 'Executive' }
];

var _purIdCounter = 500;
function purUid(prefix) { return prefix + '-' + (++_purIdCounter); }

/* ═══════════════════════════════════════
   VENDORS (SCREEN 13 & 14)
   ═══════════════════════════════════════ */
var PURCHASE_VENDORS = [
  {
    id: 'VND-001',
    name: 'Marmi Italian Imports Pvt Ltd',
    category: 'Tiles & Marble',
    contactPerson: 'Giorgio Rossi / Alok Gupta',
    phone: '+91 98200 11223',
    email: 'orders@marmi-italia.in',
    gstin: '27AABCM8821Q1ZU',
    address: 'Plot 45, Marble Market, Makrana Road, Navi Mumbai 400705',
    paymentTerms: '30 Days Net',
    rating: 4.8,
    onTimeDeliveryRate: 94,
    qualityIssuesCount: 1,
    outstandingBalance: 620000,
    status: 'Active',
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountNumber: '••••••••4821',
      ifsc: 'HDFC0000240',
      branch: 'Bandra West, Mumbai'
    }
  },
  {
    id: 'VND-002',
    name: 'TimberCraft Woods & Panels',
    category: 'Timber & Woodwork',
    contactPerson: 'Harpreet Singh',
    phone: '+91 98111 44556',
    email: 'sales@timbercraft.co.in',
    gstin: '27AABCT4321R1ZX',
    address: 'Survey 12, Timber Depot, Reay Road, Mumbai 400010',
    paymentTerms: '15 Days Net',
    rating: 4.5,
    onTimeDeliveryRate: 88,
    qualityIssuesCount: 2,
    outstandingBalance: 285000,
    status: 'Active',
    bankDetails: {
      bankName: 'ICICI Bank Ltd',
      accountNumber: '••••••••9012',
      ifsc: 'ICIC0000104',
      branch: 'Nariman Point, Mumbai'
    }
  },
  {
    id: 'VND-003',
    name: 'Kohler Signature Fixtures & Bath',
    category: 'Sanitary & Plumbing',
    contactPerson: 'Sunil Rao',
    phone: '+91 98450 77889',
    email: 'sunil.rao@kohlerdistributor.in',
    gstin: '29AAACK5512L1ZV',
    address: 'Brigade Metropolis, Whitefield, Bengaluru 560048',
    paymentTerms: 'Immediate Advance (50%) / Net 30',
    rating: 4.9,
    onTimeDeliveryRate: 98,
    qualityIssuesCount: 0,
    outstandingBalance: 145000,
    status: 'Active',
    bankDetails: {
      bankName: 'Kotak Mahindra Bank',
      accountNumber: '••••••••3319',
      ifsc: 'KKBK0000420',
      branch: 'MG Road, Bengaluru'
    }
  },
  {
    id: 'VND-004',
    name: 'Lumina Smart Architectural Lighting',
    category: 'Lighting & Fixtures',
    contactPerson: 'Meenakshi Sundaram',
    phone: '+91 98205 33441',
    email: 'projects@lumina-lighting.com',
    gstin: '27AABCL9011M1ZY',
    address: '102 Industrial Estate, Kanjurmarg West, Mumbai 400078',
    paymentTerms: '30 Days Net',
    rating: 4.2,
    onTimeDeliveryRate: 82,
    qualityIssuesCount: 3,
    outstandingBalance: 410000,
    status: 'Active',
    bankDetails: {
      bankName: 'Axis Bank Ltd',
      accountNumber: '••••••••6642',
      ifsc: 'UTIB0000005',
      branch: 'Fort, Mumbai'
    }
  },
  {
    id: 'VND-005',
    name: 'Schneider Smart Systems Automation',
    category: 'Electrical & Automation',
    contactPerson: 'Rajesh Kulkarni',
    phone: '+91 98920 66778',
    email: 'automation@schneider-channel.in',
    gstin: '27AAACS1129P1ZW',
    address: 'Andheri-Kurla Road, Chakala, Andheri East, Mumbai 400093',
    paymentTerms: '45 Days Net',
    rating: 4.7,
    onTimeDeliveryRate: 92,
    qualityIssuesCount: 1,
    outstandingBalance: 530000,
    status: 'Active',
    bankDetails: {
      bankName: 'State Bank of India',
      accountNumber: '••••••••1184',
      ifsc: 'SBIN0000300',
      branch: 'Main Branch, Mumbai'
    }
  },
  {
    id: 'VND-006',
    name: 'Saint-Gobain Glass & Facade Corp',
    category: 'Glass & Metal Fabrication',
    contactPerson: 'Anand Patel',
    phone: '+91 99090 12345',
    email: 'anand@saint-gobain-dealer.in',
    gstin: '24AABCS8891N1ZX',
    address: 'GIDC Industrial Area, Makarpura, Vadodara 390010',
    paymentTerms: '30 Days Net',
    rating: 4.6,
    onTimeDeliveryRate: 90,
    qualityIssuesCount: 1,
    outstandingBalance: 190000,
    status: 'Active',
    bankDetails: {
      bankName: 'Bank of Baroda',
      accountNumber: '••••••••5501',
      ifsc: 'BARB0MAKARP',
      branch: 'Makarpura, Vadodara'
    }
  },
  {
    id: 'VND-007',
    name: 'Asian Paints Pro Finishing Hub',
    category: 'Paints & Wall Finishes',
    contactPerson: 'Karan Shah',
    phone: '+91 98212 99001',
    email: 'karan@asianpaints-pro.in',
    gstin: '27AABCA3310K1ZT',
    address: 'Santacruz Industrial Area, Mumbai 400055',
    paymentTerms: '15 Days Net',
    rating: 4.9,
    onTimeDeliveryRate: 96,
    qualityIssuesCount: 0,
    outstandingBalance: 75000,
    status: 'Active',
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountNumber: '••••••••7721',
      ifsc: 'HDFC0000019',
      branch: 'Santacruz West, Mumbai'
    }
  },
  {
    id: 'VND-008',
    name: 'Hafele Architectural Hardware Mart',
    category: 'Hardware & Fasteners',
    contactPerson: 'Pradeep Joshi',
    phone: '+91 98333 44552',
    email: 'hardware@hafele-store.in',
    gstin: '27AABCH1098J1ZU',
    address: 'Dadar TT Circle, Mumbai 400014',
    paymentTerms: '30 Days Net',
    rating: 4.4,
    onTimeDeliveryRate: 85,
    qualityIssuesCount: 2,
    outstandingBalance: 120000,
    status: 'Active',
    bankDetails: {
      bankName: 'Standard Chartered Bank',
      accountNumber: '••••••••8819',
      ifsc: 'SCBL0036001',
      branch: 'Fort, Mumbai'
    }
  }
];

/* ═══════════════════════════════════════
   PURCHASE REQUISITIONS (SCREEN 2, 3, 4, 5)
   ═══════════════════════════════════════ */
var PURCHASE_REQUISITIONS = [
  {
    id: 'PR-2026-0089',
    requestedBy: 'Rahul Mehta',
    department: 'Execution',
    projectId: 'proj-001',
    projectName: 'Prestige Tower — Penthouse Suite',
    siteLocation: 'Worli Sea Face, Mumbai',
    requiredDate: '2026-11-20',
    priority: 'High',
    purpose: 'Imported marble tiles required for 4,000 sqft main hall and master suite flooring prior to electrical fitout.',
    preferredVendorId: 'VND-001',
    clientChangeRef: 'CR-2026-0042',
    clientName: 'Vikram Singhania',
    clientChangeSummary: 'Client requested upgrade from composite tiles to imported bookmatched Italian Calacatta Gold slabs (+₹14.50 L variance).',
    status: 'Pending Approval',
    currentApproverId: 'usr-03',
    currentApprovalLevel: 2,
    submissionDate: '2026-11-07T14:30:00',
    createdDate: '2026-11-07',
    items: [
      { id: 1, name: 'Calacatta Gold Italian Marble Slabs', category: 'Tiles & Marble', spec: '20mm thick, polished, bookmatched, Lot A1', unit: 'sqft', qty: 2400, rate: 1850, total: 4440000 },
      { id: 2, name: 'Statuario White Marble Borders', category: 'Tiles & Marble', spec: '150mm wide border strips, honed finish', unit: 'rft', qty: 350, rate: 650, total: 227500 },
      { id: 3, name: 'Epoxy Grout & Adhesive Compound', category: 'Tiles & Marble', spec: 'Laticrete 254 Platinum adhesive bags', unit: 'bags', qty: 60, rate: 1250, total: 75000 }
    ],
    estimatedAmount: 4742500,
    approvalHistory: [
      { step: 'Requisition Created', user: 'Rahul Mehta', date: '2026-11-07 14:30', status: 'Submitted', notes: 'Created based on Client Variation Order CR-2026-0042.' },
      { step: 'Level 1: Project Manager', user: 'Rahul Mehta', date: '2026-11-07 14:30', status: 'Self-Verified', notes: 'Budget allocated under Penthouse Flooring head.' }
    ],
    comments: [
      { user: 'Rahul Mehta', time: '2026-11-07 15:00', text: 'Vendor confirms Lot A1 is available at Mumbai port depot. Need approval by 12 Nov.' }
    ]
  },
  {
    id: 'PR-2026-0090',
    requestedBy: 'Deepak Singh',
    department: 'Site Operations',
    projectId: 'proj-003',
    projectName: 'Godrej Office — Workspace Fitout',
    siteLocation: 'BKC G Block, Mumbai',
    requiredDate: '2026-11-18',
    priority: 'Critical',
    purpose: 'Acoustic modular ceiling tiles and smart perimeter cove lighting for 200-person cafeteria.',
    preferredVendorId: 'VND-004',
    clientChangeRef: 'CR-2026-0043',
    clientName: 'Rohit Malpani',
    clientChangeSummary: 'Client layout change: Convert 4 executive cabins to open collaborative zone (+₹1.40 L variance).',
    status: 'Pending Approval',
    currentApproverId: 'usr-02',
    currentApprovalLevel: 1,
    submissionDate: '2026-11-08T09:15:00',
    createdDate: '2026-11-08',
    items: [
      { id: 1, name: 'Architectural Acoustic Gypsum Panels', category: 'Timber & Woodwork', spec: '600x600mm micro-perforated sound absorbing', unit: 'sqft', qty: 1800, rate: 220, total: 396000 },
      { id: 2, name: 'Dimmable DALI Linear LED Battens', category: 'Lighting & Fixtures', spec: '4000K Neutral White, 36W, 1200mm continuous', unit: 'nos', qty: 85, rate: 2400, total: 204000 }
    ],
    estimatedAmount: 600000,
    approvalHistory: [
      { step: 'Requisition Created', user: 'Deepak Singh', date: '2026-11-08 09:15', status: 'Submitted', notes: 'Urgent — ceiling grid installation begins next week.' }
    ],
    comments: []
  },
  {
    id: 'PR-2026-0091',
    requestedBy: 'Rahul Mehta',
    department: 'Execution',
    projectId: 'proj-002',
    projectName: 'Oberoi Residence — Full Interiors',
    siteLocation: 'Juhu Tara Road, Mumbai',
    requiredDate: '2026-11-25',
    priority: 'High',
    purpose: 'Kohler Rose Gold bathroom fixtures and concealed thermostatic mixers for 4 master bathrooms.',
    preferredVendorId: 'VND-003',
    clientChangeRef: 'CR-2026-0041',
    clientName: 'Mrs. Sunita Oberoi',
    clientChangeSummary: 'Client requested upgrade to Vibrant Rose Gold collection and Veil smart bidet toilets (+₹2.86 L variance).',
    status: 'Approved',
    currentApproverId: 'usr-03',
    currentApprovalLevel: 2,
    submissionDate: '2026-11-04T11:00:00',
    createdDate: '2026-11-04',
    items: [
      { id: 1, name: 'Kohler Components Thermostatic Valve Trim', category: 'Sanitary & Plumbing', spec: 'Vibrant Rose Gold brushed finish, dual control', unit: 'nos', qty: 4, rate: 42000, total: 168000 },
      { id: 2, name: 'Ceiling Mount Rainhead Shower 300mm', category: 'Sanitary & Plumbing', spec: 'Katalyst air-induction spray, Rose Gold', unit: 'nos', qty: 4, rate: 28500, total: 114000 },
      { id: 3, name: 'Wall Hung Rimless Smart Bidet Toilet', category: 'Sanitary & Plumbing', spec: 'Veil wall-hung with sensor actuator plate', unit: 'nos', qty: 4, rate: 85000, total: 340000 }
    ],
    estimatedAmount: 622000,
    approvalHistory: [
      { step: 'Requisition Created', user: 'Rahul Mehta', date: '2026-11-04 11:00', status: 'Submitted', notes: 'Client accepted bathroom layout.' },
      { step: 'Level 1: Project Manager', user: 'Rahul Mehta', date: '2026-11-04 11:30', status: 'Approved', notes: 'Within interior budget specs.' },
      { step: 'Level 2: Procurement Head', user: 'Neha Kapoor', date: '2026-11-05 16:45', status: 'Approved', notes: 'Approved for PO creation.' }
    ],
    comments: [
      { user: 'Neha Kapoor', time: '2026-11-05 16:40', text: 'Kohler distributor offers 8% commercial discount on this lot.' }
    ]
  },
  {
    id: 'PR-2026-0092',
    requestedBy: 'Deepak Singh',
    department: 'Site Operations',
    projectId: 'proj-004',
    projectName: 'Brigade Villa — Landscape Design',
    siteLocation: 'Whitefield, Bengaluru',
    requiredDate: '2026-11-15',
    priority: 'Medium',
    purpose: 'Weatherproof exterior LED spike spotlights and submerged fountain luminaires.',
    preferredVendorId: 'VND-004',
    status: 'PO Created',
    currentApproverId: 'usr-03',
    currentApprovalLevel: 1,
    submissionDate: '2026-10-25T10:00:00',
    createdDate: '2026-10-25',
    items: [
      { id: 1, name: 'IP68 Underwater LED Fountain Lights 12W', category: 'Lighting & Fixtures', spec: 'RGBW controllable, 24V DC stainless steel 316', unit: 'nos', qty: 12, rate: 8500, total: 102000 },
      { id: 2, name: 'COB Garden Spike Spotlight 15W', category: 'Lighting & Fixtures', spec: '3000K Warm White, IP67 dark grey casing', unit: 'nos', qty: 30, rate: 3200, total: 96000 }
    ],
    estimatedAmount: 198000,
    approvalHistory: [
      { step: 'Requisition Created', user: 'Deepak Singh', date: '2026-10-25 10:00', status: 'Submitted', notes: 'Landscape design stage 2.' },
      { step: 'Approval Level 1', user: 'Rahul Mehta', date: '2026-10-26 14:00', status: 'Approved', notes: 'Approved as per lighting schedule.' }
    ],
    comments: []
  },
  {
    id: 'PR-2026-0093',
    requestedBy: 'Priya Sharma',
    department: 'Design & Sales',
    projectId: 'proj-005',
    projectName: 'DLF Camellias — Luxury Penthouse',
    siteLocation: 'Sector 42, Gurugram',
    requiredDate: '2026-12-05',
    priority: 'Critical',
    purpose: 'Crestron Home Automation processors, smart keypads, and motorized curtain tracks for 10,000 sqft penthouse.',
    preferredVendorId: 'VND-005',
    status: 'Pending Approval',
    currentApproverId: 'usr-05',
    currentApprovalLevel: 3,
    submissionDate: '2026-11-06T17:00:00',
    createdDate: '2026-11-06',
    items: [
      { id: 1, name: 'Crestron CP4-R Control Processor', category: 'Electrical & Automation', spec: '4-Series quad-core control processor for Crestron Home OS', unit: 'nos', qty: 2, rate: 380000, total: 760000 },
      { id: 2, name: 'Horizon Custom Backlit Keypads', category: 'Electrical & Automation', spec: 'Brushed metal, engraved buttons, white LED', unit: 'nos', qty: 28, rate: 26000, total: 728000 },
      { id: 3, name: 'Somfy Motorized Drape Tracks RTS', category: 'Electrical & Automation', spec: 'Ultra quiet Glydea 60 motors, customized 6m spans', unit: 'lot', qty: 8, rate: 55000, total: 440000 }
    ],
    estimatedAmount: 1928000,
    approvalHistory: [
      { step: 'Requisition Created', user: 'Priya Sharma', date: '2026-11-06 17:00', status: 'Submitted', notes: 'High-value penthouse automation package.' },
      { step: 'Level 1: Project Manager', user: 'Rahul Mehta', date: '2026-11-07 10:00', status: 'Approved', notes: 'Verified architectural integration drawings.' },
      { step: 'Level 2: Procurement Head', user: 'Neha Kapoor', date: '2026-11-07 12:30', status: 'Approved', notes: 'Forwarded to MD for Level 3 clearance (> ₹10L rule).' }
    ],
    comments: [
      { user: 'Neha Kapoor', time: '2026-11-07 12:35', text: 'Value exceeds ₹10,00,000 threshold. Escalated to Vikram Malhotra (MD) for final authorization.' }
    ]
  },
  {
    id: 'PR-2026-0094',
    requestedBy: 'Deepak Singh',
    department: 'Site Operations',
    projectId: 'proj-001',
    projectName: 'Prestige Tower — Penthouse Suite',
    siteLocation: 'Worli, Mumbai',
    requiredDate: '2026-11-12',
    priority: 'Low',
    purpose: 'Protective corrugated floor sheets and heavy-duty dust barriers for marble installation zone.',
    preferredVendorId: null,
    status: 'Changes Requested',
    currentApproverId: 'usr-02',
    currentApprovalLevel: 1,
    submissionDate: '2026-11-05T12:00:00',
    createdDate: '2026-11-05',
    items: [
      { id: 1, name: 'Heavy-duty Corrugated Floor Guard Sheets', category: 'Hardware & Fasteners', spec: '4mm thickness, waterproof plastic fluted board', unit: 'bundles', qty: 40, rate: 1600, total: 64000 }
    ],
    estimatedAmount: 64000,
    approvalHistory: [
      { step: 'Requisition Created', user: 'Deepak Singh', date: '2026-11-05 12:00', status: 'Submitted', notes: '' },
      { step: 'Changes Requested', user: 'Rahul Mehta', date: '2026-11-06 09:30', status: 'Returned', notes: 'Please verify if site stock from Godrej project can be reused before buying 40 new bundles.' }
    ],
    comments: []
  },
  {
    id: 'PR-2026-0095',
    requestedBy: 'Rahul Mehta',
    department: 'Execution',
    projectId: 'proj-003',
    projectName: 'Godrej Office — Workspace Fitout',
    siteLocation: 'BKC, Mumbai',
    requiredDate: '2026-11-10',
    priority: 'Medium',
    purpose: 'Imported acoustic fabric partitions for 6 executive conference rooms.',
    preferredVendorId: 'VND-002',
    status: 'Rejected',
    currentApproverId: 'usr-03',
    currentApprovalLevel: 2,
    submissionDate: '2026-10-28T16:00:00',
    createdDate: '2026-10-28',
    items: [
      { id: 1, name: 'Acoustic Wall Paneling Fabric Wrapped', category: 'Timber & Woodwork', spec: 'NRC 0.85, fire-rated class A', unit: 'sqft', qty: 900, rate: 450, total: 405000 }
    ],
    estimatedAmount: 405000,
    approvalHistory: [
      { step: 'Requisition Created', user: 'Rahul Mehta', date: '2026-10-28 16:00', status: 'Submitted', notes: '' },
      { step: 'Rejection', user: 'Neha Kapoor', date: '2026-10-30 11:00', status: 'Rejected', notes: 'Client revised scope to double-glazed demountable glass partitions instead of fabric. Requisition void.' }
    ],
    comments: []
  },
  {
    id: 'PR-2026-0096',
    requestedBy: 'Deepak Singh',
    department: 'Site Operations',
    projectId: 'proj-002',
    projectName: 'Oberoi Residence — Full Interiors',
    siteLocation: 'Juhu, Mumbai',
    requiredDate: '2026-11-28',
    priority: 'Medium',
    purpose: 'Asian Paints Royale Aspira emulsion and PU clear coat for teakwood ceiling rafters.',
    preferredVendorId: 'VND-007',
    status: 'Draft',
    currentApproverId: 'usr-02',
    currentApprovalLevel: 1,
    submissionDate: null,
    createdDate: '2026-11-09',
    items: [
      { id: 1, name: 'Asian Paints Royale Aspira Luxury Emulsion', category: 'Paints & Wall Finishes', spec: 'Morning Glory 0N12 shade, 20L buckets', unit: 'buckets', qty: 15, rate: 7800, total: 117000 },
      { id: 2, name: 'Aquadur PU 2K Water-based Wood Coat', category: 'Paints & Wall Finishes', spec: 'Matte clear topcoat 4L pack', unit: 'packs', qty: 12, rate: 3400, total: 40800 }
    ],
    estimatedAmount: 157800,
    approvalHistory: [],
    comments: []
  }
];

/* ═══════════════════════════════════════
   PURCHASE ORDERS (SCREEN 7, 8, 9)
   ═══════════════════════════════════════ */
var PURCHASE_ORDERS = [
  {
    id: 'PO-2026-0171',
    linkedPrId: 'PR-2026-0091',
    vendorId: 'VND-003',
    vendorName: 'Kohler Signature Fixtures & Bath',
    projectId: 'proj-002',
    projectName: 'Oberoi Residence — Full Interiors',
    poDate: '2026-11-06',
    expectedDeliveryDate: '2026-11-22',
    deliveryAddress: 'Oberoi Skyz, Flat 4501, Worli, Mumbai 400018',
    billingAddress: 'ULI Studio Pvt Ltd, 502 Hubtown Solaris, Andheri East, Mumbai 400069',
    paymentTerms: '50% Advance with PO, 50% upon GRN verification',
    status: 'Issued',
    clientChangeRef: 'CR-2026-0041',
    clientName: 'Mrs. Sunita Oberoi',
    clientChangeSummary: 'PO amended from v1.0 to v1.1 following client signed variation order VF-04 (Rose Gold upgrade & smart toilets).',
    orderedAmount: 679056,
    receivedAmount: 0,
    items: [
      { id: 1, desc: 'Kohler Components Thermostatic Valve Trim (Rose Gold)', unit: 'nos', qty: 4, receivedQty: 0, rate: 38640, discount: 8, taxPct: 18, total: 167543 },
      { id: 2, desc: 'Ceiling Mount Rainhead Shower 300mm (Rose Gold)', unit: 'nos', qty: 4, receivedQty: 0, rate: 26220, discount: 8, taxPct: 18, total: 113690 },
      { id: 3, desc: 'Wall Hung Rimless Smart Bidet Toilet (Veil)', unit: 'nos', qty: 4, receivedQty: 0, rate: 78200, discount: 8, taxPct: 18, total: 339075 }
    ],
    shippingCharges: 12000,
    subtotal: 575472,
    discountAmount: 46038,
    taxAmount: 91622,
    grandTotal: 633056,
    approvalHistory: [
      { step: 'PO Drafted', user: 'Neha Kapoor', date: '2026-11-05 17:00' },
      { step: 'PO Approved', user: 'Vikram Malhotra', date: '2026-11-06 10:15' },
      { step: 'PO Issued to Vendor', user: 'Neha Kapoor', date: '2026-11-06 11:30' },
      { step: 'Client Amendment v1.1 Applied', user: 'Neha Kapoor', date: '2026-11-07 16:00' }
    ],
    amendments: [
      {
        version: 'v1.1',
        date: '2026-11-07',
        changedBy: 'Neha Kapoor',
        clientChangeRef: 'CR-2026-0041',
        reason: 'Client Variation: Mrs. Sunita Oberoi signed Variation Order VF-04 upgrading Aleo chrome to Vibrant Rose Gold collection and Veil bidet toilets (+₹2,86,000 variance). Previous v1.0 value was ₹3,47,056.',
        previousTotal: 347056,
        newTotal: 633056
      }
    ],
    linkedGrns: []
  },
  {
    id: 'PO-2026-0168',
    linkedPrId: 'PR-2026-0092',
    vendorId: 'VND-004',
    vendorName: 'Lumina Smart Architectural Lighting',
    projectId: 'proj-004',
    projectName: 'Brigade Villa — Landscape Design',
    poDate: '2026-10-27',
    expectedDeliveryDate: '2026-11-10',
    deliveryAddress: 'Brigade Gateway Villa 4, Whitefield, Bengaluru 560066',
    billingAddress: 'ULI Studio Pvt Ltd, Bangalore Regional Office, Indiranagar 560038',
    paymentTerms: '30 Days Net from GRN',
    status: 'Partially Received',
    orderedAmount: 216530,
    receivedAmount: 112100,
    items: [
      { id: 1, desc: 'IP68 Underwater LED Fountain Lights 12W RGBW', unit: 'nos', qty: 12, receivedQty: 12, rate: 8000, discount: 5, taxPct: 18, total: 107674 },
      { id: 2, desc: 'COB Garden Spike Spotlight 15W Warm White', unit: 'nos', qty: 30, receivedQty: 10, rate: 3000, discount: 5, taxPct: 18, total: 100890 }
    ],
    shippingCharges: 3500,
    subtotal: 186000,
    discountAmount: 9300,
    taxAmount: 31806,
    grandTotal: 212006,
    approvalHistory: [
      { step: 'PO Created & Approved', user: 'Neha Kapoor', date: '2026-10-27 15:30' },
      { step: 'PO Issued', user: 'Neha Kapoor', date: '2026-10-28 09:00' }
    ],
    amendments: [
      { version: 'v1.1', date: '2026-11-02', changedBy: 'Neha Kapoor', reason: 'Split shipment approved due to partial vendor stock availability.' }
    ],
    linkedGrns: ['GRN-2026-0098']
  },
  {
    id: 'PO-2026-0165',
    linkedPrId: null,
    vendorId: 'VND-002',
    vendorName: 'TimberCraft Woods & Panels',
    projectId: 'proj-001',
    projectName: 'Prestige Tower — Penthouse Suite',
    poDate: '2026-10-15',
    expectedDeliveryDate: '2026-11-02',
    deliveryAddress: 'Worli Sea Face, Penthouse Tower, Mumbai',
    billingAddress: 'ULI Studio Pvt Ltd, Andheri East, Mumbai',
    paymentTerms: '15 Days Net',
    status: 'Fully Received',
    orderedAmount: 345000,
    receivedAmount: 345000,
    items: [
      { id: 1, desc: 'Burma Teak Veneer Decorative Fluted Panels', unit: 'panels', qty: 50, receivedQty: 50, rate: 5800, discount: 0, taxPct: 18, total: 342200 }
    ],
    shippingCharges: 2800,
    subtotal: 290000,
    discountAmount: 0,
    taxAmount: 52200,
    grandTotal: 345000,
    approvalHistory: [
      { step: 'PO Approved & Issued', user: 'Neha Kapoor', date: '2026-10-15 16:00' }
    ],
    amendments: [],
    linkedGrns: ['GRN-2026-0092']
  },
  {
    id: 'PO-2026-0174',
    linkedPrId: null,
    vendorId: 'VND-007',
    vendorName: 'Asian Paints Pro Finishing Hub',
    projectId: 'proj-003',
    projectName: 'Godrej Office — Workspace Fitout',
    poDate: '2026-11-08',
    expectedDeliveryDate: '2026-11-16',
    deliveryAddress: 'Godrej One, Level 8, Vikhroli, Mumbai',
    billingAddress: 'ULI Studio Pvt Ltd, Andheri East, Mumbai',
    paymentTerms: 'Immediate upon delivery',
    status: 'Pending Approval',
    orderedAmount: 88500,
    receivedAmount: 0,
    items: [
      { id: 1, desc: 'Royale Luxury Enamel Gloss White', unit: 'litres', qty: 80, receivedQty: 0, rate: 450, discount: 0, taxPct: 18, total: 42480 },
      { id: 2, desc: 'Damp Proof Waterproof Basecoat Primer', unit: 'buckets', qty: 10, receivedQty: 0, rate: 3800, discount: 0, taxPct: 18, total: 44840 }
    ],
    shippingCharges: 1180,
    subtotal: 74000,
    discountAmount: 0,
    taxAmount: 13320,
    grandTotal: 88500,
    approvalHistory: [
      { step: 'PO Drafted', user: 'Deepak Singh', date: '2026-11-08 16:00' }
    ],
    amendments: [],
    linkedGrns: []
  },
  {
    id: 'PO-2026-0175',
    linkedPrId: null,
    vendorId: 'VND-006',
    vendorName: 'Saint-Gobain Glass & Facade Corp',
    projectId: 'proj-001',
    projectName: 'Prestige Tower — Penthouse Suite',
    poDate: '2026-11-09',
    expectedDeliveryDate: '2026-11-26',
    deliveryAddress: 'Worli Sea Face, Penthouse Tower, Mumbai',
    billingAddress: 'ULI Studio Pvt Ltd, Andheri East, Mumbai',
    paymentTerms: '30 Days Net',
    status: 'Draft',
    orderedAmount: 195000,
    receivedAmount: 0,
    items: [
      { id: 1, desc: '12mm Toughened Extra-Clear Low-Iron Glass', unit: 'sqft', qty: 650, receivedQty: 0, rate: 250, discount: 0, taxPct: 18, total: 191750 }
    ],
    shippingCharges: 3250,
    subtotal: 162500,
    discountAmount: 0,
    taxAmount: 29250,
    grandTotal: 195000,
    approvalHistory: [],
    amendments: [],
    linkedGrns: []
  }
];

/* ═══════════════════════════════════════
   GOODS RECEIPT NOTES (SCREEN 10 & 11)
   ═══════════════════════════════════════ */
var PURCHASE_GRNS = [
  {
    id: 'GRN-2026-0098',
    poId: 'PO-2026-0168',
    vendorId: 'VND-004',
    vendorName: 'Lumina Smart Architectural Lighting',
    projectId: 'proj-004',
    projectName: 'Brigade Villa — Landscape Design',
    receivedDate: '2026-11-08',
    receivedBy: 'Deepak Singh',
    status: 'Partially Rejected',
    deliveryChallanNumber: 'DC-LUM-8821',
    carrierName: 'Gati Logistics',
    vehicleNumber: 'KA-04-E-4912',
    generalRemarks: 'First partial shipment arrived. 2 spike lights found with broken glass lenses.',
    items: [
      {
        poItemId: 1,
        desc: 'IP68 Underwater LED Fountain Lights 12W RGBW',
        orderedQty: 12,
        prevReceivedQty: 0,
        outstandingQty: 12,
        currentReceivedQty: 12,
        acceptedQty: 12,
        rejectedQty: 0,
        rejectionReason: '',
        remarks: 'All 12 tested in dry bench setup. Submersible seals intact.'
      },
      {
        poItemId: 2,
        desc: 'COB Garden Spike Spotlight 15W Warm White',
        orderedQty: 30,
        prevReceivedQty: 0,
        outstandingQty: 30,
        currentReceivedQty: 10,
        acceptedQty: 8,
        rejectedQty: 2,
        rejectionReason: 'Damaged Goods — Front tempered glass lenses cracked during transit',
        remarks: '8 items accepted and shifted to Site Store Room B. 2 broken pieces quarantined.'
      }
    ],
    totalAccepted: 20,
    totalRejected: 2
  },
  {
    id: 'GRN-2026-0092',
    poId: 'PO-2026-0165',
    vendorId: 'VND-002',
    vendorName: 'TimberCraft Woods & Panels',
    projectId: 'proj-001',
    projectName: 'Prestige Tower — Penthouse Suite',
    receivedDate: '2026-11-02',
    receivedBy: 'Rahul Mehta',
    status: 'Accepted',
    deliveryChallanNumber: 'TC-DEL-4019',
    carrierName: 'Local Tempo',
    vehicleNumber: 'MH-01-DR-8812',
    generalRemarks: 'Teak veneer panels inspected for moisture content and grain consistency. Perfect match with sample.',
    items: [
      {
        poItemId: 1,
        desc: 'Burma Teak Veneer Decorative Fluted Panels',
        orderedQty: 50,
        prevReceivedQty: 0,
        outstandingQty: 50,
        currentReceivedQty: 50,
        acceptedQty: 50,
        rejectedQty: 0,
        rejectionReason: '',
        remarks: '100% accepted. Moisture verified at 10.2%.'
      }
    ],
    totalAccepted: 50,
    totalRejected: 0
  },
  {
    id: 'GRN-2026-0089',
    poId: 'PO-2026-0155',
    vendorId: 'VND-001',
    vendorName: 'Marmi Italian Imports Pvt Ltd',
    projectId: 'proj-001',
    projectName: 'Prestige Tower — Penthouse Suite',
    receivedDate: '2026-10-22',
    receivedBy: 'Rahul Mehta',
    status: 'Accepted',
    deliveryChallanNumber: 'INV-MAR-0129',
    carrierName: 'Safexpress',
    vehicleNumber: 'MH-04-G-1102',
    generalRemarks: 'Statuario border strips verified against approved master lot.',
    items: [
      {
        poItemId: 1,
        desc: 'Statuario White Marble Borders 150mm',
        orderedQty: 200,
        prevReceivedQty: 0,
        outstandingQty: 200,
        currentReceivedQty: 200,
        acceptedQty: 200,
        rejectedQty: 0,
        rejectionReason: '',
        remarks: 'Clean delivery, zero hairline fractures.'
      }
    ],
    totalAccepted: 200,
    totalRejected: 0
  }
];

/* ═══════════════════════════════════════
   VENDOR BILLS & 3-WAY MATCHING (SCREEN 12)
   ═══════════════════════════════════════ */
var PURCHASE_VENDOR_BILLS = [
  {
    id: 'BILL-2026-0104',
    invoiceNumber: 'INV-LUM-2026-881',
    invoiceDate: '2026-11-08',
    vendorId: 'VND-004',
    vendorName: 'Lumina Smart Architectural Lighting',
    linkedPoId: 'PO-2026-0168',
    linkedGrnId: 'GRN-2026-0098',
    projectId: 'proj-004',
    dueDate: '2026-11-23',
    invoiceAmount: 112100,
    matchStatus: 'Quantity Mismatch',
    discrepancyNote: 'Vendor invoiced for 10 spike lights, but GRN accepted only 8 (2 rejected damaged). Overbilled by ₹7,080.',
    lines: [
      {
        item: 'IP68 Underwater LED Lights 12W',
        poQty: 12, grnAcceptedQty: 12, invQty: 12,
        poRate: 7600, invRate: 7600,
        poTaxPct: 18, invTaxPct: 18,
        poTotal: 107674, invTotal: 107674,
        status: 'Matched'
      },
      {
        item: 'COB Garden Spike Spotlight 15W',
        poQty: 30, grnAcceptedQty: 8, invQty: 10,
        poRate: 2850, invRate: 2850,
        poTaxPct: 18, invTaxPct: 18,
        poTotal: 100890, invTotal: 33630,
        status: 'Quantity Mismatch'
      }
    ],
    resolutionAudit: [
      { user: 'Neha Kapoor', date: '2026-11-09 10:15', note: 'Contacted Meenakshi at Lumina. Credit note requested for 2 damaged fixtures.' }
    ]
  },
  {
    id: 'BILL-2026-0099',
    invoiceNumber: 'TC-INV-9942',
    invoiceDate: '2026-11-03',
    vendorId: 'VND-002',
    vendorName: 'TimberCraft Woods & Panels',
    linkedPoId: 'PO-2026-0165',
    linkedGrnId: 'GRN-2026-0092',
    projectId: 'proj-001',
    dueDate: '2026-11-18',
    invoiceAmount: 345000,
    matchStatus: 'Matched',
    discrepancyNote: '100% 3-way match across quantities, rates, and GST calculations.',
    lines: [
      {
        item: 'Burma Teak Veneer Decorative Fluted Panels',
        poQty: 50, grnAcceptedQty: 50, invQty: 50,
        poRate: 5800, invRate: 5800,
        poTaxPct: 18, invTaxPct: 18,
        poTotal: 342200, invTotal: 342200,
        status: 'Matched'
      }
    ],
    resolutionAudit: [
      { user: 'Neha Kapoor', date: '2026-11-04 14:00', note: 'Verified and queued for finance release on due date.' }
    ]
  },
  {
    id: 'BILL-2026-0095',
    invoiceNumber: 'MM-INV-2026-44',
    invoiceDate: '2026-10-24',
    vendorId: 'VND-001',
    vendorName: 'Marmi Italian Imports Pvt Ltd',
    linkedPoId: 'PO-2026-0155',
    linkedGrnId: 'GRN-2026-0089',
    projectId: 'proj-001',
    dueDate: '2026-11-14',
    invoiceAmount: 153400,
    matchStatus: 'Rate Mismatch',
    discrepancyNote: 'Invoice rate billed at ₹680/rft instead of agreed PO rate of ₹650/rft. Difference ₹6,000 + GST.',
    lines: [
      {
        item: 'Statuario White Marble Borders 150mm',
        poQty: 200, grnAcceptedQty: 200, invQty: 200,
        poRate: 650, invRate: 680,
        poTaxPct: 18, invTaxPct: 18,
        poTotal: 153400, invTotal: 160480,
        status: 'Rate Mismatch'
      }
    ],
    resolutionAudit: [
      { user: 'Rahul Mehta', date: '2026-10-26 11:20', note: 'Vendor claims freight surcharge. PO was fixed price. Awaiting corrected revised invoice.' }
    ]
  }
];

/* ═══════════════════════════════════════
   VENDOR COMPARISON / RFQ (SCREEN 6)
   ═══════════════════════════════════════ */
var PURCHASE_RFQS = [
  {
    id: 'RFQ-2026-0042',
    prId: 'PR-2026-0089',
    title: 'Italian Calacatta Marble 20mm Slabs — 2,400 sqft',
    projectName: 'Prestige Tower — Penthouse Suite',
    status: 'Evaluation In Progress',
    note: 'RFQ policy is configurable; recommendation highlighted below based on unit price and lead time.',
    quotes: [
      {
        vendorId: 'VND-001',
        vendorName: 'Marmi Italian Imports Pvt Ltd',
        unitRate: 1850,
        taxPct: 18,
        totalCost: 5239200,
        deliveryDays: 10,
        paymentTerms: '30 Days Net',
        warranty: '24 Months Natural Stone Replacement',
        availability: 'Ready in Mumbai Port Depot',
        remarks: 'Highest grade bookmatched slabs. Sample approved by client.',
        isRecommended: true,
        recommendationReason: 'Best balance of ready stock, proven grade consistency, and 30-day payment term.'
      },
      {
        vendorId: 'VND-009',
        vendorName: 'Stones of Verona India',
        unitRate: 1720,
        taxPct: 18,
        totalCost: 4871040,
        deliveryDays: 35,
        paymentTerms: '50% Advance with Order',
        warranty: '12 Months',
        availability: 'In transit from Carrara, Italy',
        remarks: 'Lowest price, but delivery lead time of 5 weeks risks flooring milestone.',
        isRecommended: false,
        recommendationReason: 'Delivery delay of 35 days exceeds site timeline.'
      },
      {
        vendorId: 'VND-010',
        vendorName: 'Royal Stone Gallery Makrana',
        unitRate: 2100,
        taxPct: 18,
        totalCost: 5947200,
        deliveryDays: 7,
        paymentTerms: '15 Days Net',
        warranty: '24 Months',
        availability: 'Immediate dispatch',
        remarks: 'Premium price point (+13.5% vs budget). Excellent quality.',
        isRecommended: false,
        recommendationReason: 'Exceeds budget ceiling by ₹7.08 Lakhs.'
      }
    ]
  }
];

/* ═══════════════════════════════════════
   EXCEPTIONS & AUDIT TRAIL (SCREEN 15)
   ═══════════════════════════════════════ */
var PURCHASE_EXCEPTIONS = [
  {
    id: 'EXC-2026-0021',
    refId: 'GRN-2026-0098',
    type: 'Damaged Goods',
    description: '2 COB Garden Spike Spotlights arrived with shattered glass lenses from Lumina Lighting.',
    severity: 'High',
    responsiblePerson: 'Deepak Singh (Site Engineer)',
    date: '2026-11-08',
    status: 'Under Investigation',
    resolution: 'Vendor notified. Awaiting replacement dispatch or credit note prior to bill approval.',
    auditHistory: [
      { time: '2026-11-08 14:10', user: 'Deepak Singh', action: 'Flagged damaged lenses during receipt inspection.' },
      { time: '2026-11-09 10:15', user: 'Neha Kapoor', action: 'Escalated to Lumina Lighting account manager.' }
    ]
  },
  {
    id: 'EXC-2026-0020',
    refId: 'BILL-2026-0095',
    type: 'Price Difference',
    description: 'Supplier Marmi Italian Imports billed ₹680/rft on Invoice vs ₹650/rft approved on PO-2026-0155.',
    severity: 'Critical',
    responsiblePerson: 'Neha Kapoor (Procurement Manager)',
    date: '2026-10-26',
    status: 'Credit Note Requested',
    resolution: 'Vendor agreed to reverse ₹6,000 difference. Payment held until revised bill received.',
    auditHistory: [
      { time: '2026-10-26 11:20', user: 'Neha Kapoor', action: 'System detected ₹30/unit rate deviation during 3-way match.' }
    ]
  },
  {
    id: 'EXC-2026-0019',
    refId: 'PO-2026-0168',
    type: 'PO Amendment',
    description: 'PO amended to authorize split shipments due to vendor stock limitation.',
    severity: 'Medium',
    responsiblePerson: 'Neha Kapoor',
    date: '2026-11-02',
    status: 'Resolved',
    resolution: 'Split shipment delivery schedule approved by Project Manager Rahul Mehta.',
    auditHistory: [
      { time: '2026-11-02 16:00', user: 'Neha Kapoor', action: 'Created visible amendment v1.1 preserving previous terms.' }
    ]
  },
  {
    id: 'EXC-2026-0018',
    refId: 'PR-2026-0095',
    type: 'Approval/Rejection History',
    description: 'Acoustic fabric partition requisition of ₹4,05,000 rejected due to client scope change.',
    severity: 'Low',
    responsiblePerson: 'Neha Kapoor',
    date: '2026-10-30',
    status: 'Closed',
    resolution: 'Scope switched to glass partitions. No vendor commitments made.',
    auditHistory: [
      { time: '2026-10-30 11:00', user: 'Neha Kapoor', action: 'Logged formal rejection reason in audit queue.' }
    ]
  }
];

/* ═══════════════════════════════════════
   PURCHASE ACTIVITIES & NOTIFICATIONS
   ═══════════════════════════════════════ */
var PURCHASE_ACTIVITIES = [
  { id: 'ACT-P01', user: 'Rahul Mehta', action: 'submitted purchase requisition', detail: 'PR-2026-0089 — Italian Marble Tiles (₹47.42 L)', timestamp: '2026-11-07T14:30:00', type: 'pr' },
  { id: 'ACT-P02', user: 'Deepak Singh', action: 'inspected goods receipt', detail: 'GRN-2026-0098 — 20 accepted, 2 rejected (Lumina Lighting)', timestamp: '2026-11-08T14:15:00', type: 'grn' },
  { id: 'ACT-P03', user: 'Neha Kapoor', action: 'issued purchase order', detail: 'PO-2026-0171 to Kohler Signature Fixtures (₹6.33 L)', timestamp: '2026-11-06T11:30:00', type: 'po' },
  { id: 'ACT-P04', user: 'Neha Kapoor', action: 'flagged 3-way match discrepancy', detail: 'BILL-2026-0104 has quantity mismatch against GRN-2026-0098', timestamp: '2026-11-09T09:45:00', type: 'match' },
  { id: 'ACT-P05', user: 'Vikram Malhotra', action: 'approved high-value PO', detail: 'PO-2026-0171 cleared for Kohler Rose Gold fixtures', timestamp: '2026-11-06T10:15:00', type: 'approval' }
];

var PURCHASE_NOTIFICATIONS = [
  { id: 201, title: 'High-Value PR Awaiting Approval', message: 'PR-2026-0093 (₹19.28 L) requires Level 3 Director clearance', time: '2 hours ago', read: false, type: 'warning' },
  { id: 202, title: 'Damaged Goods Flagged', message: 'GRN-2026-0098 recorded 2 broken spotlights from Lumina', time: '1 day ago', read: false, type: 'error' },
  { id: 203, title: 'Vendor Invoice Mismatch', message: 'INV-LUM-2026-881 overbilled by ₹7,080 vs accepted receipt', time: '3 hours ago', read: false, type: 'warning' },
  { id: 204, title: 'PO Ready for Issue', message: 'PO-2026-0174 approved and ready for dispatch to Asian Paints', time: '4 hours ago', read: true, type: 'info' }
];

/* ═══════════════════════════════════════
   CLIENT CHANGE REQUESTS / VARIATION ORDERS
   ═══════════════════════════════════════ */
var PURCHASE_CLIENT_CHANGES = [
  {
    id: 'CR-2026-0041',
    variationCode: 'VAR-OBR-04',
    title: 'Master Bath Sanitary Upgrade & Concealed Valve Thermostats',
    clientName: 'Mrs. Sunita Oberoi',
    clientPhone: '+91 98201 55432',
    clientEmail: 'sunita@oberoigroup.com',
    projectId: 'proj-002',
    projectName: 'Oberoi Residence — Full Interiors',
    siteLocation: 'Juhu Tara Road, Mumbai',
    requestDate: '2026-11-03',
    approvalDate: '2026-11-04',
    status: 'Approved & Ordered',
    category: 'Sanitary & Plumbing',
    costImpact: 286000,
    costImpactFormatted: '+₹2.86 L',
    timelineImpactDays: 7,
    clientStatedRequest: 'Client visited Kohler Experience Center and requested upgrading standard chrome fittings to Vibrant Rose Gold collection and adding thermostatic digital temperature mixers for all 4 ensuite baths.',
    originalScope: 'Standard Chrome finishes (Kohler Aleo Series) — Estimated ₹3,36,000.',
    revisedScope: 'Vibrant Rose Gold brushed trim, Katalyst 300mm rainheads & Veil wall-hung smart bidet toilets — Revised ₹6,22,000.',
    linkedPrId: 'PR-2026-0091',
    linkedPoId: 'PO-2026-0171',
    poAmendmentRef: 'PO-2026-0171-v1.1',
    clientApprovalRef: 'OBR-VAR-04-SIGNED.pdf',
    consultant: 'Neha Kapoor (Procurement Lead)',
    leadArchitect: 'Amit Verma (Design Director)',
    notes: 'Client signed formal Variation Order VF-04 on 04 Nov 2026 agreeing to additional ₹2,86,000 billing. Advance received.'
  },
  {
    id: 'CR-2026-0042',
    variationCode: 'VAR-PST-12',
    title: 'Living Room Flooring Upgrade to Italian Calacatta Gold Marble',
    clientName: 'Mr. Vikram Singhania',
    clientPhone: '+91 98110 33445',
    clientEmail: 'vikram.singhania@singhaniaholdings.in',
    projectId: 'proj-001',
    projectName: 'Prestige Tower — Penthouse Suite',
    siteLocation: 'Worli Sea Face, Mumbai',
    requestDate: '2026-11-05',
    approvalDate: '2026-11-06',
    status: 'Approved (Awaiting PR Clearance)',
    category: 'Tiles & Marble',
    costImpact: 1450000,
    costImpactFormatted: '+₹14.50 L',
    timelineImpactDays: 14,
    clientStatedRequest: 'Client requested changing living room and grand foyer flooring from engineered stone slabs to 20mm polished bookmatched Italian Calacatta Gold marble with honed Statuario borders.',
    originalScope: 'Engineered Terrazzo & Quartz slabs (2,400 sqft) — Budget ₹32.90 L.',
    revisedScope: 'Imported Lot A1 bookmatched Italian Calacatta Gold 20mm + Statuario honed borders — Revised ₹47.42 L.',
    linkedPrId: 'PR-2026-0089',
    linkedPoId: null,
    poAmendmentRef: 'Pending RFQ evaluation (RFQ-2026-0042)',
    clientApprovalRef: 'PST-VAR-12-CLIENT-APPROVAL.pdf',
    consultant: 'Rahul Mehta (Project Manager)',
    leadArchitect: 'Priya Sharma (Principal Architect)',
    notes: 'Client confirmed 30% top-up milestone payment cleared. Vendor Marmi Italian Imports holds Lot A1 at port depot.'
  },
  {
    id: 'CR-2026-0043',
    variationCode: 'VAR-GDJ-02',
    title: 'Cafeteria Layout Alteration: Collaborative Zone Conversion',
    clientName: 'Mr. Rohit Malpani',
    clientPhone: '+91 99220 77881',
    clientEmail: 'rohit.malpani@godrejproperties.com',
    projectId: 'proj-003',
    projectName: 'Godrej Office — Workspace Fitout',
    siteLocation: 'BKC G Block, Mumbai',
    requestDate: '2026-11-07',
    approvalDate: '2026-11-08',
    status: 'In Procurement Review',
    category: 'Timber & Lighting',
    costImpact: 140000,
    costImpactFormatted: '+₹1.40 L',
    timelineImpactDays: 0,
    clientStatedRequest: 'Godrej Executive Committee requested removing 4 rigid drywall cabins in Cafeteria North Wing and transforming space into open collaboration lounge with micro-perforated acoustic gypsum tiles and DALI Dimmable linear lighting.',
    originalScope: 'Standard gypsum board ceiling with recessed 2x2 troffers — Budget ₹4.60 L.',
    revisedScope: '600x600 acoustic perforated panels (1,800 sqft) + 85 nos DALI linear LED continuous fixtures — Revised ₹6.00 L.',
    linkedPrId: 'PR-2026-0090',
    linkedPoId: null,
    poAmendmentRef: null,
    clientApprovalRef: 'GDJ-CORP-CR-02.pdf',
    consultant: 'Deepak Singh (Site Operations)',
    leadArchitect: 'Amit Verma (Design Director)',
    notes: 'Zero timeline slippage permitted due to scheduled opening date on 01 Dec 2026.'
  },
  {
    id: 'CR-2026-0044',
    variationCode: 'VAR-BRG-07',
    title: 'Landscape Deck Wood Upgrade & Submerged Fountain Illumination',
    clientName: 'Ms. Ananya Reddy',
    clientPhone: '+91 97400 11223',
    clientEmail: 'ananya.reddy@reddyinfra.com',
    projectId: 'proj-004',
    projectName: 'Brigade Villa — Landscape Design',
    siteLocation: 'Whitefield, Bengaluru',
    requestDate: '2026-10-22',
    approvalDate: '2026-10-24',
    status: 'Partially Delivered',
    category: 'Lighting & Decking',
    costImpact: 320000,
    costImpactFormatted: '+₹3.20 L',
    timelineImpactDays: 5,
    clientStatedRequest: 'Client requested upgrading exterior swimming pool deck wood from treated Pine to aged Burma Teak and adding color-controllable RGBW underwater fountain lights.',
    originalScope: 'Kiln-dried pine decking with static warm spotlights — Budget ₹2.80 L.',
    revisedScope: 'Burma Teak fluted deck strips + 12 nos IP68 underwater 316-grade stainless steel luminaires — Revised ₹6.00 L.',
    linkedPrId: 'PR-2026-0092',
    linkedPoId: 'PO-2026-0168',
    poAmendmentRef: 'PO-2026-0168-v1.1',
    clientApprovalRef: 'BRG-VAR-07-SIGNED.pdf',
    consultant: 'Deepak Singh (Site Engineer)',
    leadArchitect: 'Priya Sharma (Principal Architect)',
    notes: 'PO-2026-0168 split shipment logged. 2 spotlight lenses damaged on receipt and logged in exception EXC-2026-0021.'
  }
];

