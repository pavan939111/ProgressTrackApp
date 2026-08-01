import { UserProfile, UserSettings } from '../src/types';
import { dbService } from '../database/dbService';

export const userService = {
  getProfile(): UserProfile {
    return dbService.getUserProfile();
  },

  updateProfile(updates: Partial<UserProfile>): UserProfile {
    return dbService.updateUserProfile(updates);
  },

  getSettings(): UserSettings {
    return dbService.getUserSettings();
  },

  updateSettings(updates: Partial<UserSettings>): UserSettings {
    return dbService.updateUserSettings(updates);
  },

  getXPStatus() {
    const profile = dbService.getUserProfile();
    return {
      totalXP: profile.totalXP,
      level: profile.level,
      streak: profile.streak,
    };
  },
};
