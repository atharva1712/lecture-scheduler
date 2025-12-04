# Online Lecture Scheduling Module

### Overview

This project is a full‑stack **Online Lecture Scheduling Module** with:

- **Admin panel** to manage:
  - Instructors
  - Courses (with level, description, image)
  - Lectures / batches for each course
  - Assignments of lectures to instructors on specific dates
- **Instructor panel** where each logged‑in instructor sees **only their own assigned lectures** with course names, dates, times, and batch info.

The backend enforces the key business rule:

> **An instructor cannot be assigned to more than one lecture on the same date.**

This is guaranteed with both database constraints and application‑level conflict checks.

---

## Tech Stack

- **Backend**: Node.js, Express, Mongoose (MongoDB)
- **Frontend**: React (Vite + TypeScript)
- **Auth**: JWT (JSON Web Token)
- **File Uploads**: Multer (course images)
- **Styling**: Lightweight custom CSS (`client/src/index.css`)

---

## Project Structure

```text
project/
├── package.json               # Root scripts (run server + client)
├── IMPLEMENTATION_GUIDE.md    # Internal implementation notes (optional)
├── PROJECT_PHASES.md          # Phase breakdown, status, and tasks
├── server/                    # Backend (Node/Express/Mongo)
│   ├── index.js               # Express app & Mongo connection
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js            # JWT auth, admin/instructor guards
│   ├── models/
│   │   ├── User.js            # Admin + Instructor users
│   │   ├── Course.js          # Courses
│   │   └── Lecture.js         # Lectures with conflict index
│   └── routes/
│       ├── auth.js            # Register / login / current user
│       ├── admin.js           # Admin-only instructor listing
│       ├── courses.js         # Course CRUD + image upload
│       ├── lectures.js        # Lecture CRUD + assignment + conflicts
│       └── instructors.js     # Instructor schedule + self lectures
└── client/                    # Frontend (React + Vite + TS)
    ├── index.html
    ├── package.json
    ├── public/
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx            # Routing
    │   ├── index.css          # Global styles
    │   ├── types.ts           # Shared TS types
    │   ├── services/api.ts    # Axios client with JWT header
    │   ├── context/AuthContext.tsx
    │   ├── components/
    │   │   └── ProtectedRoute.tsx
    │   └── pages/
    │       ├── LoginPage.tsx
    │       ├── NotFoundPage.tsx
    │       ├── instructor/
    │       │   └── InstructorDashboard.tsx
    │       └── admin/
    │           ├── AdminLayout.tsx
    │           ├── CoursesPage.tsx
    │           ├── LecturesPage.tsx
    │           ├── AssignmentsPage.tsx
    │           └── InstructorsPage.tsx
    ├── tsconfig.json
    └── vite.config.ts
```

---

## Features Checklist

### Admin Panel

- **Instructors**
  - View all instructors.
  - Create new instructor accounts by providing name, email, and password.
- **Courses**
  - Create, list, update, delete courses.
  - Fields: **Name**, **Level**, **Description**, **Image** (uploaded via Multer).
- **Lectures / Batches**
  - For each course, create multiple lectures (batches).
  - Fields: **Course**, **Instructor**, **Date**, **Start time**, **End time**, **Batch name**, **Status**.
  - Edit and delete lectures.
- **Assignments**
  - Assign an existing lecture to an instructor on a specific date.
  - **Conflict prevention**: If an instructor already has a lecture on that date, assignment is blocked with a clear error message.
  - Listing of all assigned lectures (course, instructor, date, time, status).

### Instructor Panel

- Instructor logs in using their email and password.
- Sees **“My Lectures”**:
  - Course name + level + description
  - Date and time
  - Batch name
  - Lecture status (scheduled/completed/cancelled)
- Filtering: All / Upcoming / Past.

---

## Business Rules & Conflict Prevention

1. **One instructor, one lecture per day**  
   - At the database level, `Lecture` has a unique index on `{ instructor, date }`.
   - At the application level, before creating or updating/assigning a lecture, the backend:
     - Normalizes the date to the start of the day.
     - Checks if a `scheduled` lecture already exists for that instructor in that date range.
     - If found, returns **409 Conflict** with a descriptive message.

2. **Assignments respect conflicts**  
   - The endpoint `POST /api/lectures/:id/assign` will refuse a new assignment that violates the rule above.

3. **Instructor view is scoped to logged‑in user**  
   - `GET /api/instructors/me/lectures` uses the JWT to fetch lectures only for the current instructor.

---

## Setup & Running Locally

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB URI (e.g. Atlas)

### 1. Clone & install

```bash
git clone <repo-url>
cd projectintenrship

# Install root dev helper (concurrently)
npm install

# Install backend and frontend dependencies
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

In `server/`, create a `.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lecture-scheduling
JWT_SECRET=your-secret-key
```

### 3. Run backend

```bash
cd server
npm run dev
```

Backend will be available at `http://localhost:5000`.

### 4. Run frontend

```bash
cd client
npm run dev
```

Vite will show the local URL (typically `http://localhost:5173`).

---

## Authentication & Roles

- Users have roles: **`admin`** or **`instructor`**.
- JWT is returned on login/registration and stored in `localStorage` by the frontend.
- All protected API routes expect `Authorization: Bearer <token>`.

### Creating an admin user

Use Postman / curl or the browser dev tools to call:

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "Admin@123",
  "role": "admin"
}
```

Then log in from the React app with that email/password.

### Creating instructors (Admin UI)

- Navigate to **Admin → Instructors**.
- Fill in **Name**, **Email**, and **Password** and click **Create instructor**.
- Share those credentials with the instructor; they can log in from the same login page and will be redirected to `/instructor`.

---

## Backend API Routes

Base URL: `http://localhost:5000`

### Auth (`/api/auth`)

- `POST /api/auth/register`
  - Body: `{ name, email, password, role? }`
  - Creates a user (role default: `instructor`).
  - Returns: `{ token, user }`

- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns: `{ token, user }`

- `GET /api/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ user }`

### Admin (`/api/admin`)

- `GET /api/admin/instructors`
  - Headers: `Authorization: Bearer <admin-token>`
  - Returns list of all instructors (without passwords).

### Courses (`/api/courses`)

- `GET /api/courses`
  - Get all courses.

- `GET /api/courses/:id`
  - Get single course.

- `POST /api/courses` **(Admin only)**
  - Headers: `Authorization: Bearer <admin-token>`
  - Multipart form data:
    - `name`, `level`, `description`, optional `image` file.

- `PUT /api/courses/:id` **(Admin only)**
  - Same fields as above (multipart).

- `DELETE /api/courses/:id` **(Admin only)**

### Lectures (`/api/lectures`)

- `GET /api/lectures` **(Admin only)**
  - All lectures with populated course and instructor.

- `GET /api/lectures/course/:courseId` **(Admin only)**
  - Lectures for a specific course.

- `GET /api/lectures/assigned` **(Admin only)**
  - All lectures that currently have an instructor assigned.

- `GET /api/lectures/:id`
  - Get a single lecture by ID.

- `POST /api/lectures` **(Admin only)**
  - Body: `{ course, instructor, date, startTime, endTime, batchName? }`
  - Performs conflict check for instructor + date.

- `PUT /api/lectures/:id` **(Admin only)**
  - Body: optional updates to:
    - `course`, `instructor`, `date`, `startTime`, `endTime`, `batchName`, `status`
  - Re-runs conflict checks when instructor/date change.

- `DELETE /api/lectures/:id` **(Admin only)**

- `POST /api/lectures/:id/assign` **(Admin only)**
  - Body: `{ instructorId, date }`
  - Assign/update instructor and date for an existing lecture.
  - Enforces “no two lectures for same instructor on same date” rule.

### Instructors (`/api/instructors`)

- `GET /api/instructors` **(Admin only)**
  - Same as `/api/admin/instructors` (convenience).

- `GET /api/instructors/me/lectures` **(Instructor only)**
  - Uses JWT to determine instructor.
  - Returns array of lectures populated with course details.

- `GET /api/instructors/:id/schedule` **(Admin only)**
  - Returns instructor info + list of their lectures (for admin view).

---

## Frontend Routes (React)

Base (Vite dev): `http://localhost:5173` (or as printed by Vite)

- `/login`
  - Login for both admin and instructors.

- `/admin` (protected, **admin only**)
  - Layout: `AdminLayout`
  - Nested routes:
    - `/admin/courses` – Manage courses.
    - `/admin/lectures` – Create/update/delete lectures (batches).
    - `/admin/assignments` – Assign lectures to instructors; see assigned list.
    - `/admin/instructors` – Create instructors and view list.

- `/instructor` (protected, **instructor only**)
  - `InstructorDashboard` – “My Lectures” with filters.

- `/` → redirects to `/login`
- `*` → `NotFoundPage`

---

## Testing the Key Scenario

1. Start backend and frontend.
2. Create an **admin** via `POST /api/auth/register` with `role: "admin"`, then log in.
3. In admin panel:
   - Add 1–2 instructors.
   - Add a course.
   - Create a lecture for that course on a given date with an instructor.
   - Try to create/assign another lecture for the same instructor on the same date:
     - You should see an error message and the assignment should fail.
4. Log out and log in as that instructor:
   - Go to `/instructor` (auto-redirect).
   - Confirm you see your assigned lectures with correct course names and dates.

---

## Notes

- Before submission, remove `server/node_modules`, `client/node_modules`, and `client/dist` – they will be re‑generated on install/build.
- Real secrets (JWT secret, DB URIs) should not be committed; keep them in `.env` and optionally add a sanitized `.env.example`.


