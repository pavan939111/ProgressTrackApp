# Database Design Document

**Project:** Progress Tracker PWA
**Version:** 1.2 — supersedes 1.1. Added `xpHistory`, `streakHistory`, and `deviceTokens` collections, and a `weeklyReminder` setting field, to match the Gamification and Notification specs. See Section 26 for the full change log.
**Database:** Firebase Firestore (NoSQL)

## 1. Database Overview

The database is designed around the user's productivity lifecycle.

```
User
 │
 ├── Weekly Goals
 │
 ├── Daily Plans
 │      │
 │      ├── Sessions
 │      │      │
 │      │      └── Tasks
 │      │
 │      └── Daily Report
 │
 ├── Weekly Reports
 │
 ├── Progress Logs
 │
 ├── Achievements
 │
 ├── XP History
 │
 ├── Streak History
 │
 ├── Device Tokens
 │
 └── Settings
```

## 2. Firestore Collections

```
users/
weeklyGoals/
dailyPlans/
sessions/
tasks/
progressLogs/
dailyReports/
weeklyReports/
achievements/
xpHistory/
streakHistory/
deviceTokens/
settings/
```

All collections are flat, top-level collections. See Section 24 for why this structure was chosen over nesting under `users/{uid}`.

Note: XP level thresholds (Gamification System Specification, Section 5) are a static, versioned app-level config — not Firestore data. There is no `levels` collection; level number is derived from `users.totalXP` at read time.

## 3. Collection: users

```ts
users
{
    uid
    email
    fullName

    profileImage

    createdAt
    updatedAt

    timezone

    currentWeekId

    notificationPermission

    pwaInstalled

    streak

    totalXP

    level

    lastActiveDate

    onboardingCompleted
}
```

## 4. Collection: settings

```ts
settings
{
    uid

    morningReminder

    beforeLunchReminder

    afternoonReminder

    eveningReminder

    nightReminder

    planningReminder

    weeklyReminder

    notificationsEnabled

    theme

    workDays

    syncEnabled

    createdAt

    updatedAt
}
```

## 5. Collection: weeklyGoals

```ts
weeklyGoals
{
    goalId

    uid

    title

    description

    priority

    weekStart

    weekEnd

    status

    progress

    completedTasks

    totalTasks

    achievements

    createdAt

    updatedAt
}
```

## 6. Collection: dailyPlans

One document for one day.

```ts
dailyPlans
{
    planId

    uid

    date

    title

    goal

    notes

    overallPriority

    completionPercentage

    completedTasks

    pendingTasks

    weeklyGoalIds

    status

    createdAt

    updatedAt
}
```

## 7. Collection: sessions

Every session belongs to one daily plan. This collection is the system of record for session timing and completion — it is referenced by the Notification & Reminder Engine, the Backend Design "Session Service," and the API Design Specification's `/api/sessions/{sessionId}` endpoints, so it is defined here as a first-class collection rather than only a field on tasks.

```ts
sessions
{
    sessionId

    uid

    dailyPlanId

    name              // Morning | Before Lunch | Afternoon | Evening | Night

    order             // 1–5, execution sequence within the day

    startTime

    endTime

    reminderTime

    status            // Pending | Active | Completed | Skipped

    completionPercentage

    taskCount

    completedTaskCount

    createdAt

    updatedAt
}
```

## 8. Collection: tasks

Every task belongs to one daily plan and one session.

```ts
tasks
{
    taskId

    uid

    dailyPlanId

    sessionId          // reference to sessions collection

    session            // denormalized session name, for display/filtering without a join

    weeklyGoalId

    title

    description

    priority            // High | Medium | Low

    estimatedMinutes

    expectedOutcome

    status

    completedAt

    movedToDate

    skippedReason

    createdAt

    updatedAt
}
```

## 9. Collection: progressLogs

Stores every session update.

```ts
progressLogs
{
    logId

    uid

    taskId

    dailyPlanId

    sessionId

    session

    completed

    progressNotes

    achievements

    blockers

    confidence

    timestamp
}
```

## 10. Collection: dailyReports

Immutable snapshot.

```ts
dailyReports
{
    reportId

    uid

    date

    goal

    totalTasks

    completedTasks

    pendingTasks

    completionPercentage

    achievements

    missedTasks

    reflection

    generatedAt
}
```

## 11. Collection: weeklyReports

```ts
weeklyReports
{
    reportId

    uid

    weekStart

    weekEnd

    completedTasks

    pendingTasks

    completionPercentage

    achievements

    weeklyGoalSummary

    consistencyScore

    generatedAt
}
```

## 12. Collection: achievements

```ts
achievements
{
    achievementId

    uid

    type

    title

    description

    xpEarned

    unlockedAt
}
```

## 13. Collection: xpHistory

Every XP-earning event is logged here, per the Gamification System Specification (Section 15, "XP History"). This is an append-only ledger — `users.totalXP` is the current running total, and this collection is its audit trail. Never overwritten.

```ts
xpHistory
{
    xpLogId

    uid

    amount              // e.g. +20, +100, +500

    source              // task | session | dailyBonus | weeklyBonus | streakBonus | planningBonus | achievement

    sourceId            // taskId, sessionId, weeklyGoalId, or achievementId, depending on source

    reason              // short label, e.g. "Task completed: High priority"

    timestamp
}
```

## 14. Collection: streakHistory

Records the outcome of every planned day, used to calculate and audit the user's streak (Gamification System Specification, Section 7). A "successful day" record is what increments `users.streak`; a break resets it. This also supports the "grace day" / streak-freeze policy noted as a recommended improvement in the Gamification spec.

```ts
streakHistory
{
    streakLogId

    uid

    date

    dailyPlanId

    successful          // true if ≥80% of planned tasks were completed

    completionPercentage

    streakCountAfter    // running streak value after this day was recorded

    frozen              // true if a grace day was applied instead of a reset

    createdAt
}
```

## 15. Collection: deviceTokens

Stores FCM push tokens. A user may have multiple devices, so this is a separate collection rather than a field on `users` (Notification & Reminder Engine Specification, Sections 20–21, 28).

```ts
deviceTokens
{
    tokenId

    uid

    fcmToken

    platform            // web | android | ios

    userAgent

    isActive

    lastSeenAt

    createdAt

    updatedAt
}
```

## 16. Entity Relationship

```
User
 │
 ├──────────────┐
 │              │
 ▼              ▼
Weekly Goal   Daily Plan
                  │
                  ▼
              Sessions
                  │
                  ▼
              Multiple Tasks
                  │
                  ▼
            Progress Logs
                  │
                  ▼
          Daily Report
                  │
                  ▼
          Weekly Report
                  │
                  ▼
           Achievements
                  │
                  ▼
      XP History / Streak History
```

## 17. Task State Machine

```
Pending
   │
   ├────────► In Progress
   │               │
   │               ▼
   │          Completed
   │
   ├────────► Skipped
   │
   └────────► Moved
```

## 18. Session State Machine

```
Pending
   │
   ▼
Active
   │
   ├────────► Completed   (all tasks in session completed)
   │
   └────────► Skipped     (session window passed with pending tasks)
```

## 19. Firestore Indexes

**weeklyGoals**
```
uid
weekStart
status
```

**dailyPlans**
```
uid
date
```

**sessions**
```
uid
dailyPlanId
order
status
```

**tasks**
```
uid
dailyPlanId
sessionId
status
priority
weeklyGoalId
```

**progressLogs**
```
uid
timestamp
taskId
sessionId
```

**reports**
```
uid
date
weekStart
```

**xpHistory**
```
uid
timestamp
source
```

**streakHistory**
```
uid
date
```

**deviceTokens**
```
uid
isActive
```

## 20. Read Flow

**Dashboard**
```
Load User
      │
      ▼
Today's Plan
      │
      ▼
Today's Sessions
      │
      ▼
Today's Tasks
      │
      ▼
Weekly Goal
      │
      ▼
Dashboard
```

**Calendar**
```
Select Date
      │
      ▼
Daily Plan
      │
      ▼
Sessions
      │
      ▼
Tasks
      │
      ▼
Daily Report
```

**Weekly Report**
```
Current Week
      │
      ▼
Weekly Goals
      │
      ▼
Tasks
      │
      ▼
Weekly Report
```

## 21. Write Flow

**Night Planning**
```
Create Daily Plan
↓
Create Sessions (Morning, Before Lunch, Afternoon, Evening, Night)
↓
Save Firestore
↓
Ready
```

**Task Completion**
```
Update Task
↓
Create Progress Log
↓
Update Session (completedTaskCount, completionPercentage, status)
↓
Update Daily Plan
↓
Update Weekly Goal
↓
Write xpHistory Entry
↓
Update users.totalXP / users.level
↓
Dashboard Refresh
```

**End of Day**
```
Generate Report
↓
Write streakHistory Entry
↓
Update users.streak
↓
Store Snapshot
```

## 22. Firestore Security Rules (High Level)

```
Authenticated User
↓
Can Read Own Data
↓
Can Write Own Data
↓
Cannot Access Other Users
↓
Validate Ownership
↓
Commit
```

## 23. Optimization Strategy

- Keep dashboard queries under 3–4 reads.
- Store computed counters (completedTasks, pendingTasks, progress) to avoid expensive aggregations.
- Use pagination for reports, xpHistory, and streakHistory.
- Lazy-load historical data.
- Cache today's plan locally.
- Batch writes for task completion + progress updates (task, session, dailyPlan, weeklyGoal, xpHistory, user XP total in one transaction).

## 24. Firestore Structure Decision (Locked)

**Adopted: flat, top-level collections with a `uid` field on every document** (as documented in Sections 3–15), not collections nested under `users/{uid}`.

Reasons:
- The indexes in Section 19 are already designed around `uid`-first composite queries; nesting under `users/{uid}` would make those indexes unnecessary but wouldn't simplify anything else.
- The API Design Specification's REST resources (`/api/weekly-goals`, `/api/tasks`, `/api/sessions/{sessionId}`) are flat and map directly onto flat collections.
- Firestore Security Rules (Section 22) enforce `uid` ownership per document either way — nesting does not remove the need for ownership validation, it only changes the path shape.
- Flat collections keep collection-group queries and future cross-user features (e.g., analytics, admin tooling) simpler to add later.

**Alternative considered, not adopted:**

```
users
 └── {uid}
      ├── profile
      ├── settings
      ├── weeklyGoals
      ├── dailyPlans
      ├── sessions
      ├── tasks
      ├── progressLogs
      ├── dailyReports
      ├── weeklyReports
      ├── achievements
      ├── xpHistory
      ├── streakHistory
      └── deviceTokens
```

This nested structure was the original production recommendation in v1.0 of this document. It's a reasonable alternative if the application later needs strict per-user data partitioning (e.g., for GDPR data export/deletion), but it is not required for the current single-user MVP and is not used in any other specification document. If data export/deletion requirements change this decision, the `uid` field already present on every document makes migration straightforward.

## 25. Remaining Recommended Improvements

The `sessions`, `xpHistory`, `streakHistory`, and `deviceTokens` collection gaps from earlier versions of this document have been resolved — see Sections 7, 13, 14, 15. The following refinements are still open for a production-ready build:

**1. Support Future AI Features**

Reserve optional fields like:

```ts
aiSummary
aiSuggestions
productivityScore
```

in report documents without implementing them yet.

**2. Add Audit Metadata**

Every major document should include:

```ts
createdBy
updatedBy
createdAt
updatedAt
version
isDeleted
```

This improves traceability and future migrations.

Overall, this schema is well aligned with the application logic and provides a scalable foundation for the Progress Tracker PWA.

## 26. Change Log

| Version | Change |
|---|---|
| 1.0 | Initial schema. Sessions modeled only as a `session` string field on tasks. Firestore structure (flat vs. nested) left open as a recommendation. |
| 1.1 | Added `sessions` as a first-class collection (Section 7) to match the API Design Specification, Backend Design Document, and System Design Document, which already assumed session documents with IDs. Locked the Firestore structure decision to flat, top-level collections (Section 24). Added `sessionId` to `tasks` and `progressLogs`. Enumerated `priority` values (High/Medium/Low) explicitly on the `tasks` field. |
| 1.2 | Added `xpHistory` (Section 13) and `streakHistory` (Section 14) collections to match the Gamification System Specification's XP History and streak-audit requirements, which referenced these collections but were never defined here. Added `deviceTokens` (Section 15) to match the Notification & Reminder Engine Specification's multi-device FCM token storage requirement. Added `weeklyReminder` field to `settings` to match the Notification spec and System Design Document, both of which listed it as a configurable reminder. Clarified that `levels` (mentioned in the Gamification spec) is a static app config, not a Firestore collection — no `levels` collection exists. Updated Write Flow, Indexes, and Entity Relationship sections accordingly. |
