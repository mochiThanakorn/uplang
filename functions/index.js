import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { createQuiz, QuizError } from "./quiz.js";
import catalog from "./catalog.js";

initializeApp();
const quiz = createQuiz(catalog);
const db = getFirestore();
const users = db.collection("quizUsers");
const profiles = db.collection("quizProfiles");
const PAGE_SIZE = 25;
const routes = new Map([
  ["GET /api/question", "question"],
  ["POST /api/answer", "answer"],
  ["POST /api/next", "next"],
  ["GET /api/stats", "stats"],
  ["GET /api/admin/users", "adminUsers"],
  ["GET /api/admin/history", "adminHistory"],
]);

function validUid(value) {
  return typeof value === "string" && value.length <= 128 && /^[^/]+$/.test(value)
    && value !== "." && value !== ".." && !/^__.*__$/.test(value);
}

async function listProfiles(after) {
  let query = profiles.orderBy("__name__").limit(PAGE_SIZE + 1);
  if (after !== undefined) {
    if (!validUid(after)) throw new QuizError(400, "ตำแหน่งรายการผู้ใช้ไม่ถูกต้อง");
    query = query.startAfter(after);
  }
  const { docs } = await query.get();
  const page = docs.slice(0, PAGE_SIZE);
  return {
    users: page.map((doc) => ({ uid: doc.id, email: doc.get("email") })),
    next: docs.length > PAGE_SIZE ? page.at(-1).id : null,
  };
}

async function readHistory(uid) {
  if (!validUid(uid)) throw new QuizError(400, "รหัสผู้ใช้ไม่ถูกต้อง");
  const [profile, progress] = await db.getAll(profiles.doc(uid), users.doc(uid));
  if (!profile.exists || !progress.exists) throw new QuizError(404, "ไม่พบประวัติของผู้ใช้");
  return { email: profile.get("email"), ...quiz.run(progress.get("state"), "stats").response };
}

export const quizApi = onRequest({ region: "asia-southeast1", maxInstances: 10 }, async (req, res) => {
  res.set("Cache-Control", "private, no-store");
  const action = routes.get(`${req.method} ${req.path}`);
  if (!action) return res.status(404).json({ error: "ไม่พบ API ที่ระบุ" });
  const token = req.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบอีกครั้ง" });

  let identity;
  try {
    identity = await getAuth().verifyIdToken(token);
  } catch {
    return res.status(401).json({ error: "กรุณาเข้าสู่ระบบอีกครั้ง" });
  }
  const { uid, email, email_verified, firebase, admin } = identity;
  const googleAccount = email_verified === true && typeof email === "string"
    && Boolean(firebase?.identities?.["google.com"]?.length);
  if (!googleAccount) return res.status(403).json({ error: "กรุณาเข้าสู่ระบบด้วย Google" });

  const adminAction = action === "adminUsers" || action === "adminHistory";
  if (adminAction && admin !== true) return res.status(403).json({ error: "หน้านี้สำหรับผู้ดูแลระบบ" });

  const input = req.body ?? {};
  if ((action === "answer" || action === "next") && typeof input.id !== "string") {
    return res.status(400).json({ error: "ไม่พบหมายเลขคำถาม" });
  }

  const ref = users.doc(uid);
  try {
    if (action === "adminUsers") return res.json(await listProfiles(req.query.after));
    if (action === "adminHistory") return res.json(await readHistory(req.query.uid));
    const response = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const { state, response } = quiz.run(snapshot.data()?.state, action, input);
      const emailChanged = email !== snapshot.get("email");
      if (emailChanged || action === "answer" || action === "next") {
        transaction.set(ref, { state, email }, { mergeFields: ["state", "email"] });
      }
      if (emailChanged) transaction.set(profiles.doc(uid), { email });
      return response;
    });
    return res.json(response);
  } catch (error) {
    if (error instanceof QuizError) return res.status(error.status).json({ error: error.message });
    logger.error(error);
    return res.status(500).json({ error: "บันทึกหรือโหลดข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง" });
  }
});
