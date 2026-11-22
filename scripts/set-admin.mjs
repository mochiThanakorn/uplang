import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [projectId, email, action] = process.argv.slice(2);
if (!projectId || !email || !["grant", "revoke"].includes(action)) {
  console.error("Usage: node scripts/set-admin.mjs PROJECT_ID GOOGLE_EMAIL grant|revoke");
  process.exit(1);
}

initializeApp({ projectId });
const auth = getAuth();
const user = await auth.getUserByEmail(email);
if (action === "grant" && (!user.emailVerified || !user.providerData.some(({ providerId }) => providerId === "google.com"))) {
  throw new Error("The account must have a verified Google sign-in before receiving admin access.");
}
const claims = { ...user.customClaims };
if (action === "grant") claims.admin = true;
else delete claims.admin;
await auth.setCustomUserClaims(user.uid, claims);
console.log(action === "grant" ? "Admin access granted." : "Admin access removed from future ID tokens.");
