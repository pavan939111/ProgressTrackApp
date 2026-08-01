import fs from 'fs';
import path from 'path';

export type DeviceToken = {
  uid: string;
  token: string;
  platform: 'web';
  updatedAt: string;
};

const dataDir = path.join(process.cwd(), '.data');
const filePath = path.join(dataDir, 'fcm-tokens.json');

function ensure() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}', 'utf8');
}

function readAll(): Record<string, DeviceToken[]> {
  try {
    ensure();
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, DeviceToken[]>) {
  ensure();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export const fcmTokenStore = {
  register(uid: string, token: string) {
    const all = readAll();
    const list = all[uid] || [];
    const filtered = list.filter((t) => t.token !== token);
    filtered.push({ uid, token, platform: 'web', updatedAt: new Date().toISOString() });
    all[uid] = filtered.slice(-10);
    writeAll(all);
  },

  list(uid: string): DeviceToken[] {
    return readAll()[uid] || [];
  },

  remove(uid: string, token: string) {
    const all = readAll();
    all[uid] = (all[uid] || []).filter((t) => t.token !== token);
    writeAll(all);
  },
};
