# Secure Cloud-Based File Storage and Document Management System
**AI24300/CS24300 PROJECT-I (Semester V)**  
*Birla Institute of Technology, Mesra — Jaipur Campus*  
**Under Supervision of**: Dr. Kuntal Mukherjee  
**Team Members**:
- Ravinder Dhayal — BTECH/25188/24
- Utkarsh Tikkiwal — BTECH/25190/24
- Naman Kumar — BTECH/25170/24

---

## 🌐 Live Interactive Web Demo
**Live Website**: [https://namansingh68.github.io/cloud-based-file-storage-system/](https://namansingh68.github.io/cloud-based-file-storage-system/)  
*(Hosted directly on GitHub Pages via GitHub Actions with full in-browser interactive demo mode)*

---

## 📌 Project Overview
A full-stack, self-hosted, privacy-focused alternative to proprietary cloud storage services (Google Drive, Dropbox) engineered per the approved **SRS & SDS Specification Report**.

### ✨ Key Features Implemented (SRS Functional Requirements)
- **FR-01 to FR-03: Secure Authentication & Sessions**: JWT-based authentication, BCrypt password hashing, stateless session tokens.
- **FR-04 & FR-05: Authenticated File Upload & Download**: Size & MIME-type checking, user directory isolation, max 50MB upload limits.
- **FR-06 & FR-07: Hierarchical Folder Organization**: Nested folders, tree traversal, rename, and moving across hierarchies.
- **FR-08: Drag-and-Drop UX**: Canvas-wide drag & drop for file uploads and folder drops.
- **FR-09 to FR-11: Role-Based Sharing & Tokens**: Cryptographic shareable link tokens, configurable permissions (`VIEWER`, `EDITOR`), and custom expiration intervals.
- **FR-12: Search & Filter**: Real-time search across filenames with file-type filtering (Documents, Images, Archives, Code).
- **FR-13: Activity Audit Logging**: Real-time event logging capturing uploads, downloads, renames, shares, and deletes.
- **FR-14 & FR-18: Dashboard & Storage Quotas**: Storage usage metrics, quota progress bar, and threshold alerts.
- **FR-15: Responsive Interface**: Tailored modern web UI with Tailwind CSS, Dark/Light modes, and grid/list view toggles.
- **FR-16: In-Browser Document Preview**: In-browser preview for PDF documents, images, plain text/code files, audio, and video without forcing download.
- **FR-17: Trash & Recovery**: Soft-delete recycle bin with restore and permanent purge capabilities.
- **FR-19: Swagger / OpenAPI Documentation**: Interactive API testing UI at `/swagger-ui.html`.

---

## 🛠️ Architecture & Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Backend** | Spring Boot 3.3.4, Java 17 | REST API controllers, business services, validation |
| **Security** | Spring Security 6, JJWT 0.12.6 | JWT authentication filter, BCrypt password encoder |
| **Database** | PostgreSQL & H2 (Dual Profile) | Relational metadata storage with H2 dev zero-setup fallback |
| **ORM** | Spring Data JPA / Hibernate | Entity relations, queries, pagination |
| **API Docs** | SpringDoc OpenAPI 2.6.0 | Swagger UI interactive documentation |
| **Frontend** | React 18, Vite | Component-driven UI, state management, client routing |
| **Styling** | Tailwind CSS v3 | Modern design system, Dark mode, glassmorphism |
| **Icons** | Lucide React | Modern vector icon set |
| **HTTP Client**| Axios | JWT Bearer token interceptor, upload progress tracking |

## ☁️ Cloud Deployment (Vercel + Render + Supabase)
Deploy this project for free in 10 minutes so teachers, seniors, and friends can access it publicly on mobile or laptop:
👉 **Complete Step-by-Step Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Frontend**: [Vercel](https://vercel.com) (React 18 + Vite)
- **Backend**: [Render](https://render.com) (Spring Boot 3.3.4 Docker container)
- **Database & Storage**: [Supabase](https://supabase.com) (PostgreSQL with persistent binary storage)

---

## 🚀 Quick Start Guide

### 1. One-Click Launch (Recommended)
Double-click `start-all.bat` in the project root to start both backend and frontend servers simultaneously.

### 2. Manual Launch

#### Backend (Spring Boot)
```bash
cd backend
run-backend.bat
# Or manually with Maven:
mvn spring-boot:run
```
- API Base URL: `http://localhost:8080/api`
- Swagger UI Documentation: `http://localhost:8080/swagger-ui.html`
- H2 Web Console: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:file:./data/fileserver`, User: `sa`, Password: empty)

#### Frontend (React + Vite)
```bash
cd frontend
run-frontend.bat
# Or manually with npm:
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 📁 Database Schema (SDS Section 4.3)
- `users`: User credentials, BCrypt hashes, storage quota & current usage
- `folders`: Hierarchical folder tree with self-referencing parent IDs
- `files`: File metadata, original names, isolated storage paths, MIME types, sizes
- `share_links`: Cryptographic access tokens, permissions, expiration timestamps
- `activities`: Audit log entries for all user operations

---

## 📜 Academic Attribution
Department of Computer Science & Engineering  
Birla Institute of Technology, Mesra (Jaipur Campus) — MO-2026
