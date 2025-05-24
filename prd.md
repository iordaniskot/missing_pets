# Missing Pets App Backend – Product Requirements Document (PRD)

## 1. Document Control

* **Version:** 1.0.0
* **Date:** 2025-05-24 (Europe/Bucharest timezone)
* **Author:** \[Team]
* **Status:** Draft

---

## 2. Overview

**Purpose:** Define functional and non-functional requirements for the Missing Pets App backend. This backend will enable users to register, manage pets, and report missing or found pets, with real-time updates.

**Audience:** Developers, QA engineers, DevOps, stakeholders.



---

## 3. Goals & Objectives

* **Enable user management:** signup, login, profile edit, account deletion.
* **Model pets & reports:** CRUD operations for pets and missing/found reports.
* **Search & discovery:** filter, paginate, geospatial queries (radius search).
* **Real-time notifications:** integrate Socket.io for live updates.
* **Media handling:** upload and serve photos via CDN attachments.
* **Security & performance:** JWT authentication, input validation, error handling, indexing.

---

## 4. Scope

* **In-Scope:** RESTful API built with Express.js and Mongoose; real-time events with Socket.io; file uploads via multer middleware; JWT-based auth; geospatial queries; pagination & filtering.
* **Out-of-Scope:** Mobile/web client implementation; push notifications; advanced analytics/dashboard.

---

## 5. Data Models

All schemas include `createdAt` and `updatedAt` timestamps (Mongoose `timestamps: true`).

### 5.1 User

| Field       | Type     | Required  | Description              |
| ----------- | -------- | --------- | ------------------------ |
| `_id`       | ObjectId | ✓         | Unique identifier        |
| `name`      | String   | ✓         | Full name                |
| `email`     | String   | ✓, unique | User email for login     |
| `password`  | String   | ✓         | Hashed password (bcrypt) |
| `phone`     | String   |           | Optional contact number  |
| `createdAt` | Date     | ✓         | Auto-generated           |
| `updatedAt` | Date     | ✓         | Auto-generated           |

### 5.2 Pet

| Field       | Type            | Required | Description                       |
| ----------- | --------------- | -------- | --------------------------------- |
| `_id`       | ObjectId        | ✓        | Unique identifier                 |
| `owner`     | ObjectId (User) | ✕        | Reference to pet owner (optional) |
| `name`      | String          | ✕        | Pet name                          |
| `breed`     | String          | ✕        | Breed or species                  |
| `photos`    | \[String]       | ✕        | URLs to uploaded images           |
| `createdAt` | Date            | ✓        | Auto-generated                    |
| `updatedAt` | Date            | ✓        | Auto-generated                    |

**Validation:** On creation and updates, at least one of `owner`, `name`, `breed`, or `photos` must be provided.

### 5.3 Report

| Field         | Type                      | Required | Description                            |
| ------------- | ------------------------- | -------- | -------------------------------------- |
| `_id`         | ObjectId                  | ✓        | Unique identifier                      |
| `pet`         | ObjectId (Pet)            | ✓        | Reference to the reported pet          |
| `reporter`    | ObjectId (User)           | ✓        | Reference to user filing the report    |
| `status`      | String (enum)             | ✓        | `'lost'` or `'found'`                  |
| `description` | String                    |          | Free-text details                      |
| `photos`      | \[String]                 |          | URLs to uploaded images                |
| `location`    | { type: 'Point',        } | ✓        | GeoJSON point where pet was lost/found |
|               | coordinates: \[Number]    |          | `[longitude, latitude]`                |
| `createdAt`   | Date                      | ✓        | Auto-generated                         |
| `updatedAt`   | Date                      | ✓        | Auto-generated                         |

**Indexes:**

* `location` field: 2dsphere for geospatial radius queries.

---

## 6. Functional Requirements

### 6.1 Authentication & Authorization

* **Signup:** `POST /auth/signup` — create new user, hash password, return JWT.
* **Login:** `POST /auth/login` — validate credentials, return JWT.
* **Protected routes:** `is-auth` middleware to guard user/pet/report endpoints.
* **Profile:** `GET/PATCH /users/me` — view and update own profile.
* **Account deletion:** `DELETE /users/me` — remove user and associated pets & reports.

### 6.2 User CRUD

* **Admin endpoints (optional):** `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id` with pagination & filtering by email.

### 6.3 Pet CRUD

* `POST /pets` — create a new pet record.
* `GET /pets` — list pets with pagination (`page`, `limit`), filters (`breed`, `name`).
* `GET /pets/:id` — retrieve by ID.
* `PATCH /pets/:id` — update name, breed, photos.
* `DELETE /pets/:id` — remove pet.

### 6.4 Report CRUD

* `POST /reports` — file lost/found report (with geolocation and photos).
* `GET /reports` — list reports with pagination & filters: `status`, `petId`, geo-parameters `(lat, lng, radiusMeters)`.
* `GET /reports/:id` — retrieve single report.
* `PATCH /reports/:id` — update status, description, photos.
* `DELETE /reports/:id` — remove report.

### 6.5 Pagination & Filtering

* Query parameters: `page` (default 1), `limit` (default 20).
* Filtering: `status`, `breed`, `name`, `reporterId`, `dateFrom`, `dateTo`.
* Geospatial filter: `lat`, `lng`, `radius` (in meters).

### 6.6 File Uploads

* Use `attachment-upload.js` middleware to handle multi-file uploads via `multipart/form-data`.
* Store attachments in CDN directory; generate unique filenames.
* Expose static `/attachments` route.
* Validate MIME types (images only for pet/report photos).

### 6.7 Real-Time Functionality (Socket.io)

* **Namespace:** `/reports`
* **Events:**

  * `connect`/`disconnect`
  * `newReport` — broadcast when a report is created.
  * `updateReport` — broadcast updates to existing reports.
  * `subscribeRegion` — clients send `{ lat, lng, radius }`; server emits matching events only.

### 6.8 Error Handling & Validation

* Centralized error handler (`app.use(errorHandler)`).
* Input validation with `express-validator` (or custom) on all payloads.
* Return structured JSON: `{ status, message, data? }`.

---

## 7. Non-Functional Requirements

| Requirement         | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| **Performance**     | API latency <200ms under normal load.                                        |
| **Scalability**     | Stateless servers; session-less JWT; CDN for media.                          |
| **Security**        | HTTPS; JWT secret in env; rate limiting; sanitize inputs.                    |
| **Reliability**     | 99.9% uptime; auto-reconnect to MongoDB; handle uncaught exceptions.         |
| **Maintainability** | Modular code; middleware for cross-cutting concerns; clear folder structure. |
| **Observability**   | Logging (winston/console); metrics for API calls; error tracking.            |

---

## 8. Technical Stack & Dependencies

* **Runtime:** Node.js 18+
* **Framework:** Express.js 5.x
* **Database:** MongoDB Atlas via Mongoose 8.x
* **Real-Time:** Socket.io 4.x
* **Auth:** JWT (jsonwebtoken)
* **Uploads:** Multer
* **Other:** body-parser

---

## 9. Milestones & Timeline

| Phase                 | Start Date | End Date   | Deliverables                   |
| --------------------- | ---------- | ---------- | ------------------------------ |
| **Design & Setup**    | 2025-05-24 | 2025-05-28 | Project scaffolding, schemas   |
| **Auth & User APIs**  | 2025-05-29 | 2025-06-02 | Auth flow, user CRUD           |
| **Pet & Report APIs** | 2025-06-03 | 2025-06-10 | Pet & report CRUD + filters    |
| **Geo & Uploads**     | 2025-06-11 | 2025-06-15 | Geospatial queries, uploads    |
| **Real-Time & QA**    | 2025-06-16 | 2025-06-20 | Socket.io integration, testing |
| **Deployment**        | 2025-06-21 | 2025-06-24 | Production rollout             |

---

## 10. Acceptance Criteria

1. All endpoints pass automated tests (coverage >90%).
2. Geospatial search returns correct results within radius.
3. Socket.io clients receive real-time events as specified.
4. File uploads validate types and serve via `/attachments`.
5. JWT-authenticated routes reject unauthorized requests.

---

*End of PRD*
