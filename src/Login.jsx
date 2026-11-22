import { useState } from "react";
import { BookOpen, Check, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WordTypeBadge, ExampleSentence } from "@/components/learning-cues";
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

  return <main className="login-layout">
    <section className="login-story" aria-label="เกี่ยวกับ Uplang">
      <div className="login-brand"><BookOpen aria-hidden="true" /><span className="brand-name">uplang.</span><Badge variant="outline" className="login-collection">Oxford 5000</Badge></div>
      <div className="login-story-content">
        <Badge variant="outline" className="login-intro-badge">คำศัพท์ใหม่ โลกใบใหม่</Badge>
        <h1 lang="en">A new word.<br /><em>A new possibility.</em></h1>
        <p>ค่อย ๆ เรียนรู้ แล้วไปได้ไกลกว่าเดิม<br />ฝึกคำศัพท์ Oxford 5000 ในจังหวะของคุณ</p>
        <Card className="login-word-preview" aria-label="ตัวอย่างคำศัพท์">
          <div className="preview-word-meta"><span lang="en">A WORD TO START YOUR DAY</span><Badge variant="outline">B2</Badge></div>
          <div className="preview-word-heading"><span lang="en">possibility</span><Volume2 size={20} aria-hidden="true" /></div>
          <div className="preview-word-pos"><WordTypeBadge pos="noun" /><span lang="th">ความเป็นไปได้</span></div>
          <p className="preview-word-example" lang="en"><ExampleSentence text="Every new word opens up a new possibility." word="possibility" /></p>
          <div className="preview-word-caption"><Check size={16} aria-hidden="true" /> เริ่มจากคำเดียว แล้วค่อย ๆ เติบโตไปทุกวัน</div>
        </Card>
      </div>
      <div className="login-story-footer"><span>OXFORD 5000</span><span>พื้นที่เล็ก ๆ สำหรับการเรียนรู้ทุกวัน</span></div>
    </section>
    <section className="login-main" aria-label="เข้าสู่ระบบ">
      <Card className="login-card">
        <CardHeader>
          <span className="login-welcome-icon" aria-hidden="true"><BookOpen size={23} /></span>
          <p className="eyebrow" lang="en">YOUR NEXT CHAPTER STARTS HERE</p>
          <CardTitle>ยินดีต้อนรับสู่ uplang.</CardTitle>
          <CardDescription>ฝึกคำศัพท์วันละนิด และเก็บความคืบหน้าไว้ในบัญชีของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          {anonymous && <p className="mb-5 text-sm leading-relaxed text-muted-foreground">เชื่อมบัญชี Google ใหม่เพื่อเก็บความคืบหน้าจากโหมดผู้เยี่ยมชมบนเบราว์เซอร์นี้</p>}
          {loading ? <p role="status">กำลังตรวจสอบบัญชี…</p>
            : unavailable ? <p role="alert">ยังไม่ได้ตั้งค่า Firebase สำหรับเว็บไซต์นี้</p>
            : <Button className="w-full" disabled={pending} onClick={login}>
              <svg aria-hidden="true" className="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36ZM12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.59A10 10 0 0 0 12 22ZM6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.05a10 10 0 0 0 0 9.02l3.35-2.59ZM12 5.96c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.49l3.35 2.59A5.98 5.98 0 0 1 12 5.96Z" /></svg>
              {pending ? "กำลังเชื่อมต่อ…" : existing ? "เข้าสู่บัญชี Google เดิม" : "เข้าสู่ระบบด้วย Google"}
            </Button>}
          {error && <p className="mt-4 rounded-lg border border-border bg-muted p-3 text-sm leading-relaxed" role="alert">{error}</p>}
          <p className="login-note">เรียนรู้จากประโยคจริง · ทบทวนคำที่ยังไม่แม่น<br />บันทึกความคืบหน้าไว้ในบัญชีของคุณ</p>
        </CardContent>
      </Card>
    </section>
  </main>;
}
