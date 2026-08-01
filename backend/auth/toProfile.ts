type Decoded = { uid: string; email?: string; name?: string };

/** Build a minimal PTA profile from Firebase Auth identity. */
export function toProfile(decoded: Decoded, fullName?: string) {
  const now = new Date().toISOString();
  return {
    uid: decoded.uid,
    email: decoded.email || '',
    fullName: fullName || decoded.name || (decoded.email || 'User').split('@')[0],
    createdAt: now,
    updatedAt: now,
    timezone: 'UTC',
    notificationPermission: false,
    pwaInstalled: false,
    streak: 0,
    totalXP: 0,
    level: 1,
    lastActiveDate: now.split('T')[0],
    onboardingCompleted: false,
  };
}
