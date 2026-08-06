# RoleSync AI — Backend Integration Guide

> **For the backend developer.** This document explains every API endpoint the frontend expects, the exact request/response JSON shapes, authentication flow, and how to connect the two. Follow this and the frontend will "just work."

---

## Table of Contents

1. [Quick Start — Connecting Frontend & Backend](#1-quick-start)
2. [Architecture Overview](#2-architecture-overview)
3. [Environment Setup](#3-environment-setup)
4. [Authentication (JWT)](#4-authentication-jwt)
5. [API Endpoints — Full Specification](#5-api-endpoints)
6. [Database Schema (MongoDB)](#6-database-schema)
7. [Error Response Format](#7-error-response-format)
8. [File Uploads (Documents)](#8-file-uploads)
9. [AI Integration](#9-ai-integration)
10. [CORS Configuration](#10-cors-configuration)
11. [Testing Checklist](#11-testing-checklist)

---

## 1. Quick Start

### How the frontend connects to the backend

The frontend uses Axios with a base URL that defaults to:

```
http://localhost:5000/api
```

This is configured via the `VITE_API_URL` environment variable in the frontend's `.env` file:

```env
# client/.env
VITE_API_URL=http://localhost:5000/api
```

**Steps to connect:**

1. Start your backend server on `http://localhost:5000`
2. All endpoints must be prefixed with `/api` (e.g., `http://localhost:5000/api/auth/login`)
3. Enable CORS for `http://localhost:5173` (Vite's default dev port)
4. The frontend will send `Authorization: Bearer <token>` on every request after login
5. Return JSON responses matching the shapes documented below

---

## 2. Architecture Overview

```
┌────────────────────┐         ┌────────────────────────┐
│  React Frontend    │  HTTP   │  Node/Express Backend  │
│  (Vite, port 5173) │◄───────►│  (port 5000)           │
│                    │  JSON   │                        │
│  Axios client      │         │  /api/*                │
│  JWT in headers    │         │  MongoDB               │
└────────────────────┘         │  Gemini API (AI)       │
                               └────────────────────────┘
```

The frontend never touches the database directly. All data flows through REST endpoints.

---

## 3. Environment Setup

### Backend `.env` file (suggested)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rolesync
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGIN=http://localhost:5173
```

### Required npm packages (suggested)

```bash
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cors dotenv multer
npm install -D nodemon
```

### Suggested `package.json` scripts

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

---

## 4. Authentication (JWT)

### Flow

1. User submits email + password to `POST /api/auth/login`
2. Backend validates credentials, returns `{ token, user }`
3. Frontend stores `token` in `localStorage`
4. Every subsequent request includes `Authorization: Bearer <token>` header
5. Backend middleware verifies the token on protected routes
6. On token expiry or invalid token, backend returns `401` → frontend redirects to `/login`

### Token payload (suggested)

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "userType": "Admin | Faculty",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Auth middleware (pseudo-code)

```javascript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

---

## 5. API Endpoints

All endpoints are prefixed with `/api`. Protected endpoints require the `Authorization: Bearer <token>` header.

---

### 5.1 Auth

#### `POST /api/auth/login`

**Public** — no auth required.

**Request:**
```json
{
  "email": "faculty@rolesync.edu",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "u2",
    "name": "Devansh Sharma",
    "email": "faculty@rolesync.edu",
    "department": "Computer Science",
    "designation": "Assistant Professor",
    "contact": "+91-9876543211",
    "status": "Leaving",
    "userType": "Faculty"
  }
}
```

**Error (401):**
```json
{ "message": "Invalid email or password." }
```

---

#### `GET /api/auth/me`

**Protected** — returns the currently authenticated user.

**Response (200):**
```json
{
  "id": "u2",
  "name": "Devansh Sharma",
  "email": "faculty@rolesync.edu",
  "department": "Computer Science",
  "designation": "Assistant Professor",
  "contact": "+91-9876543211",
  "status": "Leaving",
  "userType": "Faculty"
}
```

---

### 5.2 Users

All endpoints **Protected**. Admin-only unless noted.

#### `GET /api/users`

**Query params (all optional):**
| Param | Type | Example |
|---|---|---|
| `department` | string | `Computer Science` |
| `status` | string | `Active`, `Leaving`, `Exited` |
| `search` | string | `devansh` (matches name or email) |

**Response (200):**
```json
[
  {
    "id": "u1",
    "name": "Dr. Raghav Mehta",
    "email": "raghav@rolesync.edu",
    "department": "Computer Science",
    "designation": "HOD",
    "contact": "+91-9876543210",
    "status": "Active",
    "userType": "Admin"
  }
]
```

---

#### `GET /api/users/:id`

**Response (200):** Single user object (same shape as above).

**Error (404):**
```json
{ "message": "User not found." }
```

---

#### `POST /api/users`

**Request:**
```json
{
  "name": "New Faculty",
  "email": "new@rolesync.edu",
  "password": "initial_password",
  "department": "Computer Science",
  "designation": "Lecturer",
  "contact": "+91-0000000000",
  "userType": "Faculty"
}
```

**Response (201):** Created user object (without password).

---

#### `PUT /api/users/:id`

**Request:** Any subset of user fields:
```json
{
  "status": "Leaving",
  "designation": "Senior Lecturer"
}
```

**Response (200):** Updated user object.

> **Important:** When `status` changes to `"Leaving"`, the backend should flag all active role assignments for this user for handover.

---

### 5.3 Roles

All endpoints **Protected**.

#### `GET /api/roles`

**Response (200):**
```json
[
  { "id": "r1", "name": "Internship Coordinator", "type": "Academic" },
  { "id": "r2", "name": "Lab Administrator", "type": "Administrative" }
]
```

---

#### `POST /api/roles`

**Admin only.**

**Request:**
```json
{
  "name": "Placement Coordinator",
  "type": "Placement"
}
```

**Response (201):** Created role object.

---

### 5.4 Role Assignments

All endpoints **Protected**.

#### `GET /api/role-assignments`

**Query params (all optional):**
| Param | Type | Example |
|---|---|---|
| `userId` | string | `u2` |
| `roleId` | string | `r1` |
| `isActive` | boolean | `true` |

**Response (200):**
```json
[
  {
    "id": "ra1",
    "roleId": "r1",
    "roleName": "Internship Coordinator",
    "userId": "u2",
    "userName": "Devansh Sharma",
    "startDate": "2024-01-10T00:00:00.000Z",
    "endDate": null,
    "isActive": true
  }
]
```

---

#### `POST /api/role-assignments`

**Admin only.**

**Request:**
```json
{
  "roleId": "r1",
  "userId": "u3",
  "startDate": "2026-08-15T00:00:00.000Z"
}
```

**Response (201):** Created assignment.

> **Backend logic:** If there's an existing active assignment for the same `roleId`, automatically set its `endDate` and `isActive = false` before creating the new one.

---

#### `PUT /api/role-assignments/:id`

**Request:**
```json
{
  "endDate": "2026-08-14T00:00:00.000Z",
  "isActive": false
}
```

**Response (200):** Updated assignment.

---

### 5.5 Checklist Items

All endpoints **Protected**.

#### `GET /api/checklist-items`

**Query params:**
| Param | Type | Required |
|---|---|---|
| `roleAssignmentId` | string | Yes |

**Response (200):**
```json
[
  {
    "id": "c1",
    "roleAssignmentId": "ra1",
    "title": "Upload final semester grading sheets",
    "status": "Pending",
    "mandatory": true,
    "remark": ""
  }
]
```

> **Seeding:** When a role assignment is created for a user marked as "Leaving", auto-generate a default set of checklist items based on the role type.

---

#### `PUT /api/checklist-items/:id`

**Request:**
```json
{
  "status": "Done",
  "remark": "Uploaded to shared drive"
}
```

**Response (200):** Updated checklist item.

---

### 5.6 Documents

All endpoints **Protected**.

#### `GET /api/documents`

**Query params:**
| Param | Type | Required |
|---|---|---|
| `roleId` | string | Yes |

**Response (200):**
```json
[
  {
    "id": "d1",
    "roleId": "r1",
    "title": "TCS Placement MoU 2025",
    "category": "Placement",
    "fileUrl": "/uploads/tcs_mou_2025.pdf",
    "uploadedBy": "Devansh Sharma",
    "uploadedAt": "2025-11-15T00:00:00.000Z"
  }
]
```

---

#### `POST /api/documents`

**Content-Type: `multipart/form-data`**

**Fields:**
| Field | Type | Required |
|---|---|---|
| `roleId` | string | Yes |
| `title` | string | Yes |
| `category` | string | Yes (Academic, Placement, Administrative, Contacts, Other) |
| `file` | File | Yes (PDF, DOC, XLSX, max 10MB) |

**Response (201):** Created document object.

> **Storage:** Save files to a `uploads/` directory or a cloud storage service. Return the `fileUrl` as a relative or absolute path.

---

### 5.7 Tasks

All endpoints **Protected**.

#### `GET /api/tasks`

**Query params:**
| Param | Type | Required |
|---|---|---|
| `roleId` | string | Yes |

**Response (200):**
```json
[
  {
    "id": "t1",
    "roleId": "r1",
    "title": "Transfer recruiting company contacts",
    "ownerId": "u2",
    "ownerName": "Devansh Sharma",
    "deadline": "2026-08-15T00:00:00.000Z",
    "status": "In Progress",
    "notes": "Need to include Infosys and TCS contacts"
  }
]
```

---

#### `POST /api/tasks`

**Request:**
```json
{
  "roleId": "r1",
  "title": "Upload final MoU documents",
  "ownerId": "u2",
  "deadline": "2026-08-12T00:00:00.000Z",
  "notes": ""
}
```

**Response (201):** Created task.

---

#### `PUT /api/tasks/:id`

**Request:** Any subset:
```json
{
  "status": "Done",
  "notes": "All documents uploaded to shared drive"
}
```

**Response (200):** Updated task.

> **Status values:** `Not Started`, `In Progress`, `Pending`, `Done`

---

### 5.8 Dashboard (Admin)

All endpoints **Protected**, **Admin only**.

#### `GET /api/dashboard/summary`

**Response (200):**
```json
{
  "totalHandovers": 12,
  "completedHandovers": 8,
  "pendingHandovers": 4,
  "departments": [
    { "name": "Computer Science", "progress": 75 },
    { "name": "Mechanical", "progress": 100 },
    { "name": "Electronics", "progress": 40 }
  ]
}
```

> `progress` = average checklist completion % across all active handovers in that department.

---

#### `GET /api/dashboard/handovers`

**Response (200):**
```json
[
  {
    "id": "h1",
    "faculty": "Devansh Sharma",
    "department": "Computer Science",
    "role": "Internship Coordinator",
    "progress": 65,
    "status": "In Progress"
  }
]
```

---

### 5.9 AI Features

All endpoints **Protected**.

#### `POST /api/ai/generate-brief`

**Request:**
```json
{
  "roleId": "r1"
}
```

**Response (200):**
```json
{
  "id": "brief-1",
  "roleId": "r1",
  "generatedAt": "2026-08-06T12:00:00.000Z",
  "summary": "The Internship Coordinator role oversees industry partnerships...",
  "pendingItems": [
    "Reach out to TCS regarding the upcoming campus drive",
    "Finalize the student spreadsheet for 8th-semester internships"
  ],
  "keyContacts": [
    { "name": "Mr. Sharma", "org": "Infosys HR", "email": "sharma@infosys.example.com" }
  ],
  "nextActions": [
    "Schedule a handover meeting with successor",
    "Transfer shared drive access"
  ]
}
```

> **Implementation:** Use the Gemini API. Collect all checklist items, tasks, and documents for the role. Build a prompt with this context and ask Gemini to generate a structured handover brief. Parse the response into the JSON shape above.

> **Timeout:** This endpoint may take 10-15 seconds. The frontend shows a loading animation.

---

#### `GET /api/ai/search`

**Query params:**
| Param | Type | Required |
|---|---|---|
| `q` | string | Yes — the natural language query |

**Response (200):**
```json
[
  {
    "id": "doc1",
    "type": "document",
    "title": "TCS Placement MoU 2025",
    "snippet": "...agreed to intake 50 students from the CS department...",
    "score": 0.92
  },
  {
    "id": "contact1",
    "type": "contact",
    "title": "Mr. Sharma - Infosys HR",
    "snippet": "Primary point of contact for campus recruitment...",
    "score": 0.85
  }
]
```

> **Implementation (suggested):**
> 1. Use a text embedding model (e.g., Gemini's `text-embedding-004`) to generate embeddings for all documents, contacts, and task descriptions
> 2. Store embeddings in MongoDB (or a vector DB like Pinecone/Weaviate)
> 3. On search, embed the query and find nearest neighbors
> 4. Return top results with `type`, `title`, `snippet`, and cosine similarity `score`

---

## 6. Database Schema

### Suggested MongoDB Collections

```javascript
// users
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (bcrypt hashed),
  department: String,
  designation: String,
  contact: String,
  status: String (enum: "Active", "Leaving", "Exited"),
  userType: String (enum: "Admin", "Faculty"),
  createdAt: Date,
  updatedAt: Date
}

// roles
{
  _id: ObjectId,
  name: String,
  type: String,
  createdAt: Date
}

// roleAssignments
{
  _id: ObjectId,
  roleId: ObjectId (ref: roles),
  userId: ObjectId (ref: users),
  startDate: Date,
  endDate: Date | null,
  isActive: Boolean,
  createdAt: Date
}

// checklistItems
{
  _id: ObjectId,
  roleAssignmentId: ObjectId (ref: roleAssignments),
  title: String,
  status: String (enum: "Done", "Pending"),
  mandatory: Boolean,
  remark: String,
  createdAt: Date
}

// documents
{
  _id: ObjectId,
  roleId: ObjectId (ref: roles),
  title: String,
  category: String,
  fileUrl: String,
  uploadedBy: ObjectId (ref: users),
  uploadedAt: Date
}

// tasks
{
  _id: ObjectId,
  roleId: ObjectId (ref: roles),
  title: String,
  ownerId: ObjectId (ref: users),
  deadline: Date,
  status: String (enum: "Not Started", "In Progress", "Pending", "Done"),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}

// handoverBriefs
{
  _id: ObjectId,
  roleId: ObjectId (ref: roles),
  generatedAt: Date,
  summary: String,
  pendingItems: [String],
  keyContacts: [{ name: String, org: String, email: String }],
  nextActions: [String]
}
```

### Seed Data

Create at least 2 users for testing:

| Email | Password | User Type |
|---|---|---|
| `admin@rolesync.edu` | `password123` | Admin |
| `faculty@rolesync.edu` | `password123` | Faculty |

---

## 7. Error Response Format

All errors should follow this consistent format:

```json
{
  "message": "Human-readable error description",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

### HTTP Status Codes Used

| Code | Meaning | When |
|---|---|---|
| 200 | Success | GET, PUT successful |
| 201 | Created | POST successful |
| 400 | Bad Request | Validation errors, missing fields |
| 401 | Unauthorized | Missing/invalid/expired token |
| 403 | Forbidden | Authenticated but wrong role (e.g., Faculty trying Admin route) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected backend error |

---

## 8. File Uploads

The `POST /api/documents` endpoint receives `multipart/form-data`.

**Suggested implementation with Multer:**

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// Usage in route:
router.post('/documents', authMiddleware, upload.single('file'), createDocument);
```

Serve uploaded files statically:
```javascript
app.use('/uploads', express.static('uploads'));
```

---

## 9. AI Integration

### Gemini API for Brief Generation

**Install:** `npm install @google/generative-ai`

**Suggested implementation:**

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateHandoverBrief(roleId) {
  // 1. Gather context from DB
  const tasks = await Task.find({ roleId });
  const docs = await Document.find({ roleId });
  const checklists = await ChecklistItem.find({ /* by roleAssignment */ });

  // 2. Build prompt
  const prompt = `
    Generate a structured handover brief for the role with the following context:
    
    Tasks: ${JSON.stringify(tasks)}
    Documents: ${JSON.stringify(docs.map(d => d.title))}
    Checklist Status: ${JSON.stringify(checklists)}
    
    Return a JSON object with:
    - summary: 2-3 sentence overview
    - pendingItems: array of pending action strings
    - keyContacts: array of {name, org, email}
    - nextActions: array of recommended next step strings
  `;

  // 3. Call Gemini
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // 4. Parse and save
  const brief = JSON.parse(text);
  return brief;
}
```

### Semantic Search (RAG)

For semantic search, you can use:
- **Simple approach:** Full-text search on MongoDB with `$text` index
- **Advanced approach:** Vector embeddings with Gemini's `text-embedding-004` model

---

## 10. CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## 11. Testing Checklist

Use this to verify the integration works:

- [ ] **Login:** `POST /api/auth/login` with `admin@rolesync.edu` / `password123` → returns token + user
- [ ] **Auth guard:** Requests without token return 401
- [ ] **Get Me:** `GET /api/auth/me` with valid token → returns user
- [ ] **List Users:** `GET /api/users` → returns array
- [ ] **Filter Users:** `GET /api/users?status=Leaving` → returns filtered array
- [ ] **List Roles:** `GET /api/roles` → returns array
- [ ] **Role Assignments:** `GET /api/role-assignments?isActive=true` → returns active assignments
- [ ] **Checklist Items:** `GET /api/checklist-items?roleAssignmentId=ra1` → returns items
- [ ] **Update Checklist:** `PUT /api/checklist-items/c1` with `{ "status": "Done" }` → updates
- [ ] **Upload Document:** `POST /api/documents` with multipart form → creates record + stores file
- [ ] **List Documents:** `GET /api/documents?roleId=r1` → returns documents
- [ ] **Create Task:** `POST /api/tasks` → creates task
- [ ] **Update Task Status:** `PUT /api/tasks/t1` with `{ "status": "Done" }` → updates
- [ ] **Dashboard Summary:** `GET /api/dashboard/summary` → returns stats
- [ ] **Generate Brief:** `POST /api/ai/generate-brief` with `{ "roleId": "r1" }` → returns brief
- [ ] **Search:** `GET /api/ai/search?q=placement` → returns results
- [ ] **CORS:** Frontend on :5173 can call backend on :5000 without errors
- [ ] **File Serving:** Uploaded files accessible via URL

---

## Suggested Backend Folder Structure

```
server/
├── server.js            # Entry point
├── config/
│   └── db.js            # MongoDB connection
├── middleware/
│   ├── auth.js          # JWT verification
│   └── adminOnly.js     # Admin role check
├── models/
│   ├── User.js
│   ├── Role.js
│   ├── RoleAssignment.js
│   ├── ChecklistItem.js
│   ├── Document.js
│   ├── Task.js
│   └── HandoverBrief.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── roles.js
│   ├── roleAssignments.js
│   ├── checklistItems.js
│   ├── documents.js
│   ├── tasks.js
│   ├── dashboard.js
│   └── ai.js
├── services/
│   └── gemini.js        # Gemini API wrapper
├── uploads/             # Uploaded files
├── seed.js              # Database seeding script
├── .env
└── package.json
```

---

*Last updated: August 2026*
