export type Priority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Skipped' | 'Moved';
export type SessionStatus = 'Pending' | 'Active' | 'Completed' | 'Missed';
export type GoalStatus = 'Active' | 'Completed' | 'Archived';
export type SessionName = 'Morning' | 'Before Lunch' | 'Afternoon' | 'Evening' | 'Night';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
  timezone: string;
  currentWeekId?: string;
  notificationPermission: boolean;
  pwaInstalled: boolean;
  streak: number;
  totalXP: number;
  level: number;
  lastActiveDate: string;
  onboardingCompleted: boolean;
}

export interface UserSettings {
  uid: string;
  morningReminder: string;
  beforeLunchReminder: string;
  afternoonReminder: string;
  eveningReminder: string;
  nightReminder: string;
  planningReminder: string;
  weeklyReminder: string;
  notificationsEnabled: boolean;
  theme: 'dark' | 'light' | 'system';
  workDays: number[];
  syncEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyGoal {
  goalId: string;
  uid: string;
  title: string;
  description?: string;
  priority: Priority;
  weekStart: string;
  weekEnd: string;
  status: GoalStatus;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  achievements?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyPlan {
  planId: string;
  uid: string;
  date: string;
  title: string;
  goal: string;
  notes?: string;
  overallPriority: Priority;
  completionPercentage: number;
  completedTasks: number;
  pendingTasks: number;
  weeklyGoalIds?: string[];
  status: 'In Progress' | 'Completed';
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  sessionId: string;
  uid: string;
  dailyPlanId: string;
  name: SessionName;
  order: number;
  startTime: string;
  endTime: string;
  reminderTime: string;
  status: SessionStatus;
  completionPercentage: number;
  taskCount: number;
  completedTaskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  taskId: string;
  uid: string;
  dailyPlanId: string;
  sessionId: string;
  session: SessionName;
  weeklyGoalId?: string;
  title: string;
  description?: string;
  priority: Priority;
  estimatedMinutes?: number;
  expectedOutcome?: string;
  status: TaskStatus;
  completedAt?: string;
  movedToDate?: string;
  skippedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressLog {
  logId: string;
  uid: string;
  taskId: string;
  dailyPlanId: string;
  sessionId: string;
  session: SessionName;
  completed: boolean;
  progressNotes?: string;
  achievements?: string[];
  blockers?: string;
  confidence?: number;
  timestamp: string;
}

export interface DailyReport {
  reportId: string;
  uid: string;
  date: string;
  goal: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionPercentage: number;
  achievements: string[];
  missedTasks: string[];
  reflection?: string;
  generatedAt: string;
}

export interface WeeklyReport {
  reportId: string;
  uid: string;
  weekStart: string;
  weekEnd: string;
  completedTasks: number;
  pendingTasks: number;
  completionPercentage: number;
  achievements: string[];
  weeklyGoalSummary: string;
  consistencyScore: number;
  generatedAt: string;
}

export interface Achievement {
  achievementId: string;
  uid: string;
  type: 'Streak' | 'Execution' | 'Planner' | 'Milestone';
  title: string;
  description: string;
  xpEarned: number;
  unlockedAt: string;
  iconName?: string;
}
