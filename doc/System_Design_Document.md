# System Design Document

**Project:** Progress Tracker PWA
**Version:** 1.0

## 1. System Overview

The Progress Tracker is a single-user Progressive Web Application (PWA) built around an event-driven productivity workflow.

Instead of simply storing tasks, the system continuously guides the user through the following lifecycle:

```
Plan
   ↓
Execute
   ↓
Reminder
   ↓
Progress Update
   ↓
Dashboard Update
   ↓
Reports
   ↓
Repeat
```

The architecture is designed to be:

- Modular
- Offline-capable
- Real-time
- Event-driven
- Scalable
- Mobile-first

## 2. High-Level Architecture

```
                    USER
                      │
                      ▼
              Next.js PWA (Frontend)
                      │
      ┌───────────────┼────────────────┐
      │               │                │
      ▼               ▼                ▼
 Notification     Business Logic     UI State
    Engine          Layer            Management
      │               │
      └───────────────┼────────────────────────────┐
                      ▼                            │
               Firebase Authentication            │
                      │                            │
                      ▼                            │
                  Firestore Database               │
                      │                            │
      ┌───────────────┼────────────────────────────┘
      ▼               ▼
 Cloudinary      Service Worker
(Image Assets)   (Offline + Push)
```

## 3. Core Architecture Layers

**Presentation Layer**

Responsible for:
- UI
- Pages
- Components
- Animations
- Dashboard
- Reports

Technology:
- Next.js
- React
- Tailwind CSS
- PWA

**Business Layer**

Contains application rules. Responsible for:
- Planning logic
- Reminder logic
- Progress calculation
- Weekly goal calculation
- Report generation
- Gamification
- Validation

No UI code should exist here.

**Data Layer**

Responsible for:
- Firestore reads
- Firestore writes
- Offline cache
- Synchronization

**Service Layer**

Responsible for:
- Notifications
- Authentication
- Cloudinary uploads
- Service Worker
- Background sync

## 4. Core Modules

```
Authentication
↓
Dashboard
↓
Weekly Goals
↓
Daily Planner
↓
Session Manager
↓
Task Manager
↓
Reminder Engine
↓
Progress Engine
↓
Report Engine
↓
Calendar
↓
Gamification
↓
Settings
```

Each module should remain independent.

## 5. Authentication Module

**Responsibilities**
- Login
- Register
- Session management
- Logout
- User profile

**Dependencies**
- Firebase Auth

## 6. Weekly Goal Module

**Responsibilities**
- Create
- Edit
- Delete
- Track
- Calculate Progress

**Stores**
```
Goal
Priority
Week
Completion
Linked Tasks
Achievements
```

## 7. Daily Planner Module

**Responsibilities**
Create tomorrow's plan.

**Stores**
```
Date
Goal
Sessions
Tasks
Expected Outcomes
Notes
```

**Produces**
Tomorrow's execution plan.

## 8. Session Manager

**Responsibilities**
Manage:
- Morning
- Before Lunch
- Afternoon
- Evening
- Night

**Each session**
```
Tasks
Reminder
Progress
Completion
```

## 9. Task Manager

**Handles**
- Create
- Update
- Delete
- Move
- Skip
- Complete

**Task States**
```
Pending
In Progress
Completed
Skipped
Moved
```

## 10. Reminder Engine

**Triggers**
- Morning
- Before Lunch
- Afternoon
- Evening
- Night

Each reminder opens the Progress Update Flow.

**Reminder Engine should:**
- Load today's session
- Show pending tasks
- Ask for update
- Save progress

## 11. Progress Engine

**Receives**
```
Completed Tasks
Achievements
Notes
Current Session
```

**Updates**
```
Task Status
Daily Progress
Weekly Goal
Reports
```

## 12. Dashboard Engine

**Calculates**
- Today's Goal
- Current Session
- Pending Tasks
- Completed Tasks
- Progress %
- Weekly Goal %
- Next Reminder

Dashboard should never contain hardcoded values. Everything is computed.

## 13. Calendar Module

**Responsibilities**
Display Monthly Calendar.

**Selecting day loads**
```
Tasks
Achievements
Reports
Notes
Progress
```

Calendar is read-heavy. Optimize reads.

## 14. Report Engine

**Generates**

**Daily Report** — Contains:
```
Goal
Completed
Pending
Achievements
Reflection
Completion %
```

**Weekly Report** — Contains:
```
Weekly Goal
Completed Tasks
Achievements
Consistency
Weekly Completion
```

Generated automatically.

## 15. Gamification Engine

**Triggers**
- Task Complete
- Session Complete
- Day Complete
- Week Complete

**Possible rewards**
```
XP
Badges
Levels
Animations
Streaks
```

Gamification never changes business data. Only presentation.

## 16. Notification Engine

**Supports**
- Morning Reminder
- Session Reminder
- Night Planning Reminder

**Future**
- Weekly Reminder

**Notification Flow**
```
Reminder
↓
Open App
↓
Progress Form
↓
Update
↓
Dashboard Refresh
```

## 17. Firestore Collections (High-Level)

```
users
weeklyGoals
dailyPlans
sessions
tasks
progressLogs
dailyReports
weeklyReports
achievements
settings
```

Each user owns their data.

## 18. Data Relationships

```
User
 │
 ├── Weekly Goals
 │       │
 │       └── Daily Tasks
 │
 ├── Daily Plans
 │       │
 │       ├── Sessions
 │       │      │
 │       │      └── Tasks
 │       │
 │       └── Daily Report
 │
 ├── Weekly Reports
 │
 ├── Progress Logs
 │
 └── Achievements
```

## 19. Event Flow

**Night Planning**
```
User
↓
Create Tomorrow Plan
↓
Save Firestore
↓
Ready
```

**Morning**
```
Reminder
↓
Dashboard
↓
Begin Session
```

**Session Completion**
```
Reminder
↓
Update Progress
↓
Task Updated
↓
Daily Progress Updated
↓
Weekly Goal Updated
↓
Dashboard Updated
```

**Daily Completion**
```
Finish Last Session
↓
Generate Daily Report
↓
Save Snapshot
```

**Weekly Completion**
```
Sunday Night
↓
Generate Weekly Report
↓
Save Snapshot
```

## 20. Offline Flow

```
User Updates Task
↓
Local Cache
↓
Firestore Sync Queue
↓
Internet Available
↓
Background Sync
↓
Firestore Updated
```

PWA should work even without internet for core task management.

## 21. Security Design

```
Authentication
↓
Firestore Rules
↓
User Isolation
↓
Validation
↓
Database
```

**Rules**
- User can only access own data.
- No cross-user reads.
- Validate ownership on every write.
- Restrict report modifications.
- Secure Cloudinary uploads.

## 22. Performance Design

**Optimize**
- Firestore reads
- Pagination for history
- Lazy loading reports
- Indexed queries
- Optimistic UI updates
- Cached dashboard
- Image optimization
- Background synchronization

## 23. Scalability

**Current Design**
Single User

**Future Ready**
- Team workspace
- Shared goals
- AI planning
- Calendar integrations
- Native apps
- Analytics engine
- Multi-device sync
- Collaboration

Architecture should support these without major restructuring.

## 24. Failure Handling

**Handle**
- Offline mode
- Notification denied
- Sync conflicts
- Firestore failures
- Duplicate updates
- Browser refresh
- Missed reminders
- Partial uploads

System should never lose user progress.

## 25. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js |
| UI | React + Tailwind CSS |
| PWA | Service Worker + Web App Manifest |
| Authentication | Firebase Authentication |
| Database | Firestore |
| Image Storage | Cloudinary |
| Offline Storage | IndexedDB / Cache API |
| Notifications | Web Push Notifications |
| Hosting | Firebase Hosting or Vercel |

## 26. Architecture Principles

- Feature-based modular architecture.
- Business logic separated from UI.
- Event-driven state updates.
- Single source of truth in Firestore.
- Offline-first for core workflows.
- Read optimization over unnecessary writes.
- Immutable report snapshots.
- Reusable services and components.

## 27. Recommended Folder Structure

```
src/
├── app/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── planner/
│   ├── weekly-goals/
│   ├── sessions/
│   ├── tasks/
│   ├── reports/
│   ├── calendar/
│   ├── gamification/
│   ├── notifications/
│   └── settings/
├── components/
├── services/
│   ├── firebase/
│   ├── firestore/
│   ├── cloudinary/
│   ├── notifications/
│   └── sync/
├── hooks/
├── store/
├── lib/
├── types/
├── utils/
└── styles/
```

## 28. Design Gaps to Resolve Before Development

These decisions should be finalized before implementation because they affect both architecture and data modeling:

1. **Reminder Scheduling:** PWA background execution is limited. Decide whether reminders rely only on browser notifications or require a backend scheduler (e.g., Firebase Cloud Functions + FCM) for reliable delivery.
2. **Planning Window:** Should users only be allowed to plan tomorrow, or edit today's plan during the day?
3. **Task Carry Forward:** Define the exact workflow for unfinished tasks at the end of the day.
4. **Report Generation:** Decide whether reports are generated on demand or stored as immutable snapshots.
5. **Gamification Model:** Finalize XP, levels, streaks, and badge rules before implementing the reward engine.
6. **Notification Personalization:** Decide whether session times are fixed defaults or fully customizable per user.

These architectural decisions should be resolved before moving to the Firestore schema and detailed API/service design.
