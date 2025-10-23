"use client";
import { useState } from "react";
import PhotoInput from "../PhotoInput";
import SignatureField from "../SignatureField";
import { generatePdf } from "../../lib/pdf";
import { EnhancedFormStorageManager } from "../../lib/enhancedFormStorage";

export default function Step4Finalize({ form, setForm, back, onComplete }: any) {
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const handlePdf = async () => {
    try {
      setIsLoading(true);
      const doc = await generatePdf(form);
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      const updatedForm = { ...form, pdfUrl: url };
      setForm(updatedForm);

      console.log('✅ PDF oluşturuldu');
    } catch (error) {
      console.error('❌ PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);

      if (!form.kontrolEdenAd || !form.kontrolEdenAd.trim()) {
        alert('Lütfen kontrol eden kişinin adını girin.');
        return;
      }

      const finalForm = {
        ...form,
        pdfUrl,
        timestamp: new Date().toISOString(),
        status: 'submitted' as const,
        customStatus: 'completed' as const
      };

      const formId = await EnhancedFormStorageManager.saveForm(finalForm, 'completed');

      console.log('✅ Form Supabase\'e kaydedildi:', formId);
      alert('Form başarıyla tamamlandı ve kaydedildi!');

      if (onComplete) {
        onComplete(formId);
      }
    } catch (error) {
      console.error('❌ Form kaydetme hatası:', error);
      alert('Form kaydedilirken bir hata oluştu: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
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
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block">İmza</label>
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
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'PDF Oluşturuluyor...' : 'PDF Oluştur'}
      </button>

      {pdfUrl && (
        <iframe src={pdfUrl} className="w-full h-96 border mt-3" />
      )}

      {/* Navigasyon */}
      <div className="flex justify-between">
        <button
          onClick={back}
          className="bg-gray-400 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={isLoading}
        >
          ← Geri
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleComplete}
          disabled={isLoading}
        >
          {isLoading ? 'Kaydediliyor...' : 'Bitir ✔'}
        </button>
      </div>
    </div>
  );
}
