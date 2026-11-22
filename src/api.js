import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, GoogleAuthProvider, linkWithPopup, onIdTokenChanged, signInWithPopup, signOut } from "firebase/auth";

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

export function watchSession(callback) {
  return onIdTokenChanged(auth, callback);
}

export function loginWithGoogle(useExistingAccount = false) {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const user = auth.currentUser;
  return user?.isAnonymous && !useExistingAccount
    ? linkWithPopup(user, provider)
    : signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}

export async function api(action, input) {
  if (import.meta.env.DEV && isDemo) {
    const { demoApi } = await import("./demo");
    return demoApi(action, input);
  }

  const user = auth?.currentUser;
  if (!user || user.isAnonymous) throw new Error("กรุณาเข้าสู่ระบบด้วย Google");
  const token = await user.getIdToken();
  const response = await fetch(`/api/${action}`, {
    cache: "no-store",
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
