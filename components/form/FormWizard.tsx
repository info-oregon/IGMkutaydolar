"use client";
import { useState, useEffect } from "react";
import WelcomeScreen from "../WelcomeScreen";
import Step1VehicleInfo from "./Step1VehicleInfo";
import Step2Checklist from "./Step2Checklist";
import Step3Checklist from "./Step3Checklist";
import FormHistory from "./FormHistory";
import { EnhancedFormData, EnhancedFormStorageManager } from "../../lib/enhancedFormStorage";
import { generatePdfFromHtml } from "../../lib/htmlToPdf";
import { uploadFinalPdf } from "../../lib/storage";

export default function FormWizard() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<EnhancedFormData>({ status: 'draft' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  // Otomatik taslak kaydetme
  useEffect(() => {
    const autoSave = async () => {
      if (step > 1 && Object.keys(formData).length > 0) {
        try {
          console.log('Otomatik taslak kaydediliyor...');
          const formId = await EnhancedFormStorageManager.autoSave(formData);
          if (!currentFormId) {
            setCurrentFormId(formId || null);
            setFormData(prev => ({ ...prev, id: formId || undefined }));
          }
        } catch (error) {
          console.warn('Otomatik kaydetme hatası:', error);
        }
      }
    };

    const timeoutId = setTimeout(autoSave, 2000); // 2 saniye sonra kaydet
    return () => clearTimeout(timeoutId);
  }, [formData, step, currentFormId]);

  // Mevcut formu yükle
  const loadExistingForm = async (formId: string) => {
    try {
      setIsProcessing(true);
      console.log('Mevcut form yükleniyor:', formId);
      
      const existingForm = await EnhancedFormStorageManager.getForm(formId);
      
      if (existingForm) {
        console.log('Form yüklendi:', existingForm);
        setFormData(existingForm);
        setCurrentFormId(formId);
        setShowHistory(false);
        setShowWelcome(false);
        
        // Form durumuna göre adımı belirle
        const resolvedStatus = existingForm.customStatus ?? existingForm.status;
        if (resolvedStatus === 'completed' || resolvedStatus === 'submitted') {
          setStep(3); // Onaylanmış formları son adımda göster
        } else {
          setStep(1); // Taslakları baştan başlat
        }
      }
    } catch (error) {
      console.error('Form yüklenirken hata:', error);
      alert('Form yüklenirken bir hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // PDF önizleme oluştur
  const handlePreview = async (overrideData?: EnhancedFormData) => {
    try {
      setIsProcessing(true);
      console.log('PDF önizleme oluşturuluyor...');
      const currentData = overrideData ?? formData;
      console.log('Gönderilen form verisi:', currentData);

      // Form validasyonu
      const validation = EnhancedFormStorageManager.validateForm(currentData);
      if (!validation.isValid) {
        console.log('Form validasyon hatası:', validation.errors);
        alert('Lütfen tüm zorunlu alanları doldurun:\n' + validation.errors.join('\n'));
        return;
      }

      // PDF önizleme oluştur
      const { previewUrl: generatedPreviewUrl } = await generatePdfFromHtml(currentData);
      setPreviewUrl(prev => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return generatedPreviewUrl;
      });

      console.log('PDF önizleme başarıyla oluşturuldu');
      // Başarı mesajı
      alert('PDF önizleme başarıyla oluşturuldu! Aşağıda görüntüleyebilirsiniz.');

    } catch (error) {
      console.error('PDF önizleme oluşturulurken hata:', error);
      alert('PDF önizleme oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.\n\nHata: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // PDF kaydet ve onayla
  const handleSubmit = async (overrideData?: EnhancedFormData) => {
    try {
      setIsProcessing(true);
      console.log('Form onaylanıyor...');
      const currentData = overrideData ?? formData;

      // Son validasyon
      const validation = EnhancedFormStorageManager.validateForm(currentData);
      if (!validation.isValid) {
        console.log('Form validasyon hatası:', validation.errors);
        alert('Lütfen tüm zorunlu alanları doldurun:\n' + validation.errors.join('\n'));
        return;
      }

      // PDF oluştur ve Storage'a kaydet
      const { previewUrl: generatedPreviewUrl, pdfBytes } = await generatePdfFromHtml(currentData);

      // Create form ID if not exists
      const formIdForUpload = currentData.id || crypto.randomUUID();

      // Upload PDF to storage
      const pdfPath = await uploadFinalPdf(formIdForUpload, pdfBytes);
      console.log('✅ PDF uploaded to storage:', pdfPath);

      // Formu onaylanmış olarak kaydet
      const updatedFormData: EnhancedFormData = {
        ...currentData,
        id: formIdForUpload,
        pdfUrl: pdfPath,
        status: 'submitted',
        customStatus: 'completed',
      };
      const formId = await EnhancedFormStorageManager.saveForm(updatedFormData, 'completed');

      console.log('Form başarıyla onaylandı:', formId);
      // Başarı mesajı göster
      alert('Form başarıyla onaylandı ve Supabase\'e kaydedildi! 🎉');

      // PDF'i indir
      const downloadUrl = generatedPreviewUrl;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `arac-kontrol-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

      // Formu sıfırla
      setFormData({ status: 'draft' });
      setCurrentFormId(null);
      setPreviewUrl(undefined);
      setStep(1);
      setShowWelcome(true);

    } catch (error) {
      console.error('Form onaylanırken hata:', error);
      alert('Form onaylanırken bir hata oluştu. Lütfen tekrar deneyin.\n\nHata: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen oregon-gradient flex items-center justify-center">
        <div className="oregon-card p-8 text-center">
          <div className="oregon-loading w-16 h-16 mx-auto mb-4 rounded-full"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">İşleniyor...</h2>
          <p className="text-gray-600">Lütfen bekleyin</p>
        </div>
      </div>
    );
  }

  if (showWelcome) {
    return (
      <WelcomeScreen 
        onStart={() => setShowWelcome(false)}
        onShowHistory={() => {
          setShowWelcome(false);
          setShowHistory(true);
        }}
      />
    );
  }

  if (showHistory) {
    return (
      <FormHistory
        onBack={() => {
          setShowHistory(false);
          setShowWelcome(true);
        }}
        onLoadForm={loadExistingForm}
        onNewForm={() => {
          setShowHistory(false);
          setShowWelcome(false);
          setFormData({ status: 'draft' });
          setCurrentFormId(null);
          setPreviewUrl(undefined);
          setStep(1);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="oregon-gradient p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-white mb-4">
            <div className="text-lg font-semibold">Oregon Araç Denetim</div>
            <div className="flex items-center gap-4">
              <div className="text-sm">Adım {step}/3</div>
              {currentFormId && (
                <div className="text-xs bg-white/20 px-2 py-1 rounded">
                  Taslak Kaydedildi ✓
                </div>
              )}
              {previewUrl && (
                <div className="text-xs bg-green-500/80 px-2 py-1 rounded">
                  PDF Önizleme Hazır 📄
                </div>
              )}
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {step === 1 && (
          <Step1VehicleInfo
            data={formData}
            setData={setFormData}
            next={() => setStep(2)}
            onBack={() => {
              setShowWelcome(true);
              setStep(1);
            }}
          />
        )}
        {step === 2 && (
          <Step2Checklist
            data={formData}
            setData={setFormData}
            back={() => setStep(1)}
            next={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3Checklist
            data={formData}
            setData={setFormData}
            back={() => setStep(2)}
            onPreview={handlePreview}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
            previewUrl={previewUrl}
          />
        )}
      </div>
    </div>
  );
}
