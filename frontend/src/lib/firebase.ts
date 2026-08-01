/**
 * Frontend must NOT initialize Firebase Auth/Firestore with credentials.
 * Auth + DB go through the backend API only.
 * FCM may fetch ephemeral web config from the backend at runtime.
 */

export const isFirebaseConfigured = false;
export const auth = null;
export const db = null;
export default null;
