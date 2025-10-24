import { supabase } from './supabase';
import { authManager } from './auth';
import type { ControlRow } from '../types/form';

export interface EnhancedFormData {
  id?: string;
  mrnNo?: string;
  rejimHakSahibiAdi?: string;
  tasiyiciFirma?: string;
  aracTuru?: string;
  sevkDurumu?: string;
  muhurDurumu?: string;
  cekiciPlaka?: string;
  dorsePlaka?: string;
  konteynerNo?: string;
  kamyonPlaka?: string;

  loadingLocation?: string;
  yuklemeTarihi?: string;
  preLoadingWeight?: string;
  postLoadingWeight?: string;

  soforSayisi?: number;
  soforler?: Array<{
    ad?: string;
    tel?: string;
    imza?: string;
  }>;

  muhurNum?: string;
  yeniMuhurNum?: string;
  muhurKontrol?: {
    evrakUyum?: boolean | null;
    saglamlik?: boolean | null;
    gerginlik?: boolean | null;
    kilitUygunluk?: boolean | null;
  };
  yeniMuhurKontrol?: {
    evrakUyum?: boolean | null;
    saglamlik?: boolean | null;
    gerginlik?: boolean | null;
    kilitUygunluk?: boolean | null;
  };

  fizikiKontrol?: ControlRow[];
  fizikiAciklama?: string[];
  zulaKontrol?: ControlRow[];
  zulaAciklama?: string[];

  kontrolEdenAd?: string;
  kontrolEdenImza?: string;
  timestamp?: string;

  genelSonuc?: string;

  fotoListesi?: string[];

  status: 'draft' | 'completed';
  customStatus?: 'field' | 'draft' | 'completed';
  companyId?: string;
  inspectorId?: string;
  pdfPath?: string;
  pdfSizeBytes?: number;
  thumbnailPath?: string;
  pdfUrl?: string;
  createdAt?: string;
  updatedAt?: string;
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
  user_id?: string;
  created_at?: string;
}

export class EnhancedFormStorageManager {
  static validateForm(formData: EnhancedFormData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    completionLevel: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let completedFields = 0;
    let totalFields = 0;

    const criticalFields = [
      { key: 'tasiyiciFirma', label: 'Taşıyıcı firma' },
      { key: 'aracTuru', label: 'Araç türü' },
      { key: 'sevkDurumu', label: 'Sevk durumu' },
      { key: 'muhurDurumu', label: 'Mühür durumu' },
      { key: 'kontrolEdenAd', label: 'Kontrol eden adı' }
    ];

    criticalFields.forEach(field => {
      totalFields++;
      const value = (formData as any)[field.key];
      if (value && (typeof value !== 'string' || value.trim())) {
        completedFields++;
      }
    });

    const importantFields = [
      { key: 'cekiciPlaka', label: 'Çekici plaka' },
      { key: 'dorsePlaka', label: 'Dorse plaka' },
      { key: 'loadingLocation', label: 'Yükleme yeri' },
      { key: 'yuklemeTarihi', label: 'Yükleme tarihi' }
    ];

    importantFields.forEach(field => {
      totalFields++;
      const value = (formData as any)[field.key];
      if (!value || (typeof value === 'string' && !value.trim())) {
        warnings.push(`${field.label} önerilir`);
      } else {
        completedFields++;
      }
    });

    totalFields += 2;

    const hasChecklistSelection = (list: any): boolean => {
      if (!Array.isArray(list)) return false;
      return list.some(item => {
        if (item === null || item === undefined) return false;
        if (typeof item === 'string') {
          const normalized = item.trim().toLowerCase();
          return normalized === 'uygun' || normalized === 'uygunsuz';
        }
        if (typeof item === 'boolean') return true;
        if (typeof item === 'object') {
          if ('uygun' in item) {
            const value = (item as ControlRow).uygun;
            return value !== null && value !== undefined;
          }
          return Object.values(item).some(Boolean);
        }
        return false;
      });
    };

    if (hasChecklistSelection(formData.fizikiKontrol)) completedFields++;
    if (hasChecklistSelection(formData.zulaKontrol)) completedFields++;

    totalFields++;
    if (formData.soforler && formData.soforler.length > 0 &&
        formData.soforler.some(s => s.ad && s.ad.trim())) {
      completedFields++;
    } else {
      warnings.push('Şoför bilgileri eksik');
    }

    const completionLevel = Math.round((completedFields / totalFields) * 100);

    return {
      isValid: true,
      errors: [],
      warnings,
      completionLevel
    };
  }

  static async autoSave(formData: Partial<EnhancedFormData>): Promise<string | null> {
    try {
      const user = authManager.getCurrentUser();
      if (!user) {
        console.log('⚠️ Auto-save skipped: No authenticated user');
        return null;
      }

      const hasData = formData.tasiyiciFirma ||
                     formData.aracTuru ||
                     formData.cekiciPlaka ||
                     formData.soforler?.some(s => s.ad);

      if (!hasData) {
        console.log('⚠️ Auto-save skipped: No meaningful data');
        return null;
      }

      const validation = this.validateForm(formData as EnhancedFormData);
      const status = validation.isValid ? 'submitted' : 'draft';
      const customStatus = validation.isValid ? 'completed' : null;

      const saveData = {
        form_data: formData,
        status,
        custom_status: customStatus,
        updated_at: new Date().toISOString(),
        company_id: formData.companyId || null,
        inspector_id: null,
        tasiyici_firma: formData.tasiyiciFirma || null,
        arac_turu: formData.aracTuru || null,
        cekici_plaka: formData.cekiciPlaka || null,
        genel_sonuc: formData.genelSonuc || null
      };

      if (formData.id) {
        const { error } = await supabase
          .from('forms')
          .update(saveData)
          .eq('id', formData.id);

        if (error) throw error;
        return formData.id;
      } else {
        const { data, error } = await supabase
          .from('forms')
          .insert({
            ...saveData,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (error) throw error;
        return data.id;
      }
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      return null;
    }
  }

  static async saveForm(formData: EnhancedFormData, forceStatus?: string): Promise<string> {
    try {
      const user = authManager.getCurrentUser();

      // Determine custom_status (UI filter category)
      const customStatus = formData.customStatus || 'draft';

      // IMPORTANT: Do NOT send 'status' field manually!
      // Database trigger 'sync_form_status()' will auto-sync status based on custom_status:
      // - If custom_status = 'field' or 'draft' → status = 'draft' (editable)
      // - If custom_status = 'completed' → status = 'completed' (locked)

      const saveData = {
        form_data: formData,
        // status field is NOT included - trigger will set it automatically
        custom_status: customStatus,
        updated_at: new Date().toISOString(),
        company_id: formData.companyId || null,
        inspector_id: formData.inspectorId || null,
        pdf_path: formData.pdfPath || null,
        pdf_size_bytes: formData.pdfSizeBytes || null,
        thumbnail_path: formData.thumbnailPath || null,
        pdf_url: formData.pdfUrl || null,
        tasiyici_firma: formData.tasiyiciFirma || null,
        arac_turu: formData.aracTuru || null,
        cekici_plaka: formData.cekiciPlaka || null,
        genel_sonuc: formData.genelSonuc || null
      };

      if (formData.id) {
        const existingForm = await this.getForm(formData.id);
        if (existingForm && !authManager.canEditForm(existingForm.status)) {
          throw new Error('Bu formu düzenleme yetkiniz bulunmuyor');
        }

        const { error } = await supabase
          .from('forms')
          .update(saveData)
          .eq('id', formData.id);

        if (error) throw error;
        return formData.id;
      } else {
        const { data, error } = await supabase
          .from('forms')
          .insert({
            ...saveData,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (error) throw error;
        return data.id;
      }
    } catch (error) {
      console.error('❌ Form save failed:', error);
      throw error;
    }
  }

  static async getForms(filters?: {
    status?: string;
    companyId?: string;
    limit?: number;
  }): Promise<EnhancedFormData[]> {
    try {
      const user = authManager.getCurrentUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      let query = supabase
        .from('forms')
        .select('id,status,custom_status,created_at,updated_at,pdf_path,pdf_url,tasiyici_firma,cekici_plaka,arac_turu,genel_sonuc,company_id,inspector_id')
        .order('updated_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.companyId) {
        query = query.eq('company_id', filters.companyId);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(form => ({
        id: form.id,
        status: form.status,
        customStatus: form.custom_status,
        createdAt: form.created_at,
        updatedAt: form.updated_at,
        companyId: form.company_id,
        inspectorId: form.inspector_id,
        pdfPath: form.pdf_path,
        pdfUrl: form.pdf_url,
        tasiyiciFirma: form.tasiyici_firma,
        cekiciPlaka: form.cekici_plaka,
        aracTuru: form.arac_turu,
        genelSonuc: form.genel_sonuc
      }));
    } catch (error) {
      console.error('❌ Forms fetch failed:', error);
      throw error;
    }
  }

  static async getForm(formId: string): Promise<EnhancedFormData | null> {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      if (!authManager.canViewForm(data.status)) {
        throw new Error('Bu formu görüntüleme yetkiniz bulunmuyor');
      }

      return {
        ...data.form_data,
        id: data.id,
        status: data.status,
        customStatus: data.custom_status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        companyId: data.company_id,
        inspectorId: data.inspector_id,
        pdfPath: data.pdf_path,
        pdfUrl: data.pdf_url
      };
    } catch (error) {
      console.error('❌ Form fetch failed:', error);
      throw error;
    }
  }

  static async deleteForm(formId: string): Promise<void> {
    try {
      const user = authManager.getCurrentUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      const existingForm = await this.getForm(formId);
      if (!existingForm) {
        throw new Error('Form bulunamadı');
      }

      if (user.role !== 'admin' && existingForm.status !== 'draft') {
        throw new Error('Sadece taslak formlar silinebilir');
      }

      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Form deletion failed:', error);
      throw error;
    }
  }

  static async getCompanies(): Promise<Company[]> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')
        .limit(100);

      if (error) {
        console.error('❌ Companies fetch failed:', error);
        console.log('🔍 Check RLS policies or Supabase keys');
        throw error;
      }

      console.log('✅ Companies fetched:', data?.length, 'companies');
      return data || [];
    } catch (error) {
      console.error('❌ Companies health check failed:', error);
      return [];
    }
  }

  static async getDashboardStats(): Promise<{
    totalForms: number;
    draftForms: number;
    completedForms: number;
    sahadaForms: number;
    recentForms: EnhancedFormData[];
  }> {
    try {
      const user = authManager.getCurrentUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      const { count: totalCount } = await supabase
        .from('forms')
        .select('*', { count: 'exact', head: true });

      const { count: draftCount } = await supabase
        .from('forms')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      const { count: completedCount } = await supabase
        .from('forms')
        .select('*', { count: 'exact', head: true })
        .or('status.eq.submitted,custom_status.eq.completed');

      const { count: sahadaCount } = await supabase
        .from('forms')
        .select('*', { count: 'exact', head: true })
        .eq('custom_status', 'sahada');

      const recentForms = await this.getForms({ limit: 5 });

      return {
        totalForms: totalCount || 0,
        draftForms: draftCount || 0,
        completedForms: completedCount || 0,
        sahadaForms: sahadaCount || 0,
        recentForms
      };
    } catch (error) {
      console.error('❌ Dashboard stats fetch failed:', error);
      return {
        totalForms: 0,
        draftForms: 0,
        completedForms: 0,
        sahadaForms: 0,
        recentForms: []
      };
    }
  }
}
