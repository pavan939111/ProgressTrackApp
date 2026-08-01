# UX Flow & Interaction Design Specification

**Project:** Progress Tracker PWA
**Version:** 1.0

This document defines every user interaction, state transition, gesture, modal, navigation, feedback, and animation trigger. It serves as the blueprint for frontend implementation.

## 1. UX Philosophy

The application has two distinct modes.

```
Planning Mode
↓
Think

↓

Execution Mode
↓
Do
```

The user should never feel like they are managing tasks. Instead, they should feel like they are executing today's mission.

## 2. Primary User Flow

```
Open App
↓
Dashboard
↓
Continue Current Session
↓
Complete Tasks
↓
Progress Update
↓
Reward
↓
Dashboard Refresh
↓
Next Session
↓
Night Planning
↓
Sleep
↓
Morning Reminder
↓
Repeat
```

## 3. Application State Machine

```
Unauthenticated
↓
Authenticated
↓
Planning
↓
Executing Session
↓
Progress Update
↓
Dashboard
↓
Reports
↓
Planning Tomorrow
```

## 4. Screen State Transitions

**Launch**
```
Splash
↓
Authentication Check
↓
Login  OR  Dashboard
```
Animation: Fade In, Logo Scale

**Login Success**
```
Login
↓
Loading
↓
Dashboard
```
Animation: Button Loading, Screen Slide

**Logout**
```
Settings
↓
Logout
↓
Confirmation
↓
Login
```

## 5. Dashboard Interaction

Dashboard is the Execution Hub.

**First Load — Shows**
- Greeting
- Today's Goal
- Current Session
- Active Task
- Progress Ring

**Continue Session (Tap)**
```
Dashboard
↓
Session Screen
```

**Tap Weekly Goal** → Weekly Goal Details

**Tap Progress Ring** → Daily Statistics

**Pull to Refresh / Swipe Down** → Reload Dashboard (Spinner animation)

## 6. Planner Flow

```
Night Reminder
↓
Planner Opens
↓
Create Tomorrow Goal
↓
Morning Tasks
↓
Before Lunch
↓
Afternoon
↓
Evening
↓
Night
↓
Review
↓
Save
↓
Success Animation
```

## 7. Planning Wizard

Instead of a long form:

```
Step 1 — Weekly Goal
↓
Step 2 — Tomorrow Goal
↓
Step 3 — Morning Tasks
↓
Step 4 — Afternoon Tasks
↓
Step 5 — Review
↓
Save
```

Navigation: Previous, Next, Save

## 8. Session Flow

```
Dashboard
↓
Morning Session
↓
Task
↓
Complete
↓
Progress Form
↓
Reward
↓
Dashboard
```

## 9. Task Interaction

**Tap Task** → Task Details

**Buttons:** Complete, Skip, Move, Edit

**Complete** → Animation → Progress Update → Reward

**Skip** → Confirmation → Reason → Save

**Move** → Calendar → Choose Date → Save

## 10. Progress Update Flow

Every reminder opens a Progress Card.

**Questions:** Completed? Achievement? Blocker? Notes?

**Submit** → Dashboard Refresh

**Goal:** under 30 seconds

## 11. Reminder Flow

**Morning Reminder** → Dashboard → Morning Session

**Session Reminder** → Current Session → Progress Card

**Night Reminder** → Planner → Tomorrow Planning

## 12. Weekly Goal Flow

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
↓
Back
```

## 13. Calendar Flow

```
Calendar
↓
Select Date
↓
Daily Timeline
↓
Tasks
↓
Achievements
↓
Report
```

**Future Date** → Planning

**Past Date** → Read Only

## 14. Report Flow

```
Reports
↓
Weekly
↓
Daily
↓
Achievements
↓
Back
```

Reports are Read Only.

## 15. Navigation Rules

- Dashboard is always Home.
- Back Button returns to the Previous Screen — never Dashboard automatically.
- Bottom Navigation preserves state.
- Deep Links: Supported (future).

## 16. Gesture Design

**Mobile**
- Tap → Primary Action
- Long Press → Task Options
- Swipe Right → Complete Task
- Swipe Left → Skip / Move
- Pull Down → Refresh
- Horizontal Swipe → Change Session (Morning ↓ Afternoon ↓ Evening)

**Desktop**
- Hover → Card Elevation
- Click → Selection
- Double Click → No Action

## 17. Modal Design

- **Delete Task** — Confirmation: Delete / Cancel
- **Skip Task** — Reason: Confirm
- **Move Task** — Calendar Picker
- **Complete Goal** — Celebration: XP, Badge, Close
- **Logout** — Confirm / Cancel

## 18. Bottom Sheets (Mobile)

- Task Details → Bottom Sheet
- Progress Update → Bottom Sheet
- Notifications → Bottom Sheet

## 19. Animation Specification

| Element | Effect | Duration |
|---|---|---|
| Screen Transition | Slide | 200ms |
| Button | Scale | 150ms |
| Card | Fade | 200ms |
| Modal | Bottom Up | 250ms |

**Task Complete:** Checkmark → Confetti → XP → Progress Ring

**Session Complete:** Progress Ring Fill → Celebration

**Weekly Goal Complete:** Large Celebration, Badge, XP, Fireworks

## 20. Micro Interactions

- Task Checked: Small Vibration + Check Animation
- XP Earned: Floating Number "+50 XP"
- Progress: Smooth Fill
- Button: Ripple
- Card: Lift

## 21. Loading States

- Dashboard: Skeleton
- Planner: Skeleton
- Calendar: Spinner
- Reports: Skeleton
- Images: Blur Placeholder

## 22. Empty States

- Dashboard: "No tasks planned" — CTA: Plan Tomorrow
- Calendar: "No records"
- Reports: "No reports"
- Weekly Goal: "No active goal"
- Achievements: "Start completing tasks"

## 23. Error States

- Network Error → Retry
- Firestore Error → Toast → Retry
- Authentication Error → Login
- Validation Error → Inline Error

## 24. Offline Flow

```
Open App
↓
Offline Banner
↓
Use Cached Data
↓
Update Tasks
↓
Queue Sync
↓
Online
↓
Sync Success
↓
Banner Removed
```

## 25. Notification UX

```
Notification
↓
Tap
↓
Relevant Screen
```

Never Dashboard First.

- Morning → Morning Session
- Night → Planner
- Session Reminder → Progress Card

## 26. Accessibility

- Keyboard: Supported
- Screen Reader: Labels
- Touch Target: Minimum 44px
- High Contrast: Supported
- Reduced Motion: Supported

## 27. Responsive Behaviour

- Mobile: Single Column
- Tablet: Two Columns
- Desktop: Dashboard Grid, Sidebar, Panels

## 28. UX Rules

- One primary CTA per screen.
- Maximum three taps to complete any common action.
- Progress update must take less than 30 seconds.
- Dashboard always opens to today's active session.
- Planning and execution remain separate experiences.
- Reports are read-only.
- Historical data is never editable.
- Reward animations never block user interaction.

## 29. Complete Interaction Map

```
Splash
   │
Login
   │
Dashboard
   │
├── Continue Session
│      │
│      ├── Complete Task
│      │       │
│      │       ├── Progress Update
│      │       │       │
│      │       │       ├── XP Animation
│      │       │       │
│      │       │       └── Dashboard Refresh
│      │
│      ├── Skip Task
│      │
│      └── Move Task
│
├── Planner
│      │
│      ├── Weekly Goal
│      ├── Tomorrow Goal
│      ├── Session Tasks
│      └── Save
│
├── Calendar
│      │
│      └── Daily Report
│
├── Reports
│      │
│      ├── Daily
│      └── Weekly
│
├── Achievements
│
├── Profile
│
└── Settings
```

## 30. Final UX Principles

**Planning Mode**
- Calm
- Structured
- Form-driven
- Review before saving

**Execution Mode**
- Fast
- Focused
- Minimal distractions
- Action-first

**Reflection Mode**
- Reports
- Achievements
- Analytics
- Historical review

## 31. UX Decisions to Lock Before UI Design

Before creating high-fidelity designs in Figma or implementing React components, these interaction decisions should be finalized:

1. **Dynamic Dashboard:** The dashboard should automatically change based on the current time and active session rather than remaining static throughout the day.
2. **Progress Updates:** Replace long text forms with quick actions (chips, toggles, voice input in future versions) so updates can be completed in under 30 seconds.
3. **Session-Centric Navigation:** The primary CTA on the dashboard should always resume the current session. Users should rarely navigate through menus during execution.
4. **Planning Wizard:** Break tomorrow's planning into guided steps instead of one long form to reduce cognitive load.
5. **Non-Blocking Rewards:** XP, streaks, and achievement animations should celebrate progress while allowing users to continue working immediately, avoiding interruptions to their workflow.
