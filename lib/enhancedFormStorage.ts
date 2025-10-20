import { supabase } from './supabase';
import { authManager } from './auth';
import type { ControlRow } from '../types/form';

export interface EnhancedFormData {
  // Basic Information
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
  
  // Enhanced fields
  loadingLocation?: string;
  yuklemeTarihi?: string;
  preLoadingWeight?: string;
  postLoadingWeight?: string;
  
  // Driver Information
  soforSayisi?: number;
  soforler?: Array<{
    ad?: string;
    tel?: string;
    imza?: string;
  }>;
  
  // Seal Information
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
  
  // Control Results
  fizikiKontrol?: ControlRow[];
  fizikiAciklama?: string[];
  zulaKontrol?: ControlRow[];
  zulaAciklama?: string[];
  
  // Inspector Information
  kontrolEdenAd?: string;
  kontrolEdenImza?: string;
  timestamp?: string;
  
  // General Result
  genelSonuc?: string;
  
  // Photos
  fotoListesi?: string[];
  
  // Enhanced metadata
  status: 'draft' | 'submitted';
  customStatus?: 'completed' | 'sahada' | 'sahadan_cikis' | 'x' | 'y';
  companyId?: string;
  inspectorId?: string;
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
  // Form validation with enhanced logic
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

    console.log('🔍 Enhanced form validation starting...');

    // TEMPORARILY DISABLED: Critical fields validation
    // Allow forms to proceed even with empty critical fields
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
      // No errors pushed - validation temporarily disabled
    });

    // Important fields (warnings if missing)
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

    // Control checks validation
    totalFields += 2; // Fiziki and Zula controls
    
    // TEMPORARILY DISABLED: Fiziki kontrol validation
    const hasChecklistSelection = (list: any): boolean => {
      if (!Array.isArray(list)) {
        return false;
      }

      return list.some(item => {
        if (item === null || item === undefined) return false;

        if (typeof item === 'string') {
          const normalized = item.trim().toLowerCase();
          return normalized === 'uygun' || normalized === 'uygunsuz';
        }

        if (typeof item === 'boolean') {
          return true;
        }

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

    const fizikiValid = hasChecklistSelection(formData.fizikiKontrol);
    
    if (fizikiValid) {
      completedFields++;
    }
    // No error for missing fiziki kontrol - validation temporarily disabled

    // TEMPORARILY DISABLED: Zula kontrol validation
    const zulaValid = hasChecklistSelection(formData.zulaKontrol);
    
    if (zulaValid) {
      completedFields++;
    }
    // No error for missing zula kontrol - validation temporarily disabled

    // Driver information
    totalFields++;
    if (formData.soforler && formData.soforler.length > 0 && 
        formData.soforler.some(s => s.ad && s.ad.trim())) {
      completedFields++;
    } else {
      warnings.push('Şoför bilgileri eksik');
    }

    const completionLevel = Math.round((completedFields / totalFields) * 100);
    const isValid = true; // TEMPORARILY ALWAYS VALID - validation disabled

    console.log('✅ Enhanced validation result:', {
      isValid,
      errors: errors.length,
      warnings: warnings.length,
      completionLevel: `${completionLevel}%`
    });

    return { 
      isValid: true, // Always return valid
      errors: [], // No blocking errors
      warnings, 
      completionLevel 
    };
  }

  // Auto-save with enhanced logic
  static async autoSave(formData: Partial<EnhancedFormData>): Promise<string | null> {
    try {
      const user = authManager.getCurrentUser();
      if (!user) {
        console.log('⚠️ Auto-save skipped: No authenticated user');
        return null;
      }

      // Check if form has meaningful data
      const hasData = formData.tasiyiciFirma || 
                     formData.aracTuru || 
                     formData.cekiciPlaka || 
                     formData.soforler?.some(s => s.ad);

      if (!hasData) {
        console.log('⚠️ Auto-save skipped: No meaningful data');
        return null;
      }

      console.log('🔄 Auto-saving form...');

      const validation = this.validateForm(formData as EnhancedFormData);
      const status = validation.isValid ? 'submitted' : 'draft';
      const customStatus = validation.isValid ? 'completed' : null;

      const saveData = {
        form_data: formData,
        status,
        custom_status: customStatus,
        updated_at: new Date().toISOString(),
        company_id: formData.companyId || null,
        inspector_id: null // Will be set if user system is implemented
      };

      if (formData.id) {
        // Update existing form
        const { error } = await supabase
          .from('forms')
          .update(saveData)
          .eq('id', formData.id);

        if (error) throw error;
        console.log('✅ Form auto-saved (updated):', formData.id);
        return formData.id;
      } else {
        // Create new form
        const { data, error } = await supabase
          .from('forms')
          .insert({
            ...saveData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        console.log('✅ Form auto-saved (created):', data.id);
        return data.id;
      }
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      return null;
    }
  }

  // Save form with status determination
  static async saveForm(formData: EnhancedFormData, forceStatus?: string): Promise<string> {
    try {
      console.log('🔄 Saving form with enhanced logic...');

      const user = authManager.getCurrentUser();
      const validation = this.validateForm(formData);
      
      // Determine status
      let status = forceStatus || (validation.isValid ? 'submitted' : 'draft');
      let customStatus = undefined;
      
      // Map custom statuses to database-compatible values
      if (forceStatus && !['draft', 'submitted'].includes(forceStatus)) {
        customStatus = forceStatus as any;
        status = 'submitted'; // Store as submitted in database
      }
      
      // Admin can force any status
      if (user?.role === 'admin' && forceStatus) {
        if (['draft', 'submitted'].includes(forceStatus)) {
          status = forceStatus;
        } else {
          customStatus = forceStatus as any;
          status = 'submitted';
        }
      }

      const saveData = {
        form_data: formData,
        status,
        custom_status: customStatus,
        updated_at: new Date().toISOString(),
        company_id: formData.companyId || null,
        inspector_id: formData.inspectorId || null,
        pdf_url: formData.pdfUrl || null
      };

      if (formData.id) {
        // Check edit permissions
        const existingForm = await this.getForm(formData.id);
        if (existingForm && !authManager.canEditForm(existingForm.status)) {
          throw new Error('Bu formu düzenleme yetkiniz bulunmuyor');
        }

        const { error } = await supabase
          .from('forms')
          .update(saveData)
          .eq('id', formData.id);

        if (error) throw error;
        console.log('✅ Form updated:', formData.id, 'Status:', status);
        return formData.id;
      } else {
        const { data, error } = await supabase
          .from('forms')
          .insert({
            ...saveData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        console.log('✅ Form created:', data.id, 'Status:', status);
        return data.id;
      }
    } catch (error) {
      console.error('❌ Form save failed:', error);
      throw error;
    }
  }

  // Get forms with role-based filtering
  static async getForms(filters?: {
    status?: string;
    companyId?: string;
    limit?: number;
  }): Promise<EnhancedFormData[]> {
    try {
      console.log('🔄 Fetching forms with filters:', filters);

      const user = authManager.getCurrentUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      let query = supabase
        .from('forms')
        .select('*')
        .order('updated_at', { ascending: false });

      // Apply filters
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

      console.log('✅ Forms fetched:', data?.length, 'forms');

      // Transform data
      return (data || []).map(form => ({
        ...form.form_data,
        id: form.id,
        status: form.custom_status || form.status,
        createdAt: form.created_at,
        updatedAt: form.updated_at,
        companyId: form.company_id,
        inspectorId: form.inspector_id,
        pdfUrl: form.pdf_url
      }));
    } catch (error) {
      console.error('❌ Forms fetch failed:', error);
      throw error;
    }
  }

  // Get single form with permission check
  static async getForm(formId: string): Promise<EnhancedFormData | null> {
    try {
      console.log('🔄 Fetching form:', formId);

      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Form not found
        }
        throw error;
      }

      // Check view permissions
      if (!authManager.canViewForm(data.status)) {
        throw new Error('Bu formu görüntüleme yetkiniz bulunmuyor');
      }

      console.log('✅ Form fetched:', formId);

      return {
        ...data.form_data,
        id: data.id,
        status: data.custom_status || data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        companyId: data.company_id,
        inspectorId: data.inspector_id,
        pdfUrl: data.pdf_url
      };
    } catch (error) {
      console.error('❌ Form fetch failed:', error);
      throw error;
    }
  }

  // Delete form with permission check
  static async deleteForm(formId: string): Promise<void> {
    try {
      console.log('🔄 Deleting form:', formId);

      const user = authManager.getCurrentUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      // Get form to check permissions
      const existingForm = await this.getForm(formId);
      if (!existingForm) {
        throw new Error('Form bulunamadı');
      }

      // Only admin or draft forms can be deleted
      if (user.role !== 'admin' && existingForm.status !== 'draft' && existingForm.status !== 'submitted') {
        throw new Error('Sadece taslak formlar silinebilir');
      }

      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;
      console.log('✅ Form deleted:', formId);
    } catch (error) {
      console.error('❌ Form deletion failed:', error);
      throw error;
    }
  }

  // Get companies
  static async getCompanies(): Promise<Company[]> {
    try {
      console.log('🔄 Fetching companies...');
      
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;

      console.log('✅ Companies fetched:', data?.length, 'companies');
      return data || [];
    } catch (error) {
      console.error('❌ Companies fetch failed:', error);
      return [];
    }
  }

  // Get dashboard statistics
  static async getDashboardStats(): Promise<{
    totalForms: number;
    draftForms: number;
    completedForms: number;
    sahadaForms: number;
    recentForms: EnhancedFormData[];
  }> {
    try {
      console.log('🔄 Fetching dashboard statistics...');

      const user = authManager.getCurrentUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      // Get all forms for statistics
      const { data: allForms, error } = await supabase
        .from('forms')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const totalForms = allForms?.length || 0;
      const draftForms = allForms?.filter(f => f.status === 'draft').length || 0;
      const completedForms = allForms?.filter(f => f.status === 'submitted' || f.custom_status === 'completed').length || 0;
      const sahadaForms = allForms?.filter(f => f.custom_status === 'sahada').length || 0;

      // Get recent forms (last 5)
      const recentFormsData = allForms?.slice(0, 5) || [];
      const recentForms: EnhancedFormData[] = recentFormsData.map(form => ({
        ...form.form_data,
        id: form.id,
        status: form.custom_status || form.status,
        createdAt: form.created_at,
        updatedAt: form.updated_at,
        companyId: form.company_id,
        inspectorId: form.inspector_id,
        pdfUrl: form.pdf_url
      }));

      console.log('✅ Dashboard stats fetched:', {
        totalForms,
        draftForms,
        completedForms,
        sahadaForms
      });

      return {
        totalForms,
        draftForms,
        completedForms,
        sahadaForms,
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
