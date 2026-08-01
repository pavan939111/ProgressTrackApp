# Business Rules Matrix

**Project:** Progress Tracker PWA
**Version:** 1.0

## 1. Purpose

This document defines the business rules that govern how the application behaves. These rules are the single source of truth for developers, testers, and future features.

> **Business Rule = A condition or policy that the application must always enforce.**

## 2. Business Rule Categories

| Category | Description |
|---|---|
| BR-01 | User Rules |
| BR-02 | Authentication Rules |
| BR-03 | Weekly Goal Rules |
| BR-04 | Daily Planning Rules |
| BR-05 | Session Rules |
| BR-06 | Task Rules |
| BR-07 | Reminder Rules |
| BR-08 | Progress Rules |
| BR-09 | Dashboard Rules |
| BR-10 | Report Rules |
| BR-11 | Calendar Rules |
| BR-12 | Gamification Rules |
| BR-13 | Notification Rules |
| BR-14 | Offline Rules |
| BR-15 | Security Rules |

## BR-01 User Rules

| Rule ID | Business Rule |
|---|---|
| BR-001 | Every account belongs to exactly one user. |
| BR-002 | Users can access only their own data. |
| BR-003 | User profile must exist before planning tasks. |
| BR-004 | User preferences are loaded during login. |
| BR-005 | User timezone determines reminder scheduling. |

## BR-02 Authentication Rules

| Rule ID | Business Rule |
|---|---|
| BR-006 | Authentication is mandatory before accessing the application. |
| BR-007 | All requests require a valid authenticated user. |
| BR-008 | Logged-out users cannot access protected routes. |
| BR-009 | Password reset requires verified email ownership. |
| BR-010 | Session expiration requires re-authentication. |

## BR-03 Weekly Goal Rules

| Rule ID | Business Rule |
|---|---|
| BR-011 | Users may create multiple weekly goals. |
| BR-012 | Weekly goals belong to one calendar week. |
| BR-013 | Every weekly goal has a start and end date. |
| BR-014 | Weekly goals can exist without tasks initially. |
| BR-015 | Daily tasks may optionally link to a weekly goal. |
| BR-016 | One task can belong to only one weekly goal. |
| BR-017 | Weekly progress is calculated automatically. |
| BR-018 | Weekly goals become complete only when all linked tasks are completed. |
| BR-019 | Archived weekly goals become read-only. |

## BR-04 Daily Planning Rules

| Rule ID | Business Rule |
|---|---|
| BR-020 | Only one daily plan is allowed per date. |
| BR-021 | Planning tomorrow is the primary workflow. |
| BR-022 | Every daily plan must contain one daily goal. |
| BR-023 | Users may edit the plan before execution. |
| BR-024 | Additional tasks may be added during the day. |
| BR-025 | A daily plan cannot belong to multiple dates. |
| BR-026 | Each plan maintains completion statistics. |

## BR-05 Session Rules

| Rule ID | Business Rule |
|---|---|
| BR-027 | Each day is divided into work sessions. |
| BR-028 | Default sessions are Morning, Before Lunch, Afternoon, Evening, and Night. |
| BR-029 | Every task belongs to exactly one session. |
| BR-030 | Sessions can contain multiple tasks. |
| BR-031 | Session completion depends on task completion. |
| BR-032 | Session reminders use user-configured times. |

## BR-06 Task Rules

| Rule ID | Business Rule |
|---|---|
| BR-033 | Every task belongs to one daily plan. |
| BR-034 | Task title is mandatory. |
| BR-035 | Tasks may have descriptions and notes. |
| BR-036 | Tasks support priorities (High, Medium, Low). |
| BR-037 | Task states: Pending, In Progress, Completed, Skipped, Moved. |
| BR-038 | Completed tasks record completion timestamp. |
| BR-039 | Completed tasks may only be reopened explicitly. |
| BR-040 | Deleted tasks are soft deleted for audit purposes. |
| BR-041 | Tasks can be moved to another date. |
| BR-042 | Moved tasks retain history. |
| BR-043 | Skipped tasks require an optional reason. |

## BR-07 Reminder Rules

| Rule ID | Business Rule |
|---|---|
| BR-044 | Morning reminder starts the workday. |
| BR-045 | Every active session triggers a reminder. |
| BR-046 | Night reminder prompts tomorrow planning. |
| BR-047 | Reminders only trigger if notifications are enabled. |
| BR-048 | Reminder opens the relevant session. |
| BR-049 | Missed reminders are logged. |
| BR-050 | Reminder schedules follow the user's timezone. |

## BR-08 Progress Rules

| Rule ID | Business Rule |
|---|---|
| BR-051 | Every progress update creates a history log. |
| BR-052 | Progress updates never overwrite previous logs. |
| BR-053 | Completing a task updates daily progress immediately. |
| BR-054 | Linked weekly goals update automatically. |
| BR-055 | Dashboard refreshes after every progress update. |
| BR-056 | Progress updates include timestamp. |
| BR-057 | Achievements are stored separately from tasks. |

## BR-09 Dashboard Rules

| Rule ID | Business Rule |
|---|---|
| BR-058 | Dashboard always opens to today's data. |
| BR-059 | Current session is the highest-priority information. |
| BR-060 | Dashboard displays only active tasks. |
| BR-061 | Progress values are computed automatically. |
| BR-062 | Dashboard reflects Firestore changes in real time. |
| BR-063 | Dashboard should never require manual refresh. |

## BR-10 Report Rules

| Rule ID | Business Rule |
|---|---|
| BR-064 | Daily reports are generated automatically. |
| BR-065 | Weekly reports are generated automatically. |
| BR-066 | Reports are immutable snapshots. |
| BR-067 | Reports are read-only. |
| BR-068 | Historical reports never change after generation. |
| BR-069 | Reports calculate completion percentage automatically. |

## BR-11 Calendar Rules

| Rule ID | Business Rule |
|---|---|
| BR-070 | Calendar displays all planned days. |
| BR-071 | Selecting a day loads historical data. |
| BR-072 | Future dates display planned tasks only. |
| BR-073 | Previous dates display reports and achievements. |
| BR-074 | Calendar never edits historical reports directly. |

## BR-12 Gamification Rules

| Rule ID | Business Rule |
|---|---|
| BR-075 | Completing a task awards XP. |
| BR-076 | Completing a session may award bonus XP. |
| BR-077 | Completing all daily tasks awards a completion bonus. |
| BR-078 | Completing a weekly goal unlocks rewards. |
| BR-079 | XP never decreases. |
| BR-080 | Achievements are permanent once unlocked. |
| BR-081 | Streaks increase only when the day is successfully completed. |
| BR-082 | Missing a planned day breaks the streak (unless future product rules change). |

## BR-13 Notification Rules

| Rule ID | Business Rule |
|---|---|
| BR-083 | Notification permission must be granted before reminders work. |
| BR-084 | Browser limitations are handled gracefully. |
| BR-085 | Notification failures are logged. |
| BR-086 | Users may disable reminders at any time. |
| BR-087 | Test notifications are available in settings. |

## BR-14 Offline Rules

| Rule ID | Business Rule |
|---|---|
| BR-088 | Tasks remain editable while offline. |
| BR-089 | Progress updates are cached locally. |
| BR-090 | Synchronization starts automatically when online. |
| BR-091 | Sync conflicts are resolved using application-defined rules. |
| BR-092 | User is informed of pending synchronization. |

## BR-15 Security Rules

| Rule ID | Business Rule |
|---|---|
| BR-093 | Every Firestore document stores its owner UID. |
| BR-094 | Users cannot access other users' documents. |
| BR-095 | Firestore validates ownership before writes. |
| BR-096 | Sensitive operations require authentication. |
| BR-097 | Reports cannot be modified directly by clients. |
| BR-098 | Server-generated fields cannot be edited by users. |

## Cross-Module Rules

| Rule ID | Rule |
|---|---|
| BR-099 | Completing a task updates dashboard, reports, weekly goal, and progress logs in one transaction. |
| BR-100 | Deleting a weekly goal must not delete historical reports. |
| BR-101 | Moving a task updates the old and new daily plans. |
| BR-102 | Daily completion is calculated from task completion, not session completion. |
| BR-103 | Weekly completion is calculated from linked task completion. |
| BR-104 | Reports are generated from immutable snapshots, not live task data. |
| BR-105 | Dashboard always prioritizes today's work over historical information. |
| BR-106 | Every critical operation must be timestamped and auditable. |

## Exception Rules

| Rule ID | Exception |
|---|---|
| BR-107 | Users may create a daily plan without linking a weekly goal. |
| BR-108 | Users may complete tasks before a reminder is triggered. |
| BR-109 | Users may add tasks after the day has started. |
| BR-110 | Users may finish all tasks before all reminders occur. |
| BR-111 | If notifications are denied, manual progress tracking remains available. |
| BR-112 | Offline users continue working and synchronize later. |

## Future Business Rules (Reserved)

- AI-generated task suggestions.
- Automatic task prioritization.
- Smart reminder scheduling.
- Habit tracking rules.
- Team collaboration permissions.
- Shared weekly goals.
- Monthly and yearly planning.
- Productivity scoring model.
- AI coaching and recommendations.

## Business Rule Priority

| Priority | Meaning |
|---|---|
| Critical | Authentication, data ownership, reports, task integrity |
| High | Planning, reminders, progress tracking |
| Medium | Calendar, dashboard, reports |
| Low | Gamification, achievements, personalization |

This Business Rules Matrix becomes the authoritative reference for implementation, testing, backend validation, and future feature development. Every new feature should either conform to these rules or explicitly extend them with new business rules.
