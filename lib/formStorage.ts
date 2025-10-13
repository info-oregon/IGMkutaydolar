import { supabase } from './supabase';
import { FormData } from './pdfForm';

export interface StoredForm extends FormData {
  id: string;
  status: 'draft' | 'submitted';
  createdAt: string;
  updatedAt: string;
  companyId?: string;
  inspectorId?: string;
  pdfUrl?: string;
  formData?: any; // JSON formatında form verisi
}

export interface Company {
  id: string;
  name: string;
  created_at?: string;
}

export interface Inspector {
  id: string;
  name: string;
  email: string;
  company_id?: string;
  user_id: string;
  created_at?: string;
}

export class FormStorageManager {
  // Şirketleri getir
  static async getCompanies(): Promise<Company[]> {
    try {
      console.log('Şirketler Supabase\'den getiriliyor...');
      
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Şirketler getirilirken hata:', error);
        throw error;
      }

      console.log('Şirketler başarıyla getirildi:', data?.length, 'adet şirket');
      console.log('İlk 3 şirket:', data?.slice(0, 3));
      return data || [];
    } catch (error) {
      console.error('Şirketler getirilirken hata:', error);
      return [];
    }
  }

  // Denetçileri getir
  static async getInspectors(): Promise<Inspector[]> {
    try {
      console.log('Denetçiler Supabase\'den getiriliyor...');
      
      const { data, error } = await supabase
        .from('inspectors')
        .select('id, name, email, company_id, user_id, created_at')
        .order('name');

      if (error) {
        console.error('Denetçiler getirilirken hata:', error);
        throw error;
      }

      console.log('Denetçiler başarıyla getirildi:', data?.length, 'adet denetçi');
      return data || [];
    } catch (error) {
      console.error('Denetçiler getirilirken hata:', error);
      return [];
    }
  }

  // Form validasyonu - zorunlu alanları kontrol et
  static validateForm(formData: FormData): { isValid: boolean; errors: string[] } {
    const warnings: string[] = [];

    console.log('🔍 Form validasyonu başlıyor...');
    console.log('📋 Temel bilgiler:', {
      tasiyiciFirma: formData.tasiyiciFirma,
      aracTuru: formData.aracTuru,
      sevkDurumu: formData.sevkDurumu,
      muhurDurumu: formData.muhurDurumu
    });
    console.log('🔧 Fiziki kontrol:', {
      type: typeof formData.fizikiKontrol,
      isArray: Array.isArray(formData.fizikiKontrol),
      length: formData.fizikiKontrol?.length,
      sample: formData.fizikiKontrol?.slice(0, 3),
      allValues: formData.fizikiKontrol
    });
    console.log('🔍 Zula kontrol:', {
      type: typeof formData.zulaKontrol,
      isArray: Array.isArray(formData.zulaKontrol),
      length: formData.zulaKontrol?.length,
      sample: formData.zulaKontrol?.slice(0, 3),
      allValues: formData.zulaKontrol
    });
    console.log('👤 Kontrol eden:', {
      kontrolEdenAd: formData.kontrolEdenAd,
      type: typeof formData.kontrolEdenAd,
      length: formData.kontrolEdenAd?.length,
      trimmed: formData.kontrolEdenAd?.trim()
    });

    // Temel bilgiler kontrol (sadece uyarı)
    if (!formData.tasiyiciFirma?.trim()) {
      warnings.push('Taşıyıcı firma seçilmemiş');
      console.warn('⚠️ Taşıyıcı firma seçilmemiş');
    }
    if (!formData.aracTuru?.trim()) {
      warnings.push('Araç türü seçilmemiş');
      console.warn('⚠️ Araç türü seçilmemiş');
    }
    if (!formData.sevkDurumu?.trim()) {
      warnings.push('Sevk durumu seçilmemiş');
      console.warn('⚠️ Sevk durumu seçilmemiş');
    }
    if (!formData.muhurDurumu?.trim()) {
      warnings.push('Mühür durumu seçilmemiş');
      console.warn('⚠️ Mühür durumu seçilmemiş');
    }

    // Fiziki kontrol kontrol (sadece uyarı)
    const fizikiValid = formData.fizikiKontrol && 
      Array.isArray(formData.fizikiKontrol) &&
      formData.fizikiKontrol.length > 0 && 
      formData.fizikiKontrol.some(item => 
        // Herhangi bir truthy değer veya açık false değeri kabul et
        item === true || 
        item === false || 
        item === 'uygun' || 
        item === 'uygunsuz' ||
        item === 'on' ||
        (typeof item === 'string' && item.trim() !== '') ||
        (typeof item === 'number' && !isNaN(item))
      );
    
    console.log('✅ Fiziki kontrol validasyon:', {
      fizikiValid,
      validItems: formData.fizikiKontrol?.filter(item => item === true || item === false || item === 'uygun' || item === 'uygunsuz' || item === 'on' || (typeof item === 'string' && item.trim() !== ''))
    });
    
    if (!fizikiValid) {
      warnings.push('Fiziki kontrol alanları boş');
      console.warn('⚠️ Fiziki kontrol alanları doldurulmamış');
    }

    // Zula kontrol kontrol (sadece uyarı)
    const zulaValid = formData.zulaKontrol && 
      Array.isArray(formData.zulaKontrol) &&
      formData.zulaKontrol.length > 0 && 
      formData.zulaKontrol.some(item => 
        // Herhangi bir truthy değer veya açık false değeri kabul et
        item === true || 
        item === false || 
        item === 'uygun' || 
        item === 'uygunsuz' ||
        item === 'on' ||
        (typeof item === 'string' && item.trim() !== '') ||
        (typeof item === 'number' && !isNaN(item))
      );
    
    console.log('✅ Zula kontrol validasyon:', {
      zulaValid,
      validItems: formData.zulaKontrol?.filter(item => item === true || item === false || item === 'uygun' || item === 'uygunsuz' || item === 'on' || (typeof item === 'string' && item.trim() !== ''))
    });
    
    if (!zulaValid) {
      warnings.push('Zula kontrol alanları boş');
      console.warn('⚠️ Zula kontrol alanları doldurulmamış');
    }

    // Kontrolü gerçekleştiren kontrol (sadece uyarı)
    if (!formData.kontrolEdenAd?.trim()) {
      warnings.push('Kontrolü gerçekleştiren adı boş');
      console.warn('⚠️ Kontrolü gerçekleştiren kişinin adı girilmemiş');
    }

    console.log('Form validasyon sonucu (uyarılar):', { 
      isValid: true, // Her zaman true döndür
      warnings,
      totalWarnings: warnings.length
    });

    // Her zaman geçerli form olarak döndür
    return {
      isValid: true,
      errors: [] // Boş errors array döndür
    };
  }

  // Taslak formu kaydet
  static async saveDraft(formData: Partial<FormData>): Promise<string> {
    try {
      console.log('Taslak kaydediliyor:', formData);

      const { data: { user } } = await supabase.auth.getUser();
      
      // Inspector ID'yi al veya oluştur
      let inspectorId = user ? await this.getOrCreateInspector(user.id, user.email || '') : null;

      const draftData = {
        form_data: formData,
        status: 'draft' as const,
        updated_at: new Date().toISOString(),
        company_id: formData.companyId || null,
        inspector_id: inspectorId
      };

      if (formData.id) {
        // Mevcut taslağı güncelle
        console.log('Mevcut taslak güncelleniyor:', formData.id);
        
        const { error } = await supabase
          .from('forms')
          .update(draftData)
          .eq('id', formData.id);

        if (error) throw error;
        console.log('Taslak güncellendi:', formData.id);
        return formData.id;
      } else {
        // Yeni taslak oluştur
        console.log('Yeni taslak oluşturuluyor...');
        
        const { data, error } = await supabase
          .from('forms')
          .insert({
            ...draftData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        console.log('Yeni taslak oluşturuldu:', data.id);
        return data.id;
      }
    } catch (error) {
      console.error('Taslak kaydedilirken hata:', error);
      throw error;
    }
  }

  // Formu onaylanmış olarak kaydet
  static async submitForm(formData: FormData, pdfUrl?: string): Promise<string> {
    try {
      console.log('Form onaylanıyor:', formData, 'PDF URL:', pdfUrl);
      
      // Auth olmadan çalış - user_id ve inspector_id opsiyonel
      let inspectorId = null;
      
      const submittedData = {
        form_data: formData,
        status: 'submitted' as const,
        updated_at: new Date().toISOString(),
        company_id: formData.companyId || null,
        inspector_id: inspectorId,
        pdf_url: pdfUrl || null
      };

      if (formData.id) {
        // Mevcut formu güncelle
        console.log('Mevcut form onaylanıyor:', formData.id);
        
        const { error } = await supabase
          .from('forms')
          .update(submittedData)
          .eq('id', formData.id);

        if (error) throw error;
        console.log('Form onaylandı:', formData.id);
        return formData.id;
      } else {
        // Yeni onaylanmış form oluştur
        console.log('Yeni form onaylanıyor...');
        
        const { data, error } = await supabase
          .from('forms')
          .insert({
            ...submittedData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        console.log('Yeni form onaylandı:', data.id);
        return data.id;
      }
    } catch (error) {
      console.error('Form onaylanırken hata:', error);
      throw error;
    }
  }

  // Inspector ID'yi al veya oluştur
  static async getOrCreateInspector(userId: string, email: string): Promise<string> {
    try {
      console.log('Inspector kontrol ediliyor:', userId, email);
      
      // Mevcut inspector'ı kontrol et
      const { data: existingInspector, error: selectError } = await supabase
        .from('inspectors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingInspector) {
        console.log('Mevcut inspector bulundu:', existingInspector.id);
        return existingInspector.id;
      }

      // Yeni inspector oluştur
      console.log('Yeni inspector oluşturuluyor...');
      
      const { data: newInspector, error: insertError } = await supabase
        .from('inspectors')
        .insert({
          name: email.split('@')[0], // Email'den isim çıkar
          email: email,
          user_id: userId
        })
        .select()
        .single();

      if (insertError) throw insertError;
      console.log('Yeni inspector oluşturuldu:', newInspector.id);
      return newInspector.id;
    } catch (error) {
      console.error('Inspector oluşturulurken hata:', error);
      throw error;
    }
  }

  // Kullanıcının formlarını getir
  static async getUserForms(): Promise<StoredForm[]> {
    try {
      console.log('Kullanıcı formları getiriliyor...');
      
      // Auth olmadan tüm formları getir
      console.log('Auth olmadan tüm formlar getiriliyor...');

      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      console.log('Kullanıcı formları getirildi:', data?.length, 'adet form');
      
      // Form verilerini düzenle
      return (data || []).map(form => ({
        ...form.form_data,
        id: form.id,
        status: form.status,
        createdAt: form.created_at,
        updatedAt: form.updated_at,
        companyId: form.company_id,
        inspectorId: form.inspector_id,
        pdfUrl: form.pdf_url,
        formData: form.form_data
      }));
    } catch (error) {
      console.error('Formlar getirilirken hata:', error);
      throw error;
    }
  }

  // Belirli bir formu getir
  static async getForm(formId: string): Promise<StoredForm | null> {
    try {
      console.log('Form getiriliyor:', formId);
      
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Form bulunamadı:', formId);
          return null; // Form bulunamadı
        }
        throw error;
      }

      console.log('Form getirildi:', data);

      // Form verisini düzenle
      return {
        ...data.form_data,
        id: data.id,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        companyId: data.company_id,
        inspectorId: data.inspector_id,
        pdfUrl: data.pdf_url,
        formData: data.form_data
      };
    } catch (error) {
      console.error('Form getirilirken hata:', error);
      throw error;
    }
  }

  // Formu sil
  static async deleteForm(formId: string): Promise<void> {
    try {
      console.log('Form siliniyor:', formId);
      
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;
      console.log('Form başarıyla silindi:', formId);
    } catch (error) {
      console.error('Form silinirken hata:', error);
      throw error;
    }
  }

  // Otomatik taslak kaydetme
  static async autoSaveDraft(formData: Partial<FormData>): Promise<void> {
    try {
      // Sadece önemli veriler varsa kaydet
      const hasImportantData = formData.tasiyiciFirma || 
                              formData.aracTuru || 
                              formData.cekici || 
                              formData.soforler?.some(s => s.ad);

      if (hasImportantData) {
        console.log('Otomatik taslak kaydediliyor...');
        await this.saveDraft(formData);
      }
    } catch (error) {
      // Otomatik kaydetme hatası sessizce loglanır
      console.warn('Otomatik taslak kaydetme hatası:', error);
    }
  }
}