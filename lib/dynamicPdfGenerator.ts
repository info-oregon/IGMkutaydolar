import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { supabase } from './supabase';

export interface FormData {
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
  loadingLocation?: string;
  yuklemeTarihi?: string;
  preLoadingWeight?: string;
  postLoadingWeight?: string;
  
  // Legacy field mappings
  cekici?: string;
  dorse?: string;
  mrn?: string;
  rejimHak?: string;
  yuklemeYeri?: string;
  yuklemeOncesiKantar?: string;
  izinliGondericiKantar?: string;
  
  // Driver Information
  soforler?: Array<{
    ad?: string;
    adSoyad?: string;
    tel?: string;
    telefon?: string;
    imza?: string;
  }>;
  
  // Seal Information
  muhurNum?: string;
  yeniMuhurNum?: string;
  muhurKontrol?: {
    evrakUyum?: boolean;
    saglamlik?: boolean;
    gerginlik?: boolean;
    kilitUygunluk?: boolean;
  };
  yeniMuhurKontrol?: {
    evrakUyum?: boolean;
    saglamlik?: boolean;
    gerginlik?: boolean;
    kilitUygunluk?: boolean;
  };
  
  // Control Results
  fizikiKontrol?: (string | boolean | null)[];
  fizikiAciklama?: string[];
  zulaKontrol?: (string | boolean | null)[];
  zulaAciklama?: string[];
  
  // Inspector Information
  kontrolEdenAd?: string;
  kontrolEdenImza?: string;
  timestamp?: string;
  
  // General Result
  genelSonuc?: string;
  
  // Photos
  fotoListesi?: string[];
  
  // Metadata
  status?: 'draft' | 'completed' | 'sahada' | 'sahadan_cikis' | 'x' | 'y';
  companyId?: string;
  inspectorId?: string;
}

export class DynamicPDFGenerator {
  private pdfDoc: PDFDocument | null = null;
  private unicodeFont: any = null;
  private currentY = 0;
  private pageHeight = 0;
  private pageWidth = 0;
  private margin = 20;
  private lineHeight = 12;
  private sectionSpacing = 8;
  private fieldSpacing = 6;

  async initialize(): Promise<void> {
    try {
      console.log('🔄 Dynamic PDF Generator initializing...');
      
      // Create new A4 PDF document
      this.pdfDoc = await PDFDocument.create();
      
      // Register fontkit for Unicode support
      this.pdfDoc.registerFontkit(fontkit);
      console.log('✅ Fontkit registered for Unicode support');
      
      // Load and embed Turkish font
      await this.loadUnicodeFont();
      
      console.log('✅ Dynamic PDF Generator initialized');
      
    } catch (error) {
      console.error('❌ PDF Generator initialization failed:', error);
      throw error;
    }
  }

  private async loadUnicodeFont(): Promise<void> {
    if (!this.pdfDoc) {
      throw new Error('PDF document not initialized');
    }

    try {
      console.log('🔄 Loading Turkish font: /fonts/Roboto-Regular.ttf');
      
      const fontResponse = await fetch('/fonts/Roboto-Regular.ttf');
      if (!fontResponse.ok) {
        throw new Error(`Font loading failed: ${fontResponse.status}`);
      }
      
      const fontBytes = await fontResponse.arrayBuffer();
      console.log('✅ Font file loaded, size:', fontBytes.byteLength, 'bytes');
      
      this.unicodeFont = await this.pdfDoc.embedFont(fontBytes);
      console.log('✅ Turkish font embedded successfully');
      
    } catch (error) {
      console.error('❌ Font loading error:', error);
      console.warn('⚠️ Using default font, Turkish characters may not display correctly');
      this.unicodeFont = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
    }
  }

  async generatePDF(formData: FormData): Promise<{ pdfBytes: Uint8Array; filename: string }> {
    if (!this.pdfDoc || !this.unicodeFont) {
      throw new Error('PDF Generator not initialized');
    }

    try {
      console.log('🔄 Generating single-page PDF...');
      console.log('📝 Form data received:', formData);
      
      // Add single comprehensive page
      await this.addComprehensivePage(formData);
      
      // Generate PDF bytes
      const pdfBytes = await this.pdfDoc.save();
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `arac-kontrol-${timestamp}.pdf`;
      
      console.log('✅ Single-page PDF generated successfully');
      return { pdfBytes, filename };
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw error;
    }
  }

  private async addComprehensivePage(formData: FormData): Promise<void> {
    const page = this.pdfDoc!.addPage([595.28, 841.89]); // A4 size
    this.pageWidth = page.getWidth();
    this.pageHeight = page.getHeight();
    this.currentY = this.pageHeight - this.margin;

    // Document header with info block
    await this.drawDocumentHeader(page);

    // Main title
    await this.drawText(page, 'ARAÇ GÜVENLİK KONTROL FORMU', this.pageWidth / 2, this.currentY, {
      size: 14,
      align: 'center',
      bold: true
    });
    this.currentY -= 18;

    // Temel Bilgiler
    await this.drawSectionHeader(page, 'TEMEL BİLGİLER');
    await this.drawBasicInfo(page, formData);

    // Araç Bilgileri
    await this.drawSectionHeader(page, 'ARAÇ BİLGİLERİ');
    await this.drawVehicleInfo(page, formData);

    // Şoför Bilgileri
    await this.drawSectionHeader(page, 'ŞOFÖR BİLGİLERİ');
    await this.drawDriverInfo(page, formData);

    // Mühür Kontrol Detayları
    await this.drawSectionHeader(page, 'MÜHÜR KONTROL DETAYLARI');
    await this.drawSealInfo(page, formData);

    // Fiziki Kontrol
    await this.drawSectionHeader(page, 'FİZİKİ KONTROL');
    await this.drawPhysicalControl(page, formData);

    // Zula Kontrol
    await this.drawSectionHeader(page, 'ZULA KONTROL');
    await this.drawHiddenCompartmentControl(page, formData);

    // Kontrol Eden Bilgileri
    await this.drawSectionHeader(page, 'KONTROL EDEN BİLGİLERİ');
    await this.drawInspectorInfo(page, formData);
  }

  private async drawDocumentHeader(page: PDFPage): Promise<void> {
    // Document info block in top-right
    const rightX = this.pageWidth - this.margin;
    const startY = this.currentY;
    
    await this.drawText(page, 'Doküman No: AKF-001', rightX, startY, { 
      size: 8, 
      align: 'right' 
    });
    await this.drawText(page, 'Yayın Tarihi: 01.01.2025', rightX, startY - 10, { 
      size: 8, 
      align: 'right' 
    });
    await this.drawText(page, 'Revizyon: 01', rightX, startY - 20, { 
      size: 8, 
      align: 'right' 
    });
    
    this.currentY -= 35;
  }

  private async drawBasicInfo(page: PDFPage, formData: FormData): Promise<void> {
    const leftCol = this.margin;
    const rightCol = this.pageWidth / 2 + 10;
    const startY = this.currentY;

    // Left column
    this.currentY = startY;
    await this.drawLabelValue(page, 'MRN No:', this.getValueOrDash(formData.mrnNo || formData.mrn), leftCol);
    await this.drawLabelValue(page, 'Rejim Hak Sahibi:', this.getValueOrDash(formData.rejimHakSahibiAdi || formData.rejimHak), leftCol);
    await this.drawLabelValue(page, 'Sevk Durumu:', this.getValueOrDash(formData.sevkDurumu), leftCol);

    // Right column
    this.currentY = startY;
    await this.drawLabelValue(page, 'Taşıyıcı Firma:', this.getValueOrDash(formData.tasiyiciFirma), rightCol);
    await this.drawLabelValue(page, 'Araç Türü:', this.getValueOrDash(formData.aracTuru), rightCol);
    await this.drawLabelValue(page, 'Mühür Durumu:', this.getValueOrDash(formData.muhurDurumu), rightCol);

    this.currentY = Math.min(startY - (3 * this.lineHeight), this.currentY) - this.sectionSpacing;
  }

  private async drawVehicleInfo(page: PDFPage, formData: FormData): Promise<void> {
    const leftCol = this.margin;
    const rightCol = this.pageWidth / 2 + 10;
    const startY = this.currentY;

    // Left column
    this.currentY = startY;
    await this.drawLabelValue(page, 'Çekici Plaka:', this.getValueOrDash(formData.cekiciPlaka || formData.cekici), leftCol);
    await this.drawLabelValue(page, 'Konteyner No:', this.getValueOrDash(formData.konteynerNo), leftCol);
    await this.drawLabelValue(page, 'Yükleme Yeri:', this.getValueOrDash(formData.loadingLocation || formData.yuklemeYeri), leftCol);
    await this.drawLabelValue(page, 'Öncesi Kantar (kg):', this.getValueOrDash(formData.preLoadingWeight || formData.yuklemeOncesiKantar), leftCol);

    // Right column
    this.currentY = startY;
    await this.drawLabelValue(page, 'Dorse Plaka:', this.getValueOrDash(formData.dorsePlaka || formData.dorse), rightCol);
    await this.drawLabelValue(page, 'Kamyon Plaka:', this.getValueOrDash(formData.kamyonPlaka), rightCol);
    await this.drawLabelValue(page, 'Yükleme Tarihi:', this.getValueOrDash(formData.yuklemeTarihi), rightCol);
    await this.drawLabelValue(page, 'Sonrası Kantar (kg):', this.getValueOrDash(formData.postLoadingWeight || formData.izinliGondericiKantar), rightCol);

    this.currentY = Math.min(startY - (4 * this.lineHeight), this.currentY) - this.sectionSpacing;
  }

  private async drawDriverInfo(page: PDFPage, formData: FormData): Promise<void> {
    if (formData.soforler && formData.soforler.length > 0) {
      for (let i = 0; i < Math.min(formData.soforler.length, 2); i++) {
        const driver = formData.soforler[i];
        const leftCol = this.margin;
        const rightCol = this.pageWidth / 2 + 10;
        const startY = this.currentY;
        
        // Driver info on same line - prevent overlap
        this.currentY = startY;
        await this.drawLabelValue(page, `Şoför ${i + 1} Ad:`, this.getValueOrDash(driver.ad || driver.adSoyad), leftCol);
        
        this.currentY = startY;
        await this.drawLabelValue(page, `Şoför ${i + 1} Tel:`, this.getValueOrDash(driver.tel || driver.telefon), rightCol);

        // Move to next line for signature with proper spacing
        this.currentY = startY - this.lineHeight - this.fieldSpacing;
        
        // Signature
        if (driver.imza) {
          await this.drawText(page, `Şoför ${i + 1} İmza:`, leftCol, this.currentY, { size: 9 });
          await this.embedSignature(page, driver.imza, leftCol + 80, this.currentY - 18, 70, 18);
          this.currentY -= 25;
        } else {
          await this.drawText(page, `Şoför ${i + 1} İmza: (İmza bulunamadı)`, leftCol, this.currentY, { size: 8 });
          this.currentY -= this.fieldSpacing;
        }
      }
    } else {
      await this.drawText(page, 'Şoför bilgisi girilmemiş', this.margin, this.currentY, { size: 9 });
      this.currentY -= this.lineHeight;
    }
    this.currentY -= this.sectionSpacing;
  }

  private async drawSealInfo(page: PDFPage, formData: FormData): Promise<void> {
    const leftCol = this.margin;
    const rightCol = this.pageWidth / 2 + 10;

    // Show existing seal info only if vehicle came with seal
    if (formData.muhurDurumu === "Evet") {
      const startY = this.currentY;
      
      // Existing seal subsection
      await this.drawText(page, 'Mevcut Mühür:', this.margin, this.currentY, { size: 10, bold: true });
      this.currentY -= this.lineHeight;

      // Left column - seal number
      this.currentY = startY - this.lineHeight;
      await this.drawLabelValue(page, 'Mühür No:', this.getValueOrDash(formData.muhurNum), leftCol);

      // Right column - seal controls
      this.currentY = startY - this.lineHeight;
      if (formData.muhurKontrol) {
        await this.drawLabelValue(page, 'Evrakla Uyum:', this.formatCheckResult(formData.muhurKontrol.evrakUyum), rightCol);
        await this.drawLabelValue(page, 'Sağlamlık:', this.formatCheckResult(formData.muhurKontrol.saglamlik), rightCol);
        await this.drawLabelValue(page, 'Gerginlik:', this.formatCheckResult(formData.muhurKontrol.gerginlik), rightCol);
        await this.drawLabelValue(page, 'Kilit Uygunluğu:', this.formatCheckResult(formData.muhurKontrol.kilitUygunluk), rightCol);
      }

      this.currentY = Math.min(startY - (4 * this.lineHeight), this.currentY) - this.fieldSpacing;
    }

    // New seal section - ALWAYS show with complete data
    const newSealStartY = this.currentY;
    const sealLabel = formData.muhurDurumu === "Evet" ? 'Yeni Mühür:' : 'Mühür:';
    
    await this.drawText(page, sealLabel, this.margin, this.currentY, { size: 10, bold: true });
    this.currentY -= this.lineHeight;

    // Left column - new seal number
    this.currentY = newSealStartY - this.lineHeight;
    const newSealNumber = formData.yeniMuhurNum || formData.cikis_yeniMuhurNo;
    console.log('🔍 New seal number:', newSealNumber);
    await this.drawLabelValue(page, 'Mühür No:', this.getValueOrDash(newSealNumber), leftCol);

    // Right column - new seal controls
    this.currentY = newSealStartY - this.lineHeight;
    
    // Get new seal control data from multiple possible sources
    let newSealControl = formData.yeniMuhurKontrol;
    
    // If yeniMuhurKontrol doesn't exist, try cikis_ fields
    if (!newSealControl) {
      newSealControl = {
        evrakUyum: formData.cikis_muhurEvrakUygun,
        saglamlik: formData.cikis_muhurSaglamlik,
        gerginlik: formData.cikis_muhurGerginlik,
        kilitUygunluk: formData.cikis_muhurKilit
      };
    }
    
    console.log('🔍 New seal control data:', newSealControl);
    
    if (newSealControl) {
      await this.drawLabelValue(page, 'Evrakla Uyum:', this.formatCheckResult(newSealControl.evrakUyum), rightCol);
      await this.drawLabelValue(page, 'Sağlamlık:', this.formatCheckResult(newSealControl.saglamlik), rightCol);
      await this.drawLabelValue(page, 'Gerginlik:', this.formatCheckResult(newSealControl.gerginlik), rightCol);
      await this.drawLabelValue(page, 'Kilit Uygunluğu:', this.formatCheckResult(newSealControl.kilitUygunluk), rightCol);
    } else {
      // Fallback - show dashes if no data
      await this.drawLabelValue(page, 'Evrakla Uyum:', '-', rightCol);
      await this.drawLabelValue(page, 'Sağlamlık:', '-', rightCol);
      await this.drawLabelValue(page, 'Gerginlik:', '-', rightCol);
      await this.drawLabelValue(page, 'Kilit Uygunluğu:', '-', rightCol);
    }

    this.currentY = Math.min(newSealStartY - (4 * this.lineHeight), this.currentY) - this.sectionSpacing;
  }

  private async drawPhysicalControl(page: PDFPage, formData: FormData): Promise<void> {
    const fizikiLabels = [
      'Genel fiziki sağlamlığı ve bütünlüğü',
      'Herhangi bir zarar, yırtılma, sökülme veya parçalanma durumu yok',
      'Kapıların mekanizmalarının sağlamlığı',
      'Mühür ve kilit mekanizmalarının sağlamlığı',
      'Araç konteyner ise 7 nokta kontrolü (ön, sağ, sol, zemin, tavan, iç/dış kapılar)'
    ];

    await this.drawControlTable(page, fizikiLabels, formData.fizikiKontrol, formData.fizikiAciklama);
  }

  private async drawHiddenCompartmentControl(page: PDFPage, formData: FormData): Promise<void> {
    const zulaLabels = [
      'Tamponlar',
      'Motor',
      'Far arkası kontrol',
      'Lastikler',
      'Tekerlek üstü kontrol',
      'Yedek lastik',
      'Yakıt depoları',
      'Egzoz',
      'Sürüş mili',
      'Çekici & Dorse içi / zemin kontrol',
      'Çekici & Dorse altı genel kontrol',
      'Yan duvarlar',
      'Ön duvar',
      'İç / dış kapılar',
      'Sürücü depoları',
      'Hava depoları',
      'Çatı',
      'Soğutma ünitesi'
    ];

    await this.drawControlTable(page, zulaLabels, formData.zulaKontrol, formData.zulaAciklama);
  }

  private async drawControlTable(page: PDFPage, labels: string[], controls?: (string | boolean | null)[], explanations?: string[]): Promise<void> {
    const labelCol = this.margin;
    const statusCol = this.margin + 200;
    const explanationCol = this.margin + 280;
    const rowHeight = 12;
    
    console.log('🔍 Drawing control table:', {
      labelsCount: labels.length,
      controlsCount: controls?.length || 0,
      explanationsCount: explanations?.length || 0,
      controls: controls,
      explanations: explanations
    });
    
    for (let i = 0; i < labels.length; i++) {
      const y = this.currentY;
      
      // Draw item number and label
      const numberedLabel = `${i + 1}. ${labels[i]}`;
      // Don't truncate labels - use smaller font if needed
      const labelFontSize = numberedLabel.length > 30 ? 7 : 8;
      await this.drawText(page, numberedLabel, labelCol, y, { size: labelFontSize });
      
      // Draw control result with clear status symbols
      const control = controls?.[i];
      let statusText = '-';
      
      console.log(`🔍 Control ${i}:`, control, typeof control);
      
      if (control === true || control === 'uygun' || control === 'on') {
        statusText = '✓ Uygun';
      } else if (control === false || control === 'uygunsuz' || control === 'off') {
        statusText = '✗ Uygun Değil';
      } else if (typeof control === 'string' && control.toLowerCase().includes('uygun')) {
        statusText = control.toLowerCase().includes('değil') ? '✗ Uygun Değil' : '✓ Uygun';
      }
      
      await this.drawText(page, statusText, statusCol, y, { size: 8 });
      
      // Draw explanation if available
      const explanation = explanations?.[i];
      if (explanation && explanation.trim() && explanation.trim() !== '') {
        // Don't truncate explanations - use smaller font if needed
        const explanationFontSize = explanation.length > 20 ? 7 : 8;
        await this.drawText(page, explanation, explanationCol, y, { size: explanationFontSize });
      } else {
        await this.drawText(page, '-', explanationCol, y, { size: 8 });
      }
      
      this.currentY -= rowHeight;
    }
    
    this.currentY -= this.fieldSpacing;
  }

  private async drawInspectorInfo(page: PDFPage, formData: FormData): Promise<void> {
    const leftCol = this.margin;
    const rightCol = this.pageWidth / 2 + 10;
    const startY = this.currentY;

    console.log('🔍 Inspector info data:', {
      kontrolEdenAd: formData.kontrolEdenAd,
      timestamp: formData.timestamp,
      genelSonuc: formData.genelSonuc,
      kontrolEdenImza: formData.kontrolEdenImza ? 'Present' : 'Missing'
    });

    // Left column - Inspector name
    this.currentY = startY;
    await this.drawLabelValue(page, 'Kontrol Eden Ad Soyad:', this.getValueOrDash(formData.kontrolEdenAd), leftCol);

    // Right column - Date/time
    this.currentY = startY;
    const timestamp = formData.timestamp || new Date().toLocaleString('tr-TR');
    await this.drawLabelValue(page, 'Kontrol Tarihi/Saati:', this.getValueOrDash(timestamp), rightCol);

    // Move to next line for general result - ensure no overlap
    this.currentY = Math.min(startY - this.lineHeight, this.currentY) - this.fieldSpacing;
    
    // General result on separate line
    await this.drawLabelValue(page, 'Genel Sonuç:', this.getValueOrDash(formData.genelSonuc), leftCol);
    
    // Inspector signature - ensure proper spacing
    this.currentY -= this.fieldSpacing;
    
    if (formData.kontrolEdenImza) {
      console.log('✅ Drawing inspector signature');
      await this.drawText(page, 'Kontrol Eden İmza:', leftCol, this.currentY, { size: 9 });
      await this.embedSignature(page, formData.kontrolEdenImza, leftCol + 90, this.currentY - 18, 70, 18);
      this.currentY -= 25;
    } else {
      console.log('⚠️ No inspector signature found');
      await this.drawText(page, 'Kontrol Eden İmza: (İmza bulunamadı)', leftCol, this.currentY, { size: 9 });
      this.currentY -= this.lineHeight;
    }
  }

  private async drawSectionHeader(page: PDFPage, title: string): Promise<void> {
    this.currentY -= 2;
    
    // Draw background rectangle
    page.drawRectangle({
      x: this.margin,
      y: this.currentY - 6,
      width: this.pageWidth - (this.margin * 2),
      height: 10,
      color: rgb(0.9, 0.9, 0.9),
    });

    // Center the text in the header
    await this.drawText(page, title, this.pageWidth / 2, this.currentY - 1, {
      size: 9,
      align: 'center',
      bold: true
    });
    
    this.currentY -= 12;
  }

  private async drawLabelValue(page: PDFPage, label: string, value: string, x: number): Promise<void> {
    const maxWidth = (this.pageWidth / 2) - 30;
    const labelWidth = 80;
    const maxValueWidth = maxWidth - labelWidth - 10;

    let fontSize = 9;
    let displayValue = value ?? '-';

    const measure = (text: string, size: number) => this.unicodeFont.widthOfTextAtSize(text, size);

    // Try shrinking font size to fit within available width
    while (measure(displayValue, fontSize) > maxValueWidth && fontSize > 7) {
      fontSize -= 0.5;
    }

    // Apply truncation with ellipsis if text still overflows
    if (measure(displayValue, fontSize) > maxValueWidth) {
      const ellipsis = '...';
      const ellipsisWidth = measure(ellipsis, fontSize);
      const availableWidth = Math.max(maxValueWidth - ellipsisWidth, 0);
      let truncated = '';

      for (const char of displayValue) {
        const next = truncated + char;
        if (measure(next, fontSize) > availableWidth) {
          break;
        }
        truncated = next;
      }

      displayValue = truncated.trimEnd();
      if (displayValue.length < value.length) {
        displayValue += ellipsis;
      }
    }

    await this.drawText(page, label, x, this.currentY, { size: fontSize, bold: true });
    await this.drawText(page, displayValue, x + labelWidth, this.currentY, { size: fontSize });

    this.currentY -= this.lineHeight;
  }

  private async drawText(page: PDFPage, text: string, x: number, y: number, options: {
    size?: number;
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
  } = {}): Promise<void> {
    const { size = 9, align = 'left', bold = false } = options;
    
    let adjustedX = x;
    if (align === 'center') {
      const textWidth = this.unicodeFont.widthOfTextAtSize(text, size);
      adjustedX = x - (textWidth / 2);
    } else if (align === 'right') {
      const textWidth = this.unicodeFont.widthOfTextAtSize(text, size);
      adjustedX = x - textWidth;
    }

    page.drawText(text, {
      x: adjustedX,
      y,
      size,
      font: this.unicodeFont,
      color: rgb(0, 0, 0),
    });
  }

  private async embedSignature(page: PDFPage, base64Data: string, x: number, y: number, width: number, height: number): Promise<void> {
    try {
      const cleanBase64 = base64Data.replace(/^data:image\/png;base64,/, '');
      const image = await this.pdfDoc!.embedPng(cleanBase64);
      
      // Calculate aspect ratio and fit within bounds
      const imgDims = image.scale(1);
      const aspectRatio = imgDims.width / imgDims.height;
      
      let finalWidth = width;
      let finalHeight = height;
      
      if (aspectRatio > width / height) {
        finalHeight = width / aspectRatio;
      } else {
        finalWidth = height * aspectRatio;
      }
      
      // Center the image within the bounds
      const centerX = x + (width - finalWidth) / 2;
      const centerY = y + (height - finalHeight) / 2;
      
      page.drawImage(image, { 
        x: centerX, 
        y: centerY, 
        width: finalWidth, 
        height: finalHeight 
      });
      
      console.log(`✅ Signature embedded at (${Math.round(centerX)}, ${Math.round(centerY)})`);
    } catch (error) {
      console.error('❌ Signature embedding failed:', error);
      // Draw fallback text if signature fails
      await this.drawText(page, '(İmza yüklenemedi)', x, y, { size: 8 });
    }
  }

  private getValueOrDash(value: any): string {
    if (value === null || 
        value === undefined || 
        value === '' || 
        value === 'undefined' || 
        value === 'null' || 
        value === '-' ||
        value === 'Belirtilmemiş' || 
        value === 'belirtilmemiş' ||
        (typeof value === 'string' && value.trim() === '')) {
      return '-';
    }
    return String(value).trim();
  }

  private formatCheckResult(value: any): string {
    if (value === true || value === 'uygun') return '✓ Uygun';
    if (value === false || value === 'uygunsuz') return '✗ Uygun Değil';
    return '-';
  }

  private formatDetailedCheckResult(value: any): string {
    if (value === true || value === 'uygun') return '✓ Uygun';
    if (value === false || value === 'uygunsuz') return '✗ Uygun Değil';
    return '-';
  }
}

// Main generation functions
export async function generateDynamicPDF(formData: FormData): Promise<{ previewUrl: string }> {
  const generator = new DynamicPDFGenerator();
  await generator.initialize();
  
  const { pdfBytes } = await generator.generatePDF(formData);
  
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);
  
  return { previewUrl };
}

export async function generateAndSaveDynamicPDF(formData: FormData): Promise<{ downloadUrl: string; supabaseUrl: string }> {
  const generator = new DynamicPDFGenerator();
  await generator.initialize();
  
  const { pdfBytes, filename } = await generator.generatePDF(formData);
  
  console.log('🔄 Uploading PDF to Supabase Storage...');
  
  // Upload to Supabase Storage
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
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('inspection-pdfs')
    .getPublicUrl(filename);
  
  const supabaseUrl = urlData.publicUrl;
  
  // Create download URL
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);
  
  return { downloadUrl, supabaseUrl };
}
