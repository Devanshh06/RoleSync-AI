# RoleSync AI — Frontend Development Guide

*A working reference for AI-assisted development (e.g. Claude Code) and human developers building the RoleSync AI frontend. Keep this file updated as work progresses — it is the source of truth for what's built, what's next, and how pieces fit together.*

---

## 1. Project Overview

**RoleSync AI** manages the handover of institutional responsibilities when college faculty leave, transfer, or are reassigned. Instead of tying documents, contacts, and tasks to a *person*, everything is tied to a *role* — so when a role changes hands, nothing gets lost.

**Users:**
- **Admin / HOD** — full access: manage faculty, assign/reassign roles, view all department dashboards
- **Faculty** — limited access: manage their own roles, checklists, tasks, and documents; search institutional knowledge

**Core idea the UI must reinforce everywhere:** the *role* is the persistent unit, not the *person*. Every screen should make "who currently holds this role" and "what's pending on this role" immediately visible.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React (functional components + hooks only, no class components) |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| HTTP client | Axios, wrapped in a single `api/client.js` with a base URL and auth header interceptor |
| State | React Context for auth/user session; local `useState`/`useReducer` per feature — no external state library needed at this scope |
| Icons | `lucide-react` or `react-icons` |
| Forms | Plain controlled components — no form library needed for this scope |

Backend is a separate Node/Express + MongoDB service exposing REST endpoints. The frontend should never assume backend internals — only the JSON shapes documented in Section 3 and the endpoints documented per module.

---

## 3. Core Data Shapes (as consumed by the frontend)

```json
// User
{ "id": "string", "name": "string", "email": "string", "department": "string",
  "designation": "string", "contact": "string",
  "status": "Active | Leaving | Exited", "userType": "Admin | Faculty" }

// Role
{ "id": "string", "name": "string", "type": "string" } // e.g. "Internship Coordinator - CSE"

// RoleAssignment
{ "id": "string", "roleId": "string", "roleName": "string",
  "userId": "string", "userName": "string",
  "startDate": "ISO date", "endDate": "ISO date | null", "isActive": "boolean" }

// ChecklistItem
{ "id": "string", "roleAssignmentId": "string", "title": "string",
  "status": "Done | Pending", "mandatory": "boolean", "remark": "string" }

// Document
{ "id": "string", "roleId": "string", "title": "string", "category": "string",
  "fileUrl": "string", "uploadedBy": "string", "uploadedAt": "ISO date" }

// Task
{ "id": "string", "roleId": "string", "title": "string",
  "ownerId": "string", "ownerName": "string", "deadline": "ISO date",
  "status": "Not Started | In Progress | Done", "notes": "string" }

// AI Handover Brief
{ "id": "string", "roleId": "string", "generatedAt": "ISO date",
  "keyContacts": ["string"], "pendingItems": ["string"],
  "summary": "string", "nextActions": ["string"] }

// Search Result
{ "id": "string", "type": "document | contact | task", "title": "string",
  "snippet": "string", "score": "number" }
```

Treat these as contracts. If a module needs a field not listed here, add it to this section before building against it, so frontend and backend stay in sync.

---

## 4. Design Guidelines

- Keep it simple and functional — faculty users have varying technical comfort; no feature should need training to discover.
- Use consistent status colors everywhere: **green** = Done/Active, **yellow** = In Progress/Pending, **red** = Blocked/Overdue/Leaving.
- Every list of roles, tasks, or checklist items should show its **owner** and **status** without a click — no hidden state.
- Admin views and Faculty views share components where possible; differ by what data is fetched and which actions are shown, not by separate component trees.
- Loading and empty states are required on every data-driven screen — never show a blank screen while fetching.

---

## 5. Folder Structure

```
src/
  api/           # axios client + one file per resource (rolesApi.js, tasksApi.js, ...)
  components/    # shared, reusable UI (Button, Card, StatusBadge, Modal, etc.)
  context/       # AuthContext, session state
  modules/
    auth/
    roles/
    handover/    # checklist + documents + tasks
    dashboard/
    ai/          # brief + search
  pages/         # route-level components, one per screen, composed from modules/
  routes/        # route definitions + protected-route wrapper
  utils/
```

---

## 6. Development Modules

The frontend is split into 5 modules, built in this order — each depends only on the ones before it.

### Module 1 — Foundation: Auth, Layout & Navigation
**Goal:** a logged-in shell that routes Admin and Faculty users to the right views.

**Pages:** Login, App Shell (sidebar + header), 404/Not Authorized

**Key components:** `LoginForm`, `AppLayout`, `Sidebar`, `ProtectedRoute`, `UserMenu`

**API endpoints consumed:** `POST /auth/login`, `GET /auth/me`

**Task list:**
- [ ] Set up React Router with a protected-route wrapper
- [ ] Build `AuthContext` (login, logout, current user, token persistence)
- [ ] Build Login page with validation and error states
- [ ] Build App Shell: sidebar (role-aware nav items), header (user menu, logout)
- [ ] Build route guarding — Faculty users cannot reach Admin-only routes
- [ ] Build 404 and Not Authorized pages
- [ ] Wire Axios client with auth header interceptor and centralized error handling

---

### Module 2 — Role & Faculty Management
**Goal:** manage faculty profiles and see/change who holds which role.

**Pages:** Faculty List (Admin), Faculty Profile, Role Directory, Reassign Role modal/flow

**Key components:** `FacultyTable`, `FacultyStatusBadge`, `RoleCard`, `ReassignRoleModal`

**API endpoints consumed:** `GET/POST/PUT /users`, `GET/POST /roles`, `GET/POST/PUT /role-assignments`

**Task list:**
- [ ] Build Faculty List page (Admin) with status filter (Active/Leaving/Exited)
- [ ] Build Faculty Profile page (view/edit, shows roles held)
- [ ] Build "mark as Leaving" action with confirmation
- [ ] Build Role Directory — "who holds what" list across departments
- [ ] Build Reassign Role flow (close old assignment, open new one)
- [ ] Build role type creation form (Admin only)

---

### Module 3 — Handover Core: Checklist, Documents & Tasks
**Goal:** the actual handover workflow — this is the heart of the product.

**Pages:** Handover Checklist view, Document Repository, Task Tracker

**Key components:** `ChecklistItemRow`, `DocumentUploadCard`, `DocumentList`, `TaskCard`, `TaskStatusSelect`

**API endpoints consumed:** `GET/PUT /checklist-items`, `GET/POST /documents`, `GET/POST/PUT /tasks`

**Task list:**
- [ ] Build Checklist view — grouped by role, mandatory items visually distinct
- [ ] Build checklist item toggle (Done/Pending) with remark field
- [ ] Build "block exit until mandatory items complete" UI state
- [ ] Build Document Repository — upload, tag by category, filter by role/tag
- [ ] Build document list with download links
- [ ] Build Task Tracker — list + create/edit task form
- [ ] Build task status update control and context-notes field
- [ ] Build auto-reassignment indicator (task flagged when owner marked Leaving)

---

### Module 4 — Admin Dashboard
**Goal:** give Admin/HOD a real-time view of handover health.

**Pages:** Dashboard (Admin only)

**Key components:** `HandoverStatusCard`, `CompletionBar`, `SummaryStatTile`, `DepartmentFilter`

**API endpoints consumed:** `GET /dashboard/summary`, `GET /dashboard/handovers`

**Task list:**
- [ ] Build summary stat tiles (total roles, pending checklist items, open tasks)
- [ ] Build ongoing-handovers list with completion % per faculty member
- [ ] Build red/yellow/green status indicator logic
- [ ] Build department filter/segmentation
- [ ] Build empty state for "no active handovers"

---

### Module 5 — AI-Powered Features: Handover Brief & Semantic Search
**Goal:** the flagship differentiator — surface AI-generated context, not just raw records.

**Pages:** Handover Brief view, Search page (or global search bar)

**Key components:** `BriefSummaryCard`, `BriefSection` (contacts/pending/next-actions), `SearchBar`, `SearchResultList`, `AIGeneratingIndicator`

**API endpoints consumed:** `POST /ai/generate-brief`, `GET /ai/search?q=`

**Task list:**
- [ ] Build "Generate Brief" trigger on a role's handover page
- [ ] Build loading state for brief generation (can take up to ~15s — show progress, not a frozen screen)
- [ ] Build Brief display — key contacts, pending items, summary, next actions as distinct sections
- [ ] Build global Search bar (natural-language input)
- [ ] Build Search results list with type badges (document/contact/task) and snippet preview
- [ ] Build empty/no-results state with a helpful prompt
- [ ] Build graceful fallback UI if the AI service is unavailable (cached/error state, not a crash)

---

## 7. Progress Tracker

*Update this table as work happens — it's the single place to check "where are we."*

| Module | Status | % Complete | Owner | Notes / Blockers |
|---|---|---|---|---|
| 1. Foundation (Auth, Layout, Routing) | Not Started | 0% | — | — |
| 2. Role & Faculty Management | Not Started | 0% | — | Depends on Module 1 |
| 3. Handover Core (Checklist/Docs/Tasks) | Not Started | 0% | — | Depends on Module 2 |
| 4. Admin Dashboard | Not Started | 0% | — | Depends on Module 3 |
| 5. AI Features (Brief/Search) | Not Started | 0% | — | Depends on Module 3; needs LLM API key |

**Status values:** `Not Started` → `In Progress` → `Blocked` (note why) → `Done`

**How an AI assistant should use this file:** before starting work, read Section 7 to see what's already done and what's next in dependency order. After completing a task, check it off in the relevant module's task list in Section 6, and update that module's row in Section 7. Never skip ahead to a module whose dependency isn't at least `In Progress`.
