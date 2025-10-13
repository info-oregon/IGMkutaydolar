"use client";
import { useState } from "react";
import SignatureField from "../SignatureField";

export default function Step2MuhurSofor({ form, setForm, next, back }: any) {
  const [local, setLocal] = useState(form);

  const handleChange = (key: string, value: any) => {
    const updated = { ...local, [key]: value };
    setLocal(updated);
    setForm(updated);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Mühür ve Şoför Bilgileri</h2>

      {/* --- MÜHÜR TABLOSU --- */}
      <div className="border p-3 rounded space-y-2">
        <h3 className="font-semibold">Araç Mühür Kontrolü</h3>

        <div>
          <label className="block">Mühür Numarası</label>
          <input
            className="border px-2 py-1 w-full"
            value={local.muhurNo ?? ""}
            onChange={(e) => handleChange("muhurNo", e.target.value)}
          />
        </div>

        <div>
          <label className="block">Evrakla Uyum</label>
          <select
            className="border px-2 py-1 w-full"
            value={local.muhurEvrakUygun ?? ""}
            onChange={(e) => handleChange("muhurEvrakUygun", e.target.value)}
          >
            <option value="">Seçiniz</option>
            <option value="Uygun">Uygun</option>
            <option value="Uygun Değil">Uygun Değil</option>
          </select>
        </div>

        <div>
          <label className="block">Sağlamlık</label>
          <select
            className="border px-2 py-1 w-full"
            value={local.muhurSaglamlik ?? ""}
            onChange={(e) => handleChange("muhurSaglamlik", e.target.value)}
          >
            <option value="">Seçiniz</option>
            <option value="Uygun">Uygun</option>
            <option value="Uygun Değil">Uygun Değil</option>
          </select>
        </div>

        <div>
          <label className="block">Gerginlik</label>
          <select
            className="border px-2 py-1 w-full"
            value={local.muhurGerginlik ?? ""}
            onChange={(e) => handleChange("muhurGerginlik", e.target.value)}
          >
            <option value="">Seçiniz</option>
            <option value="Uygun">Uygun</option>
            <option value="Uygun Değil">Uygun Değil</option>
          </select>
        </div>

        <div>
          <label className="block">Kilit Aksamı</label>
          <select
            className="border px-2 py-1 w-full"
            value={local.muhurKilit ?? ""}
            onChange={(e) => handleChange("muhurKilit", e.target.value)}
          >
            <option value="">Seçiniz</option>
            <option value="Uygun">Uygun</option>
            <option value="Uygun Değil">Uygun Değil</option>
          </select>
        </div>
      </div>

      {/* --- ŞOFÖR BLGLER --- */}
      <div className="border p-3 rounded space-y-3">
        <h3 className="font-semibold">Şoför Bilgileri</h3>

        <div>
          <label className="block">Şoför Sayısı</label>
          <select
            className="border px-2 py-1 w-full"
            value={local.soforSayisi ?? 1}
            onChange={(e) => handleChange("soforSayisi", Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </div>

        {[...Array(local.soforSayisi ?? 1)].map((_, i) => (
          <div key={i} className="border p-2 rounded space-y-2">
            <label className="block">Şoför {i + 1} Ad Soyad</label>
            <input
              className="border px-2 py-1 w-full"
              value={local.soforler?.[i]?.adSoyad ?? ""}
              onChange={(e) => {
                const updated = [...(local.soforler || [])];
                updated[i] = { ...(updated[i] || {}), adSoyad: e.target.value };
                handleChange("soforler", updated);
              }}
            />
            <label className="block">Telefon</label>
            <input
              className="border px-2 py-1 w-full"
              value={local.soforler?.[i]?.telefon ?? ""}
              onChange={(e) => {
                const updated = [...(local.soforler || [])];
                updated[i] = { ...(updated[i] || {}), telefon: e.target.value };
                handleChange("soforler", updated);
              }}
            />
            <label className="block">mza</label>
            <SignatureField
              onSave={(data: string) => {
                const updated = [...(local.soforler || [])];
                updated[i] = { ...(updated[i] || {}), imza: data };
                handleChange("soforler", updated);
              }}
            />
          </div>
        ))}
      </div>

      {/* --- BUTONLAR --- */}
      <div className="flex justify-between">
        <button
          onClick={back}
          className="bg-gray-400 text-white px-4 py-2 rounded"
        >
          ← Geri
        </button>
        <button
          onClick={next}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Sonraki Adım →
        </button>
      </div>
    </div>
  );
}
