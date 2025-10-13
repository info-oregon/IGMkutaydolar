"use client";
import { SealCheck } from "../types/form";

export default function SealTable({ seals, setSeals }: { seals: SealCheck[]; setSeals: (s: SealCheck[]) => void; }) {
  const update = (i: number, k: keyof SealCheck, v: any) => setSeals(seals.map((r, idx) => idx===i?{...r,[k]:v}:r));
  const add = () => setSeals([...(seals||[]), {}]);
  const del = (i: number) => setSeals(seals.filter((_,idx)=>idx!==i));

  return (
    <div className="space-y-2">
      <div className="font-semibold">Mühür Kontrol</div>
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2">Numara</th>
            <th className="border px-2">Evrak Uyum</th>
            <th className="border px-2">Sağlamlık</th>
            <th className="border px-2">Gerginlik</th>
            <th className="border px-2">Kilit</th>
            <th className="border px-2">Açıklama</th>
            <th className="border px-2">Sil</th>
          </tr>
        </thead>
        <tbody>
          {(seals||[]).map((row,i)=>(
            <tr key={i}>
              <td className="border px-2"><input className="border px-1 w-28" value={row.numara??""} onChange={e=>update(i,"numara",e.target.value)} /></td>
              {["evrakUyum","saglamlik","gerginlik","kilitUygun"].map((f)=>(
                <td key={f} className="border text-center"><input type="checkbox" checked={(row as any)[f]??false} onChange={e=>update(i,f as any,e.target.checked)} /></td>
              ))}
              <td className="border px-2"><input className="border px-1 w-full" value={row.aciklama??""} onChange={e=>update(i,"aciklama",e.target.value)} /></td>
              <td className="border text-center"><button type="button" className="text-red-600" onClick={()=>del(i)}>✖</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="bg-blue-500 text-white px-3 py-1 rounded" onClick={add}>+ Satır</button>
    </div>
  );
}
