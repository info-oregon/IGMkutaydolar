"use client";
import { useState, useEffect } from "react";
import { EnhancedFormStorageManager, Company } from "../../lib/enhancedFormStorage";

interface Step1Props {
  data: any;
  setData: (data: any) => void;
  next: () => void;
  onBack?: () => void;
  isReadOnly?: boolean;
}

export default function Step1VehicleInfo({ data, setData, next, onBack, isReadOnly = false }: Step1Props) {
  const [tasiyici, setTasiyici] = useState(data?.tasiyiciFirma || "");
  const [aracTuru, setAracTuru] = useState(data?.aracTuru || "");
  const [sevk, setSevk] = useState(data?.sevkDurumu || "");
  const [muhur, setMuhur] = useState(data?.muhurDurumu || "");
  const [soforSayisi, setSoforSayisi] = useState(data?.soforSayisi || 1);
  const [errors, setErrors] = useState<string[]>([]);
  
  // Şirketler için state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(data?.companyId || "");
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // Şirketleri yükle
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      console.log('Şirketler yükleniyor...');
      
      const companiesData = await EnhancedFormStorageManager.getCompanies();
      setCompanies(companiesData);
      setFilteredCompanies(companiesData);
      
      console.log('Şirketler başarıyla yüklendi:', companiesData.length, 'adet');
      console.log('Yüklenen şirketler:', companiesData.map(c => c.name));
      
    } catch (error) {
      console.error('Şirketler yüklenirken hata:', error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  // Şirket arama
  const handleCompanySearch = (searchTerm: string) => {
    setTasiyici(searchTerm);
    
    if (searchTerm.trim() === '') {
      setFilteredCompanies(companies);
      setShowDropdown(false);
      setSelectedCompanyId("");
      return;
    }

    const filtered = companies.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCompanies(filtered);
    setShowDropdown(filtered.length > 0);
    
    console.log('Şirket arama:', searchTerm, 'Bulunan:', filtered.length);
  };

  // Şirket seçimi
  const handleCompanySelect = (company: Company) => {
    setTasiyici(company.name);
    setSelectedCompanyId(company.id);
    setShowDropdown(false);
    console.log('Şirket seçildi:', company);
  };

  const handleAracTuruSelect = (tur: string) => {
    if (aracTuru === tur) {
      setAracTuru(""); // Seçimi kaldır
    } else {
      setAracTuru(tur);
    }
  };

  const handleSevkSelect = (durum: string) => {
    if (sevk === durum) {
      setSevk(""); // Seçimi kaldır
    } else {
      setSevk(durum);
    }
  };

  const handleMuhurSelect = (durum: string) => {
    if (muhur === durum) {
      setMuhur(""); // Seçimi kaldır
    } else {
      setMuhur(durum);
    }
  };

  const handleNext = () => {
    const newErrors: string[] = [];
    
    if (!tasiyici) newErrors.push("Taşıyıcı ünvanı seçilmelidir");
    if (!aracTuru) newErrors.push("Araç türü seçilmelidir");
    if (!sevk) newErrors.push("Sevk durumu seçilmelidir");
    if (!muhur) newErrors.push("Mühür durumu seçilmelidir");

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]); // Hataları temizle
    setData({
      ...data,
      tasiyiciFirma: tasiyici,
      aracTuru,
      sevkDurumu: sevk,
      muhurDurumu: muhur,
      soforSayisi,
      companyId: selectedCompanyId, // Şirket ID'sini kaydet
    });
    next();
  };

  return (
    <div className="oregon-card p-6 mt-6">
      <div className="flex items-center mb-6">
        <div className="w-8 h-8 oregon-gradient rounded-full flex items-center justify-center text-white font-bold mr-3">
          1
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Araç Bilgileri</h2>
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

      <div className="space-y-6">
        {/* Taşıyıcı Ünvanı - Searchable Dropdown */}
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Taşıyıcı Ünvanı
          </label>
          
          {isLoadingCompanies && (
            <div className="text-sm text-gray-500 mb-2">
              📡 Şirketler yükleniyor...
            </div>
          )}
          
          <input
            type="text"
            value={tasiyici}
            onChange={(e) => handleCompanySearch(e.target.value)}
            onFocus={() => setShowDropdown(filteredCompanies.length > 0)}
            placeholder="Şirket adı yazın veya seçin..."
            className="oregon-input w-full"
            disabled={isReadOnly}
          />
          
          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  onClick={() => handleCompanySelect(company)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  {company.name}
                </div>
              ))}
              {filteredCompanies.length === 0 && (
                <div className="px-4 py-2 text-gray-500 text-center">
                  Eşleşen şirket bulunamadı
                </div>
              )}
            </div>
          )}
          
          {/* Debug bilgisi */}
          {companies.length > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              ✅ {companies.length} şirket yüklendi
            </div>
          )}
        </div>

        {/* Enhanced Fields */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Yükleme Yeri
          </label>
          <input
            type="text"
            value={data?.loadingLocation || ""}
            onChange={(e) => setData({ ...data, loadingLocation: e.target.value })}
            className="oregon-input w-full"
            placeholder="Yükleme yapılan yer"
            disabled={isReadOnly}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Yükleme Tarihi
          </label>
          <input
            type="datetime-local"
            value={data?.yuklemeTarihi || ""}
            onChange={(e) => setData({ ...data, yuklemeTarihi: e.target.value })}
            className="oregon-input w-full"
            disabled={isReadOnly}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Yükleme Öncesi Kantar (kg)
            </label>
            <input
              type="number"
              value={data?.preLoadingWeight || ""}
              onChange={(e) => setData({ ...data, preLoadingWeight: e.target.value })}
              className="oregon-input w-full"
              placeholder="0"
              disabled={isReadOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Yükleme Sonrası Kantar (kg)
            </label>
            <input
              type="number"
              value={data?.postLoadingWeight || ""}
              onChange={(e) => setData({ ...data, postLoadingWeight: e.target.value })}
              className="oregon-input w-full"
              placeholder="0"
            disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Araç Türü - Oregon Tarzı Kutucuklar */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Araç Türü
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Römork", "Minivan", "Konteyner"].map((tur) => (
              <div
                key={tur}
                onClick={() => !isReadOnly && handleAracTuruSelect(tur)}
                className={`oregon-select-card ${aracTuru === tur ? 'selected' : ''} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                    ${aracTuru === tur ? 'border-green-500 bg-green-500' : 'border-gray-400'}
                  `}>
                    {aracTuru === tur && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="font-semibold text-gray-700">{tur}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sevk Durumu */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Araç farklı bir gümrükten sevkli mi geldi?
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div 
              className={`oregon-radio-card ${sevk === "Evet" ? 'selected' : ''} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isReadOnly && handleSevkSelect("Evet")}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  sevk === "Evet" ? 'border-green-500 bg-green-500' : 'border-gray-400'
                }`}>
                  {sevk === "Evet" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <span className="font-medium">Evet</span>
              </div>
            </div>
            <div 
              className={`oregon-radio-card ${sevk === "Hayır" ? 'selected' : ''} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isReadOnly && handleSevkSelect("Hayır")}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  sevk === "Hayır" ? 'border-green-500 bg-green-500' : 'border-gray-400'
                }`}>
                  {sevk === "Hayır" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <span className="font-medium">Hayır</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mühür Durumu */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Araç mühürlü mü geldi?
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div 
              className={`oregon-radio-card ${muhur === "Evet" ? 'selected' : ''} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isReadOnly && handleMuhurSelect("Evet")}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  muhur === "Evet" ? 'border-green-500 bg-green-500' : 'border-gray-400'
                }`}>
                  {muhur === "Evet" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <span className="font-medium">Evet</span>
              </div>
            </div>
            <div 
              className={`oregon-radio-card ${muhur === "Hayır" ? 'selected' : ''} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isReadOnly && handleMuhurSelect("Hayır")}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  muhur === "Hayır" ? 'border-green-500 bg-green-500' : 'border-gray-400'
                }`}>
                  {muhur === "Hayır" && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <span className="font-medium">Hayır</span>
              </div>
            </div>
          </div>
        </div>

        {/* Şoför Sayısı */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Şoför Sayısı
          </label>
          <select
            value={soforSayisi}
            onChange={(e) => setSoforSayisi(Number(e.target.value))}
            className="oregon-input w-full"
            disabled={isReadOnly}
          >
            <option value={1}>1 Şoför</option>
            <option value={2}>2 Şoför</option>
          </select>
        </div>

        <div className="flex justify-between mt-8">
          {onBack && (
            <button 
              onClick={onBack} 
              className="oregon-button-secondary px-6 py-3"
            >
              ← Ana Sayfa
            </button>
          )}
          <button 
            onClick={handleNext} 
            className={`w-full text-lg py-4 mt-8 ${isReadOnly ? 'oregon-button-secondary opacity-50 cursor-not-allowed' : 'oregon-button-primary'}`}
            disabled={isReadOnly}
          >
            {isReadOnly ? 'Sadece Görüntüleme Modu' : 'Devam Et →'}
          </button>
        </div>
      </div>
    </div>
  );
}