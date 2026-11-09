/**
 * ULI Studio ERP — CRM Mock Data Module
 * ══════════════════════════════════════
 * DEMO DATA ONLY — no real company figures.
 * Single source of truth for all CRM screens.
 */
'use strict';

/* ── Enums / Lookup Tables ── */
var CRM_STAGES = [
  { id: 'new-enquiry',           label: 'New Enquiry',           order: 1, color: '#6366f1' },
  { id: 'qualified',             label: 'Qualified',             order: 2, color: '#2563eb' },
  { id: 'site-visit-scheduled',  label: 'Site Visit Scheduled',  order: 3, color: '#0891b2' },
  { id: 'site-visit-completed',  label: 'Site Visit Completed',  order: 4, color: '#0d9488' },
  { id: 'quotation-preparation', label: 'Quotation Preparation', order: 5, color: '#ca8a04' },
  { id: 'quotation-sent',        label: 'Quotation Sent',        order: 6, color: '#d97706' },
  { id: 'negotiation',           label: 'Negotiation',           order: 7, color: '#ea580c' },
  { id: 'won',                   label: 'Won',                   order: 8, color: '#16a34a' },
  { id: 'lost',                  label: 'Lost',                  order: 9, color: '#dc2626' }
];

var CRM_SOURCES = ['Referral','Website','Social Media','Walk-in','Exhibition','Partner','Cold Call'];
var CRM_PROPERTY_TYPES = ['Residential','Commercial','Hospitality','Retail','Institutional'];
var CRM_SERVICES = ['Full Interior Design','Renovation','Landscape Design','Office Fitout','Kitchen & Bath Remodel','Facade Design'];
var CRM_PRIORITIES = ['Low','Medium','High','Critical'];
var CRM_BUDGET_RANGES = ['Below \u20B910L','\u20B910L - \u20B925L','\u20B925L - \u20B950L','\u20B950L - \u20B91Cr','\u20B91Cr - \u20B95Cr','Above \u20B95Cr'];

var CRM_ENQUIRY_TYPES = ['New Project','Renovation','Consultation','Maintenance','Extension'];
var CRM_FOLLOWUP_TYPES = ['Call','Email','Meeting','Site Visit','WhatsApp','Video Call'];
var CRM_VISIT_PURPOSES = ['Initial Assessment','Measurement','Design Presentation','Material Selection','Progress Check','Final Walkthrough'];
var CRM_QUOTE_STATUSES = ['Draft','Pending Approval','Approved','Sent','Accepted','Rejected','Expired','Revised'];
var CRM_LOSS_REASONS = ['Budget Constraints','Chose Competitor','Project Postponed','Scope Mismatch','No Response','Other'];

var CRM_SALESPEOPLE = [
  { id:'sp-01', name:'Priya Sharma',  email:'priya@ulistudio.com',  role:'Sales Lead' },
  { id:'sp-02', name:'Amit Verma',    email:'amit@ulistudio.com',   role:'Sr. Designer' },
  { id:'sp-03', name:'Rahul Mehta',   email:'rahul@ulistudio.com',  role:'Business Dev' },
  { id:'sp-04', name:'Neha Kapoor',   email:'neha@ulistudio.com',   role:'Sales Executive' },
  { id:'sp-05', name:'Deepak Singh',  email:'deepak@ulistudio.com', role:'Asst. Designer' }
];

var CRM_TAX_CATEGORIES = [
  { id:'gst-18', label:'GST 18%', rate:18 },
  { id:'gst-12', label:'GST 12%', rate:12 },
  { id:'gst-5',  label:'GST 5%',  rate:5 },
  { id:'exempt', label:'Exempt',  rate:0 }
];

var CRM_BOQ_CATEGORIES = ['Civil Work','Carpentry','Electrical','Plumbing','Painting','Flooring','False Ceiling','Furniture','Fixtures','Hardware','Glass & Mirror','Soft Furnishing','Lighting','HVAC','Miscellaneous'];

/* ── Helper: generate unique IDs ── */
var _crmIdCounter = 100;
function crmUid(prefix) { return prefix + '-' + (++_crmIdCounter); }

/* ═══════════════════════════════════════
   LEADS — 15 demo leads
   ═══════════════════════════════════════ */
var CRM_LEADS = [
  {
    id:'LD-2026-001', customerName:'Arjun Birla', phone:'+91 98765 43210', email:'arjun.birla@email.com',
    altContact:'+91 98765 43211', address:'Birla Estate, Juhu, Mumbai 400049',
    enquiryTitle:'Birla Estate — 4BHK Luxury Interiors', enquiryType:'New Project',
    propertyType:'Residential', projectLocation:'Juhu, Mumbai', serviceRequired:'Full Interior Design',
    approxArea:'3,200 sqft', budgetRange:'\u20B925L - \u20B950L', expectedValue:4500000,
    expectedStartDate:'2027-01-15', source:'Referral', salesperson:'sp-01', priority:'High',
    stage:'new-enquiry', description:'Premium 4BHK apartment requiring full interior design with Italian finishes.',
    notes:'Client prefers modern minimalist style. Budget flexible for quality.', nextFollowup:'2026-11-10T10:00',
    createdDate:'2026-11-08T09:30:00', updatedDate:'2026-11-08T09:30:00'
  },
  {
    id:'LD-2026-002', customerName:'Rajesh Tata', phone:'+91 99887 66554', email:'rajesh.t@tajhotels.com',
    altContact:'', address:'Taj Hotel, Colaba, Mumbai 400001',
    enquiryTitle:'Taj Hotel — Grand Lobby Redesign', enquiryType:'Renovation',
    propertyType:'Hospitality', projectLocation:'Colaba, Mumbai', serviceRequired:'Full Interior Design',
    approxArea:'8,500 sqft', budgetRange:'Above \u20B95Cr', expectedValue:12000000,
    expectedStartDate:'2027-03-01', source:'Partner', salesperson:'sp-02', priority:'Critical',
    stage:'qualified', description:'Complete lobby redesign blending heritage with contemporary aesthetics.',
    notes:'Heritage-sensitive project. Must preserve Art Deco elements.', nextFollowup:'2026-11-11T14:00',
    createdDate:'2026-11-01T11:00:00', updatedDate:'2026-11-07T16:20:00'
  },
  {
    id:'LD-2026-003', customerName:'Sneha Oberoi', phone:'+91 99001 22334', email:'sneha@oberoigroup.com',
    altContact:'+91 99001 22335', address:'Oberoi Skyz, Worli, Mumbai 400018',
    enquiryTitle:'Oberoi Penthouse — Full Interiors', enquiryType:'New Project',
    propertyType:'Residential', projectLocation:'Worli, Mumbai', serviceRequired:'Full Interior Design',
    approxArea:'5,800 sqft', budgetRange:'\u20B91Cr - \u20B95Cr', expectedValue:8500000,
    expectedStartDate:'2027-02-01', source:'Website', salesperson:'sp-03', priority:'High',
    stage:'site-visit-scheduled', description:'Ultra-luxury penthouse interiors with panoramic sea views.',
    notes:'Site visit on 12 Nov. Client wants mood boards before visit.', nextFollowup:'2026-11-12T11:00',
    createdDate:'2026-10-25T10:15:00', updatedDate:'2026-11-06T09:00:00'
  },
  {
    id:'LD-2026-004', customerName:'Vikram Mahindra', phone:'+91 98111 22233', email:'vikram.m@mahindra.com',
    altContact:'', address:'Mahindra Towers, BKC, Mumbai 400051',
    enquiryTitle:'Mahindra Office — Corporate Fitout', enquiryType:'New Project',
    propertyType:'Commercial', projectLocation:'BKC, Mumbai', serviceRequired:'Office Fitout',
    approxArea:'12,000 sqft', budgetRange:'\u20B91Cr - \u20B95Cr', expectedValue:6500000,
    expectedStartDate:'2027-04-01', source:'Cold Call', salesperson:'sp-04', priority:'Medium',
    stage:'quotation-sent', description:'Modern open-plan office fitout for 200 employees.',
    notes:'Quotation sent on 5 Nov. Awaiting feedback. Competitor also quoting.', nextFollowup:'2026-11-13T15:00',
    createdDate:'2026-10-10T14:00:00', updatedDate:'2026-11-05T17:30:00'
  },
  {
    id:'LD-2026-005', customerName:'Ananya Godrej', phone:'+91 98222 33344', email:'ananya.g@email.com',
    altContact:'', address:'Godrej Platinum, Vikhroli, Mumbai 400079',
    enquiryTitle:'Godrej Villa — Landscape Design', enquiryType:'New Project',
    propertyType:'Residential', projectLocation:'Vikhroli, Mumbai', serviceRequired:'Landscape Design',
    approxArea:'2,400 sqft (outdoor)', budgetRange:'\u20B925L - \u20B950L', expectedValue:3800000,
    expectedStartDate:'2027-01-01', source:'Social Media', salesperson:'sp-05', priority:'Medium',
    stage:'negotiation', description:'Contemporary landscape design with water features and outdoor seating.',
    notes:'Client wants 10% discount. We offered 5%. Negotiating.', nextFollowup:'2026-11-10T16:00',
    createdDate:'2026-09-28T13:00:00', updatedDate:'2026-11-07T11:00:00'
  },
  {
    id:'LD-2026-006', customerName:'Meera Prestige', phone:'+91 97333 44455', email:'meera.p@prestige.com',
    altContact:'+91 97333 44456', address:'Prestige Lakeside Habitat, Whitefield, Bengaluru 560066',
    enquiryTitle:'Prestige Apartments — Model Flat', enquiryType:'New Project',
    propertyType:'Residential', projectLocation:'Whitefield, Bengaluru', serviceRequired:'Full Interior Design',
    approxArea:'1,850 sqft', budgetRange:'\u20B950L - \u20B91Cr', expectedValue:5200000,
    expectedStartDate:'2026-12-01', source:'Exhibition', salesperson:'sp-01', priority:'High',
    stage:'won', description:'Model flat design for premium residential tower launch.',
    notes:'Contract signed 3 Nov. Project handoff to PM team pending.', nextFollowup:null,
    createdDate:'2026-09-15T10:00:00', updatedDate:'2026-11-03T10:30:00',
    wonDate:'2026-11-03', wonNotes:'Client accepted revised quotation v3.'
  },
  {
    id:'LD-2026-007', customerName:'Karan Brigade', phone:'+91 96444 55566', email:'karan.b@brigade.com',
    altContact:'', address:'Brigade Gateway, Rajajinagar, Bengaluru 560055',
    enquiryTitle:'Brigade Showroom — Retail Design', enquiryType:'New Project',
    propertyType:'Retail', projectLocation:'Rajajinagar, Bengaluru', serviceRequired:'Full Interior Design',
    approxArea:'4,200 sqft', budgetRange:'\u20B925L - \u20B950L', expectedValue:2800000,
    expectedStartDate:'2027-02-01', source:'Walk-in', salesperson:'sp-02', priority:'Low',
    stage:'lost', description:'High-end retail showroom design for fashion brand.',
    notes:'Lost to competitor with lower pricing.', nextFollowup:null,
    createdDate:'2026-09-01T09:00:00', updatedDate:'2026-10-28T16:00:00',
    lostDate:'2026-10-28', lostReason:'Chose Competitor'
  },
  {
    id:'LD-2026-008', customerName:'Pooja Hiranandani', phone:'+91 95555 66677', email:'pooja.h@email.com',
    altContact:'+91 95555 66678', address:'Hiranandani Gardens, Powai, Mumbai 400076',
    enquiryTitle:'Hiranandani Duplex — Premium Interiors', enquiryType:'New Project',
    propertyType:'Residential', projectLocation:'Powai, Mumbai', serviceRequired:'Full Interior Design',
    approxArea:'4,600 sqft', budgetRange:'\u20B950L - \u20B91Cr', expectedValue:7200000,
    expectedStartDate:'2027-03-01', source:'Referral', salesperson:'sp-03', priority:'High',
    stage:'new-enquiry', description:'Duplex apartment with double-height living and terrace garden.',
    notes:'Referred by Sneha Oberoi. High-value prospect.', nextFollowup:'2026-11-09T14:00',
    createdDate:'2026-11-07T15:00:00', updatedDate:'2026-11-07T15:00:00'
  },
  {
    id:'LD-2026-009', customerName:'Sanjay Adani', phone:'+91 94666 77788', email:'sanjay.a@adani.com',
    altContact:'', address:'Adani Inspire, BKC, Mumbai 400051',
    enquiryTitle:'Adani Corporate — Executive Suite', enquiryType:'Renovation',
    propertyType:'Commercial', projectLocation:'BKC, Mumbai', serviceRequired:'Renovation',
    approxArea:'3,800 sqft', budgetRange:'\u20B950L - \u20B91Cr', expectedValue:9500000,
    expectedStartDate:'2027-02-15', source:'Partner', salesperson:'sp-01', priority:'Critical',
    stage:'qualified', description:'Executive floor renovation with bespoke furniture and smart systems.',
    notes:'MD-level decision. Need high-end portfolio presentation.', nextFollowup:'2026-11-11T10:30',
    createdDate:'2026-10-20T11:30:00', updatedDate:'2026-11-04T14:00:00'
  },
  {
    id:'LD-2026-010', customerName:'Nita Reliance', phone:'+91 93777 88899', email:'nita.r@ril.com',
    altContact:'+91 93777 88900', address:'Jio World Centre, BKC, Mumbai 400051',
    enquiryTitle:'Reliance Exhibition — Event Space', enquiryType:'New Project',
    propertyType:'Institutional', projectLocation:'BKC, Mumbai', serviceRequired:'Full Interior Design',
    approxArea:'15,000 sqft', budgetRange:'Above \u20B95Cr', expectedValue:15000000,
    expectedStartDate:'2027-06-01', source:'Partner', salesperson:'sp-02', priority:'Critical',
    stage:'site-visit-completed', description:'Premium exhibition and event space with modular installations.',
    notes:'Site visit completed 6 Nov. Impressive space. Client wants 3D renders.', nextFollowup:'2026-11-14T11:00',
    createdDate:'2026-10-15T09:30:00', updatedDate:'2026-11-06T17:00:00'
  },
  {
    id:'LD-2026-011', customerName:'Ravi Piramal', phone:'+91 92888 99901', email:'ravi.p@piramal.com',
    altContact:'', address:'Piramal Mahalaxmi, Lower Parel, Mumbai 400013',
    enquiryTitle:'Piramal Residence — Luxury Renovation', enquiryType:'Renovation',
    propertyType:'Residential', projectLocation:'Lower Parel, Mumbai', serviceRequired:'Renovation',
    approxArea:'2,800 sqft', budgetRange:'\u20B925L - \u20B950L', expectedValue:4200000,
    expectedStartDate:'2027-01-15', source:'Website', salesperson:'sp-04', priority:'Medium',
    stage:'quotation-preparation', description:'Complete renovation of 3BHK with Italian marble and smart home.',
    notes:'BOQ being prepared. Need vendor quotes for Italian marble.', nextFollowup:'2026-11-13T10:00',
    createdDate:'2026-10-18T16:00:00', updatedDate:'2026-11-05T12:00:00'
  },
  {
    id:'LD-2026-012', customerName:'Arun Wipro', phone:'+91 91999 00012', email:'arun.w@wipro.com',
    altContact:'', address:'Wipro Campus, Sarjapur Road, Bengaluru 560035',
    enquiryTitle:'Wipro Campus — Staff Cafeteria', enquiryType:'New Project',
    propertyType:'Commercial', projectLocation:'Sarjapur Road, Bengaluru', serviceRequired:'Full Interior Design',
    approxArea:'6,500 sqft', budgetRange:'\u20B950L - \u20B91Cr', expectedValue:5500000,
    expectedStartDate:'2027-04-01', source:'Cold Call', salesperson:'sp-05', priority:'Medium',
    stage:'new-enquiry', description:'Modern cafeteria design for 500+ employees with food court style.',
    notes:'Initial discussion positive. Need to schedule site visit.', nextFollowup:'2026-11-10T11:30',
    createdDate:'2026-11-05T14:30:00', updatedDate:'2026-11-05T14:30:00'
  },
  {
    id:'LD-2026-013', customerName:'Priyanka DLF', phone:'+91 91000 11123', email:'priyanka.d@dlf.in',
    altContact:'+91 91000 11124', address:'DLF Camellias, Sector 42, Gurugram 122002',
    enquiryTitle:'DLF Penthouse — Ultra Luxury', enquiryType:'New Project',
    propertyType:'Residential', projectLocation:'Sector 42, Gurugram', serviceRequired:'Full Interior Design',
    approxArea:'10,200 sqft', budgetRange:'Above \u20B95Cr', expectedValue:18000000,
    expectedStartDate:'2027-05-01', source:'Referral', salesperson:'sp-01', priority:'Critical',
    stage:'quotation-sent', description:'Ultra-luxury penthouse with imported materials and art curation.',
    notes:'Quotation v2 sent. Client reviewing. Follow up for feedback.', nextFollowup:'2026-11-15T14:00',
    createdDate:'2026-09-20T10:00:00', updatedDate:'2026-11-04T11:00:00'
  },
  {
    id:'LD-2026-014', customerName:'Suresh Lodha', phone:'+91 90111 22234', email:'suresh.l@lodha.com',
    altContact:'', address:'Lodha Altamount, Altamount Road, Mumbai 400026',
    enquiryTitle:'Lodha Villa — Contemporary Interiors', enquiryType:'New Project',
    propertyType:'Residential', projectLocation:'Altamount Road, Mumbai', serviceRequired:'Full Interior Design',
    approxArea:'7,500 sqft', budgetRange:'\u20B91Cr - \u20B95Cr', expectedValue:6200000,
    expectedStartDate:'2027-03-15', source:'Exhibition', salesperson:'sp-03', priority:'High',
    stage:'site-visit-scheduled', description:'Contemporary villa interiors with Japanese-inspired design language.',
    notes:'Visit scheduled 15 Nov. Client loves wabi-sabi aesthetic.', nextFollowup:'2026-11-15T10:00',
    createdDate:'2026-10-22T09:00:00', updatedDate:'2026-11-07T13:00:00'
  },
  {
    id:'LD-2026-015', customerName:'Kavitha Infosys', phone:'+91 89222 33345', email:'kavitha.i@infosys.com',
    altContact:'', address:'Infosys Campus, Electronics City, Bengaluru 560100',
    enquiryTitle:'Infosys Wellness Center', enquiryType:'New Project',
    propertyType:'Institutional', projectLocation:'Electronics City, Bengaluru', serviceRequired:'Full Interior Design',
    approxArea:'9,000 sqft', budgetRange:'\u20B950L - \u20B91Cr', expectedValue:7800000,
    expectedStartDate:'2027-04-15', source:'Partner', salesperson:'sp-04', priority:'High',
    stage:'negotiation', description:'Employee wellness center with yoga studio, gym, and meditation rooms.',
    notes:'Final round of negotiation. Client wants phased payment plan.', nextFollowup:'2026-11-12T15:30',
    createdDate:'2026-09-25T11:00:00', updatedDate:'2026-11-06T10:00:00'
  }
];

/* ═══════════════════════════════════════
   FOLLOW-UPS
   ═══════════════════════════════════════ */
var CRM_FOLLOWUPS = [
  { id:'FU-101', leadId:'LD-2026-001', customerName:'Arjun Birla', assignedTo:'sp-01', date:'2026-11-10T10:00', type:'Call', status:'Pending', notes:'Discuss design preferences and timeline.' },
  { id:'FU-102', leadId:'LD-2026-002', customerName:'Rajesh Tata', assignedTo:'sp-02', date:'2026-11-11T14:00', type:'Meeting', status:'Pending', notes:'Present heritage-modern design concepts.' },
  { id:'FU-103', leadId:'LD-2026-003', customerName:'Sneha Oberoi', assignedTo:'sp-03', date:'2026-11-12T11:00', type:'Site Visit', status:'Pending', notes:'Conduct initial site measurement.' },
  { id:'FU-104', leadId:'LD-2026-005', customerName:'Ananya Godrej', assignedTo:'sp-05', date:'2026-11-10T16:00', type:'Call', status:'Pending', notes:'Discuss final pricing and discount.' },
  { id:'FU-105', leadId:'LD-2026-008', customerName:'Pooja Hiranandani', assignedTo:'sp-03', date:'2026-11-09T14:00', type:'Call', status:'Pending', notes:'Introduction call. Understand requirements.' },
  { id:'FU-106', leadId:'LD-2026-009', customerName:'Sanjay Adani', assignedTo:'sp-01', date:'2026-11-11T10:30', type:'Meeting', status:'Pending', notes:'Portfolio presentation to MD team.' },
  { id:'FU-107', leadId:'LD-2026-004', customerName:'Vikram Mahindra', assignedTo:'sp-04', date:'2026-11-07T15:00', type:'Email', status:'Overdue', notes:'Follow up on sent quotation.' },
  { id:'FU-108', leadId:'LD-2026-013', customerName:'Priyanka DLF', assignedTo:'sp-01', date:'2026-11-06T14:00', type:'Call', status:'Overdue', notes:'Check quotation review status.' },
  { id:'FU-109', leadId:'LD-2026-012', customerName:'Arun Wipro', assignedTo:'sp-05', date:'2026-11-10T11:30', type:'Call', status:'Pending', notes:'Schedule site visit.' },
  { id:'FU-110', leadId:'LD-2026-011', customerName:'Ravi Piramal', assignedTo:'sp-04', date:'2026-11-13T10:00', type:'Email', status:'Pending', notes:'Send BOQ progress update.' },
  { id:'FU-111', leadId:'LD-2026-006', customerName:'Meera Prestige', assignedTo:'sp-01', date:'2026-11-02T10:00', type:'Meeting', status:'Completed', notes:'Contract signed. Handoff to PM.', completedDate:'2026-11-03T10:30:00', outcome:'Contract signed successfully.' },
  { id:'FU-112', leadId:'LD-2026-010', customerName:'Nita Reliance', assignedTo:'sp-02', date:'2026-11-14T11:00', type:'Video Call', status:'Pending', notes:'Present 3D render concepts.' },
  { id:'FU-113', leadId:'LD-2026-014', customerName:'Suresh Lodha', assignedTo:'sp-03', date:'2026-11-15T10:00', type:'Site Visit', status:'Pending', notes:'Villa site visit and measurements.' },
  { id:'FU-114', leadId:'LD-2026-015', customerName:'Kavitha Infosys', assignedTo:'sp-04', date:'2026-11-12T15:30', type:'Meeting', status:'Pending', notes:'Negotiate phased payment terms.' }
];

/* ═══════════════════════════════════════
   SITE VISITS
   ═══════════════════════════════════════ */
var CRM_SITE_VISITS = [
  {
    id:'SV-201', leadId:'LD-2026-003', customerName:'Sneha Oberoi',
    location:'Oberoi Skyz, 45th Floor, Worli', visitDate:'2026-11-12', visitTime:'11:00',
    assignedTo:'sp-03', purpose:'Initial Assessment', status:'Scheduled',
    notes:'Bring laser measurer and camera. Access through security desk.'
  },
  {
    id:'SV-202', leadId:'LD-2026-014', customerName:'Suresh Lodha',
    location:'Lodha Altamount, Villa 12, Altamount Road', visitDate:'2026-11-15', visitTime:'10:00',
    assignedTo:'sp-03', purpose:'Initial Assessment', status:'Scheduled',
    notes:'Japanese-inspired design preference. Study natural light patterns.'
  },
  {
    id:'SV-203', leadId:'LD-2026-010', customerName:'Nita Reliance',
    location:'Jio World Centre, Hall 4, BKC', visitDate:'2026-11-06', visitTime:'14:00',
    assignedTo:'sp-02', purpose:'Initial Assessment', status:'Completed',
    completedDate:'2026-11-06T17:00:00',
    outcome:'Excellent space with 18ft ceiling height. Modular partitions feasible.',
    requirements:'Need modular walls, integrated lighting, AV infrastructure.',
    measurements:'Hall: 15,000 sqft. Ceiling: 18ft. 4 entry points. Loading dock accessible.',
    nextAction:'Prepare 3D renders with modular layout options.',
    followupDate:'2026-11-14T11:00', notes:'VIP access required. Contact Smt. Nita PA.'
  },
  {
    id:'SV-204', leadId:'LD-2026-002', customerName:'Rajesh Tata',
    location:'Taj Mahal Palace, Main Lobby, Colaba', visitDate:'2026-10-28', visitTime:'09:00',
    assignedTo:'sp-02', purpose:'Initial Assessment', status:'Completed',
    completedDate:'2026-10-28T12:00:00',
    outcome:'Heritage structure requires sensitive renovation approach. Art Deco preserved.',
    requirements:'Maintain heritage elements, upgrade lighting, new reception desk, seating.',
    measurements:'Lobby: 8,500 sqft. Ceiling: 22ft dome. 6 pillars. Heritage walls untouchable.',
    nextAction:'Research Art Deco materials and certified heritage contractors.',
    followupDate:'2026-11-11T14:00', notes:'Heritage committee approval required before any work.'
  },
  {
    id:'SV-205', leadId:'LD-2026-007', customerName:'Karan Brigade',
    location:'Brigade Gateway, Unit 5B, Rajajinagar', visitDate:'2026-10-15', visitTime:'14:00',
    assignedTo:'sp-02', purpose:'Measurement', status:'Completed',
    completedDate:'2026-10-15T16:30:00',
    outcome:'Standard retail space. Competitor already measured.',
    requirements:'Display units, trial rooms, POS area, storage.',
    measurements:'4,200 sqft rectangle. Ceiling 12ft. Glass frontage. Rear loading.',
    nextAction:'Prepare competitive quotation.', followupDate:'2026-10-20T10:00',
    notes:'Client comparing 3 designers.'
  },
  {
    id:'SV-206', leadId:'LD-2026-011', customerName:'Ravi Piramal',
    location:'Piramal Mahalaxmi, Tower A, Flat 1802', visitDate:'2026-10-25', visitTime:'11:00',
    assignedTo:'sp-04', purpose:'Measurement', status:'Completed',
    completedDate:'2026-10-25T14:00:00',
    outcome:'Spacious 3BHK with sea view. Italian marble samples shown to client.',
    requirements:'Full renovation: flooring, kitchen, bathrooms, built-in wardrobes, smart home.',
    measurements:'2,800 sqft. 3 bed, 3 bath, living, dining, kitchen, utility, 2 balconies.',
    nextAction:'Source Italian marble samples and prepare BOQ.',
    followupDate:'2026-11-05T12:00', notes:'Client wants Statuario marble for living area.'
  }
];

/* ═══════════════════════════════════════
   ACTIVITIES
   ═══════════════════════════════════════ */
var CRM_ACTIVITIES = [
  { id:'ACT-301', leadId:'LD-2026-001', type:'Note', user:'Priya Sharma', timestamp:'2026-11-08T09:30:00', summary:'Lead created via referral from Sneha Oberoi.', detail:'Client is renovating new apartment in Birla Estate, Juhu. Premium segment.' },
  { id:'ACT-302', leadId:'LD-2026-002', type:'Meeting', user:'Amit Verma', timestamp:'2026-11-07T16:20:00', summary:'Follow-up meeting with hotel management.', detail:'Discussed heritage preservation requirements and timeline constraints.' },
  { id:'ACT-303', leadId:'LD-2026-002', type:'Call', user:'Amit Verma', timestamp:'2026-11-01T11:30:00', summary:'Initial call with Rajesh Tata.', detail:'Introduced ULI Studio capabilities. Client interested in heritage-sensitive design.' },
  { id:'ACT-304', leadId:'LD-2026-003', type:'Email', user:'Rahul Mehta', timestamp:'2026-11-06T09:00:00', summary:'Sent mood board collection.', detail:'Emailed 12 mood boards covering minimalist, contemporary, and luxury styles.' },
  { id:'ACT-305', leadId:'LD-2026-004', type:'Email', user:'Neha Kapoor', timestamp:'2026-11-05T17:30:00', summary:'Quotation QT-2026-Q04 sent to client.', detail:'Quotation for corporate fitout sent via email. Validity 30 days.' },
  { id:'ACT-306', leadId:'LD-2026-005', type:'Call', user:'Deepak Singh', timestamp:'2026-11-07T11:00:00', summary:'Negotiation call — pricing discussion.', detail:'Client requested 10%. We offered 5% with phased payment. Pending decision.' },
  { id:'ACT-307', leadId:'LD-2026-005', type:'WhatsApp', user:'Deepak Singh', timestamp:'2026-11-06T18:30:00', summary:'Shared landscape 3D renders via WhatsApp.', detail:'Client loved the water feature design. Asked about maintenance costs.' },
  { id:'ACT-308', leadId:'LD-2026-006', type:'Meeting', user:'Priya Sharma', timestamp:'2026-11-03T10:30:00', summary:'Contract signed!', detail:'Client signed revised quotation v3. ₹52L contract. Project handoff initiated.' },
  { id:'ACT-309', leadId:'LD-2026-007', type:'Call', user:'Amit Verma', timestamp:'2026-10-28T16:00:00', summary:'Lead lost — client chose competitor.', detail:'Client went with XYZ Designs due to lower pricing. 18% price gap.' },
  { id:'ACT-310', leadId:'LD-2026-008', type:'Note', user:'Rahul Mehta', timestamp:'2026-11-07T15:00:00', summary:'New lead — referred by Sneha Oberoi.', detail:'High-value duplex in Powai. Client expects premium-quality work.' },
  { id:'ACT-311', leadId:'LD-2026-009', type:'Email', user:'Priya Sharma', timestamp:'2026-11-04T14:00:00', summary:'Sent portfolio presentation.', detail:'Curated portfolio of corporate and executive office projects shared.' },
  { id:'ACT-312', leadId:'LD-2026-010', type:'Meeting', user:'Amit Verma', timestamp:'2026-11-06T17:00:00', summary:'Site visit completed — Jio World Centre.', detail:'Impressive space. 18ft ceiling. Modular concept feasible. Client very positive.' },
  { id:'ACT-313', leadId:'LD-2026-011', type:'Note', user:'Neha Kapoor', timestamp:'2026-11-05T12:00:00', summary:'BOQ preparation started.', detail:'Sourcing quotes for Italian Statuario marble and smart home system.' },
  { id:'ACT-314', leadId:'LD-2026-013', type:'Email', user:'Priya Sharma', timestamp:'2026-11-04T11:00:00', summary:'Revised quotation v2 sent.', detail:'Updated quotation with Bvlgari fixtures and custom art curation line items.' },
  { id:'ACT-315', leadId:'LD-2026-015', type:'Meeting', user:'Neha Kapoor', timestamp:'2026-11-06T10:00:00', summary:'Negotiation round 2.', detail:'Client agreed on scope. Discussing phased payment: 30-40-20-10 structure.' }
];

/* ═══════════════════════════════════════
   STAGE HISTORY
   ═══════════════════════════════════════ */
var CRM_STAGE_HISTORY = [
  { leadId:'LD-2026-002', from:'New Enquiry', to:'Qualified', date:'2026-11-03T14:00:00', user:'Amit Verma', notes:'Client confirmed budget and timeline. Qualified.' },
  { leadId:'LD-2026-003', from:'New Enquiry', to:'Qualified', date:'2026-10-28T10:00:00', user:'Rahul Mehta', notes:'Initial call successful. Client serious.' },
  { leadId:'LD-2026-003', from:'Qualified', to:'Site Visit Scheduled', date:'2026-11-06T09:00:00', user:'Rahul Mehta', notes:'Site visit scheduled for 12 Nov.' },
  { leadId:'LD-2026-004', from:'New Enquiry', to:'Qualified', date:'2026-10-15T11:00:00', user:'Neha Kapoor', notes:'Budget confirmed. Decision maker identified.' },
  { leadId:'LD-2026-004', from:'Qualified', to:'Site Visit Scheduled', date:'2026-10-18T09:00:00', user:'Neha Kapoor', notes:'' },
  { leadId:'LD-2026-004', from:'Site Visit Scheduled', to:'Site Visit Completed', date:'2026-10-20T16:00:00', user:'Neha Kapoor', notes:'Measurements taken.' },
  { leadId:'LD-2026-004', from:'Site Visit Completed', to:'Quotation Preparation', date:'2026-10-22T09:00:00', user:'Neha Kapoor', notes:'' },
  { leadId:'LD-2026-004', from:'Quotation Preparation', to:'Quotation Sent', date:'2026-11-05T17:30:00', user:'Neha Kapoor', notes:'QT-2026-Q04 sent.' },
  { leadId:'LD-2026-005', from:'New Enquiry', to:'Qualified', date:'2026-10-02T10:00:00', user:'Deepak Singh', notes:'' },
  { leadId:'LD-2026-005', from:'Qualified', to:'Site Visit Scheduled', date:'2026-10-05T14:00:00', user:'Deepak Singh', notes:'' },
  { leadId:'LD-2026-005', from:'Site Visit Scheduled', to:'Site Visit Completed', date:'2026-10-10T17:00:00', user:'Deepak Singh', notes:'' },
  { leadId:'LD-2026-005', from:'Site Visit Completed', to:'Quotation Preparation', date:'2026-10-12T09:00:00', user:'Deepak Singh', notes:'' },
  { leadId:'LD-2026-005', from:'Quotation Preparation', to:'Quotation Sent', date:'2026-10-20T11:00:00', user:'Deepak Singh', notes:'Landscape quotation sent.' },
  { leadId:'LD-2026-005', from:'Quotation Sent', to:'Negotiation', date:'2026-10-28T14:00:00', user:'Deepak Singh', notes:'Client wants discount.' },
  { leadId:'LD-2026-006', from:'New Enquiry', to:'Qualified', date:'2026-09-18T10:00:00', user:'Priya Sharma', notes:'' },
  { leadId:'LD-2026-006', from:'Qualified', to:'Site Visit Scheduled', date:'2026-09-20T09:00:00', user:'Priya Sharma', notes:'' },
  { leadId:'LD-2026-006', from:'Site Visit Scheduled', to:'Site Visit Completed', date:'2026-09-25T16:00:00', user:'Priya Sharma', notes:'' },
  { leadId:'LD-2026-006', from:'Site Visit Completed', to:'Quotation Preparation', date:'2026-09-28T09:00:00', user:'Priya Sharma', notes:'' },
  { leadId:'LD-2026-006', from:'Quotation Preparation', to:'Quotation Sent', date:'2026-10-10T11:00:00', user:'Priya Sharma', notes:'' },
  { leadId:'LD-2026-006', from:'Quotation Sent', to:'Negotiation', date:'2026-10-20T14:00:00', user:'Priya Sharma', notes:'' },
  { leadId:'LD-2026-006', from:'Negotiation', to:'Won', date:'2026-11-03T10:30:00', user:'Priya Sharma', notes:'Contract signed!' },
  { leadId:'LD-2026-007', from:'New Enquiry', to:'Qualified', date:'2026-09-05T10:00:00', user:'Amit Verma', notes:'' },
  { leadId:'LD-2026-007', from:'Qualified', to:'Site Visit Scheduled', date:'2026-09-08T09:00:00', user:'Amit Verma', notes:'' },
  { leadId:'LD-2026-007', from:'Site Visit Scheduled', to:'Site Visit Completed', date:'2026-10-15T16:30:00', user:'Amit Verma', notes:'Measurements done.' },
  { leadId:'LD-2026-007', from:'Site Visit Completed', to:'Quotation Preparation', date:'2026-10-17T09:00:00', user:'Amit Verma', notes:'' },
  { leadId:'LD-2026-007', from:'Quotation Preparation', to:'Quotation Sent', date:'2026-10-22T11:00:00', user:'Amit Verma', notes:'' },
  { leadId:'LD-2026-007', from:'Quotation Sent', to:'Lost', date:'2026-10-28T16:00:00', user:'Amit Verma', notes:'Client chose competitor.' },
  { leadId:'LD-2026-010', from:'New Enquiry', to:'Qualified', date:'2026-10-18T10:00:00', user:'Amit Verma', notes:'' },
  { leadId:'LD-2026-010', from:'Qualified', to:'Site Visit Scheduled', date:'2026-10-28T09:00:00', user:'Amit Verma', notes:'' },
  { leadId:'LD-2026-010', from:'Site Visit Scheduled', to:'Site Visit Completed', date:'2026-11-06T17:00:00', user:'Amit Verma', notes:'Detailed measurements completed.' },
  { leadId:'LD-2026-013', from:'New Enquiry', to:'Qualified', date:'2026-09-25T10:00:00', user:'Priya Sharma', notes:'' },
  { leadId:'LD-2026-013', from:'Qualified', to:'Site Visit Scheduled', date:'2026-09-28T09:00:00', user:'Priya Sharma', notes:'' },
  { leadId:'LD-2026-013', from:'Site Visit Scheduled', to:'Site Visit Completed', date:'2026-10-05T16:00:00', user:'Priya Sharma', notes:'' },
  { leadId:'LD-2026-013', from:'Site Visit Completed', to:'Quotation Preparation', date:'2026-10-08T09:00:00', user:'Priya Sharma', notes:'' },
  { leadId:'LD-2026-013', from:'Quotation Preparation', to:'Quotation Sent', date:'2026-11-04T11:00:00', user:'Priya Sharma', notes:'Quotation v2 sent.' },
  { leadId:'LD-2026-015', from:'New Enquiry', to:'Qualified', date:'2026-09-28T14:00:00', user:'Neha Kapoor', notes:'' },
  { leadId:'LD-2026-015', from:'Qualified', to:'Site Visit Scheduled', date:'2026-10-01T09:00:00', user:'Neha Kapoor', notes:'' },
  { leadId:'LD-2026-015', from:'Site Visit Scheduled', to:'Site Visit Completed', date:'2026-10-10T16:00:00', user:'Neha Kapoor', notes:'' },
  { leadId:'LD-2026-015', from:'Site Visit Completed', to:'Quotation Preparation', date:'2026-10-12T09:00:00', user:'Neha Kapoor', notes:'' },
  { leadId:'LD-2026-015', from:'Quotation Preparation', to:'Quotation Sent', date:'2026-10-25T11:00:00', user:'Neha Kapoor', notes:'' },
  { leadId:'LD-2026-015', from:'Quotation Sent', to:'Negotiation', date:'2026-11-01T14:00:00', user:'Neha Kapoor', notes:'Client wants phased payment.' }
];

/* ═══════════════════════════════════════
   QUOTATIONS
   ═══════════════════════════════════════ */
var CRM_QUOTATIONS = [
  {
    id:'QT-2026-Q01', leadId:'LD-2026-006', customerName:'Meera Prestige', projectTitle:'Prestige Apartments — Model Flat',
    version:3, previousVersions:[1,2], createdBy:'sp-01', createdDate:'2026-10-10',
    validUntil:'2026-11-10', status:'Accepted', scopeOfWork:'Complete model flat interior design including furniture, lighting, soft furnishings, and styling.',
    terms:'50% advance, 30% on material delivery, 20% on completion. 12-month warranty on workmanship.',
    items:[
      { desc:'Living Room — Italian Marble Flooring', category:'Flooring', unit:'sqft', qty:600, rate:850, discount:0, taxId:'gst-18' },
      { desc:'Living Room — False Ceiling with Cove Lighting', category:'False Ceiling', unit:'sqft', qty:600, rate:280, discount:5, taxId:'gst-18' },
      { desc:'Master Bedroom — Built-in Wardrobe', category:'Carpentry', unit:'nos', qty:1, rate:185000, discount:0, taxId:'gst-18' },
      { desc:'Kitchen — Modular Kitchen with Appliances', category:'Furniture', unit:'lot', qty:1, rate:450000, discount:0, taxId:'gst-18' },
      { desc:'Bathrooms — Premium Fixtures (x3)', category:'Fixtures', unit:'lot', qty:3, rate:120000, discount:10, taxId:'gst-18' },
      { desc:'Electrical — Smart Home Automation', category:'Electrical', unit:'lot', qty:1, rate:280000, discount:0, taxId:'gst-18' },
      { desc:'Painting — Asian Paints Royale', category:'Painting', unit:'sqft', qty:4200, rate:35, discount:0, taxId:'gst-18' },
      { desc:'Soft Furnishing — Curtains, Upholstery', category:'Soft Furnishing', unit:'lot', qty:1, rate:320000, discount:5, taxId:'gst-18' }
    ],
    sentDate:'2026-10-10', acceptedDate:'2026-11-03', approvedBy:'sp-01', approvedDate:'2026-10-09'
  },
  {
    id:'QT-2026-Q02', leadId:'LD-2026-004', customerName:'Vikram Mahindra', projectTitle:'Mahindra Office — Corporate Fitout',
    version:1, previousVersions:[], createdBy:'sp-04', createdDate:'2026-11-05',
    validUntil:'2026-12-05', status:'Sent', scopeOfWork:'Open-plan office fitout for 200 employees including workstations, meeting rooms, breakout areas, and reception.',
    terms:'30% advance, 40% on milestone, 30% on completion. 18-month warranty.',
    items:[
      { desc:'Workstations — 200 nos modular', category:'Furniture', unit:'nos', qty:200, rate:18500, discount:5, taxId:'gst-18' },
      { desc:'Meeting Rooms — 6 nos full fitout', category:'Furniture', unit:'nos', qty:6, rate:280000, discount:0, taxId:'gst-18' },
      { desc:'Reception Area — Premium Design', category:'Carpentry', unit:'lot', qty:1, rate:650000, discount:0, taxId:'gst-18' },
      { desc:'Flooring — Engineered Wood', category:'Flooring', unit:'sqft', qty:12000, rate:220, discount:0, taxId:'gst-18' },
      { desc:'False Ceiling — Grid + Gypsum', category:'False Ceiling', unit:'sqft', qty:12000, rate:180, discount:0, taxId:'gst-18' },
      { desc:'Electrical — Complete', category:'Electrical', unit:'lot', qty:1, rate:1200000, discount:0, taxId:'gst-18' },
      { desc:'HVAC Ducting Modifications', category:'HVAC', unit:'lot', qty:1, rate:450000, discount:0, taxId:'gst-18' }
    ],
    sentDate:'2026-11-05', approvedBy:'sp-01', approvedDate:'2026-11-05'
  },
  {
    id:'QT-2026-Q03', leadId:'LD-2026-013', customerName:'Priyanka DLF', projectTitle:'DLF Penthouse — Ultra Luxury',
    version:2, previousVersions:[1], createdBy:'sp-01', createdDate:'2026-11-04',
    validUntil:'2026-12-04', status:'Sent', scopeOfWork:'Ultra-luxury penthouse interiors with imported Italian marble, Bvlgari fixtures, custom art curation, and bespoke furniture.',
    terms:'40% advance, 30% on material delivery, 20% on installation, 10% on handover. 24-month warranty.',
    items:[
      { desc:'Italian Calacatta Marble — Full Living', category:'Flooring', unit:'sqft', qty:3500, rate:2800, discount:0, taxId:'gst-18' },
      { desc:'Bvlgari Bathroom Fixtures — 5 bathrooms', category:'Fixtures', unit:'lot', qty:5, rate:850000, discount:0, taxId:'gst-18' },
      { desc:'Custom Bespoke Furniture', category:'Furniture', unit:'lot', qty:1, rate:4500000, discount:0, taxId:'gst-18' },
      { desc:'Art Curation & Installation', category:'Miscellaneous', unit:'lot', qty:1, rate:2200000, discount:0, taxId:'gst-18' },
      { desc:'Smart Home — Crestron System', category:'Electrical', unit:'lot', qty:1, rate:3500000, discount:0, taxId:'gst-18' },
      { desc:'Kitchen — Bulthaup with Gaggenau', category:'Furniture', unit:'lot', qty:1, rate:2800000, discount:0, taxId:'gst-18' },
      { desc:'Lighting Design — Custom Chandeliers', category:'Lighting', unit:'lot', qty:1, rate:1800000, discount:5, taxId:'gst-18' }
    ],
    sentDate:'2026-11-04', approvedBy:'sp-01', approvedDate:'2026-11-03'
  },
  {
    id:'QT-2026-Q04', leadId:'LD-2026-005', customerName:'Ananya Godrej', projectTitle:'Godrej Villa — Landscape Design',
    version:1, previousVersions:[], createdBy:'sp-05', createdDate:'2026-10-20',
    validUntil:'2026-11-20', status:'Sent', scopeOfWork:'Contemporary landscape design including water features, outdoor seating, vertical garden, and pathway lighting.',
    terms:'40% advance, 30% on planting, 30% on completion. 6-month plant replacement warranty.',
    items:[
      { desc:'Water Feature — Custom Cascade', category:'Civil Work', unit:'lot', qty:1, rate:450000, discount:0, taxId:'gst-18' },
      { desc:'Outdoor Seating Area — Teak', category:'Furniture', unit:'lot', qty:1, rate:380000, discount:0, taxId:'gst-18' },
      { desc:'Vertical Garden — 200 sqft', category:'Miscellaneous', unit:'sqft', qty:200, rate:2800, discount:0, taxId:'gst-18' },
      { desc:'Pathway — Natural Stone', category:'Flooring', unit:'sqft', qty:800, rate:650, discount:5, taxId:'gst-18' },
      { desc:'Landscape Lighting', category:'Lighting', unit:'lot', qty:1, rate:280000, discount:0, taxId:'gst-18' },
      { desc:'Plants & Planting', category:'Miscellaneous', unit:'lot', qty:1, rate:350000, discount:0, taxId:'gst-18' }
    ],
    sentDate:'2026-10-20', approvedBy:'sp-01', approvedDate:'2026-10-19'
  },
  {
    id:'QT-2026-Q05', leadId:'LD-2026-011', customerName:'Ravi Piramal', projectTitle:'Piramal Residence — Luxury Renovation',
    version:1, previousVersions:[], createdBy:'sp-04', createdDate:'2026-11-08',
    validUntil:'2026-12-08', status:'Draft', scopeOfWork:'Complete renovation of 3BHK apartment including flooring, kitchen, bathrooms, wardrobes, and smart home integration.',
    terms:'TBD',
    items:[
      { desc:'Italian Statuario Marble — Living & Dining', category:'Flooring', unit:'sqft', qty:1200, rate:3200, discount:0, taxId:'gst-18' },
      { desc:'Modular Kitchen — Premium', category:'Furniture', unit:'lot', qty:1, rate:650000, discount:0, taxId:'gst-18' },
      { desc:'Bathroom Renovation — 3 nos', category:'Fixtures', unit:'nos', qty:3, rate:280000, discount:0, taxId:'gst-18' },
      { desc:'Built-in Wardrobes — 3 nos', category:'Carpentry', unit:'nos', qty:3, rate:165000, discount:0, taxId:'gst-18' },
      { desc:'Smart Home System', category:'Electrical', unit:'lot', qty:1, rate:350000, discount:0, taxId:'gst-18' }
    ]
  },
  {
    id:'QT-2026-Q06', leadId:'LD-2026-015', customerName:'Kavitha Infosys', projectTitle:'Infosys Wellness Center',
    version:1, previousVersions:[], createdBy:'sp-04', createdDate:'2026-10-25',
    validUntil:'2026-11-25', status:'Sent', scopeOfWork:'Employee wellness center with yoga studio, gym, meditation rooms, juice bar, and relaxation areas.',
    terms:'30% advance, 40% on milestone, 30% on completion. 12-month warranty.',
    items:[
      { desc:'Yoga Studio — Bamboo Flooring & Mirrors', category:'Flooring', unit:'sqft', qty:1500, rate:420, discount:0, taxId:'gst-18' },
      { desc:'Gym Area — Rubber Flooring & Mirrors', category:'Flooring', unit:'sqft', qty:2500, rate:350, discount:0, taxId:'gst-18' },
      { desc:'Meditation Rooms — 4 nos', category:'Carpentry', unit:'nos', qty:4, rate:180000, discount:0, taxId:'gst-18' },
      { desc:'Juice Bar — Full Fitout', category:'Furniture', unit:'lot', qty:1, rate:450000, discount:0, taxId:'gst-18' },
      { desc:'Relaxation Lounge', category:'Furniture', unit:'lot', qty:1, rate:380000, discount:0, taxId:'gst-18' },
      { desc:'Acoustic Treatment', category:'Miscellaneous', unit:'sqft', qty:3000, rate:280, discount:0, taxId:'gst-18' },
      { desc:'Specialist Lighting — Circadian', category:'Lighting', unit:'lot', qty:1, rate:520000, discount:0, taxId:'gst-18' }
    ],
    sentDate:'2026-10-25', approvedBy:'sp-01', approvedDate:'2026-10-24'
  }
];

/* ═══════════════════════════════════════
   NOTIFICATIONS (CRM-specific)
   ═══════════════════════════════════════ */
var CRM_NOTIFICATIONS = [
  { id:101, title:'Overdue Follow-up', message:'Follow-up with Vikram Mahindra is overdue', time:'2 hours ago', read:false, type:'warning' },
  { id:102, title:'New Lead Assigned', message:'Birla Estate — 4BHK assigned to you', time:'1 day ago', read:false, type:'info' },
  { id:103, title:'Quotation Accepted!', message:'Meera Prestige accepted QT-2026-Q01', time:'6 days ago', read:true, type:'success' },
  { id:104, title:'Site Visit Tomorrow', message:'Sneha Oberoi — Worli site visit at 11 AM', time:'Just now', read:false, type:'reminder' },
  { id:105, title:'Overdue Follow-up', message:'Follow-up with Priyanka DLF is overdue', time:'3 days ago', read:false, type:'warning' }
];

/* ═══════════════════════════════════════
   HELPER: Calculate quotation totals
   ═══════════════════════════════════════ */
function calcQuoteLine(item) {
  var gross = item.qty * item.rate;
  var discAmt = gross * (item.discount || 0) / 100;
  var taxable = gross - discAmt;
  var tax = CRM_TAX_CATEGORIES.find(function(t){ return t.id === item.taxId; });
  var taxAmt = taxable * ((tax ? tax.rate : 0) / 100);
  return { gross: gross, discount: discAmt, taxable: taxable, taxAmt: taxAmt, total: taxable + taxAmt };
}

function calcQuoteTotals(items) {
  var subtotal = 0, totalDiscount = 0, totalTaxable = 0, totalTax = 0, grandTotal = 0;
  items.forEach(function(item) {
    var line = calcQuoteLine(item);
    subtotal += line.gross;
    totalDiscount += line.discount;
    totalTaxable += line.taxable;
    totalTax += line.taxAmt;
    grandTotal += line.total;
  });
  return { subtotal: subtotal, discount: totalDiscount, taxable: totalTaxable, tax: totalTax, grandTotal: grandTotal };
}
