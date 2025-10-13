"use client";
import { useState } from "react";
import SignatureCanvas from "react-signature-canvas";

type Row = { label: string; uygun: boolean | null; aciklama: string };

const fizikiRows: string[] = [
  "Kapıların sağlamlığı",
  "Yan paneller",
  "Lastikler",
  "Aydınlatmalar",
  "Camlar / Aynalar"
];

const zulaRows: string[] = [
  "Tamponlar",
  "Motor bölgesi",
  "Şasi boşlukları",
  "Bagaj / Depo",
  "Tavan gizli bölmeleri"
];

export default function Step3Finalize({ onBack }: { onBack: () => void }) {
  const [fiziki, setFiziki] = useState<Row[]>(fizikiRows.map(r => ({ label: r, uygun: null, aciklama: "" })));
  const [zula, setZula] = useState<Row[]>(zulaRows.map(r => ({ label: r, uygun: null, aciklama: "" })));
  const [photos, setPhotos] = useState<string[]>([]);
  const [kontrolcu, setKontrolcu] = useState({ adSoyad: "", imza: "" });
  const [sigPad, setSigPad] = useState<SignatureCanvas | null>(null);
  const [genelSonuc, setGenelSonuc] = useState<"Uygun" | "Uygun Değil" | null>(null);

  const handleGeneralMark = (target: "fiziki" | "zula", uygun: boolean) => {
    if (target === "fiziki") setFiziki(fiziki.map(r => ({ ...r, uygun })));
    if (target === "zula") setZula(zula.map(r => ({ ...r, uygun })));
  };

  const handleClear = () => {
    setFiziki(fiziki.map(r => ({ ...r, uygun: null, aciklama: "" })));
    setZula(zula.map(r => ({ ...r, uygun: null, aciklama: "" })));
    setGenelSonuc(null);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const saveSignature = () => {
    if (sigPad) setKontrolcu({ ...kontrolcu, imza: sigPad.getTrimmedCanvas().toDataURL("image/png") });
  };

  const tarih = new Date().toLocaleString("tr-TR");

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">3. Kontrol Listeleri ve Sonuç</h2>

      {/* Fiziki Kontrol */}
      <div>
        <h3 className="font-medium">Fiziki Kontrol</h3>
        {fiziki.map((r, i) => (
          <div key={i} className="flex gap-2 items-center border-b py-2">
            <span className="flex-1">{r.label}</span>
            <label><input type="radio" checked={r.uygun===true} onChange={() => {const copy=[...fiziki]; copy[i].uygun=true; setFiziki(copy);}}/> Uygun</label>
            <label><input type="radio" checked={r.uygun===false} onChange={() => {const copy=[...fiziki]; copy[i].uygun=false; setFiziki(copy);}}/> Uygun Değil</label>
            <input className="border flex-1 px-1" placeholder="Açıklama" value={r.aciklama} onChange={(e)=>{const copy=[...fiziki]; copy[i].aciklama=e.target.value; setFiziki(copy);}}/>
          </div>
        ))}
        <button type="button" className="mt-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={()=>handleGeneralMark("fiziki",true)}>Genel Uygun</button>
      </div>

      {/* Zula Kontrol */}
      <div>
        <h3 className="font-medium">Zula Kontrol</h3>
        {zula.map((r, i) => (
          <div key={i} className="flex gap-2 items-center border-b py-2">
            <span className="flex-1">{r.label}</span>
            <label><input type="radio" checked={r.uygun===true} onChange={() => {const copy=[...zula]; copy[i].uygun=true; setZula(copy);}}/> Uygun</label>
            <label><input type="radio" checked={r.uygun===false} onChange={() => {const copy=[...zula]; copy[i].uygun=false; setZula(copy);}}/> Uygun Değil</label>
            <input className="border flex-1 px-1" placeholder="Açıklama" value={r.aciklama} onChange={(e)=>{const copy=[...zula]; copy[i].aciklama=e.target.value; setZula(copy);}}/>
          </div>
        ))}
        <button type="button" className="mt-2 bg-blue-500 text-white px-3 py-1 rounded" onClick={()=>handleGeneralMark("zula",true)}>Genel Uygun</button>
      </div>

      {/* Genel Sonuç */}
      <div>
        <h3 className="font-medium">Genel Kontrol Sonucu</h3>
        <label><input type="radio" checked={genelSonuc==="Uygun"} onChange={()=>setGenelSonuc("Uygun")}/> Uygun</label>
        <label className="ml-4"><input type="radio" checked={genelSonuc==="Uygun Değil"} onChange={()=>setGenelSonuc("Uygun Değil")}/> Uygun Değil</label>
        <button type="button" onClick={handleClear} className="ml-4 bg-gray-500 text-white px-3 py-1 rounded">Temizle</button>
      </div>

      {/* Fotoğraflar */}
      <div>
        <h3 className="font-medium">Fotoğraflar</h3>
        <input type="file" accept="image/*" multiple onChange={handlePhoto}/>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {photos.map((p,i)=>(<div key={i}><img src={p} alt="foto" className="border h-24 w-full object-cover"/><button onClick={()=>setPhotos(photos.filter((_,idx)=>idx!==i))} className="w-full bg-red-500 text-white text-sm">Sil</button></div>))}
        </div>
      </div>

      {/* mza */}
      <div>
        <h3 className="font-medium">Kontrol Eden</h3>
        <input className="border p-2 w-full mb-2" placeholder="Ad Soyad" value={kontrolcu.adSoyad} onChange={(e)=>setKontrolcu({...kontrolcu,adSoyad:e.target.value})}/>
        <SignatureCanvas ref={(r)=>setSigPad(r)} canvasProps={{width:400,height:150,className:"border"}}/>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={()=>sigPad?.clear()} className="bg-gray-400 text-white px-3 py-1 rounded">Temizle</button>
          <button type="button" onClick={saveSignature} className="bg-blue-500 text-white px-3 py-1 rounded">Kaydet</button>
        </div>
        {kontrolcu.imza && <img src={kontrolcu.imza} alt="imza" className="mt-2 border w-40 h-20"/>}
      </div>

      {/* Tarih */}
      <p className="text-sm text-gray-600">Tarih: {tarih}</p>

      {/* Butonlar */}
      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="bg-gray-400 text-white px-4 py-2 rounded">Geri</button>
        <button onClick={()=>alert("PDF Oluşturma burada tetiklenecek!")} className="bg-green-600 text-white px-4 py-2 rounded">PDF Oluştur</button>
      </div>
    </div>
  );
}
