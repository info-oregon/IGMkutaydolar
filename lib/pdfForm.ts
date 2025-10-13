import { PDFDocument, PDFForm, PDFPage } from 'pdf-lib';
import { PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { supabase } from './supabase';

export interface FormData {
  // Basic Information
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
  yuklemeYeri?: string;
  yuklemeTarihi?: string;
  yuklemeOncesiKantar?: string;
  izinliGondericiKantar?: string;
  
  // Driver Information
  soforler?: Array<{
    ad?: string;
    tel?: string;
    imza?: string;
  }>;
  
  // Seal Information (Entry)
  muhurNum?: string;
  yeniMuhurNum?: string;
  muhurKontrol?: {
    evrakUyum?: boolean;
    saglamlik?: boolean;
    gerginlik?: boolean;
    kilitUygunluk?: boolean;
  };
  
  // Seal Information (Exit)
  cikisMuhurNo?: string;
  cikisMuhurKirilmaNedeni?: string;
  cikisYeniMuhurNo?: string;
  cikisMuhurKontrol?: {
    evrakUyum?: boolean;
    saglamlik?: boolean;
    gerginlik?: boolean;
    kilitUygunluk?: boolean;
  };
  
  // Physical Control
  fizikiKontrol?: (string | boolean | null)[];
  fizikiAciklama?: string[];
  
  // Hidden Compartment Control
  zulaKontrol?: (string | boolean | null)[];
  zulaAciklama?: string[];
  
  // Inspector Information
  kontrolEdenAd?: string;
  kontrolEdenImza?: string;
  timestamp?: string;
  
  // General Result
  genelSonuc?: string;
}

// Physical control field mapping (5 fields)
const FIZIKI_FIELDS = [
  'fiziki_genel_saglamlik',
  'fiziki_zarar_kontrol',
  'fiziki_kapilar',
  'fiziki_muhur_kilit',
  'fiziki_7nokta'
];

// Hidden compartment control field mapping (18 fields)
const ZULA_FIELDS = [
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
];

export class PDFFormGenerator {
  private pdfDoc: PDFDocument | null = null;
  private form: PDFForm | null = null;

  async loadTemplate(): Promise<void> {
    try {
      console.log('🔄 PDF şablonu yükleniyor: /arac_kontrol_çizgisiz.pdf');
      
      const response = await fetch('/arac_kontrol_çizgisiz.pdf');
      if (!response.ok) {
        throw new Error(`PDF şablonu yüklenemedi: ${response.status} ${response.statusText}`);
      }
      
      const pdfBytes = await response.arrayBuffer();
      console.log('✅ PDF şablonu yüklendi, boyut:', pdfBytes.byteLength, 'bytes');
      
      this.pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Register fontkit for Unicode font support
      this.pdfDoc.registerFontkit(fontkit);
      console.log('✅ Fontkit registered for Unicode font support');
      
      this.form = this.pdfDoc.getForm();
      
      console.log('✅ PDF form alanları hazır');
      
      // Türkçe karakter desteği için Unicode font yükle ve göm
      await this.loadUnicodeFont();
      
      // Debug: List all available form fields
      const fields = this.form.getFields();
      console.log('📋 PDF\'deki mevcut form alanları:', fields.map(f => f.getName()).slice(0, 10), '... (toplam:', fields.length, 'alan)');
      
    } catch (error) {
      console.error('❌ PDF şablonu yüklenirken hata:', error);
      throw error;
    }
  }

  private async loadUnicodeFont(): Promise<void> {
    if (!this.pdfDoc) {
      throw new Error('PDF dokümanı yüklenmemiş');
    }

    try {
      console.log('🔄 Türkçe karakter desteği için Unicode font yükleniyor: /fonts/Roboto-Regular.ttf');
      
      const fontResponse = await fetch('/fonts/Roboto-Regular.ttf');
      if (!fontResponse.ok) {
        throw new Error(`Font yüklenemedi: ${fontResponse.status} ${fontResponse.statusText}`);
      }
      
      const fontBytes = await fontResponse.arrayBuffer();
      console.log('✅ Roboto font dosyası başarıyla yüklendi, boyut:', fontBytes.byteLength, 'bytes');
      
      this.unicodeFont = await this.pdfDoc.embedFont(fontBytes);
      console.log('✅ Unicode font PDF\'e başarıyla gömüldü - Türkçe karakterler artık destekleniyor');
      
    } catch (error) {
      console.error('❌ Unicode font yüklenirken hata:', error);
      console.warn('⚠️ Varsayılan font kullanılacak, Türkçe karakterler (İ, ı, ş, ğ, ö, ü, ç) bozuk görünebilir');
      this.unicodeFont = null;
    }
  }

  async fillForm(formData: FormData): Promise<void> {
    if (!this.form || !this.pdfDoc) {
      throw new Error('PDF şablonu yüklenmemiş. Önce loadTemplate() çağırın.');
    }

    try {
      console.log('🔄 PDF form alanları doldruluyor (Türkçe karakter desteği:', this.unicodeFont ? 'AKTİF' : 'PASİF', ')...');
      console.log('📝 Form verisi:', formData);

      // Fill basic information
      await this.fillBasicInformation(formData);
      
      // Fill driver information
      await this.fillDriverInformation(formData);
      
      // Fill seal information
      await this.fillSealInformation(formData);
      
      // Fill physical control
      await this.fillPhysicalControl(formData);
      
      // Fill hidden compartment control
      await this.fillHiddenCompartmentControl(formData);
      
      // Fill inspector information and signatures
      await this.fillInspectorInformation(formData);
      
      console.log('✅ Tüm form alanları başarıyla dolduruldu (Türkçe karakterler:', this.unicodeFont ? 'düzgün görünecek' : 'bozuk olabilir', ')');
      
    } catch (error) {
      console.error('❌ Form doldurulurken hata:', error);
      throw error;
    }
  }

  private async fillBasicInformation(formData: FormData): Promise<void> {
    console.log('🔄 Temel bilgiler doldruluyor (şirket isimleri, plakalar vs.)...');
    
    // Basic information fields - exact LibreOffice field names
    this.safeSetTextField('mrnNo', formData.mrnNo || formData.mrn, 8);
    this.safeSetTextField('rejimHakSahibiAdi', formData.rejimHakSahibiAdi || formData.rejimHak, 8);
    this.safeSetTextField('tasiyiciFirma', formData.tasiyiciFirma, 7); // Smaller font for long company names
    this.safeSetTextField('aracTuru', formData.aracTuru, 8);
    this.safeSetTextField('sevkDurumu', formData.sevkDurumu, 8);
    this.safeSetTextField('muhurDurumu', formData.muhurDurumu, 8);
    
    // Vehicle plates - exact LibreOffice field names
    this.safeSetTextField('cekiciPlaka', formData.cekiciPlaka || formData.cekici, 8);
    this.safeSetTextField('dorsePlaka', formData.dorsePlaka || formData.dorse, 8);
    this.safeSetTextField('konteynerNo', formData.konteynerNo, 8);
    this.safeSetTextField('kamyonPlaka', formData.kamyonPlaka, 8);
    
    // Additional fields - exact LibreOffice field names
    this.safeSetTextField('yuklemeYeri', formData.loadingLocation || formData.yuklemeYeri, 8);
    this.safeSetTextField('yuklemeTarihi', formData.yuklemeTarihi, 8);
    this.safeSetTextField('yuklemeOncesiKantar', formData.preLoadingWeight || formData.yuklemeOncesiKantar, 8);
    this.safeSetTextField('izinliGondericiKantar', formData.postLoadingWeight || formData.izinliGondericiKantar, 8);
    
    console.log('✅ Temel bilgiler dolduruldu (Türkçe şirket isimleri ve plakalar)');
  }

  private async fillDriverInformation(formData: FormData): Promise<void> {
    console.log('🔄 Şoför bilgileri doldruluyor (Türkçe isimler)...');
    
    if (formData.soforler && Array.isArray(formData.soforler)) {
      // Driver 1 - exact LibreOffice field names
      if (formData.soforler[0]) {
        this.safeSetTextField('sofor1_adSoyad', formData.soforler[0].ad || formData.soforler[0].adSoyad, 8);
        this.safeSetTextField('sofor1_telefon', formData.soforler[0].tel || formData.soforler[0].telefon, 8);
        
        // Driver 1 signature
        if (formData.soforler[0].imza) {
          console.log('🔄 Şoför 1 imzası ekleniyor...');
          await this.embedSignatureImage(formData.soforler[0].imza, 'sofor1_imza');
        }
      }
      
      // Driver 2 - exact LibreOffice field names
      if (formData.soforler[1]) {
        this.safeSetTextField('sofor2_adSoyad', formData.soforler[1].ad || formData.soforler[1].adSoyad, 8);
        this.safeSetTextField('sofor2_telefon', formData.soforler[1].tel || formData.soforler[1].telefon, 8);
        
        // Driver 2 signature
        if (formData.soforler[1].imza) {
          console.log('🔄 Şoför 2 imzası ekleniyor...');
          await this.embedSignatureImage(formData.soforler[1].imza, 'sofor2_imza');
        }
      }
    }
    
    console.log('✅ Şoför bilgileri dolduruldu (Türkçe isimler ve telefon numaraları)');
  }

  private async fillSealInformation(formData: FormData): Promise<void> {
    console.log('🔄 Mühür bilgileri doldruluyor...');
    
    // Entry seal information - exact LibreOffice field names
    this.safeSetTextField('giris_muhurNo', formData.muhurNum, 8);
    
    // Map yeniMuhurNum to the correct field
    this.safeSetTextField('giris_yeniMuhurNo', formData.yeniMuhurNum, 8);
    
    // Entry seal control checkboxes - exact LibreOffice field names
    if (formData.muhurKontrol) {
      this.safeSetCheckBox('giris_muhurEvrakUygun', formData.muhurKontrol.evrakUyum);
      this.safeSetCheckBox('giris_muhurSaglamlik', formData.muhurKontrol.saglamlik);
      this.safeSetCheckBox('giris_muhurGerginlik', formData.muhurKontrol.gerginlik);
      this.safeSetCheckBox('giris_muhurKilit', formData.muhurKontrol.kilitUygunluk);
    }
    
    // Exit seal information (New Seal) - map from yeniMuhurKontrol
    this.safeSetTextField('cikis_muhurNo', formData.cikisMuhurNo, 8);
    this.safeSetTextField('cikis_muhurKirilmaNedeni', formData.cikisMuhurKirilmaNedeni, 8);
    
    // Map yeniMuhurNum to exit field as well
    this.safeSetTextField('cikis_yeniMuhurNo', formData.yeniMuhurNum || formData.cikisYeniMuhurNo, 8);
    
    // Exit seal control checkboxes - map from yeniMuhurKontrol
    const newSealControl = formData.yeniMuhurKontrol || formData.cikisMuhurKontrol;
    if (newSealControl) {
      this.safeSetCheckBox('cikis_muhurEvrakUygun', newSealControl.evrakUyum);
      this.safeSetCheckBox('cikis_muhurSaglamlik', newSealControl.saglamlik);
      this.safeSetCheckBox('cikis_muhurGerginlik', newSealControl.gerginlik);
      this.safeSetCheckBox('cikis_muhurKilit', newSealControl.kilitUygunluk);
    }
    
    console.log('✅ Mühür bilgileri dolduruldu');
  }

  private async fillPhysicalControl(formData: FormData): Promise<void> {
    console.log('🔄 Fiziki kontrol bilgileri doldruluyor (açıklamalar Türkçe)...');
    
    console.log('🔄 Filling physical control data:', formData.fizikiKontrol);
    
    if (formData.fizikiKontrol && Array.isArray(formData.fizikiKontrol)) {
      formData.fizikiKontrol.forEach((controlItem, index) => {
        if (index < FIZIKI_FIELDS.length) {
          const fieldName = FIZIKI_FIELDS[index];
          
          // Handle both array of strings and array of objects
          let isUygun = false;
          let aciklama = '';
          
          if (typeof controlItem === 'object' && controlItem !== null) {
            // New object format: { label, uygun, aciklama }
            isUygun = controlItem.uygun === true;
            aciklama = controlItem.aciklama || '';
          } else {
            // Legacy string/boolean format
            isUygun = this.isValueUygun(controlItem);
          }
          
          this.safeSetCheckBox(`${fieldName}_uygun`, isUygun);
          
          // Fill explanation - check both object format and separate array
          if (aciklama) {
            this.safeSetTextField(`${fieldName}_aciklama`, aciklama, 7);
          } else if (formData.fizikiAciklama && formData.fizikiAciklama[index]) {
            this.safeSetTextField(`${fieldName}_aciklama`, formData.fizikiAciklama[index], 7);
          }
        }
      });
    }
    
    console.log('✅ Fiziki kontrol bilgileri dolduruldu (Türkçe açıklamalar dahil)');
  }

  private async fillHiddenCompartmentControl(formData: FormData): Promise<void> {
    console.log('🔄 Zula kontrol bilgileri doldruluyor (açıklamalar Türkçe)...');
    
    console.log('🔄 Filling hidden compartment control data:', formData.zulaKontrol);
    
    if (formData.zulaKontrol && Array.isArray(formData.zulaKontrol)) {
      formData.zulaKontrol.forEach((controlItem, index) => {
        if (index < ZULA_FIELDS.length) {
          const fieldName = ZULA_FIELDS[index];
          
          // Handle both array of strings and array of objects
          let isUygun = false;
          let aciklama = '';
          
          if (typeof controlItem === 'object' && controlItem !== null) {
            // New object format: { label, uygun, aciklama }
            isUygun = controlItem.uygun === true;
            aciklama = controlItem.aciklama || '';
          } else {
            // Legacy string/boolean format
            isUygun = this.isValueUygun(controlItem);
          }
          
          this.safeSetCheckBox(`${fieldName}_uygun`, isUygun);
          
          // Fill explanation - check both object format and separate array
          if (aciklama) {
            this.safeSetTextField(`${fieldName}_aciklama`, aciklama, 7);
          } else if (formData.zulaAciklama && formData.zulaAciklama[index]) {
            this.safeSetTextField(`${fieldName}_aciklama`, formData.zulaAciklama[index], 7);
          }
        }
      });
    }
    
    console.log('✅ Zula kontrol bilgileri dolduruldu (Türkçe açıklamalar dahil)');
  }

  private async fillInspectorInformation(formData: FormData): Promise<void> {
    console.log('🔄 Kontrolü gerçekleştiren bilgileri doldruluyor (Türkçe isim)...');
    
    // Inspector name - map from kontrolEdenAd
    this.safeSetTextField('kontrolEdenAd', formData.kontrolEdenAd, 8);
    
    // Date and time - map from timestamp
    if (formData.timestamp) {
      this.safeSetTextField('tarihSaat', formData.timestamp, 8);
    } else {
      // Use current date/time if not provided
      const now = new Date().toLocaleString('tr-TR');
      this.safeSetTextField('tarihSaat', now, 8);
    }
    
    // General result - map from genelSonuc
    if (formData.genelSonuc) {
      // Set appropriate checkbox based on result
      if (formData.genelSonuc === 'uygun' || formData.genelSonuc === 'Uygun') {
        this.safeSetCheckBox('genel_sonuc_uygun', true);
      } else if (formData.genelSonuc === 'uygunsuz' || formData.genelSonuc === 'Uygun Değil') {
        this.safeSetCheckBox('genel_sonuc_uygun_degil', true);
      }
    }
    
    // Inspector signature
    if (formData.kontrolEdenImza) {
      console.log('🔄 Kontrol eden imzası ekleniyor...');
      await this.embedSignatureImage(formData.kontrolEdenImza, 'kontrol_eden_imza');
    } else {
      console.log('⚠️ Kontrol eden imzası bulunamadı');
    }
    
    console.log('✅ Kontrolü gerçekleştiren bilgileri dolduruldu (Türkçe isim ve tarih)');
  }

  private async embedSignatureImage(base64Data: string, fieldName: string): Promise<void> {
    if (!this.pdfDoc) return;
    
    try {
      console.log(`🔄 ${fieldName} imzası ekleniyor...`);
      
      // Remove data URL prefix if present
      const cleanBase64 = base64Data.replace(/^data:image\/png;base64,/, '');
      
      // Embed PNG image
      const pngImage = await this.pdfDoc.embedPng(cleanBase64);
      
      // Get the first page (most signatures are on page 1)
      const pages = this.pdfDoc.getPages();
      const page = pages[0];
      const { width: pageWidth, height: pageHeight } = page.getSize();
      
      // Define signature positions based on field name with proper A4 coordinates
      let x = 400, y = 100, width = 120, height = 50;
      
      switch (fieldName) {
        case 'sofor1_imza':
          // Şoför 1 imza alanı - adjusted position
          x = 80; 
          y = pageHeight - 420; 
          width = 120; 
          height = 50;
          break;
        case 'sofor2_imza':
          // Şoför 2 imza alanı - adjusted position
          x = 320; 
          y = pageHeight - 420; 
          width = 120; 
          height = 50;
          break;
        case 'kontrol_eden_imza':
          // Kontrol eden imza alanı - adjusted position
          x = pageWidth / 3; 
          y = 120; 
          width = 120; 
          height = 50;
          break;
        default:
          console.warn(`⚠️ Bilinmeyen imza alanı: ${fieldName}, varsayılan pozisyon kullanılıyor`);
      }
      
      // Draw signature image on the page
      page.drawImage(pngImage, {
        x,
        y,
        width,
        height,
      });
      
      console.log(`✅ ${fieldName} imzası eklendi (x:${Math.round(x)}, y:${Math.round(y)}, ${width}x${height})`);
      
    } catch (error) {
      console.error(`❌ ${fieldName} imzası eklenirken hata:`, error);
      console.warn(`⚠️ ${fieldName} imzası eklenemedi, devam ediliyor...`);
    }
  }

  private isValueUygun(value: any): boolean {
    // Check if value indicates "uygun" (suitable)
    return value === true || 
           value === 'uygun' || 
           value === 'on' ||
           (typeof value === 'string' && value.toLowerCase().includes('uygun'));
  }

  private safeSetTextField(fieldName: string, value?: string, fontSize: number = 10): void {
    if (!this.form || !value) return;
    
    // Handle text truncation and font sizing for long text fields
    let adjustedFontSize = fontSize;
    let adjustedValue = value;
    
    if (fieldName === 'tasiyiciFirma' && value.length > 20) {
      adjustedFontSize = 6;
      if (value.length > 30) {
        adjustedValue = value.substring(0, 27) + '...';
      }
    } else if (fieldName === 'rejimHakSahibiAdi' && value.length > 25) {
      adjustedFontSize = 6;
      if (value.length > 35) {
        adjustedValue = value.substring(0, 32) + '...';
      }
    } else if (value.length > 30) {
      adjustedFontSize = 7;
      if (value.length > 40) {
        adjustedValue = value.substring(0, 37) + '...';
      }
    }
    
    try {
      const field = this.form.getTextField(fieldName);
      field.setText(adjustedValue);
      
      // Set adjusted font size
      if (this.unicodeFont) {
        field.setFontSize(adjustedFontSize);
        field.updateAppearances(this.unicodeFont);
      } else {
        field.setFontSize(adjustedFontSize);
      }
      
      console.log(`📝 Text field '${fieldName}' = '${adjustedValue}' (Font size: ${adjustedFontSize}, Unicode font: ${this.unicodeFont ? 'aktif' : 'yüklenemedi'})`);
      
    } catch (error) {
      console.warn(`⚠️ Text field '${fieldName}' bulunamadı:`, error);
    }
  }

  private safeSetCheckBox(fieldName: string, checked?: boolean): void {
    if (!this.form || checked === undefined || checked === null) return;
    
    try {
      const field = this.form.getCheckBox(fieldName);
      if (checked) {
        field.check();
      } else {
        field.uncheck();
      }
      console.log(`☑️ Checkbox '${fieldName}' = ${checked}`);
    } catch (error) {
      console.warn(`⚠️ Checkbox '${fieldName}' bulunamadı:`, error);
    }
  }

  async generatePreview(): Promise<string> {
    if (!this.pdfDoc) {
      throw new Error('PDF dokümanı hazır değil');
    }

    try {
      console.log('🔄 PDF önizleme oluşturuluyor...');
      
      // Ensure Unicode font is applied before generating preview
      if (this.unicodeFont && this.form) {
        console.log('🔄 Önizleme öncesi Unicode font uygulanıyor...');
        this.form.updateFieldAppearances(this.unicodeFont);
        console.log('✅ Önizleme için Unicode font uygulandı');
      }
      
      // Generate PDF bytes without flattening for preview
      const pdfBytes = await this.pdfDoc.save();
      
      // Create preview URL
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const previewUrl = URL.createObjectURL(blob);
      
      console.log('✅ PDF önizleme hazır:', previewUrl);
      return previewUrl;
      
    } catch (error) {
      console.error('❌ PDF önizleme oluşturulurken hata:', error);
      throw error;
    }
  }

  async generateFinalPDF(): Promise<{ downloadUrl: string; supabaseUrl: string }> {
    if (!this.pdfDoc || !this.form) {
      throw new Error('PDF dokümanı hazır değil');
    }

    try {
      console.log('🔄 Final PDF oluşturuluyor...');
      
      // Son güvence: Unicode font'u tekrar uygula, sonra flatten et
      if (this.unicodeFont) {
        console.log('🔄 Final PDF öncesi Unicode font son kez uygulanıyor...');
        this.form.updateFieldAppearances(this.unicodeFont);
        console.log('✅ Unicode font final PDF öncesi uygulandı');
      }
      
      // Form'u flatten et (düzenlenemez hale getir)
      this.form.flatten();
      console.log('✅ PDF form alanları flatten edildi (düzenlenemez)');
      
      // Generate final PDF bytes
      const pdfBytes = await this.pdfDoc.save();
      console.log('✅ Final PDF oluşturuldu, boyut:', pdfBytes.byteLength, 'bytes');
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `arac-kontrol-${timestamp}.pdf`;
      
      console.log('🔄 PDF Supabase Storage\'a yükleniyor:', filename);
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('inspection-pdfs')
        .upload(filename, pdfBytes, {
          contentType: 'application/pdf',
          upsert: false
        });
      
      if (uploadError) {
        console.error('❌ Supabase Storage yükleme hatası:', uploadError);
        throw uploadError;
      }
      
      console.log('✅ PDF başarıyla Supabase\'e yüklendi:', uploadData);
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('inspection-pdfs')
        .getPublicUrl(filename);
      
      const supabaseUrl = urlData.publicUrl;
      console.log('✅ PDF public URL:', supabaseUrl);
      
      // Create download URL
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      
      return { downloadUrl, supabaseUrl };
      
    } catch (error) {
      console.error('❌ Final PDF oluşturulurken hata:', error);
      throw error;
    }
  }
}

// Convenience functions for backward compatibility
export async function generatePDFPreview(formData: FormData): Promise<{ previewUrl: string }> {
  const generator = new PDFFormGenerator();
  await generator.loadTemplate();
  await generator.fillForm(formData);
  const previewUrl = await generator.generatePreview();
  return { previewUrl };
}

export async function generateAndSavePDF(formData: FormData): Promise<{ downloadUrl: string; supabaseUrl: string }> {
  const generator = new PDFFormGenerator();
  await generator.loadTemplate();
  await generator.fillForm(formData);
  return await generator.generateFinalPDF();
}