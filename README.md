# Secure Cloud-Based File Storage and Document Management System (CloudVault)

**Course:** AI24300 / CS24300 — Project-I (Semester V)  
**Institution:** Birla Institute of Technology, Mesra (Off-Campus Jaipur)  
**Supervisor:** Dr. Kuntal Mukherjee  

**Team Members:**
- Naman Kumar (`BTECH/25170/24`)
- Ravinder Dhayal (`BTECH/25188/24`)
- Utkarsh Tikkiwal (`BTECH/25190/24`)

---

## Live Deployment

- **Frontend (Vercel):** https://cloud-based-file-storage-system-delta.vercel.app
- **Backend API (Render):** https://cloud-based-file-storage-system-3zof.onrender.com/api
- **Swagger / OpenAPI Docs:** https://cloud-based-file-storage-system-3zof.onrender.com/swagger-ui.html

---

## Project Overview

CloudVault is a full-stack web application for storing, organizing, previewing, and sharing files securely. It follows a decoupled three-tier architecture with stateless JWT authentication, email OTP verification, role-based access control, and relational + binary persistence.

### Core Features
- **Authentication & Email Verification:** Registration with 6-digit OTP / verification link email confirmation, BCrypt password hashing, and HMAC-SHA256 JWT sessions.
- **File Upload, Download & Preview:** Multipart uploads (up to 50 MB per file), drag-and-drop upload canvas, secure file downloads, and inline preview for PDFs, images, and text/code files.
- **Hierarchical Folders:** Nested folder tree with breadcrumbs, rename, move across folders, search, and file-type filters.
- **Shareable Links:** Tokenized sharing with `VIEWER` / `EDITOR` permissions and optional expiry (`24h`, `7d`, `30d`, or permanent).
- **Trash & Storage Quota:** Two-step soft delete with restore or permanent purge, per-user storage quota tracking (500 MB default), and an audit activity log.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Java 17, Spring Boot 3.3.4, Spring Security 6, Spring Data JPA / Hibernate |
| **Auth & Security** | JJWT 0.12.6, BCrypt, SHA-256 OTP hashing |
| **Database & Storage** | PostgreSQL (Supabase in production), H2 file DB (local `dev` profile) |
| **API Documentation** | SpringDoc OpenAPI 2.6.0 (Swagger UI) |
| **Frontend** | React 19, Vite 8, Tailwind CSS v3, Axios, Lucide Icons |
| **Hosting** | Vercel (Frontend), Render Docker (Backend), Supabase (PostgreSQL) |

---

## Running Locally

### Quick Start (Windows)
Run `start-all.bat` from the project root to launch both backend and frontend servers.

### Backend (`backend/`)
```bash
cd backend
mvn spring-boot:run
```
- Uses the `dev` Spring profile (`jdbc:h2:file:./data/fileserver`) with local filesystem storage (`./storage_uploads`).
- API base URL: `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- H2 Console: `http://localhost:8080/h2-console`

### Frontend (`frontend/`)
```bash
cd frontend
npm install
npm run dev
```
- Copy `.env.example` to `.env` if pointing to a custom backend URL (`VITE_API_BASE_URL`).
- Local app URL: `http://localhost:5173`

---

## Database Entities

- `users` — User profiles, BCrypt password hashes, email verification metadata, quota counters
- `folders` — Self-referencing folder hierarchy (`parent_id`, soft-delete flags)
- `files` — File metadata, MIME types, sizes, ownership, and folder references
- `file_contents` — Binary payloads (`BYTEA`) for persistent cloud storage
- `share_links` — Access tokens, permissions (`VIEWER` / `EDITOR`), and expiration timestamps
- `activity_logs` — Audit trail for uploads, downloads, shares, renames, and deletions
