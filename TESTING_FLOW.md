# RoleSync AI — Testing Flow & QA Guide

This document outlines the workflows and features to be tested by QA to ensure the RoleSync AI platform is functioning correctly. It covers everything from authentication to background AI processes.

## 1. Setup & Pre-requisites

Before starting tests, ensure:
1. Both the `client` and `server` are running (`npm run dev`).
2. Supabase is configured correctly in `.env` files.
3. The database is seeded with some dummy faculty users (at least 2: one Admin/HOD, one Faculty).
4. The `task-documents` and `vault-documents` (if distinct) buckets exist in Supabase storage.
5. You have a valid Gmail App Password and Gemini API key for the backend `.env`.

---

## 2. Authentication & Onboarding

### 2.1 Registration
- **Action:** Go to `/register`. Fill out the form with a new Faculty profile.
- **Expected:** Success message shown. User is redirected to `/login`. Data should appear in the `staff` table in Supabase.

### 2.2 Login & Authorization
- **Action:** Go to `/login`. Enter correct credentials.
- **Expected:** Redirected to the Dashboard. User's avatar and name should appear in the Sidebar and Navbar.
- **Action:** Try to visit an admin-only route (e.g., `/faculty` or `/roles`) as a regular Faculty member.
- **Expected:** Redirected to `/unauthorized` or handled gracefully.

---

## 3. Core Faculty Work Manager Flow

### 3.1 Task Management (Self)
- **Action:** Go to "My Tasks" (`/tasks`). Click "Add Task". Create a task assigned to yourself, with a deadline and priority. Upload a test PDF document.
- **Expected:** Task appears in the dashboard grid. The document upload indicator should be visible. In Supabase, the file should be in the storage bucket.
- **Action:** Update the task status (e.g., "In Progress" -> "Done").
- **Expected:** Visual badge updates immediately. Progress circle on the Dashboard updates.

### 3.2 HOD / Admin Task Assignment
- **Action:** Login as an Admin. Go to "My Tasks" and click "Add Task".
- **Expected:** The form should show a "Coordinators / Assign To" dropdown allowing the Admin to select *other* faculty members.
- **Action:** Assign a task to another Faculty user.
- **Expected:** Login as that Faculty user. The new task should appear on their Dashboard with an "Assigned by HOD" badge (or similar indication).

---

## 4. Document Vault & Links

### 4.1 Uploading Shared Documents
- **Action:** Go to "Vault" (`/vault`). In the "Documents" tab, click "Upload Document".
- **Action:** Upload a document (e.g., a syllabus PDF) and select "Share with: Specific Staff". Select a couple of faculty members.
- **Expected:** The document appears in the list. The selected faculty members should automatically receive a task (e.g., "Review Document: [Title]") in their task list.

### 4.2 Adding Shared Links
- **Action:** Go to the "Vault", switch to the "Links" tab. Click "Add Link".
- **Action:** Add a URL (e.g., `google.com/drive/folder`), title, and description. Share with "All Staff".
- **Expected:** The link appears in the grid. The URL should be clickable and open in a new tab. Non-creators should not see the "Delete" trash can icon. Creators should be able to delete it.

---

## 5. AI Features & Automation

### 5.1 AI Chatbot
- **Action:** Click the floating chat bubble on the bottom right.
- **Action:** Ask "What are my upcoming tasks?"
- **Expected:** The bot should respond with a summary of the logged-in user's tasks. (Requires Gemini AI integration to be correctly configured).

### 5.2 Gmail Task Extraction (Background Sync)
- **Action:** Ensure your user profile has Gmail credentials saved (via settings or DB).
- **Action:** Trigger the email sync (via the backend API `/api/gmail/sync` or through the UI if implemented).
- **Expected:** The backend connects to IMAP, fetches recent emails.
- **Action:** Send a test email to that Gmail address containing official duties (e.g., "Subject: NBA Committee Meeting. Please review the criteria by Friday").
- **Expected:** The AI should parse this email, determine the *single main actionable task*, and automatically add it to the user's task list.
- **Action:** Send a junk email (e.g., "Subject: Amazon delivery").
- **Expected:** The AI should ignore it and NOT create a task.

---

## 6. Handover System

### 6.1 Requesting a Handover
- **Action:** Go to "Handover". Click "Request Access" to another faculty's workspace.
- **Expected:** An access request is created. (If auto-approved in MVP, you should immediately see their tasks and documents).

### 6.2 AI Handover Brief
- **Action:** Once you have access to a predecessor's workspace, click "Generate AI Brief".
- **Expected:** The system gathers their tasks and documents, sends them to the LLM, and returns a structured summary (Key Contacts, Pending Tasks, Resources) for the new faculty member.

---

## Conclusion
If all the above workflows pass without console errors or server crashes, the system is verified for MVP release.
