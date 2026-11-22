import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BarChart3, Check, Search, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { WordTypeBadge } from "@/components/learning-cues";

const PAGE_SIZE = 12;
const number = new Intl.NumberFormat("en-US");

export function Stats({ data, loading, readOnly = false }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("wrong");
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => {
    if (!data) return [];
    const search = query.trim().toLowerCase();
    return data.rows.filter((row) => row.word.toLowerCase().includes(search)).sort((a, b) => {
      const byWord = a.word.localeCompare(b.word, "en") || a.pos.localeCompare(b.pos, "en");
      return sort === "word" ? byWord : b[sort] - a[sort] || byWord;
    });
  }, [data, query, sort]);

  if (!data) return <Card className="grid min-h-64 place-items-center p-8 text-sm text-muted-foreground" role="status">{loading ? "กำลังโหลดสถิติ…" : "ยังโหลดสถิติไม่ได้"}</Card>;

  const { correct, wrong } = data.summary;
  const total = correct + wrong;
  const lastPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);
  const index = Math.min(page, lastPage);
  const visible = filtered.slice(index * PAGE_SIZE, (index + 1) * PAGE_SIZE);

  return <>
    <div className="stats-metrics">
      {[
        { label: "ตอบถูก", value: number.format(correct), Icon: Check, tone: "cue-success" },
        { label: "ตอบผิด", value: number.format(wrong), Icon: X, tone: "cue-error" },
        { label: "ความแม่นยำ", value: total ? `${Math.round((correct / total) * 100)}%` : "—", Icon: Target, tone: "cue-learning" },
      ].map(({ label, value, Icon, tone }) => <Card className="stat-summary" key={label}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className={`stat-icon ${tone}`}><Icon size={15} /></span>{label}</div><strong className="metric block pt-2">{value}</strong>
      </Card>)}
    </div>
    <Card className="overflow-hidden">
      <div className="stats-controls">
        <h2 className="font-semibold">ประวัติรายคำ</h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-3 text-muted-foreground" size={16} />
            <Input className="pl-9 sm:w-40" aria-label="ค้นหาคำศัพท์" placeholder="ค้นหาคำศัพท์" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} />
          </label>
          <select className="h-10 rounded-lg border border-border bg-white px-2 text-sm" aria-label="เรียงตาม" value={sort} onChange={(event) => { setSort(event.target.value); setPage(0); }}>
            <option value="wrong">ผิดมากสุด</option>
            <option value="correct">ถูกมากสุด</option>
            <option value="word">A–Z</option>
          </select>
        </div>
      </div>
      {visible.length ? <>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="ตารางประวัติรายคำ">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th scope="col">คำศัพท์</th><th scope="col">ระดับ</th><th scope="col" className="text-right">ถูก</th><th scope="col" className="text-right">ผิด</th></tr></thead>
            <tbody>{visible.map((row) => <tr key={row.id} className="border-b border-border">
              <td lang="en"><div className="font-semibold">{row.word}</div><div className="mt-1.5 flex flex-wrap items-center gap-1.5"><WordTypeBadge pos={row.pos} />{row.context && <span className="text-xs text-muted-foreground">{row.context}</span>}</div></td>
              <td><Badge variant="outline" className="level">{row.level}</Badge></td>
              <td className="text-right font-semibold tabular-nums result-correct">{number.format(row.correct)}</td>
              <td className="text-right font-semibold tabular-nums result-wrong">{number.format(row.wrong)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3 text-xs text-muted-foreground">
          <span>{number.format(index * PAGE_SIZE + 1)}–{number.format(index * PAGE_SIZE + visible.length)} จาก {number.format(filtered.length)} คำ</span>
          <div className="stats-pagination flex shrink-0 gap-2">
            <Button size="icon" variant="outline" aria-label="หน้าก่อนหน้า" disabled={index === 0} onClick={() => setPage(index - 1)}><ArrowLeft size={16} /></Button>
            <Button size="icon" variant="outline" aria-label="หน้าถัดไป" disabled={index === lastPage} onClick={() => setPage(index + 1)}><ArrowRight size={16} /></Button>
          </div>
        </div>
      </> : <div className="grid place-items-center gap-3 px-4 py-12 text-center">
        <span className="stat-icon size-11 cue-learning"><BarChart3 size={20} /></span>
        <p className="text-sm text-muted-foreground">{data.rows.length ? "ไม่พบคำศัพท์ที่ค้นหา" : readOnly ? "ผู้ใช้นี้ยังไม่ได้ตอบคำถาม" : "ตอบคำถามเพื่อเริ่มเก็บสถิติรายคำ"}</p>
        {!readOnly && !data.rows.length && <a href="#quiz" className="rounded-sm text-sm font-semibold text-primary hover:underline">ไปฝึกคำศัพท์</a>}
      </div>}
    </Card>
  </>;
}
