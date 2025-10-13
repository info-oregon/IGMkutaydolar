import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function generatePdf(form: any) {
  const doc = new jsPDF("p", "mm", "a4");

  // Başlık
  doc.setFontSize(14);
  doc.text("ARAÇ GÜVENLK KONTROL FORMU", 105, 15, { align: "center" });

  doc.setFontSize(10);

  // Üst Bilgi Tablosu
  autoTable(doc, {
    startY: 25,
    head: [["Taşıyıcı", "Araç Türü", "Sevk", "Mühür"]],
    body: [[
      form.tasiyiciFirma || "",
      form.aracTuru || "",
      form.sevkDurumu || "",
      form.muhurDurumu || ""
    ]],
    styles: { fontSize: 9, halign: "center", valign: "middle" },
    headStyles: { fillColor: [200,200,200] }
  });

  // Plaka Bilgileri
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 5,
    head: [["Çekici Plaka", "Dorse Plaka", "Konteyner No", "Kamyon/Minivan"]],
    body: [[
      form.cekiciPlaka || "-",
      form.dorsePlaka || "-",
      form.konteynerNo || "-",
      form.kamyonPlaka || "-"
    ]],
    styles: { fontSize: 9, halign: "center", valign: "middle" },
    headStyles: { fillColor: [200,200,200] }
  });

  // Mühür Tablosu
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 5,
    head: [["Mühür No", "Evrakla Uyum", "Sağlamlık", "Gerginlik", "Kilit"]],
    body: [[
      form.muhurNo || "-",
      form.muhurEvrakUygun || "-",
      form.muhurSaglamlik || "-",
      form.muhurGerginlik || "-",
      form.muhurKilit || "-"
    ]],
    styles: { fontSize: 9, halign: "center", valign: "middle" },
    headStyles: { fillColor: [200,200,200] }
  });

  // Fiziki Kontrol
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 7,
    head: [["Fiziki Kontrol", "Durum", "Açıklama"]],
    body: (form.fizikiKontrol || []).map((r: any) => [
      r.label, r.uygun===true?"Uygun":r.uygun===false?"Değil":"-", r.aciklama||""
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [180,220,180] }
  });

  // Zula Kontrol
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 5,
    head: [["Zula Kontrol", "Durum", "Açıklama"]],
    body: (form.zulaKontrol || []).map((r: any) => [
      r.label, r.uygun===true?"Uygun":r.uygun===false?"Değil":"-", r.aciklama||""
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [220,200,200] }
  });

  // Şoför Bilgileri
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 5,
    head: [["Ad Soyad", "Telefon"]],
    body: (form.soforler || []).map((s: any) => [
      s.adSoyad || "-", s.telefon || "-"
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [200,200,200] }
  });

  // Kontrol Eden
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 5,
    head: [["Kontrol Eden", "Tarih - Saat"]],
    body: [[
      form.kontrolEdenAd || "-",
      new Date(form.createdAt || Date.now()).toLocaleString("tr-TR")
    ]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [200,200,200] }
  });

  return doc;
}
