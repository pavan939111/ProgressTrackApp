# Information Architecture (IA)

**Project:** Progress Tracker PWA
**Version:** 1.0

## 1. Purpose

The Information Architecture defines:
- Application structure
- Navigation hierarchy
- Feature organization
- Page relationships
- User navigation flow
- Screen hierarchy

This document answers: **Where does every feature live and how does the user reach it?**

## 2. Application Structure

```
Progress Tracker
│
├── Authentication
│   ├── Splash
│   ├── Login
│   ├── Register
│   └── Forgot Password
│
├── Home Dashboard
│   ├── Today's Goal
│   ├── Current Session
│   ├── Progress Overview
│   ├── Weekly Goal Progress
│   ├── Quick Actions
│   └── Upcoming Reminder
│
├── Weekly Goals
│   ├── Goal List
│   ├── Goal Details
│   ├── Create Goal
│   └── Edit Goal
│
├── Daily Planner
│   ├── Tomorrow Planning
│   ├── Morning Session
│   ├── Before Lunch
│   ├── Afternoon
│   ├── Evening
│   ├── Night
│   └── Planner Summary
│
├── Session Execution
│   ├── Current Session
│   ├── Task Details
│   ├── Progress Update
│   ├── Notes
│   └── Session Summary
│
├── Calendar
│   ├── Monthly View
│   ├── Daily Timeline
│   ├── Daily Report
│   └── Daily Achievements
│
├── Reports
│   ├── Daily Report
│   ├── Weekly Report
│   └── Productivity Summary
│
├── Achievements
│   ├── XP
│   ├── Levels
│   ├── Streaks
│   ├── Badges
│   └── Rewards
│
├── Profile
│   ├── Personal Info
│   ├── Statistics
│   └── Account
│
└── Settings
    ├── Notifications
    ├── Reminder Time
    ├── Theme
    ├── Sessions
    ├── Sync
    └── About
```

## 3. Navigation Structure

**Mobile Navigation**
```
────────────────────────────
      Header
────────────────────────────
      Page Content
────────────────────────────
 Home
 Planner
 Calendar
 Reports
 Profile
────────────────────────────
```

Floating Button
```
+ Quick Add Task
```

**Desktop Navigation**
```
Sidebar
Dashboard
Weekly Goals
Planner
Calendar
Reports
Achievements
Settings
Profile
```

## 4. Route Structure

```
/
├── login
├── register
├── dashboard
├── weekly-goals
│     ├── new
│     ├── {goalId}
│     └── edit
├── planner
│     ├── today
│     ├── tomorrow
│     └── session
├── tasks
│     ├── new
│     ├── {taskId}
│     └── edit
├── calendar
│     └── {date}
├── reports
│     ├── daily
│     └── weekly
├── achievements
├── profile
└── settings
```

## 5. Primary Navigation Flow

```
Login
↓
Dashboard
↓
Current Session
↓
Task
↓
Progress Update
↓
Dashboard
↓
Reports
↓
Planner
↓
Repeat
```

## 6. Secondary Navigation

```
Dashboard
↓
Weekly Goal
↓
Goal Details
↓
Linked Tasks
↓
Progress
```

```
Calendar
↓
Daily Summary
↓
Completed Tasks
↓
Achievements
↓
Daily Report
```

```
Reports
↓
Weekly Report
↓
Daily Report
↓
Productivity Summary
```

## 7. Screen Relationships

```
Dashboard
│
├── Weekly Goal
│
├── Current Session
│
├── Today's Tasks
│
├── Calendar
│
└── Reports
```

```
Planner
│
├── Morning
├── Before Lunch
├── Afternoon
├── Evening
└── Night
```

```
Weekly Goal
│
├── Daily Tasks
├── Progress
├── Achievements
└── Completion
```

## 8. Dashboard Information Hierarchy

Priority Order:
```
1. Current Session ⭐
2. Current Task ⭐
3. Today's Goal
4. Progress %
5. Weekly Goal
6. Upcoming Reminder
7. Quick Actions
```

## 9. Planner Hierarchy

```
Tomorrow Goal
↓
Morning
↓
Before Lunch
↓
Afternoon
↓
Evening
↓
Night
↓
Summary
```

## 10. Calendar Hierarchy

```
Month
↓
Day
↓
Tasks
↓
Progress
↓
Achievements
↓
Report
```

## 11. Report Hierarchy

```
Reports
↓
Weekly Summary
↓
Daily Summary
↓
Achievements
↓
Productivity
↓
Consistency
```

## 12. Content Hierarchy

**Highest Priority**
- Current Session
- Active Task
- Today's Goal

**Medium Priority**
- Weekly Goals
- Daily Progress
- Next Reminder

**Low Priority**
- Reports
- Achievements
- History
- Statistics

## 13. User Journey Map

```
Authentication
↓
Dashboard
↓
Current Session
↓
Complete Task
↓
Progress Update
↓
Dashboard Refresh
↓
Next Session
↓
End of Day Planning
↓
Tomorrow Ready
```

## 14. Search Scope (Future)

Search should support:
- Tasks
- Weekly Goals
- Reports
- Achievements
- Dates

## 15. Notification Navigation

```
Morning Reminder
↓
Dashboard
↓
Morning Session
```

```
Session Reminder
↓
Session Page
↓
Progress Update
```

```
Night Reminder
↓
Planner
↓
Tomorrow Plan
```

## 16. Permission Flow

```
Login
↓
Notification Permission
↓
PWA Installation
↓
Dashboard
```

## 17. Empty States

- Dashboard: "No tasks planned."
- Planner: "Plan tomorrow."
- Calendar: "No history."
- Reports: "No reports."
- Weekly Goal: "No active goal."

## 18. Error States

```
Network Error
↓
Retry
↓
Offline Mode
↓
Sync Later
```

## 19. Information Access Frequency

| Screen | Frequency |
|---|---|
| Dashboard | ⭐⭐⭐⭐⭐ |
| Progress Update | ⭐⭐⭐⭐⭐ |
| Planner | ⭐⭐⭐⭐ |
| Weekly Goals | ⭐⭐⭐ |
| Calendar | ⭐⭐⭐ |
| Reports | ⭐⭐ |
| Achievements | ⭐⭐ |
| Profile | ⭐ |
| Settings | ⭐ |

## 20. Information Ownership

| Data | Owner |
|---|---|
| User | Authentication |
| Weekly Goal | Weekly Goal Module |
| Daily Plan | Planner Module |
| Tasks | Task Module |
| Progress | Progress Module |
| Reports | Report Module |
| XP | Gamification |
| Notifications | Notification Module |

## 21. Recommended Improvements (Important)

The current IA is good, but based on the application's core purpose (execution over task management), these structural changes are recommended:

**A. Merge Weekly Goals into the Planner**

Users shouldn't switch between "Weekly Goals" and "Planner." Planning should happen in one place:
- Weekly Goal
- Daily Plan
- Session Tasks

This creates a single planning workflow.

**B. Separate Planning and Execution**

Instead of treating all pages equally, organize the app into two modes:

```
Planning
├── Weekly Goals
└── Tomorrow Planner

Execution
├── Dashboard
├── Current Session
└── Progress Update
```

This reduces cognitive load during the day.

**C. Reports Should Be Historical**

Reports should not be part of the daily workflow. They belong to reflection and review, so they should be one level lower in navigation priority.

**D. Dashboard Should Be the Central Hub**

Everything should begin and return to the Dashboard:

```
Dashboard
├── Execute Current Session
├── Open Planner
├── Open Calendar
├── Open Reports
└── Open Profile
```

This keeps navigation simple and reinforces the application's primary goal: helping users execute today's work effectively.
