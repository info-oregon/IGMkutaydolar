export type AracTuru = "Yarı Römork" | "Konteyner" | "Kamyon/Minivan";
export type SevkDurumu = "Evet" | "Hayır";
export type MuhurDurumu = "Evet" | "Hayır";

export interface SealCheck {
  numara?: string;
  evrakUyum?: boolean;
  saglamlik?: boolean;
  gerginlik?: boolean;
  kilitUygun?: boolean;
  aciklama?: string;
}

export interface Sofor {
  ad: string;
  soyad: string;
  telefon: string;
  imza?: string; // base64
}

export interface ControlRow {
  label: string;
  uygun: boolean | null;
  aciklama?: string;
}

export interface FormData {
  // Üst bilgi
  tasiyiciFirma?: string;
  aracTuru: AracTuru;

  // Plakalar
  cekiciPlaka?: string;
  dorsePlaka?: string;
  konteynerNo?: string;
  kamyonPlaka?: string;

  // Sevk
  sevkDurumu: SevkDurumu;
  mrnNo?: string;
  rejimHakSahibi?: string;

  // Mühür
  muhurDurumu: MuhurDurumu;
  muhurler: SealCheck[];

  // Şoförler
  soforSayisi: 1 | 2;
  soforler: Sofor[];

  // Kontrol tabloları
  fizikiKontrol: ControlRow[];
  zulaKontrol: ControlRow[];

  // Genel Sonuç
  genelSonuc?: "Uygun" | "Uygun Değil";
  genelNot?: string;

  // Fotoğraflar
  fotoListesi: string[]; // base64

  // Meta
  createdAt: string;
  kontroluGerceklestiren?: string;
  kontrolImza?: string;
}
