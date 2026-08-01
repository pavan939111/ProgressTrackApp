# API Design Specification

**Project:** Progress Tracker PWA
**Version:** 1.0

> **Architecture Style:** Backend-less Client Architecture (Next.js + Firebase)

Since the application uses Next.js + Firebase Authentication + Firestore, most CRUD operations go directly to Firestore through a service layer. Next.js Route Handlers (or future Cloud Functions) are reserved for business operations that require server-side logic, validation, aggregation, or third-party integrations.

## 1. API Architecture

```
                User
                  │
                  ▼
          Next.js Frontend
                  │
        Service Layer (SDK)
                  │
      ┌───────────┴───────────┐
      ▼                       ▼
 Firebase Authentication   Firestore
      │
      ▼
Cloud Functions (Future)
```

## 2. API Modules

| Module | Purpose |
|---|---|
| Authentication | User authentication |
| User | Profile & settings |
| Weekly Goals | Weekly planning |
| Daily Planner | Daily planning |
| Sessions | Session management |
| Tasks | Task CRUD |
| Progress | Session updates |
| Dashboard | Dashboard aggregation |
| Reports | Daily & weekly reports |
| Calendar | Historical data |
| Gamification | XP & achievements |
| Notifications | Reminder scheduling |

## 3. Authentication APIs

**Login**
```http
POST /api/auth/login
```
Request
```json
{
  "email": "",
  "password": ""
}
```
Response
```json
{
  "success": true,
  "user": {},
  "token": ""
}
```

**Register**
```http
POST /api/auth/register
```

**Logout**
```http
POST /api/auth/logout
```

**Forgot Password**
```http
POST /api/auth/reset-password
```

## 4. User APIs

**Get Profile**
```http
GET /api/user/profile
```

**Update Profile**
```http
PUT /api/user/profile
```

**Update Settings**
```http
PUT /api/user/settings
```

## 5. Weekly Goal APIs

**Create Goal**
```http
POST /api/weekly-goals
```
Request
```json
{
  "title": "",
  "description": "",
  "priority": "High"
}
```

**Get Weekly Goals**
```http
GET /api/weekly-goals
```

**Get Weekly Goal**
```http
GET /api/weekly-goals/{goalId}
```

**Update Weekly Goal**
```http
PUT /api/weekly-goals/{goalId}
```

**Delete Weekly Goal**
```http
DELETE /api/weekly-goals/{goalId}
```

## 6. Daily Planner APIs

**Create Tomorrow Plan**
```http
POST /api/daily-plans
```

**Get Today Plan**
```http
GET /api/daily-plans/today
```

**Get Plan by Date**
```http
GET /api/daily-plans/{date}
```

**Update Plan**
```http
PUT /api/daily-plans/{planId}
```

**Delete Plan**
```http
DELETE /api/daily-plans/{planId}
```

## 7. Session APIs

**Get Sessions**
```http
GET /api/daily-plans/{planId}/sessions
```

**Update Session**
```http
PUT /api/sessions/{sessionId}
```

**Complete Session**
```http
POST /api/sessions/{sessionId}/complete
```

## 8. Task APIs

**Create Task**
```http
POST /api/tasks
```

**Get Tasks**
```http
GET /api/tasks
```
Filters: date, session, priority, status

**Get Task**
```http
GET /api/tasks/{taskId}
```

**Update Task**
```http
PUT /api/tasks/{taskId}
```

**Complete Task**
```http
POST /api/tasks/{taskId}/complete
```

**Skip Task**
```http
POST /api/tasks/{taskId}/skip
```

**Move Task**
```http
POST /api/tasks/{taskId}/move
```

**Delete Task**
```http
DELETE /api/tasks/{taskId}
```

## 9. Progress APIs

**Submit Session Update**
```http
POST /api/progress
```
Request
```json
{
  "taskId": "",
  "completed": true,
  "progressNotes": "",
  "blockers": "",
  "achievements": ""
}
```

**Get Progress History**
```http
GET /api/progress
```

## 10. Dashboard APIs

**Dashboard Summary**
```http
GET /api/dashboard
```
Returns
```json
{
  "todayGoal": "",
  "progress": 65,
  "completedTasks": 7,
  "pendingTasks": 3,
  "weeklyProgress": 42,
  "nextSession": {}
}
```

## 11. Calendar APIs

**Monthly Calendar**
```http
GET /api/calendar
```

**Day Details**
```http
GET /api/calendar/{date}
```

## 12. Report APIs

**Daily Report**
```http
GET /api/reports/daily/{date}
```

**Weekly Report**
```http
GET /api/reports/weekly/{weekId}
```

## 13. Achievement APIs

**Get Achievements**
```http
GET /api/achievements
```

**Get XP**
```http
GET /api/user/xp
```

## 14. Notification APIs

**Register Device**
```http
POST /api/notifications/register
```

**Update Reminder Time**
```http
PUT /api/notifications/settings
```

**Test Notification**
```http
POST /api/notifications/test
```

## 15. Standard Response Format

**Success**
```json
{
    "success": true,
    "message": "",
    "data": {}
}
```

**Error**
```json
{
    "success": false,
    "message": "",
    "errorCode": "",
    "details": {}
}
```

## 16. Authentication Flow

```
Login
↓
Firebase Authentication
↓
Verify User
↓
Generate Session
↓
Access Firestore
```

## 17. Dashboard Flow

```
Load Dashboard
↓
Get Today's Plan
↓
Get Tasks
↓
Get Weekly Goal
↓
Calculate Progress
↓
Return Dashboard
```

## 18. Task Completion Flow

```
Complete Task
↓
Update Task
↓
Create Progress Log
↓
Update Daily Plan
↓
Update Weekly Goal
↓
Update Dashboard
↓
Return Success
```

## 19. Error Codes

| Code | Meaning |
|---|---|
| AUTH_001 | Invalid credentials |
| AUTH_002 | Unauthorized |
| PLAN_001 | Daily plan not found |
| PLAN_002 | Duplicate daily plan |
| TASK_001 | Task not found |
| TASK_002 | Invalid task state |
| GOAL_001 | Weekly goal not found |
| REPORT_001 | Report unavailable |
| VALIDATION_001 | Invalid request |
| SERVER_001 | Internal server error |

## 20. Future APIs

Reserved for future versions:
- AI Planning
- AI Daily Reflection
- AI Weekly Summary
- Team Collaboration
- Calendar Integration
- Google Calendar Sync
- Outlook Sync
- Export Reports (PDF/CSV)
- Productivity Analytics
- Habit Tracking

## Architecture Review (Important)

For this specific application, exposing a traditional REST API for every Firestore operation is not recommended.

A better production architecture is:

```
Next.js UI
     │
     ▼
Feature Service Layer
     │
     ├── Firebase Auth SDK
     ├── Firestore SDK
     ├── Cloudinary SDK
     └── Notification Service
```

Use Firestore SDK directly for:
- User profile
- Weekly goals
- Daily plans
- Tasks
- Progress logs
- Reports
- Calendar

Use Next.js Route Handlers / Firebase Cloud Functions only for operations that require trusted server-side execution, such as:
- Push notification scheduling
- Weekly report generation
- Daily report snapshot creation
- XP and achievement calculation
- Data export
- AI integrations
- Third-party integrations
- Scheduled jobs (cron)

This hybrid architecture minimizes latency, reduces backend maintenance, lowers infrastructure costs, and aligns with Firebase best practices while keeping sensitive business logic secure.
