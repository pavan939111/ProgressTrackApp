# Notification & Reminder Engine Specification

**Project:** Progress Tracker PWA
**Version:** 1.0

> This document defines the complete notification architecture, scheduling, delivery logic, browser behavior, retry strategy, and reminder workflow.

## 1. Purpose

The Notification Engine is not just a push notification system. Its responsibility is to:

- Drive user execution
- Keep users accountable
- Maintain daily workflow
- Trigger progress updates
- Start planning
- Improve consistency

Notifications are workflow triggers, not information messages.

## 2. Reminder Types

| ID | Reminder | Purpose | Priority |
|---|---|---|---|
| R-01 | Morning Reminder | Start today's work | Critical |
| R-02 | Session Reminder | Check session progress | Critical |
| R-03 | Night Planning Reminder | Plan tomorrow | Critical |
| R-04 | Weekly Review Reminder | Weekly reflection | Medium |
| R-05 | Inactivity Reminder | Re-engage user | Low |

## 3. Daily Reminder Timeline

```
06:30–09:00
↓
Morning Reminder
↓
Current Session
↓
11:30
↓
Before Lunch Reminder
↓
15:00
↓
Afternoon Reminder
↓
18:00
↓
Evening Reminder
↓
21:00
↓
Night Session Reminder
↓
23:30
↓
Tomorrow Planning
```

Default values only. User can customize.

## 4. Notification Flow

```
Scheduled Time
↓
Reminder Trigger
↓
Permission Check
↓
Browser Support Check
↓
Send Notification
↓
User Opens
↓
Relevant Screen
↓
Progress Update
↓
Dashboard Refresh
```

## 5. Morning Reminder

**Title:** 🌅 Good Morning

**Body:** Today's goal is ready. Let's begin your Morning Session.

**CTA:** Start Session

**Opens:** Dashboard → Morning Session

## 6. Session Reminder

**Title:** ⏰ Session Check

**Body:** Have you completed your Morning Session?

**CTA:** Update Progress

**Opens:** Progress Card

## 7. Night Reminder

**Title:** 🌙 Prepare Tomorrow

**Body:** Take 5 minutes to plan tomorrow.

**CTA:** Open Planner

## 8. Weekly Reminder

**Sunday Evening**

**Title:** 📊 Weekly Review

**Body:** Your weekly report is ready.

## 9. Reminder Decision Engine

```
Current Time
↓
Find Active Session
↓
Pending Tasks?
↓
YES → Reminder
↓
NO → Skip Reminder
```

**Never remind if:**
- Session already completed
- No pending tasks
- Notifications disabled

## 10. Reminder Rules

- Morning: Once, Daily
- Session: One reminder, Per session
- Night: One reminder, Daily
- Weekly: Sunday only

## 11. Reminder Conditions

Notification sent only if:
- User authenticated
- Notifications enabled
- Browser permission granted
- Device online (for push)
- Session pending

## 12. Reminder Priority

- Critical: Morning, Session, Night
- Medium: Weekly
- Low: Inactivity

## 13. Notification State Machine

```
Scheduled
↓
Waiting
↓
Triggered
↓
Delivered
↓
Opened
↓
Completed  OR  Dismissed  OR  Expired
```

## 14. User Interaction Flow

```
Notification
↓
Tap
↓
Relevant Screen
↓
Complete Action
↓
Success
↓
Dashboard
```

```
Dismiss
↓
Log Event
↓
Wait Next Reminder
```

## 15. Retry Policy

**Delivery Failure:** Retry after 5 minutes, maximum 3 attempts.

**User Ignores:** No retry. Wait until next reminder.

**Browser Closed:** Deliver if push supported, otherwise Missed Reminder.

## 16. Missed Reminder Handling

```
Missed
↓
Log
↓
Dashboard Banner: "Morning Session Pending"
```

Never spam users.

## 17. Browser Support

| Browser | Push Support | Notes |
|---|---|---|
| Chrome Desktop | ✅ | Full |
| Chrome Android | ✅ | Full |
| Edge | ✅ | Full |
| Firefox | ✅ | Full |
| Safari macOS | ✅ | Modern versions |
| Safari iOS | ⚠️ | Requires installed PWA and iOS support |
| Unsupported Browser | ❌ | Use in-app reminders |

## 18. Permission Flow

```
Login
↓
Dashboard
↓
First Reminder
↓
Ask Permission
↓
Granted
↓
Register Device
↓
Notifications Active
```

Never request permission immediately on page load. Ask after onboarding or first successful login.

## 19. Notification Settings

Users can configure:
- Morning
- Before Lunch
- Afternoon
- Evening
- Night
- Planning Reminder
- Weekly Reminder
- Enable / Disable
- Test Notification

## 20. Device Registration

```
Login
↓
Generate Device Token
↓
Save Firestore
↓
Ready
```

Multiple devices supported.

## 21. FCM Architecture

```
Cloud Function
↓
Firebase Cloud Messaging
↓
Browser Service Worker
↓
System Notification
↓
Open PWA
```

## 22. Notification Payload

```json
{
  "type": "session",
  "session": "Morning",
  "planId": "...",
  "taskCount": 3,
  "action": "open-session"
}
```

## 23. Deep Link Routing

| Notification | Destination |
|---|---|
| Morning | Dashboard → Morning Session |
| Session | Progress Update |
| Night | Planner |
| Weekly | Weekly Report |

Never open a generic home page.

## 24. Offline Behaviour

If offline:
- Show local notification (where supported)
- Queue progress updates
- Sync later

If push cannot be delivered, Dashboard shows pending reminder on next app open.

## 25. Background Behaviour

```
PWA Installed
↓
Service Worker Active
↓
Receive Push
↓
Display Notification
↓
User Action
```

If browser limitations prevent background execution, fallback to in-app reminder banners.

## 26. Notification Analytics

Track:
- Scheduled
- Delivered
- Failed
- Opened
- Dismissed
- Completed
- Ignored

These metrics help improve reminder effectiveness.

## 27. Error Handling

```
Permission denied
↓
Disable notifications
↓
Show in-app reminders
```

```
Token expired
↓
Refresh token
↓
Update Firestore
```

```
Push failure
↓
Retry
↓
Log failure
```

## 28. Security

- Store FCM tokens per device.
- Associate every token with authenticated user ID.
- Validate ownership before sending notifications.
- Remove invalid tokens automatically.

## 29. Future AI Reminder Engine

Future versions may support:
- Adaptive reminder timing.
- Productivity-based scheduling.
- Focus mode detection.
- Intelligent snooze recommendations.
- AI-generated motivational messages.

## 30. Production Architecture Recommendation

For this application, use a hybrid notification architecture instead of relying solely on browser timers.

```
Scheduler (Cloud Function / Scheduled Job)
              │
              ▼
Determine Active Reminder
              │
              ▼
Firebase Cloud Messaging
              │
              ▼
Browser Service Worker
              │
      ┌───────┴────────┐
      ▼                ▼
Push Notification   In-App Banner
      │                │
      └───────┬────────┘
              ▼
Relevant Screen (Session / Planner / Report)
```

## 31. Final Production Decisions

Before implementation, lock these policies:

**Delivery Guarantee**
At-most-once delivery per reminder window. Never send duplicate reminders for the same session.

**Retry Policy**
Retry only for delivery failures (maximum 3 retries). Do not retry because a user ignored or dismissed a notification.

**Browser Fallback**
If push notifications are unavailable or permission is denied, use persistent in-app reminder banners and dashboard indicators.

**Reminder Eligibility**
A reminder is sent only if:
- User is authenticated.
- Notifications are enabled.
- Notification permission is granted.
- The associated session has not already been completed.
- The reminder has not already been delivered for that session.

**Deep Linking**
Every notification must open directly into the relevant workflow (session, planner, or report), minimizing the number of user interactions required to continue working.
