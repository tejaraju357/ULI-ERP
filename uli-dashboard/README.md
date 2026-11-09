# ULI Studio ERP — Overview Dashboard Prototype

> **Version:** 0.1.0 · Prototype  
> **Status:** Dashboard screen complete. All other modules are placeholder.  
> **Data:** All values shown are **DEMO DATA** — no real company figures.

---

## How to Run

1. Open the `uli-dashboard/` folder.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
3. No build step, no server, no dependencies to install.

Alternatively, serve locally:

```bash
# Python 3
cd uli-dashboard
python -m http.server 8080

# Node (npx)
npx serve uli-dashboard
```

Then open `http://localhost:8080`.

> **Note:** The app loads Lucide Icons from a CDN (`unpkg.com`), so an internet connection is required on first load (icons are cached after that).

---

## File Structure

```
uli-dashboard/
├── index.html            # Main HTML shell
├── css/
│   └── styles.css        # All styles (variables, layout, components, responsive)
├── js/
│   ├── mock-data.js      # Centralised demo data (separated from rendering)
│   ├── app.js            # Core app: sidebar, dropdowns, modals, toasts, search
│   └── dashboard.js      # Dashboard rendering: KPIs, tables, timeline, actions
├── assets/               # Reserved for future images/icons
└── README.md             # This file
```

---

## Screens & Components

| Component              | Location              | Description                                       |
|------------------------|-----------------------|---------------------------------------------------|
| Sidebar                | Shared layout         | Dark navy sidebar with navigation items            |
| Top Navigation         | Shared layout         | Breadcrumb, search, notifications, profile         |
| Welcome Section        | Dashboard             | Greeting, date, range filter, refresh              |
| KPI Cards (×4)         | Dashboard             | Revenue, Receivables, Active Projects, Open Leads  |
| Action Required Table  | Dashboard             | 5 actionable items with View modal                 |
| Project Health (×4)    | Dashboard             | Progress bars with health indicators               |
| Recent Activity        | Dashboard             | 5-item timeline with user/action/timestamp         |
| Quick Actions          | Dashboard             | 4 shortcut buttons with modal forms                |
| Modal System           | Global                | Reusable modal with dynamic content                |
| Toast Notifications    | Global                | Auto-dismissing success/error/info toasts          |
| Loading State          | Global                | Full-screen spinner on initial load                |
| Error State            | Dashboard             | Retry screen if dashboard fails to render          |
| Empty States           | Per section           | Shown when data arrays are empty                   |

---

## Interactions Checklist

| # | Interaction                        | Type        | Status |
|---|------------------------------------|-------------|--------|
| 1 | Sidebar navigation click           | Navigation  | ✅     |
| 2 | Sidebar "coming soon" toast        | Feedback    | ✅     |
| 3 | Mobile sidebar open/close          | Responsive  | ✅     |
| 4 | Mobile sidebar overlay dismiss     | Responsive  | ✅     |
| 5 | Search toggle open/close           | UI          | ✅     |
| 6 | Search with debounced results      | Functional  | ✅     |
| 7 | Search no-results state            | State       | ✅     |
| 8 | Search result click                | Navigation  | ✅     |
| 9 | Notification dropdown toggle       | UI          | ✅     |
| 10| Mark all notifications read        | Action      | ✅     |
| 11| Individual notification click      | Action      | ✅     |
| 12| Notification badge visibility      | State       | ✅     |
| 13| Profile dropdown toggle            | UI          | ✅     |
| 14| Close dropdowns on outside click   | UX          | ✅     |
| 15| Escape key closes all overlays     | Keyboard    | ✅     |
| 16| Date range filter change           | Filter      | ✅     |
| 17| Refresh button with animation      | Action      | ✅     |
| 18| KPI card hover elevation           | Visual      | ✅     |
| 19| KPI card click → detail modal      | Drill-down  | ✅     |
| 20| Action table View → detail modal   | Drill-down  | ✅     |
| 21| Action modal Approve button        | Action      | ✅     |
| 22| Project item click → detail modal  | Drill-down  | ✅     |
| 23| Quick Action: Create Lead          | Form modal  | ✅     |
| 24| Quick Action: Create PR            | Form modal  | ✅     |
| 25| Quick Action: Pending Approvals    | List modal  | ✅     |
| 26| Quick Action: View Projects        | List modal  | ✅     |
| 27| Modal close via X / Cancel / Esc   | UI          | ✅     |
| 28| Modal close on overlay click       | UI          | ✅     |
| 29| Toast auto-dismiss (3.5s)          | Feedback    | ✅     |
| 30| Loading overlay with spinner       | State       | ✅     |
| 31| Error state with retry             | State       | ✅     |
| 32| Empty states per section           | State       | ✅     |
| 33| Responsive: desktop layout         | Layout      | ✅     |
| 34| Responsive: tablet layout          | Layout      | ✅     |
| 35| Responsive: mobile layout          | Layout      | ✅     |
| 36| Responsive: table horizontal scroll| Layout      | ✅     |

---

## Test Checklist

### Functional
- [ ] Dashboard loads without console errors
- [ ] All 4 KPI cards render with values and trend indicators
- [ ] KPI click opens modal with detail breakdown
- [ ] Action table shows 5 items with correct badges
- [ ] Each View button opens the correct item modal
- [ ] Project health shows 4 projects with progress bars
- [ ] Activity timeline displays 5 entries in order
- [ ] Quick Action "Create Lead" opens form modal
- [ ] Quick Action "Create PR" opens form modal
- [ ] Quick Action "Pending Approvals" lists filtered items
- [ ] Quick Action "View Projects" lists all projects
- [ ] Search returns results for "Prestige" and "marble"
- [ ] Search shows no-results for nonsense queries
- [ ] Notifications dropdown lists 4 items with unread highlighting
- [ ] "Mark all read" clears the notification badge
- [ ] Date range filter fires toast on change
- [ ] Refresh button rotates icon and fires toast

### Responsive
- [ ] Desktop (1280px+): full sidebar, 4-column KPIs, grid layout
- [ ] Tablet (768–1024px): sidebar visible, 2-column KPIs, single-column grids
- [ ] Mobile (< 768px): sidebar hidden, hamburger visible, drawer opens/closes
- [ ] Mobile: dropdowns fit within viewport
- [ ] Mobile: table scrolls horizontally
- [ ] Mobile: Quick actions stack to single column

### States
- [ ] Loading overlay appears and fades out on load
- [ ] Error state renders if `initDashboard()` throws (test by corrupting data)
- [ ] Empty states render when corresponding data arrays are empty

### Accessibility
- [ ] Sidebar items are keyboard navigable (Tab + Enter)
- [ ] KPI cards are keyboard accessible
- [ ] Modal traps focus context and closes on Escape
- [ ] ARIA labels on interactive elements

---

## Questions Requiring Business Clarification

1. **Financial Year definition** — Does the FY run April–March (Indian standard) or calendar year?
2. **Currency** — Should values always display in INR with Lakhs/Crore formatting?
3. **User roles** — What roles exist beyond Admin? (Manager, Accountant, Designer, etc.) What should each role see on the dashboard?
4. **KPI drill-down** — Should KPI click navigate to a detailed analytics page or show a modal summary?
5. **Action Required scope** — Should this table show items across all modules or only the current user's items?
6. **Project stages** — What is the standard stage progression? (Concept → Schematic → DD → CD → Execution → Handover?)
7. **Notification system** — Will notifications be real-time (WebSocket) or polling?
8. **Branding** — Is there an official ULI Studio logo, colour palette, or brand guideline to follow?
9. **Multi-company** — Should the ERP support multiple company entities under one login?
10. **Date formats** — Should dates follow DD/MM/YYYY (Indian) or be locale-aware?

---

## Technology

- **HTML5** — semantic markup
- **CSS3** — custom properties, grid, flexbox, media queries
- **Vanilla JavaScript** — no frameworks, explicit event listeners
- **Lucide Icons** — via CDN (open-source, MIT licensed)

No build tools, transpilers, or package managers required.

---

## Next Steps (Future Modules)

1. Leads & CRM module
2. Purchase & PO module
3. Project Management module
4. Drawings & Documents module
5. Accounting & Finance module
6. HR & Payroll module
7. Roles & Approvals module

Each module will follow the same shared layout (sidebar + topnav).
