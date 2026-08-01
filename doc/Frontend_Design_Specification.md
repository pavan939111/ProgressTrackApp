# Frontend Design Specification

**Project:** Progress Tracker PWA
**Version:** 1.0
> **Framework:** Next.js (App Router)
> **Platform:** Progressive Web App (Mobile First)

## 1. Frontend Vision

The frontend should not look like a traditional To-Do application. It should feel like:

- Productivity
- Gaming
- Motivating
- Premium
- Minimal
- Fast
- Interactive

The user should feel: **"I want to complete this task because the app makes progress feel rewarding."**

## 2. Design Principles

**1. Mobile First**
Entire application should be designed for mobile first. Desktop adapts from mobile.

**2. One Screen = One Objective**
Every screen should solve one problem. Never overload the user.

**3. Show Progress Everywhere**
Every page should answer:
- What should I do?
- How much is completed?
- What remains?

**4. Reduce Clicks**
Maximum 2–3 clicks to perform any common action.

**5. Gamified Experience**
```
Every completion
↓
Visual feedback
↓
Animation
↓
XP
↓
Progress Increase
↓
Motivation
```

## 3. Responsive Design Strategy

**Mobile** — Primary platform. Width: 320px–768px

**Tablet** — 768–1024px

**Desktop** — 1024px+. Uses responsive layouts.

## 4. Navigation Structure

**Mobile — Bottom Navigation**
```
Home
Planner
Calendar
Reports
Profile
```

**Floating Action Button**
```
+ Create Task
```

**Desktop — Sidebar Navigation**
```
Dashboard
Weekly Goals
Planner
Calendar
Reports
Achievements
Settings
```

**Top Bar**
- User
- Notifications
- Search (Future)

## 5. Screen Hierarchy

```
Authentication
↓
Dashboard
↓
Planner
↓
Session
↓
Progress Update
↓
Reports
↓
Profile
↓
Settings
```

## 6. Mobile Screens

**Splash Screen**
Purpose: Branding, Loading, Authentication

**Login**
Features: Email, Password, Forgot Password, Register

**Home Dashboard**
Displays:
- Today's Date
- Today's Goal
- Current Session
- Progress Ring
- Weekly Goal Progress
- Completed Tasks
- Pending Tasks
- Next Reminder
- Quick Actions

Primary CTA: Continue Current Session

**Weekly Goals**
Features: Goal Cards, Progress Bar, Priority Badge, Completion %, Add Goal

**Planner**
Displays: Tomorrow's Plan

Sections:
- Morning
- Before Lunch
- Afternoon
- Evening
- Night

Each Session: Tasks, Expected Outcomes, Priority, Add Task

**Session Screen**
Displays: Current Session, Tasks, Timer (Future), Notes, Complete Button

**Progress Update**
Questions: Completed? Achievement? Blocker? Notes?

Primary CTA: Submit Progress

**Calendar**
Displays: Monthly Calendar. Selecting a day opens Daily Summary.

**Reports**
Tabs: Daily, Weekly

**Achievements**
Displays: XP, Levels, Badges, Streak, Rewards

**Profile**
Displays: User, XP, Settings, Notification Preferences

## 7. Desktop Screens

Desktop uses Dashboard Layout:
```
Sidebar
+
Top Navigation
+
Content Area
```

**Dashboard Widgets**
- Progress Ring
- Weekly Goal
- Today's Tasks
- Calendar
- Achievement Card
- Productivity Graph
- Upcoming Session

## 8. Component Library

**Cards**
- Goal Card
- Task Card
- Session Card
- Achievement Card
- Report Card

**Progress Components**
- Circular Progress
- Linear Progress
- XP Bar
- Weekly Completion
- Daily Completion

**Inputs**
- Text Input
- Date Picker
- Time Picker
- Priority Selector
- Session Selector
- Notes Editor

**Buttons**
- Primary
- Secondary
- Danger
- Floating Action Button
- Icon Button

**Feedback**
- Toast
- Success Animation
- Error Banner
- XP Popup
- Achievement Popup

## 9. UI States

Every screen supports:
```
Loading
↓
Success
↓
Empty
↓
Error
↓
Offline
```

## 10. Color System

- Primary: Blue, Purple
- Success: Green
- Warning: Orange
- Error: Red
- Background: Dark Mode, Light Mode

## 11. Typography

- Heading
- Subtitle
- Body
- Caption
- Button
- Monospace (statistics)

## 12. Icons

Use: Heroicons / Lucide

Categories:
- Task
- Goal
- Calendar
- Trophy
- Fire (streak)
- Clock
- Report
- Settings

## 13. Animations

- Task Complete
- XP Earned
- Goal Complete
- Session Complete
- Page Transition
- Card Hover
- Progress Fill
- Achievement Unlock

Animations ≤300ms

## 14. Gamification UI

Display:
- Current Level
- XP
- Weekly Progress
- Daily Progress
- Achievements
- Current Streak
- Recent Rewards

## 15. Notification UI

**Morning**
```
Good Morning
Today's Goal
Start Morning Session
```

**Session Reminder**
```
Morning Session
Have you completed your task?
```

**Night Reminder**
```
Plan Tomorrow
Prepare tomorrow's work.
```

## 16. Responsive Layout

**Mobile**
```
Header
↓
Progress
↓
Today's Goal
↓
Current Session
↓
Tasks
↓
Bottom Navigation
```

**Desktop**
```
Sidebar
↓
Header
↓
Dashboard Grid
↓
Reports
↓
Calendar
```

## 17. Folder Structure

```
src/
├── app/
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── planner/
│   ├── reports/
│   ├── calendar/
│   ├── achievements/
│   └── shared/
├── features/
├── hooks/
├── services/
├── store/
├── styles/
├── types/
└── utils/
```

## 18. State Management

**Global State**
- User
- Dashboard
- Weekly Goals
- Current Session
- Notifications
- Theme

**Feature State**
- Planner
- Calendar
- Reports
- Progress Updates

**Use**
- Zustand
- TanStack Query
- React Hook Form

## 19. Accessibility

Support:
- Keyboard navigation
- High contrast
- Large touch targets
- Screen readers
- Responsive fonts

## 20. Performance

- Lazy loading
- Route splitting
- Image optimization
- Virtual scrolling
- Cached dashboard
- Skeleton loaders
- Optimistic updates

## 21. Frontend Flow

```
Login
↓
Dashboard
↓
Morning Session
↓
Reminder
↓
Progress Update
↓
Dashboard Refresh
↓
Reports
↓
Night Planning
```

## 22. Design System

**Spacing**
4, 8, 12, 16, 24, 32

**Border Radius**
Small, Medium, Large, Pill

**Elevation**
Card, Floating, Modal

## 23. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Icons | Lucide React |
| Animation | Framer Motion |
| Forms | React Hook Form + Zod |
| State | Zustand |
| Server State | TanStack Query |
| Charts | Recharts |
| PWA | next-pwa + Service Worker |

## 24. Screen Inventory (MVP)

**Authentication**
- Splash
- Login
- Register

**Home**
- Dashboard

**Planning**
- Weekly Goals
- Daily Planner
- Session Details
- Progress Update

**Tracking**
- Calendar
- Daily Details
- Reports

**Gamification**
- Achievements

**User**
- Profile
- Settings

## 25. UX Improvements Recommended Before UI Design

The current feature set is strong, but these UX decisions should be finalized before creating wireframes or high-fidelity designs:

**A. Dashboard Priority**
The dashboard should answer one question first: "What should I do right now?" Current session and active task should be more prominent than historical statistics.

**B. Planning vs Execution Modes**
Separate the application into two distinct modes:
- Planning Mode: Night planning, weekly goals, editing tasks.
- Execution Mode: Today's work only, with minimal distractions and fast progress updates.

**C. One-Tap Progress Updates**
Session reminders should open directly to a lightweight progress form that users can complete in under 30 seconds.

**D. Desktop Is Not a Bigger Mobile Screen**
Desktop should take advantage of wider layouts by showing dashboard widgets, side-by-side planners, reports, and the calendar simultaneously instead of simply stretching the mobile UI.

**E. Gamification Must Support Productivity**
Animations, XP, and rewards should celebrate completion but never interrupt the user's workflow or slow down frequent task updates. They should reinforce behavior rather than distract from it.
