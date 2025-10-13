"use client";
import { ControlRow } from "../types/form";

export default function ControlTable({ title, rows, setRows }: { title: string; rows: ControlRow[]; setRows: (r: ControlRow[])=>void; }) {
  const upd = (i: number, k: keyof ControlRow, v: any) => setRows(rows.map((r,idx)=>idx===i?{...r,[k]:v}:r));
  const setAll = (v: boolean | null) => setRows(rows.map(r=>({ ...r, uygun: v })));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{title}</div>
        <div className="flex gap-2">
          <button type="button" className="px-2 py-1 bg-green-500 text-white rounded" onClick={()=>setAll(true)}>Genel=Uygun</button>
          <button type="button" className="px-2 py-1 bg-red-500 text-white rounded" onClick={()=>setAll(false)}>Genel=Uygun Değil</button>
          <button type="button" className="px-2 py-1 bg-gray-400 text-white rounded" onClick={()=>setAll(null)}>Temizle</button>
        </div>
      </div>
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1 text-left">Kontrol Noktası</th>
            <th className="border px-2 py-1">Uygun</th>
            <th className="border px-2 py-1">Uygun Değil</th>
            <th className="border px-2 py-1">Açıklama</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i}>
              <td className="border px-2">{r.label}</td>
              <td className="border text-center"><input type="radio" name={title+"-"+i} checked={r.uygun===true} onChange={()=>upd(i,"uygun",true)} /></td>
              <td className="border text-center"><input type="radio" name={title+"-"+i} checked={r.uygun===false} onChange={()=>upd(i,"uygun",false)} /></td>
              <td className="border px-2"><input className="border w-full px-1" value={r.aciklama??""} onChange={e=>upd(i,"aciklama",e.target.value)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
