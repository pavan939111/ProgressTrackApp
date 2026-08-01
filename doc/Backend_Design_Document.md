# Backend Design Document

**Project:** Progress Tracker PWA
**Version:** 1.0
**Architecture:** Serverless + Event-Driven Backend

## 1. Backend Overview

Unlike a traditional backend, the Progress Tracker uses Firebase as the primary backend with Next.js Route Handlers and Firebase Cloud Functions for business logic.

```
                User
                  │
                  ▼
          Next.js Frontend
                  │
        Feature Service Layer
                  │
      ┌───────────┴────────────┐
      ▼                        ▼
 Firebase Authentication   Firestore
      │                        │
      └────────────┬───────────┘
                   ▼
         Cloud Functions
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
 Notifications   Reports     Gamification
```

## 2. Backend Responsibilities

Backend is responsible for:

- Authentication
- Data validation
- Business rules
- Report generation
- Notification scheduling
- XP calculation
- Achievement unlocks
- Background jobs
- Data synchronization
- Security enforcement

## 3. Backend Modules

```
Authentication
↓
User Service
↓
Weekly Goal Service
↓
Daily Planner Service
↓
Session Service
↓
Task Service
↓
Progress Service
↓
Dashboard Service
↓
Calendar Service
↓
Report Service
↓
Gamification Service
↓
Notification Service
```

## 4. Authentication Service

**Responsibilities**
- Register
- Login
- Logout
- Password Reset
- Session Verification

**Uses**
- Firebase Authentication

## 5. User Service

**Responsibilities**
- User profile
- Settings
- Preferences
- Reminder timings
- Theme
- XP
- Streaks

## 6. Weekly Goal Service

**Responsibilities**
- Create Goal
- Edit Goal
- Delete Goal
- Archive Goal
- Calculate Progress
- Link Tasks

**Business Rules**
- Multiple weekly goals allowed.
- Progress calculated from linked tasks.
- Auto-complete when all linked tasks are completed.

## 7. Daily Planner Service

**Responsibilities**
- Create tomorrow's plan
- Update plan
- Delete plan
- Validate planning rules
- Link weekly goals

**Business Rules**
- One plan per day.
- One task belongs to one session.
- Planning allowed before execution.

## 8. Session Service

**Responsibilities**
- Manage sessions
- Track completion
- Schedule reminders
- Update progress

**Default Sessions**
- Morning
- Before Lunch
- Afternoon
- Evening
- Night

## 9. Task Service

**Responsibilities**
- Create task
- Update task
- Delete task
- Complete task
- Skip task
- Move task
- Link weekly goal

**Task States**
- Pending
- In Progress
- Completed
- Skipped
- Moved

## 10. Progress Service

**Responsibilities**
- Save session updates
- Save notes
- Save blockers
- Save achievements
- Create progress logs
- Update dashboard

**Triggers**
- Task completion
- Session completion

## 11. Dashboard Service

**Responsibilities — Aggregate**
- Today's goal
- Tasks
- Progress
- Weekly goals
- Next reminder

Dashboard is computed, not manually stored.

## 12. Calendar Service

**Responsibilities — Load**
- Daily plan
- Tasks
- Reports
- Achievements

Supports historical browsing.

## 13. Report Service

**Generates**

**Daily Report** — Includes:
- Goal
- Completed Tasks
- Pending Tasks
- Completion %
- Reflection
- Achievements

**Weekly Report** — Includes:
- Weekly Goal
- Weekly Progress
- Productivity
- Consistency
- Achievements

Reports are immutable snapshots.

## 14. Gamification Service

**Responsibilities — Calculate**
- XP
- Levels
- Streaks
- Badges
- Rewards

**Triggers**
- Task complete
- Session complete
- Daily completion
- Weekly completion

## 15. Notification Service

**Responsibilities**
- Morning reminder
- Session reminders
- Night planning reminder
- Retry failed notifications
- Notification history

**Future**
- Smart reminders
- Adaptive reminders

## 16. Event-Driven Backend

**Event Flow**
```
Task Completed
       │
       ▼
Update Task
       │
       ▼
Create Progress Log
       │
       ▼
Update Daily Progress
       │
       ▼
Update Weekly Goal
       │
       ▼
Update Dashboard
       │
       ▼
Award XP
       │
       ▼
Refresh UI
```

## 17. Background Jobs

**Daily**
- Generate daily report
- Archive completed day
- Prepare next day

**Weekly**
- Generate weekly report
- Calculate consistency
- Archive completed week

**Notification Jobs**
- Morning reminder
- Session reminders
- Night planning reminder

## 18. Backend Validation Rules

**Weekly Goals**
- Title required
- Week required
- Duplicate prevention

**Daily Plan**
- One plan per day
- Valid date
- Goal required

**Task**
- Session required
- Title required
- Valid status
- Valid priority

**Progress**
- Task must exist
- Timestamp required
- User ownership verified

## 19. Security Layer

```
User
↓
Firebase Authentication
↓
JWT Verification
↓
Firestore Rules
↓
Business Validation
↓
Database
```

**Rules**
- User accesses only own data.
- Validate ownership before updates.
- Prevent unauthorized writes.
- Restrict report modification.

## 20. Backend Error Handling

**Handle**
- Invalid requests
- Duplicate plans
- Invalid task state
- Offline synchronization
- Notification failures
- Firestore write failures
- Authentication failures

## 21. Performance Strategy

- Batch Firestore writes.
- Cache today's dashboard.
- Lazy-load reports.
- Indexed queries.
- Optimistic UI updates.
- Background synchronization.
- Minimize document reads.

## 22. Backend Folder Structure

```
backend/
│
├── auth/
├── users/
├── weekly-goals/
├── planner/
├── sessions/
├── tasks/
├── progress/
├── reports/
├── dashboard/
├── calendar/
├── notifications/
├── gamification/
├── shared/
│     ├── validators/
│     ├── middleware/
│     ├── errors/
│     ├── utils/
│     └── constants/
```

## 23. Cloud Functions

Use Cloud Functions only for trusted or scheduled operations.

**Scheduled Functions**
- Night planning reminder
- Morning reminder
- Session reminder scheduler
- Daily report generator
- Weekly report generator

**Trigger Functions**
- On task completion → Update weekly goal.
- On session completion → Calculate progress.
- On daily completion → Generate report.
- On report generation → Award achievements.

**HTTPS Functions (Future)**
- Export reports
- AI insights
- Productivity analytics

## 24. Logging & Monitoring

**Log**
- Authentication
- Task completion
- Reminder delivery
- Report generation
- Sync failures
- Cloud Function failures
- Firestore errors

## 25. Recovery Strategy

**Recover from**
- Offline edits
- Sync conflicts
- Browser refresh
- Interrupted writes
- Notification failures

No user progress should be lost.

## 26. Backend Lifecycle

```
Login
   │
   ▼
Load User
   │
   ▼
Load Today Plan
   │
   ▼
Reminder Trigger
   │
   ▼
User Progress Update
   │
   ▼
Task Updated
   │
   ▼
Progress Calculated
   │
   ▼
Dashboard Updated
   │
   ▼
XP Awarded
   │
   ▼
Report Generated
```

## 27. Production Architecture Recommendation

For this application, use a feature-first serverless backend:

```
src/
├── features/
│   ├── auth/
│   ├── planner/
│   ├── tasks/
│   ├── weekly-goals/
│   ├── progress/
│   ├── dashboard/
│   ├── reports/
│   ├── notifications/
│   └── gamification/
│
├── services/
│   ├── firestore.service.ts
│   ├── auth.service.ts
│   ├── notification.service.ts
│   ├── report.service.ts
│   └── sync.service.ts
│
├── cloud-functions/
│   ├── scheduled/
│   ├── triggers/
│   └── https/
│
├── lib/
├── middleware/
├── validators/
├── types/
└── utils/
```

## 28. Critical Architecture Improvements

The current design is strong, but before implementation these backend decisions should be finalized:

1. **Notification Delivery:** Browser notifications alone are unreliable. Use Firebase Cloud Messaging (FCM) with scheduled Cloud Functions where supported, while gracefully handling browsers with limited PWA push support.
2. **Transaction Strategy:** Use Firestore transactions or batched writes when completing a task, so updates to the task, daily plan, weekly goal, progress log, and XP remain consistent.
3. **Idempotent Background Jobs:** Scheduled jobs (daily reports, weekly reports, reminders) should be idempotent to prevent duplicate reports or repeated XP if a function retries.
4. **Central Business Logic:** Keep all business rules (progress calculation, XP, streaks, report generation) in shared service functions so they are reused by both the frontend and Cloud Functions.
5. **Event-Based Processing:** Treat key actions (task completed, session completed, day ended) as domain events that trigger downstream processes, making the backend easier to extend with AI insights, analytics, and collaboration features later.
