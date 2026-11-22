import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "./api";
import { Stats } from "./Stats";

function useAdminData(path) {
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!path) return;
    let active = true;
    api(path).then(
      (data) => { if (active) setResult({ path, retry, data }); },
      (error) => { if (active) setResult({ path, retry, error: error.message }); },
    );
    return () => { active = false; };
  }, [path, retry]);

  return {
    ...(result?.path === path && result.retry === retry ? result : {}),
    retry: () => setRetry((current) => current + 1),
  };
}

function LoadError({ result }) {
  return <div className="flex flex-wrap items-center gap-3 text-foreground" role="alert">
    {result.error}<Button variant="outline" onClick={result.retry}>ลองอีกครั้ง</Button>
  </div>;
}

export function Admin() {
  const [cursors, setCursors] = useState([""]);
  const [selected, setSelected] = useState(null);
  const cursor = cursors.at(-1);
  const list = useAdminData(cursor ? "admin/users?after=" + encodeURIComponent(cursor) : "admin/users");
  const history = useAdminData(selected ? "admin/history?uid=" + encodeURIComponent(selected) : null);

  return <div className="grid gap-5">
    <div className="page-heading"><div>
      <h1>ประวัติผู้ใช้</h1>
      <p>เลือกบัญชีเพื่อดูผลการฝึกและสถิติรายคำ</p>
    </div></div>
    <Card className="p-5">
      <h2 className="mb-3 font-semibold">ผู้ใช้ที่เริ่มฝึกแล้ว</h2>
      {list.error ? <LoadError result={list} /> : !list.data ? <p role="status">กำลังโหลดรายชื่อ…</p>
        : list.data.users.length ? <>
          <ul className="divide-y divide-border">
            {list.data.users.map(({ uid, email }) => <li key={uid}>
              <button type="button" className="w-full break-all rounded px-3 py-2 text-left hover:bg-muted aria-pressed:bg-neutral-100"
                aria-pressed={uid === selected} onClick={() => setSelected(uid)}>{email}</button>
            </li>)}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" disabled={cursors.length === 1}
              onClick={() => setCursors(cursors.slice(0, -1))}>หน้าก่อนหน้า</Button>
            <Button variant="outline" disabled={!list.data.next}
              onClick={() => setCursors([...cursors, list.data.next])}>หน้าถัดไป</Button>
          </div>
        </> : <p>ยังไม่มีประวัติผู้ใช้</p>}
    </Card>
    {selected && (history.error ? <LoadError result={history} /> : history.data ? <section className="grid gap-4">
      <h2 className="break-all text-lg font-semibold">{history.data.email}</h2>
      <Stats key={selected} data={history.data} readOnly />
    </section> : <p role="status">กำลังโหลดประวัติ…</p>)}
  </div>;
}
