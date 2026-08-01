# State Management & Data Flow Specification

**Project:** Progress Tracker PWA
**Version:** 1.0

> **Purpose:** Define how application state is stored, synchronized, updated, cached, and shared across the entire application.

## 1. State Management Philosophy

The application has one source of truth.

```
Firestore
      │
      ▼
TanStack Query Cache
      │
      ▼
Zustand Global Store
      │
      ▼
React Components
```

**Rule**
- Firestore = Persistent State
- TanStack Query = Server Cache
- Zustand = Global UI State
- React State = Local Component State

## 2. State Architecture

```
                    Firestore
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
   TanStack Query                  Service Layer
        │                               │
        └───────────────┬───────────────┘
                        ▼
                  Zustand Store
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
 Dashboard UI      Planner UI     Reports UI
```

## 3. State Categories

| Type | Storage |
|---|---|
| Authentication | Firebase Auth |
| User Profile | Zustand + Query |
| Weekly Goals | Query Cache |
| Daily Plan | Query Cache |
| Tasks | Query Cache |
| Progress | Query Cache |
| Reports | Query Cache |
| UI State | Zustand |
| Forms | React Hook Form |
| Offline Queue | IndexedDB |

## 4. Global Stores (Zustand)

**Auth Store**
```typescript
AuthStore
{
    user
    isAuthenticated
    loading
}
```

**Dashboard Store**
```typescript
DashboardStore
{
    currentSession
    todayGoal
    progress
    nextReminder
    dashboardMode
}
```

**Planner Store**
```typescript
PlannerStore
{
    selectedDate
    currentPlan
    draftPlan
    selectedSession
}
```

**Notification Store**
```typescript
NotificationStore
{
    permission
    token
    scheduledReminders
    pendingNotifications
}
```

**UI Store**
```typescript
UIStore
{
    theme
    sidebarOpen
    modal
    loading
    offline
}
```

**Gamification Store**
```typescript
GamificationStore
{
    level
    xp
    streak
    latestAchievement
}
```

## 5. Query Cache (TanStack Query)

Cache these collections:

```
User
Weekly Goals
Today's Plan
Tasks
Reports
Calendar
Achievements
```

## 6. Cache Lifetime

| Data | Cache |
|---|---|
| Dashboard | 30 sec |
| Weekly Goals | 5 min |
| Tasks | 30 sec |
| Calendar | 30 min |
| Reports | 1 hour |
| Settings | Until changed |

## 7. Cache Invalidation Rules

**Task Completed** — Invalidate:
```
tasks
dashboard
dailyPlan
weeklyGoal
```

**Weekly Goal Updated** — Invalidate:
```
weeklyGoals
dashboard
```

**Daily Plan Saved** — Invalidate:
```
dailyPlan
dashboard
```

**Settings Updated** — Invalidate:
```
settings
notifications
```

## 8. Local Component State

Use React State only for:
- Modal visibility
- Input focus
- Form UI
- Dropdowns
- Temporary selections

Never store business data here.

## 9. Form State

Use React Hook Form for:
- Login
- Weekly Goal
- Planner
- Task Form
- Settings

Validation: Zod

## 10. Dashboard Data Flow

```
Open Dashboard
↓
Query Today's Plan
↓
Query Tasks
↓
Query Weekly Goal
↓
Merge Data
↓
Dashboard Store
↓
Render UI
```

## 11. Task Completion Flow

```
User Click
↓
Optimistic Update
↓
Firestore Write
↓
Success
↓
Invalidate Cache
↓
Refetch
↓
Dashboard Refresh
↓
XP Animation
```

## 12. Weekly Goal Flow

```
Create Goal
↓
Firestore
↓
Invalidate Cache
↓
Query Refresh
↓
Dashboard Update
```

## 13. Planner Flow

```
Open Planner
↓
Load Draft
↓
User Edits
↓
Save
↓
Firestore
↓
Dashboard Refresh
```

## 14. Progress Flow

```
Reminder
↓
Progress Form
↓
Submit
↓
Firestore
↓
Progress Log
↓
Update Dashboard
↓
Refresh Queries
```

## 15. Offline Sync State Machine

```
Online
↓
Connection Lost
↓
Offline Mode
↓
Save Locally
↓
Queue Writes
↓
Connection Restored
↓
Sync Queue
↓
Firestore Updated
↓
Queue Cleared
```

## 16. Sync Queue

**Queue**
- Task completion
- Planner updates
- Progress updates
- Settings changes

**Never queue**
- Authentication
- Password reset

## 17. Conflict Resolution

If local and server differ, priority:
```
Server Timestamp
↓
Latest Update Wins
```

Exception: Task completion uses a transaction.

## 18. Optimistic Updates

**Supported**
- Task complete
- Task edit
- Task move
- Progress update

**Not Supported**
- Authentication
- Report generation
- Weekly report

## 19. Background Sync

```
Offline Queue
↓
Network Online
↓
Background Worker
↓
Firestore Batch
↓
Success
↓
Clear Queue
```

## 20. Query Keys

```typescript
["user"]
["dashboard"]
["today-plan"]
["tasks", date]
["weekly-goals"]
["calendar"]
["reports"]
["achievements"]
["settings"]
```

## 21. Store Ownership

| Store | Owner |
|---|---|
| Auth | Firebase |
| Dashboard | Zustand |
| Planner | Zustand |
| UI | Zustand |
| Notifications | Zustand |
| Query Data | TanStack Query |
| Offline Queue | IndexedDB |

## 22. Data Synchronization

```
Firestore
↓
Realtime Listener
↓
Query Cache
↓
Store Update
↓
UI Update
```

## 23. Realtime Listeners

**Enable for**
- Dashboard
- Current day's tasks
- Weekly goals

**Disable for**
- Reports
- Calendar history
- Achievements

These use on-demand queries.

## 24. Error Recovery

```
Firestore Failure
↓
Rollback Optimistic Update
↓
Toast
↓
Retry
```

```
Offline
↓
Queue
↓
Retry Later
```

## 25. Loading Strategy

- Dashboard: Skeleton
- Planner: Skeleton
- Reports: Lazy Load
- Calendar: Progressive Load

## 26. Performance Rules

- Never duplicate state.
- Never keep Firestore documents in multiple stores.
- Derived data should be computed, not stored.
- Batch updates when possible.
- Limit real-time listeners to active screens.

## 27. Folder Structure

```
src/
├── store/
│   ├── auth.store.ts
│   ├── dashboard.store.ts
│   ├── planner.store.ts
│   ├── ui.store.ts
│   ├── notification.store.ts
│   └── gamification.store.ts
│
├── queries/
│   ├── dashboard.query.ts
│   ├── planner.query.ts
│   ├── tasks.query.ts
│   ├── reports.query.ts
│   └── goals.query.ts
│
├── services/
│   ├── firestore.service.ts
│   ├── sync.service.ts
│   └── offline.service.ts
```

## 28. State Transition Diagram

```
User Action
↓
Optimistic Update
↓
Firestore
↓
Success?
├── Yes
│      ↓
│ Cache Refresh
│      ↓
│ UI Update
│
└── No
       ↓
Rollback
       ↓
Error
       ↓
Retry
```

## 29. Offline Data Model

Store locally:
```
offlineQueue
cachedDashboard
cachedTasks
cachedSettings
lastSyncTime
```

Use IndexedDB for persistence.

## 30. Production Best Practices

- Keep Zustand limited to UI and app state, not Firestore data.
- Use TanStack Query as the single cache layer for server data.
- Use Firestore transactions for multi-document updates (task completion, weekly progress, XP).
- Debounce rapid updates (e.g., notes editing).
- Sync offline changes in batches.
- Show clear sync status (Synced, Syncing, Offline, Error).

## 31. State Management Principles

1. **Single Source of Truth** — Firestore owns persistent data.
2. **No Duplicate State** — Avoid storing the same data in multiple places.
3. **Optimistic UX** — UI responds instantly, then synchronizes.
4. **Offline First** — Users can continue working without connectivity.
5. **Predictable Updates** — Every mutation follows the same lifecycle: Validate, Optimistic update, Persist, Invalidate cache, Refresh affected views, Handle rollback on failure.

This architecture provides a scalable, maintainable, and performant state management strategy suitable for the Progress Tracker PWA while supporting offline usage, real-time updates, and future feature expansion.
