# Core Application Logic Document

**Project:** Progress Tracker PWA
**Version:** 1.0

## 1. Purpose

The Progress Tracker is not a task manager. It is a daily execution and accountability system that transforms long-term goals into structured daily work, continuously reminds users to execute, collects progress updates throughout the day, and automatically generates reports showing productivity and consistency.

The application revolves around one principle:

```
Plan → Execute → Track → Reflect → Improve
```

## 2. Core Philosophy

The application must always answer these questions.

**Planning**
- What should I do today?
- Why am I doing it?
- What is most important today?

**Execution**
- What should I be doing right now?
- Did I complete the planned work?
- What progress have I made?

**Reflection**
- What did I achieve today?
- What is still pending?
- What should I improve tomorrow?

**Long Term**
- Am I progressing towards my weekly goal?
- Am I consistent?
- Where am I wasting time?

## 3. Core Entities

The application revolves around six primary entities.

```
Weekly Goal
    ↓
Daily Plan
    ↓
Session
    ↓
Task
    ↓
Progress Update
    ↓
Reports
```

Every feature belongs to one of these entities.

## 4. Weekly Goal Logic

A weekly goal represents a high-level objective.

**Example**
```
Complete Portfolio Website
Complete AI Project
Prepare Interview
```

A weekly goal:
- Starts Monday
- Ends Sunday
- Contains multiple daily tasks
- Tracks percentage completion
- Tracks completed tasks
- Tracks pending tasks
- Stores achievements

Weekly goals are never directly completed. They become complete only when every linked task is finished.

## 5. Daily Planning Logic

Every night, around 11:30 PM, the application asks:

```
What is tomorrow's goal?
What tasks should be completed?
How will tomorrow look?
```

The user creates tomorrow's plan. A daily plan contains:

```
Date
Goal
Priority
Sessions
Tasks
Expected outcomes
Notes
```

After saving, tomorrow becomes ready.

## 6. Session Logic

A day is divided into execution sessions.

**Example**
```
Morning
Before Lunch
Afternoon
Evening
Night
```

Each session contains:

```
Tasks
Expected Outcome
Reminder Time
Completion Status
Progress Update
```

Sessions create natural checkpoints throughout the day.

## 7. Task Logic

A task belongs to:

```
Daily Plan
AND optionally
Weekly Goal
```

Each task contains:

```
Title
Description
Priority
Estimated Time
Expected Result
Session
Completion Status
Completion Time
Linked Weekly Goal
```

Possible states:

```
Pending
In Progress
Completed
Skipped
Moved to Tomorrow
```

## 8. Reminder Logic

The reminder engine follows the daily plan.

**Example**
```
Morning Reminder
    ↓
Before Lunch Reminder
    ↓
Afternoon Reminder
    ↓
Evening Reminder
    ↓
Night Reminder
```

Each reminder asks:

```
Did you complete the planned task?
What did you finish?
What did you learn?
Any blockers?
How confident are you?
```

After submission, progress is updated automatically.

## 9. Progress Update Logic

Every update records:

```
Completed Tasks
Pending Tasks
Current Session
Notes
Achievements
Timestamp
```

After submission, the application updates:

```
Daily Progress
Weekly Progress
Reports
Dashboard
```

...immediately.

## 10. Daily Progress Logic

Daily progress is calculated from:

```
Completed Tasks
Total Tasks
Session Completion
Weekly Contribution
```

Outputs:

```
Progress %
Achievements
Pending Work
Completed Work
Time Remaining
```

## 11. Weekly Progress Logic

Every completed task updates:

```
Weekly Goal %
Completed Tasks
Remaining Tasks
Achievements
```

Weekly reports never require manual writing. Everything is generated automatically.

## 12. Dashboard Logic

The dashboard always answers:

```
What should I do today?
    ↓
What am I doing now?
    ↓
What have I completed?
    ↓
How much remains?
```

Dashboard contains:

```
Today's Goal
Today's Date
Current Session
Today's Tasks
Completed Tasks
Pending Tasks
Weekly Goal Progress
Today's Progress
Quick Actions
```

## 13. Calendar Logic

Every day is stored independently. Selecting a date shows:

```
Daily Goal
Tasks
Completed
Pending
Achievements
Notes
Progress
Weekly Goal Contribution
```

Users can review any previous day.

## 14. Report Logic

**Daily Report**
Generated automatically. Contains:

```
Goal
Completed Tasks
Pending Tasks
Achievements
Missed Work
Completion %
Reflection
```

**Weekly Report**
Generated every Sunday. Contains:

```
Weekly Goal
Tasks Completed
Tasks Pending
Major Achievements
Overall Progress
Consistency
Completion %
```

## 15. Home Screen Logic

When opening the application, the user should immediately understand:

```
Today
    ↓
Current Goal
    ↓
Current Session
    ↓
Remaining Work
    ↓
Progress
```

No navigation should be required.

## 16. Gamification Logic

The application rewards execution.

**Example**
```
Task Completed
    ↓
Animation
    ↓
Experience Points
    ↓
Progress Increase
    ↓
Achievement
    ↓
Motivation
```

Gamification must never distract from productivity. It should reinforce consistent behavior.

## 17. Data Flow

```
Night Planning
    ↓
Create Tomorrow Plan
    ↓
Store Daily Plan
    ↓
Morning Reminder
    ↓
Execute Session
    ↓
Reminder
    ↓
Progress Update
    ↓
Task Completion
    ↓
Daily Progress Update
    ↓
Weekly Goal Update
    ↓
Dashboard Refresh
    ↓
Daily Report
    ↓
Weekly Report
```

## 18. Business Rules

**Planning**
- Every day should have exactly one daily plan.
- Daily plans are created before execution.
- Multiple tasks can exist inside a session.
- A task belongs to only one session.

**Weekly Goals**
- Multiple weekly goals can exist.
- A task may belong to one weekly goal.
- Weekly completion depends on linked tasks.

**Sessions**
- Sessions execute sequentially.
- Each session can contain multiple tasks.
- Session completion depends on task completion.

**Tasks**
- Tasks can be edited before completion.
- Completed tasks cannot be modified without reopening.
- Tasks may be moved to another day.
- Tasks may be skipped.

**Reports**
- Reports are generated automatically.
- Reports are immutable snapshots for historical tracking.
- Historical reports should never change due to future edits.

## 19. Edge Cases

- User misses a reminder.
- User completes work before the reminder.
- User skips a session.
- User completes all tasks early.
- User adds tasks mid-day.
- User deletes a task.
- User postpones a task.
- Weekly goal spans unfinished tasks.
- User plans no tasks for a day.
- User misses an entire day.
- Notification permission is denied.
- Device is offline (PWA sync later).

## 20. Success Metrics

The application is successful when users can consistently answer:

- What am I supposed to do now?
- What have I completed today?
- What remains today?
- Am I progressing toward this week's goal?
- Am I becoming more consistent over time?

## 21. Complete Application Flow

```
Create Weekly Goal
        │
        ▼
Night Planning (Tomorrow)
        │
        ▼
Generate Daily Plan
        │
        ▼
Morning Dashboard
        │
        ▼
Session Reminder
        │
        ▼
User Progress Update
        │
        ▼
Task Status Updated
        │
        ▼
Daily Progress Recalculated
        │
        ▼
Weekly Goal Updated
        │
        ▼
Dashboard Refreshed
        │
        ▼
Daily Report Generated
        │
        ▼
Weekly Report Generated
        │
        ▼
Repeat for Next Day
```

## Notes for Next Documents

This document establishes the business logic only. Before implementation, the following documents should be created in order:

1. Product Requirements Document (PRD)
2. User Personas & User Journeys
3. Information Architecture
4. Functional Requirements Specification
5. Business Rules & Validation Matrix
6. Database Schema (Firestore)
7. State Management & Data Flow
8. Notification & Reminder Engine Logic
9. Gamification System Specification
10. UI/UX Specification
11. API & Service Contracts
12. Development Roadmap (MVP → V1)
