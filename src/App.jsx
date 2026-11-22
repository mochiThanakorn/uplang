import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioLines, BarChart3, BookOpen, Check, CircleCheck,
  CircleHelp, Flame, Layers3, LogOut, RotateCcw, Shield, UserRound, Volume2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Stats } from "./Stats";
import { Admin } from "./Admin";
import { Login } from "./Login";
import { api, isConfigured, isDemo, logout, watchSession } from "./api";

const format = new Intl.NumberFormat("en-US");
const empty = { total: 5000, learned: 0, seen: 0, review: 0, streak: 0, round: 1 };

function Brand() {
  return <div className="flex items-center gap-3">
    <span className="grid size-10 place-items-center rounded-xl bg-primary text-white" aria-hidden="true"><BookOpen size={21} strokeWidth={2.4} /></span>
    <div><div className="brand-name">uplang<span>.</span></div><div className="mt-1 text-xs font-semibold tracking-[.16em] text-muted-foreground">OXFORD 5000</div></div>
  </div>;
}

function AccountProfile({ user, onLogout }) {
  const [failedPhoto, setFailedPhoto] = useState(null);
  const google = user.providerData.find((profile) => profile.providerId === "google.com");
  const name = google?.displayName?.trim() || user.displayName?.trim() || user.email || "บัญชี Google";
  const photo = google?.photoURL || user.photoURL;

  return <div className="account-profile flex min-w-0 items-center justify-end gap-2">
    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-100 text-primary">
      {photo && photo !== failedPhoto
        ? <img className="size-full object-cover" src={photo} alt="" referrerPolicy="no-referrer" onError={() => setFailedPhoto(photo)} />
        : <UserRound size={17} aria-hidden="true" />}
    </span>
    <span className="min-w-0 truncate text-sm font-semibold" title={name}>{name}</span>
    <Button variant="outline" className="shrink-0" aria-label="ออกจากระบบ" title="ออกจากระบบ" onClick={onLogout}>
      <LogOut size={16} aria-hidden="true" /><span className="hidden lg:inline">ออกจากระบบ</span>
    </Button>
  </div>;
}

function Progress({ summary }) {
  const { learned, total, review, streak, round } = summary;
  const progress = (learned / total) * 100;
  const displayProgress = progress < 0.1 && progress > 0 ? "<0.1" : Number(progress.toFixed(1));
  return <aside className="progress-stack" aria-label="ความคืบหน้า">
    <Card className="p-5">
      <div className="flex items-center gap-2.5"><span className="stat-icon bg-neutral-100 text-primary"><Layers3 size={17} /></span><h2 className="font-semibold">ความคืบหน้า</h2><span className="ml-auto text-xs text-muted-foreground">รอบ {round}</span></div>
      <div className="mt-5 flex items-baseline gap-1.5"><strong className="metric">{format.format(learned)}</strong><span className="text-sm text-muted-foreground">/ {format.format(total)} คำ</span></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-label="คำที่ตอบถูกในรอบนี้" aria-valuenow={learned} aria-valuemax={total}>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%`, minWidth: learned ? 4 : 0 }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>ตอบถูกในรอบนี้</span><span className="font-semibold text-primary">{displayProgress}%</span></div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm"><span className="flex items-center gap-2 text-muted-foreground"><RotateCcw size={15} />รอทบทวน</span><strong>{format.format(review)}</strong></div>
    </Card>
    <Card className="flex items-center gap-3 p-4">
      <span className="stat-icon size-10 bg-neutral-100 text-neutral-800"><Flame size={20} /></span>
      <div><p className="text-sm font-semibold">ตอบถูกต่อเนื่อง</p><p className="mt-0.5 text-xs text-muted-foreground">จำนวนข้อที่ตอบถูกติดกัน</p></div>
      <strong className="ml-auto text-2xl tabular-nums">{format.format(streak)}</strong>
    </Card>
    <div className="guide">
      <div className="flex items-center gap-2 font-semibold text-neutral-900"><CircleHelp size={17} /> วิธีฝึก</div>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">คำที่ตอบผิดจะสุ่มกลับมาให้ลองใหม่ ส่วนคำที่ตอบถูกจะพักไว้จนจบรอบ</p>
    </div>
  </aside>;
}

export function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (!isConfigured) return;
    let generation = 0;
    const unsubscribe = watchSession(async (user) => {
      const current = ++generation;
      if (!user || user.isAnonymous) {
        setSession({ user, admin: false });
        return;
      }
      setSession((previous) => previous?.user?.uid === user.uid ? previous : { user, admin: false });
      const token = await user.getIdTokenResult().catch(() => null);
      if (current === generation) setSession({ user, admin: token?.claims.admin === true });
    });
    return () => { generation++; unsubscribe(); };
  }, []);

  if (isDemo) return <QuizApp />;
  if (!isConfigured) return <Login unavailable />;
  if (!session) return <Login loading />;
  if (!session.user || session.user.isAnonymous) return <Login anonymous={session.user?.isAnonymous} />;
  return <QuizApp key={session.user.uid} session={session} />;
}

function currentPage() {
  if (location.hash === "#admin") return "admin";
  return location.hash === "#stats" ? "stats" : "quiz";
}

function QuizApp({ session }) {
  const [page, setPage] = useState(currentPage);
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const busy = useRef(false);
  const questionHeading = useRef(null);
  const actionButton = useRef(null);
  const loadedPage = useRef(null);

  const load = useCallback(async (action, input) => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      const response = await api(action, input);
      if (action === "stats") setStats(response);
      else {
        setData(response);
        setAudioError(false);
        if (action === "next") requestAnimationFrame(() => questionHeading.current?.focus());
        if (action === "answer") requestAnimationFrame(() => actionButton.current?.focus());
      }
    } catch (failure) {
      if (failure.status === 409) {
        try {
          const current = await api("question");
          setData(current);
        } catch { /* Keep the previous question visible while the user retries. */ }
      }
      setError(failure.message);
    } finally {
      setPending(false);
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => setPage(currentPage());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (page !== "admin" && !pending && loadedPage.current !== page) {
      loadedPage.current = page;
      void load(page === "stats" ? "stats" : "question");
    }
  }, [page, pending, load]);

  const { question, result, summary = empty } = data ?? {};
  const selectedSummary = page === "stats" ? stats?.summary ?? summary : summary;
  const answer = useCallback((choice) => {
    if (question && !result) void load("answer", { id: question.id, choice });
  }, [question, result, load]);
  const next = useCallback(() => {
    if (question && result) void load("next", { id: question.id });
  }, [question, result, load]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (page !== "quiz" || !question || pending || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && (event.target.closest("input, textarea, select, [contenteditable]"))) return;
      if (!result && /^[1-8]$/.test(event.key)) answer(event.key);
      if (result && event.key === "Enter" && !event.target.closest?.("button, a")) next();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [page, question, pending, result, answer, next]);

  function speak() {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return setAudioError(true);
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(question.word);
    speech.lang = "en-GB";
    speech.rate = 0.85;
    speech.onerror = (event) => { if (!["canceled", "interrupted"].includes(event.error)) setAudioError(true); };
    window.speechSynthesis.speak(speech);
  }

  async function leave() {
    setLogoutError(false);
    try { await logout(); } catch { setLogoutError(true); }
  }

  return <div className="app">
    <header className="topbar">
      <div className="topbar-inner">
        <a href="#quiz" aria-label="Uplang หน้าฝึกคำศัพท์"><Brand /></a>
        <nav className="navigation" aria-label="เมนูหลัก">
          <a href="#quiz" className={cn("nav-link", page === "quiz" && "active")} aria-current={page === "quiz" ? "page" : undefined}><BookOpen size={17} /> ฝึกคำศัพท์</a>
          <a href="#stats" className={cn("nav-link", page === "stats" && "active")} aria-current={page === "stats" ? "page" : undefined}><BarChart3 size={17} /> สถิติ</a>
          {session?.admin && <a href="#admin" className={cn("nav-link", page === "admin" && "active")} aria-current={page === "admin" ? "page" : undefined}><Shield size={17} /> แอดมิน</a>}
        </nav>
        {session ? <AccountProfile user={session.user} onLogout={leave} /> : <Badge variant="outline" className="mode">โหมดในเครื่อง</Badge>}
      </div>
    </header>

    {logoutError && <p className="mx-auto mt-4 text-sm text-foreground" role="alert">ออกจากระบบไม่สำเร็จ กรุณาลองใหม่</p>}
    {page === "admin" ? <main className="layout wide-layout">
      {session?.admin ? <Admin /> : <Card className="p-6">หน้านี้สำหรับผู้ดูแลระบบ</Card>}
    </main> :
    <main className="layout">
      <div className="content">
        <div className="page-heading">
          <div><p className="eyebrow" lang="en">{page === "quiz" ? "YOUR DAILY PRACTICE" : "YOUR LEARNING JOURNEY"}</p><h1>{page === "quiz" ? "ฝึกคำศัพท์" : "สถิติคำศัพท์"}</h1>
            <p>{page === "quiz" ? "อ่านประโยคตัวอย่าง แล้วเลือกคำแปลภาษาไทยที่ตรงกับคำศัพท์" : session?.user.email ?? "ดูจำนวนครั้งที่ตอบถูกและผิดของแต่ละคำ"}</p></div>
        </div>

        {error && <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 border-neutral-300 p-4 text-sm text-foreground" role="alert">
          {error}<Button variant="outline" onClick={() => load(page === "stats" ? "stats" : "question")}>โหลดใหม่</Button>
        </Card>}

        {page === "stats" ? <Stats data={stats} loading={pending || !error} />
          : question ? <>
            <Card className="quiz-card">
              <div className="word-panel">
                <div className="flex items-center justify-between gap-2">
                  <span className="word-meta"><AudioLines size={15} /> คำศัพท์ภาษาอังกฤษ</span>
                  <Badge variant="outline" className="level">{question.level}</Badge>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <h2 ref={questionHeading} tabIndex={-1} className="word-title" lang="en">{question.word}</h2>
                  <Button size="icon" variant="outline" className="speaker" onClick={speak} aria-label={`ฟังการออกเสียง ${question.word}`}><Volume2 size={19} /></Button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1"><span lang="en" className="pos">{question.pos}</span>{question.context && <span lang="en" className="pos">{question.context}</span>}</div>
                {question.example && <div className="example-panel">
                  <p className="text-xs font-semibold text-primary">ประโยคตัวอย่าง</p>
                  <p className="mt-1.5 text-base leading-relaxed" lang="en">{question.example}</p>
                  {result?.exampleTh && (
                    <div className="mt-3 border-t border-border pt-3" lang="th">
                      <p className="text-xs font-semibold text-primary">คำแปลภาษาไทย</p>
                      <p className="mt-1.5 text-base leading-relaxed">{result.exampleTh}</p>
                    </div>
                  )}
                </div>}
                {audioError && <p className="mt-2 text-xs text-muted-foreground" role="status">เบราว์เซอร์นี้เล่นเสียงคำศัพท์ไม่ได้</p>}
              </div>

              <div className="answer-panel">
                <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-semibold">เลือกคำแปลภาษาไทย</h3><span className="text-xs font-medium text-muted-foreground">{question.options.length} ตัวเลือก</span></div>
                <div className="choice-grid">
                  {question.options.map(({ key, label }) => {
                    const highlight = result?.correct === key ? "right" : result?.selected === key ? "wrong" : "";
                    return <Button variant="outline" className={cn("choice h-auto justify-start font-normal", highlight)} key={key} disabled={pending || Boolean(result)} onClick={() => answer(key)}>
                      <span className="choice-index" aria-hidden="true">{key}</span>
                      <span lang="th">{label}</span>
                      {highlight === "right" && <Check className="ml-auto shrink-0" size={16} aria-label="คำตอบที่ถูก" />}
                      {highlight === "wrong" && <X className="ml-auto shrink-0" size={16} aria-label="คำตอบที่เลือก" />}
                    </Button>;
                  })}
                </div>
                {result && <div className={cn("feedback", result.correct === result.selected ? "success" : "retry")} role="status">
                  {result.correct === result.selected ? <CircleCheck size={19} /> : <RotateCcw size={17} />}
                  <div><p className="font-semibold">{summary.complete ? "ฝึกครบทุกคำแล้ว" : result.correct === result.selected ? "ตอบถูก!" : "คำนี้จะกลับมาให้ทบทวน"}</p><p className="mt-0.5 text-sm" lang="th"><span lang="en">{question.word}</span> · {result.meaning}</p></div>
                </div>}
              </div>
            </Card>
            <div className="quiz-footer">
              <span className="keyboard-hint hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><kbd>1</kbd><span>ถึง</span><kbd>8</kbd><span className="ml-1">เพื่อเลือกคำตอบ</span></span>
              {result && <Button ref={actionButton} className="ml-auto" disabled={pending} onClick={next}>{summary.complete ? "เริ่มรอบใหม่" : "คำถัดไป"}</Button>}
            </div>
          </> : <Card className="grid min-h-64 place-items-center p-8 text-sm text-muted-foreground" role="status">{pending || !error ? "กำลังโหลดคำถาม…" : "ยังโหลดคำถามไม่ได้"}</Card>}
      </div>
      <Progress summary={selectedSummary} />
    </main>}

    <footer className="site-footer"><span className="footer-brand">uplang. <span>เรียนรู้วันละนิด ไปได้อีกไกล</span></span><a href="https://www.oxfordlearnersdictionaries.com/about/wordlists/oxford3000-5000" target="_blank" rel="noreferrer">รายการคำศัพท์ Oxford 5000</a></footer>
  </div>;
}
