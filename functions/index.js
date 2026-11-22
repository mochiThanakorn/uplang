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
const routes = new Map([
  ["GET /api/question", "question"],
  ["POST /api/answer", "answer"],
  ["POST /api/next", "next"],
  ["GET /api/stats", "stats"],
]);

export const quizApi = onRequest({ region: "asia-southeast1", maxInstances: 10 }, async (req, res) => {
  res.set("Cache-Control", "private, no-store");
  const action = routes.get(`${req.method} ${req.path}`);
  if (!action) return res.status(404).json({ error: "ไม่พบ API ที่ระบุ" });
  const token = req.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: "กรุณาเข้าสู่ระบบอีกครั้ง" });

  let uid;
  try {
    ({ uid } = await getAuth().verifyIdToken(token));
  } catch {
    return res.status(401).json({ error: "กรุณาเข้าสู่ระบบอีกครั้ง" });
  }

  const input = req.body ?? {};
  if ((action === "answer" || action === "next") && typeof input.id !== "string") {
    return res.status(400).json({ error: "ไม่พบหมายเลขคำถาม" });
  }

  const ref = db.collection("quizUsers").doc(uid);
  try {
    const response = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const { state, response } = quiz.run(snapshot.data()?.state, action, input);
      if (!snapshot.exists || action === "answer" || action === "next") {
        transaction.set(ref, { state });
      }
      return response;
    });
    return res.json(response);
  } catch (error) {
    if (error instanceof QuizError) return res.status(error.status).json({ error: error.message });
    logger.error(error);
    return res.status(500).json({ error: "บันทึกหรือโหลดข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง" });
  }
});
