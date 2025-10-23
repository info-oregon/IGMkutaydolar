"use client";
import { useState, useEffect } from "react";
import { getCurrentUser, isAdmin } from "../../lib/auth";
import { EnhancedFormStorageManager, EnhancedFormData } from "../../lib/enhancedFormStorage";
import Step1VehicleInfo from "./Step1VehicleInfo";
import Step2Checklist from "./Step2Checklist";
import Step3Checklist from "./Step3Checklist";
import { canEditForm } from "../../lib/auth";
import { generatePdfFromHtml } from "../../lib/htmlToPdf";
import { supabase } from "../../lib/supabase";

interface EnhancedFormWizardProps {
  formId?: string;
  onBack: () => void;
}

export default function EnhancedFormWizard({ formId, onBack }: EnhancedFormWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<EnhancedFormData>({
    status: 'draft'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(!!formId);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [validationResult, setValidationResult] = useState<any>(null);

  const user = getCurrentUser();
  const userIsAdmin = isAdmin();

  // Check if form is editable
  const isFormEditable = canEditForm(formData.status);

  const effectiveStatus = formData.customStatus ?? formData.status;

  // Load existing form if formId provided
  useEffect(() => {
    if (formId) {
      loadExistingForm(formId);
    }
  }, [formId]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (step > 1 && Object.keys(formData).length > 1) {
        try {
          const savedId = await EnhancedFormStorageManager.autoSave(formData);
          if (savedId && !formData.id) {
            setFormData(prev => ({ ...prev, id: savedId }));
          }
        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      }
    };

    const timeoutId = setTimeout(autoSave, 3000); // Auto-save after 3 seconds
    return () => clearTimeout(timeoutId);
  }, [formData, step]);

  const loadExistingForm = async (id: string) => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading existing form:', id);
      
      const existingForm = await EnhancedFormStorageManager.getForm(id);
      
      if (existingForm) {
        console.log('✅ Form loaded:', existingForm);
        setFormData(existingForm);
        
        // Set appropriate step based on form completeness
        const resolvedStatus = existingForm.customStatus ?? existingForm.status;
        if (resolvedStatus === 'completed' || resolvedStatus === 'submitted') {
          setStep(3); // Show final step for completed forms
        } else if (existingForm.fizikiKontrol || existingForm.zulaKontrol) {
          setStep(3); // Has control data
        } else if (existingForm.soforler || existingForm.muhurKontrol) {
          setStep(2); // Has driver/seal data
        } else {
          setStep(1); // Start from beginning
        }
      }
    } catch (error) {
      console.error('❌ Form loading failed:', error);
      alert('Form yüklenirken bir hata oluştu: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async (overrideData?: EnhancedFormData) => {
    try {
      setIsProcessing(true);
      console.log('🔄 Generating PDF preview...');
      const currentData = overrideData ?? formData;
      if (overrideData) {
        setFormData(overrideData);
      }

      // TEMPORARILY DISABLED: Form validation for preview
      // Allow PDF generation even with incomplete forms
      const validation = EnhancedFormStorageManager.validateForm(currentData);
      setValidationResult(validation);
      if (overrideData) {
        setFormData(overrideData);
      }
      console.log('📊 Form completion level:', validation.completionLevel + '%');

      // Generate PDF preview
      const { previewUrl: generatedPreviewUrl } = await generatePdfFromHtml(currentData);
      setPreviewUrl(prev => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return generatedPreviewUrl;
      });

      console.log('✅ PDF preview generated successfully');
      alert('PDF önizleme başarıyla oluşturuldu! 📄');

    } catch (error) {
      console.error('❌ PDF preview generation failed:', error);
      alert('PDF önizleme oluşturulurken bir hata oluştu:\n' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (overrideData?: EnhancedFormData) => {
    try {
      setIsProcessing(true);
      console.log('🔄 Submitting form...');
      const currentData = overrideData ?? formData;
      if (overrideData) {
        setFormData(overrideData);
      }

      // TEMPORARILY DISABLED: Final validation for submission
      // Allow submission even with incomplete forms
      const validation = EnhancedFormStorageManager.validateForm(currentData);
      console.log('📊 Final form completion level:', validation.completionLevel + '%');

      // Generate and save PDF
      const { previewUrl: generatedPreviewUrl, pdfBytes } = await generatePdfFromHtml(currentData);

      const timestampForFile = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `arac-kontrol-${timestampForFile}.pdf`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('inspection-pdfs')
        .upload(filename, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Supabase upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ PDF uploaded to Supabase:', uploadData);

      const { data: urlData } = supabase.storage
        .from('inspection-pdfs')
        .getPublicUrl(filename);

      const supabaseUrl = urlData.publicUrl;

      // Save form with selected status
      const selectedStatus = currentData.customStatus || currentData.status || 'completed';
      const updatedFormData: EnhancedFormData = {
        ...currentData,
        pdfUrl: supabaseUrl,
        status: (selectedStatus === 'draft' ? 'draft' : 'submitted') as 'draft' | 'submitted',
        customStatus: selectedStatus === 'draft' ? undefined : selectedStatus as any,
        timestamp: new Date().toLocaleString('tr-TR')
      };

      const savedId = await EnhancedFormStorageManager.saveForm(updatedFormData);

      console.log('✅ Form submitted successfully:', savedId);
      alert('Form başarıyla tamamlandı ve kaydedildi! 🎉');

      // Download PDF
      const downloadUrl = generatedPreviewUrl;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `arac-kontrol-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();

      setPreviewUrl(prev => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return generatedPreviewUrl;
      });

      // Return to dashboard
      onBack();

    } catch (error) {
      console.error('❌ Form submission failed:', error);
      alert('Form kaydedilirken bir hata oluştu:\n' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!userIsAdmin) {
      alert('Sadece admin kullanıcılar form durumunu değiştirebilir.');
      return;
    }

    try {
      const updatedFormData = { ...formData, status: newStatus as any };
      await EnhancedFormStorageManager.saveForm(updatedFormData, newStatus);
      setFormData(updatedFormData);
      alert(`Form durumu "${newStatus}" olarak güncellendi.`);
    } catch (error) {
      console.error('❌ Status update failed:', error);
      alert('Durum güncellenirken bir hata oluştu.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen oregon-gradient flex items-center justify-center">
        <div className="oregon-card p-8 text-center">
          <div className="oregon-loading w-16 h-16 mx-auto mb-4 rounded-full"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Form Yükleniyor...</h2>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen oregon-gradient flex items-center justify-center">
        <div className="oregon-card p-8 text-center">
          <div className="oregon-loading w-16 h-16 mx-auto mb-4 rounded-full"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">İşleniyor...</h2>
          <p className="text-gray-600">PDF oluşturuluyor ve kaydediliyor...</p>
        </div>
      </div>
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
              
              {/* Status Badge */}
              <div className={`text-xs px-2 py-1 rounded ${
                (effectiveStatus === 'completed' || effectiveStatus === 'submitted') ? 'bg-green-500/80' :
                effectiveStatus === 'sahada' ? 'bg-blue-500/80' :
                effectiveStatus === 'sahadan_cikis' ? 'bg-purple-500/80' :
                'bg-white/20'
              }`}>
                {(effectiveStatus === 'completed' || effectiveStatus === 'submitted') ? 'Tamamlandı ✅' :
                 effectiveStatus === 'sahada' ? 'Sahada 🚛' :
                 effectiveStatus === 'sahadan_cikis' ? 'Sahadan Çıkış 🏁' :
                 'Taslak 📝'}
              </div>

              {formData.id && (
                <div className="text-xs bg-white/20 px-2 py-1 rounded">
                  Otomatik Kaydedildi ✓
                </div>
              )}
              
              {previewUrl && (
                <div className="text-xs bg-green-500/80 px-2 py-1 rounded">
                  PDF Hazır 📄
                </div>
              )}

              {validationResult && (
                <div className="text-xs bg-blue-500/80 px-2 py-1 rounded">
                  Tamamlanma: {validationResult.completionLevel}%
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

          {/* Admin Status Controls */}
          {userIsAdmin && formData.id && (
            <div className="mt-4 flex gap-2">
              <span className="text-white text-sm">Admin - Durum Değiştir:</span>
              {['draft', 'submitted', 'completed', 'sahada', 'sahadan_cikis'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    effectiveStatus === status 
                      ? 'bg-white text-oregon-blue' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {status === 'draft' ? 'Taslak' :
                   status === 'submitted' ? 'Tamamlandı' :
                   status === 'completed' ? 'Tamamlandı' :
                   status === 'sahada' ? 'Sahada' :
                   status === 'sahadan_cikis' ? 'Sahadan Çıkış' : status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {step === 1 && (
          <Step1VehicleInfo
            data={formData}
            setData={setFormData}
            next={() => setStep(2)}
            onBack={onBack}
            isReadOnly={!isFormEditable && !userIsAdmin}
          />
        )}
        {step === 2 && (
          <Step2Checklist
            data={formData}
            setData={setFormData}
            back={() => setStep(1)}
            next={() => setStep(3)}
            isReadOnly={!isFormEditable && !userIsAdmin}
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
            isReadOnly={!isFormEditable && !userIsAdmin}
          />
        )}
      </div>
    </div>
  );
}
