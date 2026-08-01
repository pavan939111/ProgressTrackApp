const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDNTXH-Jctx5tnibr0vzlRLPTfRRE_6tGA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "pta-1-8f439.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pta-1-8f439",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "pta-1-8f439.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "153283759434",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:153283759434:web:1117477fff0455abd985b3",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-2S599PLB54",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log('Seeding live Firestore database (pta-1-8f439)...');

  const userId = 'demo-user-123';
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  // 1. users
  await setDoc(doc(db, 'users', userId), {
    uid: userId,
    email: 'alex.developer@pta.io',
    fullName: 'Alex Morgan',
    createdAt: now,
    updatedAt: now,
    timezone: 'UTC',
    notificationPermission: true,
    pwaInstalled: false,
    streak: 5,
    totalXP: 1450,
    level: 3,
    lastActiveDate: today,
    onboardingCompleted: true,
  });
  console.log('✓ Collection [users] seeded');

  // 2. userSettings
  await setDoc(doc(db, 'userSettings', userId), {
    uid: userId,
    morningReminder: '08:00',
    beforeLunchReminder: '12:00',
    afternoonReminder: '15:00',
    eveningReminder: '18:00',
    nightReminder: '21:00',
    planningReminder: '22:00',
    weeklyReminder: 'Sunday 20:00',
    notificationsEnabled: true,
    theme: 'dark',
    workDays: [1, 2, 3, 4, 5, 6],
    syncEnabled: true,
    createdAt: now,
    updatedAt: now,
  });
  console.log('✓ Collection [userSettings] seeded');

  // 3. weeklyGoals
  await setDoc(doc(db, 'weeklyGoals', 'wg-1'), {
    goalId: 'wg-1',
    uid: userId,
    title: 'Ship PTA MVP & Core PWA Modules',
    description: 'Complete full execution engine, notifications, gamification & Firestore sync',
    priority: 'High',
    weekStart: '2026-07-27',
    weekEnd: '2026-08-02',
    status: 'Active',
    progress: 65,
    completedTasks: 8,
    totalTasks: 12,
    achievements: ['PWA Bootstrap', 'Firestore & Cloudinary Sync Active'],
    createdAt: now,
    updatedAt: now,
  });
  console.log('✓ Collection [weeklyGoals] seeded');

  // 4. dailyPlans
  await setDoc(doc(db, 'dailyPlans', `dp-${today}`), {
    planId: `dp-${today}`,
    uid: userId,
    date: today,
    title: 'High Focus Core Application Execution',
    goal: 'Complete session check-ins, verify Firestore & Cloudinary sync',
    notes: 'Stay accountable with session reminders and review daily progress.',
    overallPriority: 'High',
    completionPercentage: 35,
    completedTasks: 2,
    pendingTasks: 4,
    weeklyGoalIds: ['wg-1'],
    status: 'In Progress',
    createdAt: now,
    updatedAt: now,
  });
  console.log('✓ Collection [dailyPlans] seeded');

  // 5. sessions
  const sessions = [
    { sessionId: `sess-${today}-1`, name: 'Morning', order: 1, startTime: '08:00', endTime: '11:59', status: 'Active' },
    { sessionId: `sess-${today}-2`, name: 'Before Lunch', order: 2, startTime: '12:00', endTime: '13:59', status: 'Pending' },
    { sessionId: `sess-${today}-3`, name: 'Afternoon', order: 3, startTime: '14:00', endTime: '17:59', status: 'Pending' },
    { sessionId: `sess-${today}-4`, name: 'Evening', order: 4, startTime: '18:00', endTime: '20:59', status: 'Pending' },
    { sessionId: `sess-${today}-5`, name: 'Night', order: 5, startTime: '21:00', endTime: '23:59', status: 'Pending' },
  ];

  for (const s of sessions) {
    await setDoc(doc(db, 'sessions', s.sessionId), {
      ...s,
      uid: userId,
      dailyPlanId: `dp-${today}`,
      reminderTime: s.startTime,
      completionPercentage: 0,
      taskCount: 1,
      completedTaskCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log('✓ Collection [sessions] seeded');

  // 6. tasks
  const tasks = [
    {
      taskId: 't-1',
      dailyPlanId: `dp-${today}`,
      sessionId: `sess-${today}-1`,
      session: 'Morning',
      title: 'Connect Live Firebase & Firestore Database (pta-1-8f439)',
      description: 'Verify 13 flat collections and SDK initialization',
      priority: 'High',
      status: 'Completed',
    },
    {
      taskId: 't-2',
      dailyPlanId: `dp-${today}`,
      sessionId: `sess-${today}-1`,
      session: 'Morning',
      title: 'Integrate Cloudinary Image Transformations (n4elkdtt)',
      description: 'Setup auto-format, quality, and square crop URLs',
      priority: 'High',
      status: 'Completed',
    },
    {
      taskId: 't-3',
      dailyPlanId: `dp-${today}`,
      sessionId: `sess-${today}-2`,
      session: 'Before Lunch',
      title: 'Execute Session Progress Check-Ins',
      description: 'Log task completion, notes, and focus ratings',
      priority: 'High',
      status: 'In Progress',
    },
  ];

  for (const t of tasks) {
    await setDoc(doc(db, 'tasks', t.taskId), {
      ...t,
      uid: userId,
      weeklyGoalId: 'wg-1',
      estimatedMinutes: 45,
      expectedOutcome: 'Step completed',
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log('✓ Collection [tasks] seeded');

  // 7. dailyReports
  await setDoc(doc(db, 'dailyReports', `dr-${today}`), {
    reportId: `dr-${today}`,
    uid: userId,
    date: today,
    goal: 'Complete architecture readiness and initial component structure',
    totalTasks: 6,
    completedTasks: 5,
    pendingTasks: 1,
    completionPercentage: 83,
    achievements: ['Setup Constellation rules', 'Configured flat Firestore collections'],
    missedTasks: ['Optional semantic embeddings index'],
    reflection: 'High focus session execution during afternoon window.',
    generatedAt: now,
  });
  console.log('✓ Collection [dailyReports] seeded');

  // 8. weeklyReports
  await setDoc(doc(db, 'weeklyReports', 'wr-current'), {
    reportId: 'wr-current',
    uid: userId,
    weekStart: '2026-07-27',
    weekEnd: '2026-08-02',
    completedTasks: 28,
    pendingTasks: 4,
    completionPercentage: 88,
    achievements: ['Maintained 5-day streak', 'Unlocked Level 3 Productivity Master'],
    weeklyGoalSummary: 'Successfully laid foundation for PTA execution engine.',
    consistencyScore: 92,
    generatedAt: now,
  });
  console.log('✓ Collection [weeklyReports] seeded');

  // 9. achievements
  await setDoc(doc(db, 'achievements', 'ach-1'), {
    achievementId: 'ach-1',
    uid: userId,
    type: 'Streak',
    title: '5-Day Execution Streak',
    description: 'Completed planned sessions consistently for 5 consecutive days',
    xpEarned: 250,
    unlockedAt: now,
    iconName: 'Flame',
  });
  console.log('✓ Collection [achievements] seeded');

  // 10. xpHistory
  await setDoc(doc(db, 'xpHistory', 'xp-1'), {
    xpLogId: 'xp-1',
    uid: userId,
    amount: 250,
    source: 'streakBonus',
    sourceId: 'ach-1',
    reason: 'Achieved 5-day streak',
    timestamp: now,
  });
  console.log('✓ Collection [xpHistory] seeded');

  console.log('\n🎉 Successfully populated all live Firestore collections in pta-1-8f439!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
