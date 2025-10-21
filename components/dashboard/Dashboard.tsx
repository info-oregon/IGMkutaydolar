"use client";
import { useState, useEffect } from 'react';
import { getCurrentUser, signOut, isAdmin } from '../../lib/auth';
import { EnhancedFormStorageManager, EnhancedFormData } from '../../lib/enhancedFormStorage';
import { checkSupabaseConnection } from '../../lib/supabase';

interface DashboardProps {
  onStartNewForm: () => void;
  onLoadForm: (formId: string) => void;
  onLogout: () => void;
}

export default function Dashboard({ onStartNewForm, onLoadForm, onLogout }: DashboardProps) {
  const [forms, setForms] = useState<EnhancedFormData[]>([]);
  const [filteredForms, setFilteredForms] = useState<EnhancedFormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; error?: any } | null>(null);

  const user = getCurrentUser();
  const userIsAdmin = isAdmin();

  useEffect(() => {
    checkConnection();
    loadForms();
  }, []);

  useEffect(() => {
    filterForms();
  }, [forms, searchTerm, statusFilter]);

  const checkConnection = async () => {
    const result = await checkSupabaseConnection();
    setConnectionStatus(result);
  };

  const loadForms = async () => {
    try {
      setIsLoading(true);
      const allForms = await EnhancedFormStorageManager.getForms();
      setForms(allForms);
    } catch (error) {
      console.error('❌ Forms loading failed:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const resolveStatus = (form: EnhancedFormData) => form.customStatus ?? form.status;
  const filterForms = () => {
    let filtered = [...forms];

    // Enhanced search across multiple fields
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(form =>
        (form.tasiyiciFirma || '').toLowerCase().includes(searchLower) ||
        (form.cekiciPlaka || '').toLowerCase().includes(searchLower) ||
        (form.dorsePlaka || '').toLowerCase().includes(searchLower) ||
        (form.konteynerNo || '').toLowerCase().includes(searchLower) ||
        (form.mrnNo || '').toLowerCase().includes(searchLower) ||
        (form.kontrolEdenAd || '').toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(form => {
        const status = resolveStatus(form);
        // Map 'submitted' to 'completed' for filtering purposes
        if (statusFilter === 'completed') {
          return status === 'completed' || status === 'submitted';
        }
        return status === statusFilter;
      });
    }

    setFilteredForms(filtered);
  };

  const handleSignOut = async () => {
    await signOut();
    onLogout();
  };

  const handleDeleteForm = async (formId: string) => {
    if (confirm('Bu formu silmek istediğinizden emin misiniz?')) {
      try {
        await EnhancedFormStorageManager.deleteForm(formId);
        await loadForms();
      } catch (error) {
        console.error('Form silinirken hata:', error);
        alert('Form silinirken bir hata oluştu.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { class: 'oregon-warning', text: 'Taslak 📝' },
      submitted: { class: 'oregon-success', text: 'Tamamlandı ✅' },
      completed: { class: 'oregon-success', text: 'Tamamlandı ✅' },
      sahada: { class: 'bg-blue-500 text-white', text: 'Sahada 🚛' },
      sahadan_cikis: { class: 'bg-purple-500 text-white', text: 'Sahadan Çıkış 🏁' },
      x: { class: 'bg-orange-500 text-white', text: 'X Durumu ⚠️' },
      y: { class: 'bg-pink-500 text-white', text: 'Y Durumu 🔄' }
    };

    const badge = badges[status as keyof typeof badges] || { class: 'bg-gray-500 text-white', text: status };
    
    return (
      <span className={`${badge.class} px-3 py-1 rounded-full text-xs font-medium`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between text-white mb-4">
            <div>
              <div className="text-2xl font-bold">Oregon Araç Denetim</div>
              <div className="text-sm opacity-90">
                Hoş geldiniz, {user?.name || user?.email}
                {userIsAdmin && <span className="ml-2 bg-white/20 px-2 py-1 rounded text-xs">👑 Admin</span>}
              </div>
              {connectionStatus && (
                <div className={`text-xs mt-1 ${connectionStatus.success ? 'text-green-300' : 'text-red-300'}`}>
                  {connectionStatus.success ? '✅ Supabase Bağlı' : '❌ Supabase Bağlantı Hatası'}
                </div>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Search Bar - Sticky */}
        <div className="sticky top-0 z-10 bg-white shadow-md rounded-lg p-4 mb-4">
          <input
            type="text"
            placeholder="Şirket adına, plakaya, MRN numarasına göre ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="oregon-input w-full text-lg py-3"
          />
        </div>

        {/* Filter Menu and Action Bar */}
        <div className="oregon-card p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-700">Filtreler</h3>
              <button
                onClick={onStartNewForm}
                className="oregon-button-primary px-6 py-3 whitespace-nowrap"
              >
                ➕ Yeni Form
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'Tümü', icon: '📋' },
                { value: 'draft', label: 'Taslak', icon: '📝' },
                { value: 'sahada', label: 'Sahada', icon: '🚛' },
                { value: 'completed', label: 'Tamamlandı', icon: '✅' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === filter.value
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{filter.icon}</span>
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forms List */}
        <div className="oregon-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Kayıtlı Formlar ({filteredForms.length})
            </h2>
            <button
              onClick={loadForms}
              className="oregon-button-secondary px-4 py-2"
            >
              🔄 Yenile
            </button>
          </div>

          {filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'Arama kriterlerine uygun form bulunamadı' : 'Henüz form bulunmuyor'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'all' ? 'Farklı arama kriterleri deneyin' : 'İlk araç kontrol formunuzu oluşturmak için başlayın'}
              </p>
              <button
                onClick={onStartNewForm}
                className="oregon-button-primary px-6 py-3"
              >
                Yeni Form Oluştur
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredForms.map((form) => {
                const resolvedStatus = resolveStatus(form);
                const isFinalized = resolvedStatus === 'completed' || resolvedStatus === 'submitted';

                return (
                  <div key={form.id} className="oregon-card p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {form.tasiyiciFirma || 'Taşıyıcı Firma Belirtilmemiş'}
                        </h3>
                        {getStatusBadge(resolvedStatus)}
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          ID: {typeof form.id === 'string' && form.id ? form.id.slice(-8) : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Araç Türü:</span><br />
                          {form.aracTuru || '-'}
                        </div>
                        <div>
                          <span className="font-medium">Çekici Plaka:</span><br />
                          {form.cekiciPlaka || '-'}
                        </div>
                        <div>
                          <span className="font-medium">Oluşturulma:</span><br />
                          {formatDate(form.createdAt || '')}
                        </div>
                        <div>
                          <span className="font-medium">Son Güncelleme:</span><br />
                          {formatDate(form.updatedAt || '')}
                        </div>
                      </div>

                      {form.kontrolEdenAd && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Kontrol Eden:</span> {form.kontrolEdenAd}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => onLoadForm(form.id!)}
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
                          📄 PDF İndir
                        </a>
                      )}
                      
                      {(userIsAdmin || form.status === 'draft') && (
                        <button
                          onClick={() => handleDeleteForm(form.id!)}
                          className="oregon-error px-4 py-2 text-sm rounded-lg font-medium"
                        >
                          🗑️ Sil
                        </button>
                      )}
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
