# RoleSync AI — Frontend Development + Backend Integration Guide

Build out the full frontend per the [dev guide](file:///e:/Projects/RoleSync-AI/RoleSync_AI_Frontend_Dev_Guide.md), restructure the codebase to production-grade architecture, and create a comprehensive backend integration document for your friend.

## Current State

The project has a working Vite + React + Tailwind CSS scaffold with:
- **5 existing components** (Navbar, Sidebar, HandoverChecklist, AIBriefGenerator, SemanticSearch, AdminDashboard) — all use hardcoded/mock data
- **1 mock API service** (`mockApi.js`) — simulates delays but returns static data
- **ThemeContext** for dark/light mode
- **No auth system**, no route guards, no proper API client, no login page
- Empty `pages/` directory — all route components are inlined in `App.jsx` or in `components/`

## Proposed Changes

### Phase 1 — Foundation: Project Structure, API Client, Auth System

---

#### [MODIFY] [index.html](file:///e:/Projects/RoleSync-AI/client/index.html)
- Add proper `<title>` ("RoleSync AI"), meta description, Google Fonts (Inter) link

#### [MODIFY] [index.css](file:///e:/Projects/RoleSync-AI/client/src/index.css)
- Add additional utility classes, animation keyframes (shimmer, pulse-ring, slide-in-left/right), and more glass variants for the premium feel

#### [MODIFY] [App.css](file:///e:/Projects/RoleSync-AI/client/src/App.css)
- Remove the default Vite boilerplate CSS (hero, counter, ticks, etc.) — none of it is used

---

#### [NEW] `src/api/client.js`
- Axios instance with `baseURL` from env var (`VITE_API_URL`, default `http://localhost:5000/api`)
- Request interceptor: attach JWT from `localStorage`
- Response interceptor: on 401, clear token and redirect to `/login`

#### [NEW] `src/api/authApi.js`
- `login(email, password)` → `POST /auth/login`
- `getMe()` → `GET /auth/me`

#### [NEW] `src/api/usersApi.js`
- `getUsers(filters)` → `GET /users`
- `getUserById(id)` → `GET /users/:id`
- `createUser(data)` → `POST /users`
- `updateUser(id, data)` → `PUT /users/:id`

#### [NEW] `src/api/rolesApi.js`
- `getRoles()` → `GET /roles`
- `createRole(data)` → `POST /roles`
- `getRoleAssignments(filters)` → `GET /role-assignments`
- `createRoleAssignment(data)` → `POST /role-assignments`
- `updateRoleAssignment(id, data)` → `PUT /role-assignments/:id`

#### [NEW] `src/api/handoverApi.js`
- `getChecklistItems(roleAssignmentId)` → `GET /checklist-items?roleAssignmentId=`
- `updateChecklistItem(id, data)` → `PUT /checklist-items/:id`
- `getDocuments(roleId)` → `GET /documents?roleId=`
- `uploadDocument(roleId, formData)` → `POST /documents`
- `getTasks(roleId)` → `GET /tasks?roleId=`
- `createTask(data)` → `POST /tasks`
- `updateTask(id, data)` → `PUT /tasks/:id`

#### [NEW] `src/api/dashboardApi.js`
- `getDashboardSummary()` → `GET /dashboard/summary`
- `getDashboardHandovers()` → `GET /dashboard/handovers`

#### [NEW] `src/api/aiApi.js`
- `generateBrief(roleId)` → `POST /ai/generate-brief`
- `search(query)` → `GET /ai/search?q=`

---

#### [NEW] `src/context/AuthContext.jsx`
- Stores `user`, `token`, `isAuthenticated`, `isLoading`
- `login(email, password)` — calls API, stores token, fetches user profile
- `logout()` — clears token, redirects to `/login`
- On mount: check `localStorage` for token, call `getMe()` to validate

#### [NEW] `src/components/ProtectedRoute.jsx`
- Wraps `<Outlet>` — redirects to `/login` if not authenticated
- Optional `requiredRole` prop — redirects to `/unauthorized` if user role doesn't match

---

### Phase 2 — Pages & Route Structure

---

#### [NEW] `src/pages/LoginPage.jsx`
- Premium login form with glassmorphism card, gradient background, animated logo
- Email + password fields with validation
- Error display for invalid credentials
- "Logging in..." loading state
- Auto-redirect to `/` if already authenticated

#### [NEW] `src/pages/DashboardPage.jsx`
- Restructured from the inline `WelcomeDashboard` in App.jsx
- Shows current role, completion stats, quick action cards
- Fetches real data from auth context (user name, role)

#### [NEW] `src/pages/FacultyListPage.jsx`
- Admin-only page: table of all faculty with status badges (Active/Leaving/Exited)
- Filter/search by name, department, status
- "Mark as Leaving" action with confirmation modal
- Click row → navigate to Faculty Profile

#### [NEW] `src/pages/FacultyProfilePage.jsx`
- View/edit faculty details
- List of roles currently held
- Handover progress per role

#### [NEW] `src/pages/RoleDirectoryPage.jsx`
- "Who holds what" across departments
- Group by department, show current holder + active status
- Admin can create new role types

#### [NEW] `src/pages/HandoverPage.jsx`
- The main handover workspace for a specific role assignment
- Tabs/sections: Checklist, Documents, Tasks
- Uses enhanced versions of existing HandoverChecklist component
- Document upload with drag-and-drop, category tagging
- Task tracker with create/edit/status-update

#### [NEW] `src/pages/AdminDashboardPage.jsx`
- Wraps existing AdminDashboard component, wired to real API
- Department filter, handover list with completion bars

#### [NEW] `src/pages/AIBriefPage.jsx`
- Enhanced brief generation page, wired to real API
- Structured brief display with sections (contacts, pending, next actions)

#### [NEW] `src/pages/SearchPage.jsx`
- Enhanced semantic search, wired to real API
- Type badges on results (document/contact/task)

#### [NEW] `src/pages/UnauthorizedPage.jsx`
- Clean "You don't have permission" page with back button

#### [NEW] `src/pages/NotFoundPage.jsx`
- Animated 404 page with navigation back to dashboard

---

#### [MODIFY] [App.jsx](file:///e:/Projects/RoleSync-AI/client/src/App.jsx)
- Complete rewrite: wrap with `AuthProvider`, set up routes with `ProtectedRoute`
- Public routes: `/login`
- Protected routes: all others, inside `AppLayout` (Navbar + Sidebar shell)
- Admin-only routes: `/admin`, `/faculty`, `/roles`

---

### Phase 3 — Shared UI Components

---

#### [NEW] `src/components/ui/Button.jsx`
- Variants: primary, secondary, danger, ghost
- Sizes: sm, md, lg
- Loading state with spinner

#### [NEW] `src/components/ui/Modal.jsx`
- Reusable modal with backdrop blur, slide-in animation
- Title, body, footer slots

#### [NEW] `src/components/ui/StatusBadge.jsx`
- Consistent status pills: Active (green), Leaving (amber), Exited (red), Pending (yellow), Done (green)

#### [NEW] `src/components/ui/Card.jsx`
- Glass card component with optional gradient accent

#### [NEW] `src/components/ui/LoadingSkeleton.jsx`
- Shimmer loading placeholder for cards, tables, lists

#### [NEW] `src/components/ui/EmptyState.jsx`
- Reusable empty state with icon, title, description, optional action button

#### [NEW] `src/components/ReassignRoleModal.jsx`
- Select new faculty member, set start date, confirm reassignment

---

### Phase 4 — Backend Integration Document

---

#### [NEW] `Backend_Integration_Guide.md` (in project root)
- Complete REST API specification with all endpoints, request/response shapes, and status codes
- Authentication flow (JWT) with implementation details
- Database schema suggestions (MongoDB collections)
- Environment variables needed
- CORS configuration
- Step-by-step guide to connect frontend and backend
- Error response format contract
- File upload handling (documents)
- AI integration guidance (Gemini API for briefs, embedding model for search)

---

## Verification Plan

### Dev Server
- Run `npm run dev` and verify all pages render without errors
- Verify routing works (login → dashboard, protected routes redirect)
- Verify dark/light mode works across all new pages

### Mock Fallback
- Keep `mockApi.js` updated so the frontend is fully functional without a backend
- Each API module will use mock data as fallback when the backend isn't available

### Build Check
- Run `npm run build` to ensure no TypeScript/build errors

> [!IMPORTANT]
> The existing `mockApi.js` will be preserved and enhanced. Each real API module will gracefully fall back to mock data when the backend server is unreachable, so you can develop and demo the frontend independently.

> [!NOTE]
> The dev guide specifies Tailwind CSS — the project is already set up with Tailwind v4 via `@tailwindcss/vite`. All new components will use Tailwind as specified.
