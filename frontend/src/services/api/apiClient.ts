function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.replace(/\/$/, '');
  }
  return 'http://localhost:3001';
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const baseUrl = getBaseUrl();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = path.startsWith('http') ? path : `${baseUrl}${cleanPath}`;

    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    const json = await res.json();
    return json;
  } catch (error: any) {
    console.warn('API call failed, falling back gracefully', { path, error: error?.message || error });
    return { success: false, message: error.message };
  }
}

export const apiClient = {
  getDashboard: () => apiFetch('/api/dashboard'),
  getTodayPlan: () => apiFetch('/api/daily-plans/today'),
  getWeeklyGoals: () => apiFetch('/api/weekly-goals'),
  getProfile: () => apiFetch('/api/user/profile'),
  getSettings: () => apiFetch('/api/user/settings'),
  getCalendar: () => apiFetch('/api/calendar'),
  getAchievements: () => apiFetch('/api/achievements'),

  completeTask: (taskId: string, logData?: any) =>
    apiFetch(`/api/tasks/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify(logData || {}),
    }),

  saveDailyPlan: (planPayload: any) =>
    apiFetch('/api/daily-plans', {
      method: 'POST',
      body: JSON.stringify(planPayload),
    }),

  saveWeeklyGoal: (goalPayload: any) =>
    apiFetch('/api/weekly-goals', {
      method: 'POST',
      body: JSON.stringify(goalPayload),
    }),
};
