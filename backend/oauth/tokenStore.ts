import fs from 'fs';
import path from 'path';

export type OAuthProvider = 'google';

export type OAuthTokenRecord = {
  uid: string;
  provider: OAuthProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  email?: string;
  scope?: string;
  updatedAt: string;
};

const dataDir = path.join(process.cwd(), '.data');
const filePath = path.join(dataDir, 'oauth-tokens.json');

function ensure() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}', 'utf8');
}

function readAll(): Record<string, OAuthTokenRecord> {
  try {
    ensure();
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, OAuthTokenRecord>;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, OAuthTokenRecord>) {
  ensure();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function key(uid: string, provider: OAuthProvider) {
  return `${uid}__${provider}`;
}

export const tokenStore = {
  save(record: OAuthTokenRecord) {
    const all = readAll();
    all[key(record.uid, record.provider)] = record;
    writeAll(all);
  },

  get(uid: string, provider: OAuthProvider): OAuthTokenRecord | null {
    return readAll()[key(uid, provider)] || null;
  },

  remove(uid: string, provider: OAuthProvider) {
    const all = readAll();
    delete all[key(uid, provider)];
    writeAll(all);
  },

  listForUser(uid: string): OAuthTokenRecord[] {
    return Object.values(readAll()).filter((r) => r.uid === uid);
  },
};
