import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isDemo = import.meta.env.DEV && !config.projectId;
export const isConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

const auth = isConfigured ? getAuth(initializeApp(config)) : null;
if (auth && import.meta.env.VITE_FIREBASE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

let pendingSignIn;
async function getUser() {
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  pendingSignIn ??= signInAnonymously(auth).then((credential) => credential.user)
    .finally(() => { pendingSignIn = undefined; });
  return pendingSignIn;
}

export async function api(action, input) {
  if (import.meta.env.DEV && isDemo) {
    const { demoApi } = await import("./demo");
    return demoApi(action, input);
  }

  const token = await (await getUser()).getIdToken();
  const response = await fetch(`/api/${action}`, {
    method: input ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, ...(input ? { "Content-Type": "application/json" } : {}) },
    body: input ? JSON.stringify(input) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error ?? "เชื่อมต่อกับเซิร์ฟเวอร์ไม่สำเร็จ");
    error.status = response.status;
    throw error;
  }
  return data;
}
