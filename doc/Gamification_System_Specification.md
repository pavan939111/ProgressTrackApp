# Gamification System Specification

**Project:** Progress Tracker PWA
**Version:** 1.0

> **Purpose:** Increase consistency and motivation by rewarding execution — not by turning the application into a game.

## 1. Gamification Philosophy

The objective is not entertainment. The objective is to reinforce productive behavior.

The reward loop is:

```
Plan
↓
Execute
↓
Complete
↓
Reward
↓
Motivation
↓
Repeat
```

The system rewards consistency, execution, and completion, not simply creating tasks.

## 2. Rewardable Events

| Event | Reward |
|---|---|
| Complete Task | XP |
| Complete Session | Bonus XP |
| Complete Daily Goal | Daily Bonus |
| Complete Weekly Goal | Weekly Bonus |
| Maintain Streak | Streak Bonus |
| Unlock Achievement | Badge + XP |
| Reach New Level | Celebration |

## 3. XP System

**Task Completion**

| Priority | XP |
|---|---:|
| Low | 10 XP |
| Medium | 20 XP |
| High | 40 XP |

**Session Completion**

| Session | XP |
|---|---:|
| Morning | 20 XP |
| Before Lunch | 20 XP |
| Afternoon | 20 XP |
| Evening | 20 XP |
| Night | 20 XP |

Only awarded if every task in that session is completed.

**Daily Completion**

All planned tasks completed → +100 XP

**Weekly Goal Completion**

Weekly goal completed → +500 XP

**Planning Reward**

Plan tomorrow before 11:59 PM → +15 XP

Encourages planning consistency.

## 4. XP Formula

```
Total XP
=
Task XP
+
Session XP
+
Daily Bonus
+
Weekly Bonus
+
Achievement Bonus
```

XP is never reduced.

## 5. Level System

Level progression is based on cumulative XP.

| Level | XP Required |
|---|---:|
| 1 | 0 |
| 2 | 250 |
| 3 | 600 |
| 4 | 1,100 |
| 5 | 1,800 |
| 6 | 2,700 |
| 7 | 3,800 |
| 8 | 5,100 |
| 9 | 6,600 |
| 10 | 8,300 |

Future levels continue using an increasing XP curve.

## 6. Level Up Flow

```
Gain XP
↓
Reach Threshold
↓
Level Up
↓
Animation
↓
Badge
↓
Dashboard Refresh
```

## 7. Streak System

A streak measures consecutive successful days.

A successful day means:
- Daily plan exists.
- At least 80% of planned tasks completed.

**Streak Rules**

| Rule | Description |
|---|---|
| Consecutive successful day | +1 streak |
| Miss successful day | Streak reset to 0 |
| Planning only | Does not count |
| Completing one task only | Does not count |

## 8. Streak Rewards

| Streak | Reward |
|---|---|
| 3 Days | +50 XP |
| 7 Days | Bronze Badge |
| 14 Days | +200 XP |
| 30 Days | Silver Badge |
| 60 Days | Gold Badge |
| 100 Days | Legendary Badge |

## 9. Achievement System

Achievements are permanent. Unlocked once. Never removed.

**Planning**
- First Plan
- 7 Days Planned
- 30 Days Planned

**Execution**
- First Task
- 100 Tasks
- 500 Tasks
- 1000 Tasks

**Sessions**
- First Session
- 50 Sessions
- 100 Sessions

**Weekly Goals**
- First Weekly Goal
- 10 Weekly Goals
- 50 Weekly Goals

**Consistency**
- 7-Day Streak
- 30-Day Streak
- 100-Day Streak

## 10. Badge System

- Bronze — Beginner achievements
- Silver — Intermediate achievements
- Gold — Advanced achievements
- Platinum — Elite achievements
- Legendary — Exceptional consistency

## 11. Reward Animation Rules

**Task Complete** → Small Check Animation → XP Popup → Progress Ring Fill

**Session Complete** → Card Glow → XP → Session Badge

**Daily Completion** → Confetti → XP → Daily Champion Banner

**Weekly Completion** → Large Celebration → Weekly Trophy → Badge Unlock

**Level Up** → Full Screen Celebration → Level Card → Continue Button

## 12. Progress Bars

**Dashboard**
- Daily Progress
- Weekly Goal Progress
- XP Progress to Next Level

**Achievements**
- Streak Progress
- Badge Progress

## 13. Dashboard Rewards

Always show:
- Current Level
- Current XP
- XP to Next Level
- Current Streak
- Latest Achievement

## 14. Achievement Card

Displays:
- Badge Icon
- Achievement Name
- Description
- Unlock Date
- XP Earned

## 15. XP History

Every XP event is logged.

| Event | XP | Timestamp |
|---|---:|---|
| Completed Task | +20 | 10:30 |
| Session Bonus | +20 | 12:00 |
| Daily Bonus | +100 | 22:00 |

## 16. Gamification Events

```
Task Complete
↓
Award XP
↓
Check Achievement
↓
Check Level
↓
Update Dashboard
↓
Play Animation
```

## 17. Anti-Abuse Rules

- XP awarded only once per task.
- Reopening a completed task does not grant additional XP.
- Editing completed tasks does not create rewards.
- Duplicate submissions ignored.
- Archived tasks cannot generate XP.

## 18. Leaderboards

Not included in MVP. Future feature.

## 19. Motivational Messages

**Task Complete**
"Great work! Keep the momentum going."

**Session Complete**
"Excellent! One more step toward today's goal."

**Weekly Goal Complete**
"Outstanding! Your weekly mission is complete."

Messages rotate randomly to avoid repetition.

## 20. Firestore Collections

```
users
achievements
xpHistory
streakHistory
```

Level thresholds (Section 5) are a static, versioned app-level config, not Firestore data — there is no `levels` collection. A user's current level is derived from `users.totalXP` at read time. See Database Design Document, Section 2 and Section 26 (Change Log v1.2) for the full canonical schema, including field-level definitions for `xpHistory` and `streakHistory`.

## 21. Gamification State Machine

```
Task Completed
↓
Award XP
↓
Update XP Total
↓
Check Level
↓
Check Achievement
↓
Trigger Animation
↓
Refresh Dashboard
```

## 22. UX Rules

- Reward within 300 ms of successful completion.
- Never interrupt the user's workflow.
- Users can dismiss animations immediately.
- Celebration intensity should match achievement importance.
- Small rewards use lightweight animations.
- Major milestones use full-screen celebrations.

## 23. Analytics

Track:
- XP earned per day.
- Average tasks completed.
- Streak growth.
- Badge unlock frequency.
- Level progression.
- Session completion rate.

## 24. Future Expansion

- Team challenges.
- Monthly missions.
- Seasonal events.
- Custom avatars.
- Reward marketplace.
- Community achievements.
- AI productivity coach.

## 25. Production Architecture

```
Task Completed
      │
      ▼
Validation Service
      │
      ▼
XP Engine
      │
      ▼
Achievement Engine
      │
      ▼
Level Engine
      │
      ▼
Animation Engine
      │
      ▼
Dashboard Update
```

## 26. Business Rules

- Rewards are tied to execution, not task creation.
- XP can only increase.
- Achievements are immutable.
- Streaks measure consistency, not volume.
- Gamification never modifies business data (tasks, reports, plans).
- All reward calculations occur after successful business transactions.

## 27. Recommended Improvements

To make the system more meaningful for long-term use:

**1. Reward Completion Percentage**

Instead of only rewarding completed tasks, calculate a Daily Performance Score based on:
- Task completion rate.
- On-time completion.
- Planning consistency.
- Session completion.

This discourages creating many trivial tasks for XP.

**2. Dynamic XP**

Scale XP by:
- Task priority.
- Estimated effort.
- Actual completion.
- Weekly goal contribution.

This makes important work more rewarding than easy work.

**3. Freeze Streak Instead of Immediate Reset**

Rather than instantly resetting long streaks after one missed day:
- Allow one "grace day" per month, or
- Freeze the streak and require recovery the next day.

This reduces frustration and improves long-term retention.

**4. Milestone Rewards**

Celebrate:
- 100 Tasks Completed.
- 1,000 XP Earned.
- 10 Weekly Goals Completed.
- 365 Consecutive Planning Days.

These milestones create memorable moments beyond daily task completion.

**5. Keep Productivity First**

The application's identity is a productivity system with gamification, not a game with productivity features. Every reward should encourage users to finish meaningful work — not distract them from it.
