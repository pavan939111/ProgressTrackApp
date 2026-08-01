export type SyncItem = {
  collection: string;
  docId: string;
  data: object;
  queuedAt: string;
};

const QUEUE_KEY = 'pta_offline_sync_queue';

export function getSyncQueue(): SyncItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as SyncItem[];
  } catch {
    return [];
  }
}

export function enqueueSync(item: Omit<SyncItem, 'queuedAt'>) {
  if (typeof window === 'undefined') return;
  const q = getSyncQueue();
  // Dedupe same doc — keep newest payload
  const filtered = q.filter((x) => !(x.collection === item.collection && x.docId === item.docId));
  filtered.push({ ...item, queuedAt: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered.slice(-200)));
  try {
    window.dispatchEvent(new Event('pta-sync-queue'));
  } catch {
    /* ignore */
  }
}

export function clearSyncQueue() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Last-write-wins by updatedAt (BR conflict rule).
 * Returns the newer record, or `remote` if local missing, or `local` if remote missing.
 */
export function resolveConflict<T extends { updatedAt?: string }>(
  local: T | null | undefined,
  remote: T | null | undefined
): T | null {
  if (!local && !remote) return null;
  if (!local) return remote || null;
  if (!remote) return local;
  const lt = local.updatedAt ? Date.parse(local.updatedAt) : 0;
  const rt = remote.updatedAt ? Date.parse(remote.updatedAt) : 0;
  return rt >= lt ? remote : local;
}

/** Flush queue when online + Firebase available (best-effort). */
export async function flushSyncQueue(
  writer: (collection: string, docId: string, data: object) => Promise<void>
) {
  const q = getSyncQueue();
  if (!q.length) return { flushed: 0, remaining: 0 };
  const remaining: SyncItem[] = [];
  let flushed = 0;
  for (const item of q) {
    try {
      await writer(item.collection, item.docId, item.data);
      flushed++;
    } catch {
      remaining.push(item);
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  try {
    window.dispatchEvent(new Event('pta-sync-queue'));
  } catch {
    /* ignore */
  }
  return { flushed, remaining: remaining.length };
}
