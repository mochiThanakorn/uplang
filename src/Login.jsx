import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { loginWithGoogle } from "./api";

const messages = {
  "auth/popup-blocked": "เบราว์เซอร์ปิดกั้นหน้าต่างเข้าสู่ระบบ กรุณาอนุญาตป๊อปอัปแล้วลองอีกครั้ง",
  "auth/popup-closed-by-user": "หน้าต่างเข้าสู่ระบบถูกปิด ลองอีกครั้งได้เลย",
  "auth/network-request-failed": "เชื่อมต่อไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง",
  "auth/operation-not-allowed": "ยังไม่ได้เปิดการเข้าสู่ระบบด้วย Google สำหรับแอปนี้",
  "auth/unauthorized-domain": "โดเมนนี้ยังไม่ได้รับอนุญาตให้เข้าสู่ระบบ",
};

export function Login({ loading, unavailable, anonymous }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState(false);

  async function login() {
    setPending(true);
    setError("");
    try {
      await loginWithGoogle(existing);
    } catch (failure) {
      if (anonymous && failure.code === "auth/credential-already-in-use") {
        setExisting(true);
        setError("บัญชี Google นี้มีประวัติอยู่แล้ว คุณเข้าสู่บัญชีเดิมได้ ประวัติจากโหมดผู้เยี่ยมชมจะไม่ถูกรวม");
      } else {
        setError(messages[failure.code] ?? "เข้าสู่ระบบไม่ได้ กรุณาลองอีกครั้ง");
      }
    } finally {
      setPending(false);
    }
  }

  return <main className="grid min-h-svh place-items-center px-4 py-8">
    <Card className="w-full max-w-md p-8 sm:p-10">
      <span className="grid size-12 place-items-center rounded-xl bg-primary text-white" aria-hidden="true"><BookOpen size={24} /></span>
      <p className="brand-name mt-5">uplang<span>.</span></p>
      <h1 className="mt-3 text-2xl font-semibold">เข้าสู่ระบบ</h1>
      <p className="mt-2 text-muted-foreground">ใช้บัญชี Google เพื่อบันทึกความคืบหน้าและดูประวัติคำศัพท์ได้จากทุกอุปกรณ์</p>
      {anonymous && <p className="mt-3 text-sm text-muted-foreground">เชื่อมบัญชี Google ใหม่เพื่อเก็บความคืบหน้าจากโหมดผู้เยี่ยมชมบนเบราว์เซอร์นี้</p>}
      {loading ? <p className="mt-6" role="status">กำลังตรวจสอบบัญชี…</p>
        : unavailable ? <p className="mt-6" role="alert">ยังไม่ได้ตั้งค่า Firebase สำหรับเว็บไซต์นี้</p>
        : <Button className="mt-6 w-full" disabled={pending} onClick={login}>
          {pending ? "กำลังเชื่อมต่อ…" : existing ? "เข้าสู่บัญชี Google เดิม" : "เข้าสู่ระบบด้วย Google"}
        </Button>}
      {error && <p className="mt-3 text-sm text-rose-800" role="alert">{error}</p>}
    </Card>
  </main>;
}
