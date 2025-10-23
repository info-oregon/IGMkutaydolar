"use client";
import { useState, useEffect } from "react";
import { EnhancedFormStorageManager, EnhancedFormData } from "../../lib/enhancedFormStorage";

interface FormHistoryProps {
  onBack: () => void;
  onLoadForm: (formId: string) => void;
  onNewForm: () => void;
}

export default function FormHistory({ onBack, onLoadForm, onNewForm }: FormHistoryProps) {
  const [forms, setForms] = useState<EnhancedFormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setIsLoading(true);
      const userForms = await EnhancedFormStorageManager.getForms();
      setForms(userForms);
    } catch (error) {
      console.error('Formlar yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (confirm('Bu formu silmek istediğinizden emin misiniz?')) {
      try {
        await EnhancedFormStorageManager.deleteForm(formId);
        await loadForms(); // Listeyi yenile
      } catch (error) {
        console.error('Form silinirken hata:', error);
        alert('Form silinirken bir hata oluştu.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return (
        <span className="oregon-success px-2 py-1 rounded-full text-xs font-medium">
          Tamamlandı ✓
        </span>
      );
    }
    if (status === 'sahada') {
      return (
        <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          Sahada 🚛
        </span>
      );
    }
    if (status === 'sahadan_cikis') {
      return (
        <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          Sahadan Çıkış 🏁
        </span>
      );
    }
    return (
      <span className="oregon-warning px-2 py-1 rounded-full text-xs font-medium">
        Taslak 📝
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen oregon-gradient flex items-center justify-center">
        <div className="oregon-card p-8 text-center">
          <div className="oregon-loading w-16 h-16 mx-auto mb-4 rounded-full"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Formlar Yükleniyor...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="oregon-gradient p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-white mb-4">
            <div className="text-lg font-semibold">Form Geçmişi</div>
            <div className="text-sm">{forms.length} Form</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="oregon-card p-6 mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Kayıtlı Formlarım</h2>
            <div className="flex gap-3">
              <button
                onClick={onNewForm}
                className="oregon-button-primary px-4 py-2"
              >
                + Yeni Form
              </button>
              <button
                onClick={onBack}
                className="oregon-button-secondary px-4 py-2"
              >
                ← Geri
              </button>
            </div>
          </div>

          {forms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Henüz kayıtlı form bulunmuyor
              </h3>
              <p className="text-gray-500 mb-6">
                İlk araç kontrol formunuzu oluşturmak için başlayın
              </p>
              <button
                onClick={onNewForm}
                className="oregon-button-primary px-6 py-3"
              >
                İlk Formumu Oluştur
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {forms.map((form, index) => {
                const normalized = (form as Partial<EnhancedFormData> & { formData?: EnhancedFormData }).formData ?? form;
                const resolvedStatus = form.customStatus ?? form.status;
                const aracTuru = normalized.aracTuru ?? (normalized as any).aracTuru ?? '-';
                const cekiciPlaka = normalized.cekiciPlaka ?? (normalized as any).cekici ?? form.cekiciPlaka ?? '-';
                const kontrolEden = normalized.kontrolEdenAd ?? form.kontrolEdenAd;
                const createdAt = form.createdAt ? formatDate(form.createdAt) : '-';
                const updatedAt = form.updatedAt ? formatDate(form.updatedAt) : '-';
                const formId = form.id ?? `form-${index}`;
                const isFinalized = resolvedStatus === 'completed';

                return (
                  <div key={formId} className="oregon-card p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {form.tasiyiciFirma || 'Taşıyıcı Firma Belirtilmemiş'}
                        </h3>
                        {getStatusBadge(resolvedStatus)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Araç Türü:</span><br />
                          {aracTuru}
                        </div>
                        <div>
                          <span className="font-medium">Çekici Plaka:</span><br />
                          {cekiciPlaka}
                        </div>
                        <div>
                          <span className="font-medium">Oluşturulma:</span><br />
                          {createdAt}
                        </div>
                        <div>
                          <span className="font-medium">Son Güncelleme:</span><br />
                          {updatedAt}
                        </div>
                      </div>

                      {kontrolEden && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Kontrol Eden:</span> {kontrolEden}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => onLoadForm(formId)}
                        className="oregon-button-primary px-4 py-2 text-sm"
                      >
                        {isFinalized ? 'Görüntüle' : 'Devam Et'}
                      </button>
                      
                      {isFinalized && form.pdfUrl && (
                        <a
                          href={form.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="oregon-button-secondary px-4 py-2 text-sm text-center"
                        >
                          PDF İndir
                        </a>
                      )}
                      
                      <button
                        onClick={() => handleDeleteForm(formId)}
                        className="oregon-error px-4 py-2 text-sm rounded-lg font-medium"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
