import React, { useState, useEffect, useRef, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import type { ControlRow } from "../../types/form";

const FIZIKI_FIELD_KEYS = [
  'fiziki_genel_saglamlik',
  'fiziki_zarar_kontrol',
  'fiziki_kapilar',
  'fiziki_muhur_kilit',
  'fiziki_7nokta'
] as const;

const ZULA_FIELD_KEYS = [
  'zula_tamponlar',
  'zula_motor',
  'zula_far_arkasi',
  'zula_lastikler',
  'zula_tekerlek_ustu',
  'zula_yedek_lastik',
  'zula_yakit_depolari',
  'zula_egzoz',
  'zula_surucu_mili',
  'zula_cekici_dorse_ici',
  'zula_cekici_dorse_alti',
  'zula_yan_duvarlar',
  'zula_on_duvar',
  'zula_ic_dis_kapilar',
  'zula_surucu_depolari',
  'zula_hava_depolari',
  'zula_cati',
  'zula_sogutma_unitesi'
] as const;

type YeniMuhurKontrolState = {
  evrakUyum?: boolean | null;
  saglamlik?: boolean | null;
  gerginlik?: boolean | null;
  kilitUygunluk?: boolean | null;
};

interface Step3Props {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  back: () => void;
  onPreview: (latestData?: any) => void;
  onSubmit: (latestData?: any) => void;
  isProcessing: boolean;
  previewUrl?: string;
  isReadOnly?: boolean;
}

export default function Step3Checklist({ 
  data, 
  setData, 
  back, 
  onPreview, 
  onSubmit, 
  isProcessing,
  previewUrl,
  isReadOnly = false
}: Step3Props) {
  // Fiziki Kontrol Satırları
  const fizikiRows = [
    "Genel fiziki sağlamlığı ve bütünlüğü",
    "Herhangi bir zarar, yırtılma, sökülme veya parçalanma durumu yok",
    "Kapıların mekanizmalarının sağlamlığı",
    "Mühür ve kilit mekanizmalarının sağlamlığı",
    "Araç konteyner ise 7 nokta kontrolü (ön, sağ, sol, zemin, tavan, iç/dış kapılar)"
  ];

  // Zula Kontrol Satırları
  const zulaRows = [
    "Tamponlar",
    "Motor",
    "Far arkası kontrol",
    "Lastikler",
    "Tekerlek üstü kontrol",
    "Yedek lastik",
    "Yakıt depoları",
    "Egzoz",
    "Sürüş mili",
    "Çekici & Dorse içi / zemin kontrol",
    "Çekici & Dorse altı genel kontrol",
    "Yan duvarlar",
    "Ön duvar",
    "İç / dış kapılar",
    "Sürücü depoları",
    "Hava depoları",
    "Çatı",
    "Soğutma ünitesi"
  ];

  const mapInitialSelection = (source: any[] | undefined, rowCount: number): (string | null)[] => {
    if (!Array.isArray(source)) {
      return Array(rowCount).fill(null);
    }

    return Array.from({ length: rowCount }, (_, index) => {
      const item = source[index];
      if (item === null || item === undefined) return null;
      if (typeof item === "string") {
        const normalized = item.trim().toLowerCase();
        if (normalized === "uygun" || normalized === "uygunsuz") {
          return normalized;
        }
        if (normalized === "true") return "uygun";
        if (normalized === "false") return "uygunsuz";
        return null;
      }

      if (typeof item === "boolean") {
        return item ? "uygun" : "uygunsuz";
      }

      if (typeof item === "object" && item !== null) {
        const uygunValue =
          "uygun" in item ? (item.uygun === null || item.uygun === undefined ? null : item.uygun) : null;
        if (uygunValue === null) return null;
        return uygunValue ? "uygun" : "uygunsuz";
      }

      return null;
    });
  };

  const mapInitialNotes = (
    explicitNotes: string[] | undefined,
    structuredRows: any[] | undefined,
    rowCount: number
  ): string[] => {
    if (Array.isArray(explicitNotes) && explicitNotes.length) {
      return Array.from({ length: rowCount }, (_, index) => explicitNotes[index] || "");
    }

    if (Array.isArray(structuredRows)) {
      return Array.from(
        { length: rowCount },
        (_, index) => (structuredRows[index] && typeof structuredRows[index] === "object" && structuredRows[index]?.aciklama) || ""
      );
    }

    return Array(rowCount).fill("");
  };

  // State
  const [fiziki, setFiziki] = useState<(string | null)[]>(() =>
    mapInitialSelection(data.fizikiKontrol as any[], fizikiRows.length)
  );
  const [zula, setZula] = useState<(string | null)[]>(() =>
    mapInitialSelection(data.zulaKontrol as any[], zulaRows.length)
  );
  const [fizikiAciklama, setFizikiAciklama] = useState<string[]>(() =>
    mapInitialNotes(data.fizikiAciklama, data.fizikiKontrol as any[], fizikiRows.length)
  );
  const [zulaAciklama, setZulaAciklama] = useState<string[]>(() =>
    mapInitialNotes(data.zulaAciklama, data.zulaKontrol as any[], zulaRows.length)
  );
  const [genelSonuc, setGenelSonuc] = useState<string | null>(data.genelSonuc || null);
  const [adiSoyadi, setAdiSoyadi] = useState(data.kontrolEdenAd || "");
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [imzaData, setImzaData] = useState<string>(data.kontrolEdenImza || "");
  const [errors, setErrors] = useState<string[]>([]);
  const [hasPreview, setHasPreview] = useState(false);
  const [photos, setPhotos] = useState<string[]>(data.fotoListesi || []);
  const [manualStatus, setManualStatus] = useState<string>(data.status || 'completed');
  
  // New Seal Information State
  const [yeniMuhurNum, setYeniMuhurNum] = useState<string>(data.yeniMuhurNum || "");
  const [yeniMuhurKontrol, setYeniMuhurKontrol] = useState<YeniMuhurKontrolState>(data.yeniMuhurKontrol || {
    evrakUyum: null,
    saglamlik: null,
    gerginlik: null,
    kilitUygunluk: null
  });

  // Tarih & Saat
  const [timestamp, setTimestamp] = useState("");
  useEffect(() => {
    const now = new Date();
    setTimestamp(now.toLocaleString('tr-TR'));
  }, []);

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newPhotos.push(event.target.result as string);
            if (newPhotos.length === files.length) {
              setPhotos(prev => [...prev, ...newPhotos]);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Fiziki kontrol için hepsi uygun
  const applyFizikiUygun = () => {
    const newFiziki = Array(fizikiRows.length).fill("uygun");
    setFiziki(newFiziki);
  };

  // Zula kontrol için hepsi uygun
  const applyZulaUygun = () => {
    const newZula = Array(zulaRows.length).fill("uygun");
    setZula(newZula);
  };

  // Genel kontrol seçilince tüm satırlar işaretlensin
  const applyGenelSonuc = (value: string) => {
    setGenelSonuc(value);
    if (value === "uygun") {
      const newFiziki = Array(fizikiRows.length).fill("uygun");
      const newZula = Array(zulaRows.length).fill("uygun");
      setFiziki(newFiziki);
      setZula(newZula);
      }
  };

  // Temizle butonu
  const handleClear = () => {
    const newFiziki = Array(fizikiRows.length).fill(null);
    const newZula = Array(zulaRows.length).fill(null);
    const newFizikiAciklama = Array(fizikiRows.length).fill("");
    const newZulaAciklama = Array(zulaRows.length).fill("");
    
    setFiziki(newFiziki);
    setZula(newZula);
    setFizikiAciklama(newFizikiAciklama);
    setZulaAciklama(newZulaAciklama);
    setGenelSonuc(null);
    
  };

  // İmza kaydet
const saveSignature = () => {
  if (sigRef.current) {
    const signature = sigRef.current.getCanvas().toDataURL("image/png");
    setImzaData(signature);
  }
};


  // Form verilerini guncelle
  const syncFormData = useCallback(() => {
    const logPayload = {
      kontrolEdenAd: adiSoyadi,
      yeniMuhurNum,
      yeniMuhurKontrol,
      fizikiKontrolLength: fiziki.length,
      zulaKontrolLength: zula.length,
      fizikiValidCount: fiziki.filter(item => item !== null && item !== undefined && item !== '').length,
      zulaValidCount: zula.filter(item => item !== null && item !== undefined && item !== '').length,
      genelSonuc,
      timestamp
    };

    let latestData: any = null;

    setData((prev: any) => {
      const baseData: any = {
        ...prev,
        fizikiKontrol: fizikiRows.map<ControlRow>((label, index) => ({
          label,
          uygun: fiziki[index] === null ? null : fiziki[index] === "uygun",
          aciklama: fizikiAciklama[index] || undefined
        })),
        zulaKontrol: zulaRows.map<ControlRow>((label, index) => ({
          label,
          uygun: zula[index] === null ? null : zula[index] === "uygun",
          aciklama: zulaAciklama[index] || undefined
        })),
        fizikiAciklama,
        zulaAciklama,
        genelSonuc,
        kontrolEdenAd: adiSoyadi,
        adiSoyadi,
        kontrolEdenImza: imzaData,
        tarihSaat: timestamp,
        timestamp,
        fotoListesi: photos,
        yeniMuhurNum,
        yeniMuhurKontrol,
        cikis_yeniMuhurNo: yeniMuhurNum,
        cikis_muhurEvrakUygun: yeniMuhurKontrol?.evrakUyum ?? null,
        cikis_muhurSaglamlik: yeniMuhurKontrol?.saglamlik ?? null,
        cikis_muhurGerginlik: yeniMuhurKontrol?.gerginlik ?? null,
        cikis_muhurKilit: yeniMuhurKontrol?.kilitUygunluk ?? null,
        status: manualStatus as any
      };

      FIZIKI_FIELD_KEYS.forEach((field, index) => {
        const value = fiziki[index];
        const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
        baseData[`${field}_uygun`] = normalized === 'uygun';
        baseData[`${field}_aciklama`] = fizikiAciklama[index] || '';
      });

      ZULA_FIELD_KEYS.forEach((field, index) => {
        const value = zula[index];
        const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
        baseData[`${field}_uygun`] = normalized === 'uygun';
        baseData[`${field}_aciklama`] = zulaAciklama[index] || '';
      });

      latestData = baseData;
      return baseData;
    });

    console.log('Form verileri guncelleniyor:', logPayload);

    return latestData;
  }, [
    setData,
    fiziki,
    zula,
    fizikiAciklama,
    zulaAciklama,
    genelSonuc,
    adiSoyadi,
    imzaData,
    photos,
    yeniMuhurNum,
    yeniMuhurKontrol,
    manualStatus,
    timestamp
  ]);

  useEffect(() => {
    syncFormData();
  }, [syncFormData]);


  // PDF önizleme
  const handlePreview = () => {
    console.log('🔍 PDF önizleme başlıyor (validasyon geçici olarak devre dışı)...');

    setErrors([]);
    const latestData = syncFormData() ?? data;
    setHasPreview(true);
    
    onPreview(latestData);
  };

  // Form onaylama
  const handleSubmit = () => {
    console.log('Form onaylanıyor...');
    const latestData = syncFormData() ?? data;
    onSubmit(latestData);
  };

  // Kontrol satırı bileşeni
  const ControlRow = ({ 
    value, 
    onChange, 
    aciklama, 
    onAciklamaChange, 
    label, 
    index 
  }: {
    value: string | null;
    onChange: (val: string | null) => void;
    aciklama: string;
    onAciklamaChange: (val: string) => void;
    label: string;
    index: number;
  }) => {
    const handleRadioClick = (newValue: string) => {
      if (value === newValue) {
        onChange(null); // Seçimi kaldır
      } else {
        onChange(newValue);
      }
    };

    return (
      <tr className="hover:bg-blue-50/30 transition-colors">
        <td className="border border-gray-200 p-4 text-sm font-medium text-gray-700">{label}</td>
        <td className="border border-gray-200 p-4 text-center">
          <div 
            className={`cursor-pointer p-2 rounded-lg transition-all ${
              value === "uygun" ? 'bg-green-100 border-2 border-green-500' : 'hover:bg-green-50'
            }`}
            onClick={() => handleRadioClick("uygun")}
          >
            <div className="text-2xl">
              {value === "uygun" ? '✅' : '⬜'}
            </div>
          </div>
        </td>
        <td className="border border-gray-200 p-4 text-center">
          <div 
            className={`cursor-pointer p-2 rounded-lg transition-all ${
              value === "uygunsuz" ? 'bg-red-100 border-2 border-red-500' : 'hover:bg-red-50'
            }`}
            onClick={() => handleRadioClick("uygunsuz")}
          >
            <div className="text-2xl">
              {value === "uygunsuz" ? '❌' : '⬜'}
            </div>
          </div>
        </td>
        <td className="border border-gray-200 p-4">
          <input 
            type="text" 
            className="oregon-input w-full" 
            placeholder="Açıklama (opsiyonel)" 
            value={aciklama}
            onChange={(e) => {
              e.stopPropagation();
              onAciklamaChange(e.target.value);
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onFocus={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          />
        </td>
      </tr>
    );
  };

  // New Seal Control Row Component
  const YeniMuhurSatiri = ({
    name,
    label
  }: {
    name: keyof typeof yeniMuhurKontrol;
    label: string;
  }) => {
    const val = yeniMuhurKontrol[name];
    
    const handleClick = (newVal: boolean) => {
      if (val === newVal) {
        // Remove selection if same value clicked
        setYeniMuhurKontrol((p) => ({ ...p, [name]: null }));
      } else {
        setYeniMuhurKontrol((p) => ({ ...p, [name]: newVal }));
      }
    };

    return (
      <div className="flex items-center gap-4 mb-4 p-4 oregon-card">
        <span className="flex-1 font-medium text-gray-700">{label}</span>
        <div 
          className={`oregon-radio-card cursor-pointer ${
            val === true ? 'selected' : ''
          } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !isReadOnly && handleClick(true)}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              val === true ? 'border-green-500 bg-green-500' : 'border-gray-400'
            }`}>
              {val === true && <div className="w-2 h-2 rounded-full bg-white"></div>}
            </div>
            <span className="text-sm font-medium">Uygun</span>
          </div>
        </div>
        <div 
          className={`oregon-radio-card cursor-pointer ${
            val === false ? 'selected' : ''
          } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !isReadOnly && handleClick(false)}
        >
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              val === false ? 'border-red-500 bg-red-500' : 'border-gray-400'
            }`}>
              {val === false && <div className="w-2 h-2 rounded-full bg-white"></div>}
            </div>
            <span className="text-sm font-medium">Uygun Değil</span>
          </div>
        </div>
      </div>
    );
  };

  // All New Seal Controls Suitable
  const handleYeniMuhurHepsiUygun = () => {
    setYeniMuhurKontrol({
      evrakUyum: true,
      saglamlik: true,
      gerginlik: true,
      kilitUygunluk: true
    });
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="oregon-card p-6">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 oregon-gradient rounded-full flex items-center justify-center text-white font-bold mr-3">
            3
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Fiziki ve Zula Kontrolü</h2>
        </div>

        {/* Hata Mesajları */}
        {errors.length > 0 && (
          <div className="oregon-error rounded-lg p-4 mb-6">
            <div className="font-semibold mb-2">⚠️ Lütfen aşağıdaki alanları kontrol edin:</div>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Fiziki Kontrol */}
        <div className="oregon-card p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800">🔧 Araç Fiziki Kontrolü</h3>
            <button 
              onClick={applyFizikiUygun}
              className="oregon-button-primary px-4 py-2"
              disabled={isReadOnly}
            >
              Hepsi Uygun ✓
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="oregon-table w-full bg-white rounded-lg">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-4 text-left">Kontrol Noktası</th>
                  <th className="border border-gray-300 p-4">Uygun ✔</th>
                  <th className="border border-gray-300 p-4">Uygun Değil ✖</th>
                  <th className="border border-gray-300 p-4">Açıklama</th>
                </tr>
              </thead>
              <tbody>
                {fizikiRows.map((row, idx) => (
                  <ControlRow
                    key={`fiziki_${idx}`}
                    value={fiziki[idx]}
                    onChange={(val) => {
                      const newFiziki = [...fiziki];
                      newFiziki[idx] = val;
                      setFiziki(newFiziki);
                    }}
                    aciklama={fizikiAciklama[idx]}
                    onAciklamaChange={React.useCallback((val) => {
                      const newAciklama = [...fizikiAciklama];
                      newAciklama[idx] = val;
                      setFizikiAciklama(newAciklama);
                    }, [fizikiAciklama])}
                    label={row}
                    index={idx}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zula Kontrol */}
        <div className="oregon-card p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800">🔍 Araç Zula Kontrolü</h3>
            <button 
              onClick={applyZulaUygun}
              className="oregon-button-primary px-4 py-2"
              disabled={isReadOnly}
            >
              Hepsi Uygun ✓
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="oregon-table w-full bg-white rounded-lg">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-4 text-left">Kontrol Noktası</th>
                  <th className="border border-gray-300 p-4">Uygun ✔</th>
                  <th className="border border-gray-300 p-4">Uygun Değil ✖</th>
                  <th className="border border-gray-300 p-4">Açıklama</th>
                </tr>
              </thead>
              <tbody>
                {zulaRows.map((row, idx) => (
                  <ControlRow
                    key={`zula_${idx}`}
                    value={zula[idx]}
                    onChange={(val) => {
                      const newZula = [...zula];
                      newZula[idx] = val;
                      setZula(newZula);
                    }}
                    aciklama={zulaAciklama[idx]}
                    onAciklamaChange={React.useCallback((val) => {
                      const newAciklama = [...zulaAciklama];
                      newAciklama[idx] = val;
                      setZulaAciklama(newAciklama);
                    }, [zulaAciklama])}
                    label={row}
                    index={idx + fizikiRows.length}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Genel Sonuç */}
        <div className="oregon-card p-4 mb-6">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">📋 Genel Kontrol Sonucu</h3>
          <div className="flex gap-4 mb-4">
            <div 
              className={`oregon-radio-card flex-1 cursor-pointer ${genelSonuc === "uygun" ? 'selected' : ''} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isReadOnly && setGenelSonuc(genelSonuc === "uygun" ? null : "uygun")}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  genelSonuc === "uygun" ? 'border-green-500 bg-green-500' : 'border-gray-400'
                }`}>
                  {genelSonuc === "uygun" && <div className="w-3 h-3 rounded-full bg-white"></div>}
                </div>
                <span className="font-medium">Uygun ✔</span>
              </div>
            </div>
            <div 
              className={`oregon-radio-card flex-1 cursor-pointer ${genelSonuc === "uygunsuz" ? 'selected' : ''} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isReadOnly && setGenelSonuc(genelSonuc === "uygunsuz" ? null : "uygunsuz")}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  genelSonuc === "uygunsuz" ? 'border-red-500 bg-red-500' : 'border-gray-400'
                }`}>
                  {genelSonuc === "uygunsuz" && <div className="w-3 h-3 rounded-full bg-white"></div>}
                </div>
                <span className="font-medium">Uygun Değil ✖</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleClear} 
            className="oregon-button-secondary px-4 py-2"
            disabled={isReadOnly}
          >
            Tümünü Temizle
          </button>
        </div>

        {/* New Seal Information Section */}
        <div className="oregon-card p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-800">
              {data.muhurDurumu === "Evet" ? "🔒 Yeni Mühür Bilgileri" : "🔒 Mühür Bilgileri"}
            </h3>
            <button
              type="button"
              className="oregon-button-primary px-4 py-2"
              onClick={handleYeniMuhurHepsiUygun}
              disabled={isReadOnly}
            >
              Hepsi Uygun ✓
            </button>
          </div>
          
          <div className="mb-6">
            <input
              className="oregon-input w-full mb-4"
              placeholder={data.muhurDurumu === "Evet" ? "Yeni Mühür Numarası" : "Mühür Numarası"}
              value={yeniMuhurNum}
              onChange={(e) => setYeniMuhurNum(e.target.value)}
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-2">
            <YeniMuhurSatiri name="evrakUyum" label="Evraklarla Uyum" />
            <YeniMuhurSatiri name="saglamlik" label="Mührün Sağlamlığı" />
            <YeniMuhurSatiri name="gerginlik" label="Mührün Gerginliği" />
            <YeniMuhurSatiri name="kilitUygunluk" label="Kilit Aksamı Uygunluğu" />
          </div>
        </div>

        {/* Kontrolü Gerçekleştiren */}
        <div className="oregon-card p-4 mb-6">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">👤 Kontrolü Gerçekleştiren</h3>
          <input
            className="oregon-input w-full mb-4"
            placeholder="Adı Soyadı"
            value={adiSoyadi}
            onChange={(e) => setAdiSoyadi(e.target.value)}
            disabled={isReadOnly}
          />
          <div className="mb-4">
            <p className="font-medium text-gray-700 mb-2">İmza:</p>
            <div className="border-2 border-gray-300 rounded-lg bg-white">
              <SignatureCanvas
                ref={sigRef}
                penColor="black"
                canvasProps={{ width: 600, height: 200, className: "rounded-lg" }}
                clearOnResize={false}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button 
                onClick={() => sigRef.current?.clear()} 
                className="oregon-button-secondary px-3 py-2"
                disabled={isReadOnly}
              >
                Temizle
              </button>
              <button 
                onClick={saveSignature} 
                className="oregon-button-primary px-3 py-2"
                disabled={isReadOnly}
              >
                Kaydet
              </button>
            </div>
            {imzaData && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Kaydedilen İmza:</p>
                <img src={imzaData} alt="imza" className="border rounded max-w-xs" />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600">📅 Tarih & Saat: {timestamp}</p>
        </div>

        {/* Photo Upload */}
        <div className="oregon-card p-4 mb-6">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">📷 Fotoğraflar</h3>
          
          <div className="mb-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="oregon-input w-full"
              disabled={isReadOnly}
            />
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Fotoğraf ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* PDF Önizleme */}
        {previewUrl && (
          <div className="oregon-card p-4 mb-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">📄 PDF Önizleme</h3>
            <div className="border rounded-lg overflow-hidden">
              <iframe 
                src={previewUrl} 
                className="w-full h-96" 
                title="PDF Önizleme"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="oregon-button-secondary px-4 py-2"
              >
                📱 Yeni Sekmede Aç
              </a>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = previewUrl;
                  link.download = `arac-kontrol-onizleme-${new Date().toISOString().split('T')[0]}.pdf`;
                  link.click();
                }}
                className="oregon-button-secondary px-4 py-2"
              >
                💾 Önizlemeyi İndir
              </button>
            </div>
          </div>
        )}

        {/* Manual Status Selection */}
        <div className="oregon-card p-4 mb-6">
          <h3 className="font-semibold text-lg text-gray-800 mb-4">📋 Form Durumu</h3>
          <select
            value={manualStatus}
            onChange={(e) => setManualStatus(e.target.value)}
            className="oregon-input w-full"
            disabled={isReadOnly}
          >
            <option value="submitted">Tamamlandı</option>
            <option value="completed">Tamamlandı (Eski)</option>
            <option value="sahada">Sahada</option>
            <option value="sahadan_cikis">Sahadan Çıkış</option>
            <option value="x">X Durumu</option>
            <option value="y">Y Durumu</option>
          </select>
        </div>
        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button 
            onClick={back} 
            className="oregon-button-secondary px-6 py-3"
            disabled={isProcessing}
          >
            ← Geri
          </button>
          
          <div className="flex gap-4">
            <button 
              onClick={handlePreview} 
              className={`oregon-button-primary px-6 py-3 ${
                isProcessing ? 'oregon-loading' : ''
              }`}
              disabled={isProcessing}
            >
              {isProcessing ? 'PDF Oluşturuluyor...' : '📄 PDF Önizle'}
            </button>
            
            {hasPreview && !isReadOnly && (
              <button 
                onClick={handleSubmit} 
                className={`oregon-success px-6 py-3 rounded-lg font-semibold ${
                  isProcessing ? 'oregon-loading' : ''
                }`}
                disabled={isProcessing}
              >
                {isProcessing ? 'Kaydediliyor...' : '✅ Kaydet ve Onayla'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
