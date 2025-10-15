"use client";
import { useState } from "react";
import PhotoInput from "../PhotoInput";
import SignatureField from "../SignatureField";
import { generatePdf } from "../../lib/pdf";

export default function Step4Finalize({ form, setForm, back }: any) {
  const [pdfUrl, setPdfUrl] = useState<string>();

  const handlePdf = async () => {
    const doc = await generatePdf(form);
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Kontrolü Gerçekleştiren</h2>

      {/* Kontrol Eden Bilgisi */}
      <div>
        <label className="block">Ad Soyad</label>
        <input
          className="border px-2 py-1 w-full"
          value={form.kontrolEdenAd || ""}
          onChange={(e) => setForm({ ...form, kontrolEdenAd: e.target.value })}
        />
      </div>

      <div>
        <label className="block">mza</label>
        <SignatureField
          value={form.kontrolEdenImza}
          onChange={(v) => setForm({ ...form, kontrolEdenImza: v })}
        />
      </div>

      <div>
        <strong>Tarih & Saat:</strong>{" "}
        {new Date(form.createdAt || Date.now()).toLocaleString("tr-TR")}
      </div>

      {/* Fotoğraflar */}
      <div>
        <h3 className="font-semibold">Fotoğraflar</h3>
        <PhotoInput
          photos={form.fotoListesi}
          setPhotos={(p: string[]) => setForm({ ...form, fotoListesi: p })}
        />
      </div>

      {/* PDF Oluştur */}
      <button
        onClick={handlePdf}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        PDF Oluştur
      </button>

      {pdfUrl && (
        <iframe src={pdfUrl} className="w-full h-96 border mt-3" />
      )}

      {/* Navigasyon */}
      <div className="flex justify-between">
        <button
          onClick={back}
          className="bg-gray-400 text-white px-4 py-2 rounded"
        >
          ← Geri
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => alert("Form başarıyla tamamlandı.")}
        >
          Bitir ✔
        </button>
      </div>
    </div>
  );
}
