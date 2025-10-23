// components/pdf/PdfTemplate.tsx

import React from 'react';
import type { EnhancedFormData } from '../../lib/enhancedFormStorage';
import { FIZIKI_DEFAULT, ZULA_DEFAULT } from '../../lib/checklists';

interface PdfTemplateProps {
  formData: EnhancedFormData;
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    backgroundColor: 'white',
    width: '210mm',
    minHeight: '297mm',
    padding: '0.7cm',
    fontFamily: "'Roboto', sans-serif",
    color: 'black',
    boxSizing: 'border-box',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    fontSize: '7.5pt',
    tableLayout: 'fixed',
  },
  td: {
    border: '0.5pt solid black',
    // DİKEY HİZALAMA VE BOŞLUK İÇİN PADDING GÜNCELLENDİ
    padding: '4px 3px', 
    verticalAlign: 'middle',
    textAlign: 'center',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    height: 'auto', // Yükseklik 'auto' olarak ayarlandı
  },
  labelCell: {
    textAlign: 'left',
    fontWeight: 700,
  },
  header: {
    fontWeight: 700,
    textAlign: 'center',
    backgroundColor: '#F2F2F2',
  },
  logo: {
    width: '120px',
    height: 'auto',
  },
  smallText: {
    fontSize: '6.5pt',
  },
  signatureBox: {
    height: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inspectorSignatureBox: {
    height: '50px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureImg: {
    maxWidth: '100px',
    maxHeight: '35px',
    objectFit: 'contain',
  },
  checkbox: {
    fontFamily: "'Segoe UI Symbol', sans-serif",
    fontSize: '11pt',
    lineHeight: '1',
  },
  boldText: {
    fontWeight: 700,
  }
};

const Checkbox: React.FC<{ checked?: boolean | null | string }> = ({ checked }) => {
    const isChecked = checked === true || checked === 'uygun';
    return <span style={styles.checkbox}>{isChecked ? '✔' : ''}</span>;
};

const PdfTemplate: React.FC<PdfTemplateProps> = ({ formData }) => {

  const get = (path: (string|number)[], defaultValue: any = '') => {
    let current: any = formData;
    for (const key of path) {
      if (current === null || current === undefined) return defaultValue;
      current = current[key];
    }
    return current ?? defaultValue;
  }

  return (
    <div style={styles.page}>
       <table style={styles.table}>
        <tbody>
          <tr style={{height: '40px'}}>
            <td colSpan={7} style={{...styles.td, borderRight:'none', verticalAlign:'middle', paddingLeft: '5px'}}>
              <img src="/ARAÇ GÜVENLİK KONTROL FORMU_dosyalar/image001.png" alt="Oregon Logo" style={styles.logo} />
            </td>
            <td colSpan={8} style={{...styles.td, fontWeight: 700, textAlign:'center', fontSize: '11pt', borderLeft:'none', borderRight:'none'}}>
                ARAÇ GÜVENLİK KONTROL FORMU
            </td>
            <td colSpan={7} style={{...styles.td, verticalAlign: 'top', borderLeft:'none', padding: 0}}>
              <table style={{...styles.table, fontSize: '6.5pt', height: '100%'}}>
                  <tbody>
                    <tr><td style={{...styles.td, ...styles.labelCell}}>Form ID</td><td style={{...styles.td}}>{get(['formId'])}</td></tr>
                    <tr><td style={{...styles.td, ...styles.labelCell}}>Doküman No</td><td style={{...styles.td}}>FR.060</td></tr>
                    <tr><td style={{...styles.td, ...styles.labelCell}}>Yayın Tarihi</td><td style={{...styles.td}}>20.11.2023</td></tr>
                  </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* DİKEY BOŞLUK ARTIRILDI */}
      <div style={{height: '10px'}}></div>

      <table style={styles.table}>
        <thead><tr><td colSpan={4} style={{...styles.td, ...styles.header}}>ARAÇ VE SEVK BİLGİLERİ</td></tr></thead>
        <tbody>
            <tr>
                <td style={{...styles.td, ...styles.labelCell, width: '25%'}}>Taşıyıcı Firma</td>
                <td style={{...styles.td, width: '25%'}}>{get(['tasiyiciFirma'])}</td>
                <td style={{...styles.td, ...styles.labelCell, width: '25%'}}>Araç Türü</td>
                <td style={{...styles.td, width: '25%'}}>{get(['aracTuru'])}</td>
            </tr>
            <tr>
                <td style={{...styles.td, ...styles.labelCell}}>Çekici Plaka</td>
                <td style={{...styles.td}}>{get(['cekiciPlaka'])}</td>
                <td style={{...styles.td, ...styles.labelCell}}>Dorse Plaka / Konteyner No</td>
                <td style={{...styles.td}}>{get(['dorsePlaka']) || get(['konteynerNo'])}</td>
            </tr>
            <tr>
                <td style={{...styles.td, ...styles.labelCell}}>Sevk Durumu</td>
                <td style={{...styles.td}}>{get(['sevkDurumu'])}</td>
                <td style={{...styles.td, ...styles.labelCell}}>MRN No</td>
                <td style={{...styles.td}}>{get(['sevkDurumu']) === 'Evet' ? get(['mrnNo']) : '-'}</td>
            </tr>
             <tr>
                <td style={{...styles.td, ...styles.labelCell}}>Yükleme Yeri</td>
                <td style={{...styles.td}}>{get(['loadingLocation'])}</td>
                <td style={{...styles.td, ...styles.labelCell}}>Rejim Hak Sahibi</td>
                <td style={{...styles.td}}>{get(['sevkDurumu']) === 'Evet' ? get(['rejimHakSahibiAdi']) : '-'}</td>
            </tr>
             <tr>
                <td style={{...styles.td, ...styles.labelCell}}>Yükleme Tarihi</td>
                <td style={{...styles.td}}>{get(['yuklemeTarihi'])}</td>
                <td style={{...styles.td, ...styles.labelCell}}>Kontrol Tarihi / Saati</td>
                <td style={{...styles.td}}>{get(['timestamp'])}</td>
            </tr>
        </tbody>
      </table>
      
      {/* DİKEY BOŞLUK ARTIRILDI */}
      <div style={{height: '10px'}}></div>

      <table style={styles.table}>
        <thead><tr><td colSpan={4} style={{...styles.td, ...styles.header}}>ŞOFÖR BİLGİLERİ</td></tr></thead>
        <tbody>
            <tr>
                <td colSpan={2} style={{...styles.td, ...styles.header}}>ŞOFÖR 1</td>
                <td colSpan={2} style={{...styles.td, ...styles.header}}>ŞOFÖR 2</td>
            </tr>
            <tr>
                <td style={{...styles.td, ...styles.labelCell, width: '15%'}}>Adı Soyadı</td>
                <td style={{...styles.td, width: '35%'}}>{get(['soforler', 0, 'ad'])}</td>
                <td style={{...styles.td, ...styles.labelCell, width: '15%'}}>Adı Soyadı</td>
                <td style={{...styles.td, width: '35%'}}>{get(['soforler', 1, 'ad'])}</td>
            </tr>
            <tr>
                <td style={{...styles.td, ...styles.labelCell}}>Telefon</td>
                <td style={{...styles.td}}>{get(['soforler', 0, 'tel'])}</td>
                <td style={{...styles.td, ...styles.labelCell}}>Telefon</td>
                <td style={{...styles.td}}>{get(['soforler', 1, 'tel'])}</td>
            </tr>
            <tr style={{height: '40px'}}>
                <td style={{...styles.td, ...styles.labelCell}}>İmza</td>
                <td style={{...styles.td, ...styles.signatureBox}}>{get(['soforler', 0, 'imza']) && <img src={get(['soforler', 0, 'imza'])} alt="imza 1" style={styles.signatureImg} />}</td>
                <td style={{...styles.td, ...styles.labelCell}}>İmza</td>
                <td style={{...styles.td, ...styles.signatureBox}}>{get(['soforler', 1, 'imza']) && <img src={get(['soforler', 1, 'imza'])} alt="imza 2" style={styles.signatureImg} />}</td>
            </tr>
        </tbody>
      </table>

      {/* DİKEY BOŞLUK ARTIRILDI */}
      <div style={{height: '10px'}}></div>

      <table style={styles.table}><tbody>
          <tr>
            <td style={{border: 'none', verticalAlign: 'top', padding: '0 2px 0 0', width: '50%'}}>
              {/* ARAÇ FİZİKİ KONTROLÜ TABLOSU */}
              <table style={styles.table}>
                <thead>
                    <tr><td colSpan={4} style={{...styles.td, ...styles.header}}>ARAÇ FİZİKİ KONTROLÜ</td></tr>
                    <tr>
                        <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '50%'}}>Kontrol Noktası</td>
                        <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '15%'}}>Uygun ✔</td>
                        <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '15%'}}>Uygun Değil X</td>
                        <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '20%'}}>Açıklama</td>
                    </tr>
                </thead>
                <tbody>
                  {FIZIKI_DEFAULT.map((item, index) => (
                      <tr key={`fizik-${index}`}>
                          <td style={{ ...styles.td, ...styles.smallText, textAlign: 'left' }}>{item.label}</td>
                          <td style={{ ...styles.td }}><Checkbox checked={get(['fizikiKontrol', index, 'uygun'])} /></td>
                          <td style={{ ...styles.td }}><Checkbox checked={!(get(['fizikiKontrol', index, 'uygun']))} /></td>
                          <td style={{ ...styles.td, ...styles.smallText }}>{get(['fizikiAciklama', index]) || ''}</td>
                      </tr>
                  ))}
                </tbody>
              </table>
              <div style={{height: '10px'}}></div>
              
              {/* MÜHÜR KONTROL TABLOLARI */}
              <table style={styles.table}>
                  <thead>
                    <tr><td colSpan={3} style={{...styles.td, ...styles.header}}>MEVCUT MÜHÜR KONTROLÜ</td></tr>
                    {get(['muhurDurumu']) === 'Evet' && (
                      <tr>
                          <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '50%'}}>Kontrol Noktası</td>
                          <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '25%'}}>Uygun ✔</td>
                          <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '25%'}}>Uygun Değil X</td>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                      {get(['muhurDurumu']) === 'Evet' ? (
                        <>
                          <tr>
                              <td style={{...styles.td, ...styles.labelCell, ...styles.smallText}}>Mühür Numarası</td>
                              <td colSpan={2} style={{...styles.td}}>{get(['muhurNum'])}</td>
                          </tr>
                          <tr>
                              <td style={{...styles.td, ...styles.smallText, textAlign: 'left'}}>Evraklarla Uyum</td>
                              <td style={{...styles.td}}><Checkbox checked={get(['muhurKontrol', 'evrakUyum'])} /></td>
                              <td style={{...styles.td}}><Checkbox checked={get(['muhurKontrol', 'evrakUyum']) === false} /></td>
                          </tr>
                          <tr>
                              <td style={{...styles.td, ...styles.smallText, textAlign: 'left'}}>Mührün Sağlamlığı</td>
                              <td style={{...styles.td}}><Checkbox checked={get(['muhurKontrol', 'saglamlik'])} /></td>
                              <td style={{...styles.td}}><Checkbox checked={get(['muhurKontrol', 'saglamlik']) === false} /></td>
                          </tr>
                          <tr>
                              <td style={{...styles.td, ...styles.smallText, textAlign: 'left'}}>Gerginlik Durumu</td>
                              <td style={{...styles.td}}><Checkbox checked={get(['muhurKontrol', 'gerginlik'])} /></td>
                              <td style={{...styles.td}}><Checkbox checked={get(['muhurKontrol', 'gerginlik']) === false} /></td>
                          </tr>
                          <tr>
                              <td style={{...styles.td, ...styles.smallText, textAlign: 'left'}}>Kilit Aksamı Uygunluğu</td>
                              <td style={{...styles.td}}><Checkbox checked={get(['muhurKontrol', 'kilitUygunluk'])} /></td>
                              <td style={{...styles.td}}><Checkbox checked={get(['muhurKontrol', 'kilitUygunluk']) === false} /></td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan={3} style={{...styles.td, textAlign: 'center', padding: '12px'}}>
                            Araç mühürsüz geldi
                          </td>
                        </tr>
                      )}
                  </tbody>
              </table>
               <div style={{height: '10px'}}></div>
              <table style={styles.table}>
                  <thead>
                    <tr><td colSpan={3} style={{...styles.td, ...styles.header}}>YENİ MÜHÜR KONTROLÜ</td></tr>
                    <tr>
                        <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '50%'}}>Kontrol Noktası</td>
                        <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '25%'}}>Uygun ✔</td>
                        <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '25%'}}>Uygun Değil X</td>
                    </tr>
                  </thead>
                  <tbody>
                      <tr>
                          <td style={{...styles.td, ...styles.labelCell, ...styles.smallText}}>Yeni Mühür Numarası</td>
                          <td colSpan={2} style={{...styles.td}}>{get(['yeniMuhurNum'])}</td>
                      </tr>
                      <tr>
                          <td style={{...styles.td, ...styles.smallText, textAlign: 'left'}}>Evraklarla Uyum</td>
                          <td style={{...styles.td}}><Checkbox checked={get(['yeniMuhurKontrol', 'evrakUyum'])} /></td>
                          <td style={{...styles.td}}><Checkbox checked={!get(['yeniMuhurKontrol', 'evrakUyum'])} /></td>
                      </tr>
                      <tr>
                          <td style={{...styles.td, ...styles.smallText, textAlign: 'left'}}>Mührün Sağlamlığı</td>
                          <td style={{...styles.td}}><Checkbox checked={get(['yeniMuhurKontrol', 'saglamlik'])} /></td>
                          <td style={{...styles.td}}><Checkbox checked={!get(['yeniMuhurKontrol', 'saglamlik'])} /></td>
                      </tr>
                      <tr>
                          <td style={{...styles.td, ...styles.smallText, textAlign: 'left'}}>Gerginlik Durumu</td>
                          <td style={{...styles.td}}><Checkbox checked={get(['yeniMuhurKontrol', 'gerginlik'])} /></td>
                          <td style={{...styles.td}}><Checkbox checked={!get(['yeniMuhurKontrol', 'gerginlik'])} /></td>
                      </tr>
                       <tr>
                          <td style={{...styles.td, ...styles.smallText, textAlign: 'left'}}>Kilit Aksamı Uygunluğu</td>
                          <td style={{...styles.td}}><Checkbox checked={get(['yeniMuhurKontrol', 'kilitUygunluk'])} /></td>
                          <td style={{...styles.td}}><Checkbox checked={!get(['yeniMuhurKontrol', 'kilitUygunluk'])} /></td>
                      </tr>
                  </tbody>
              </table>
            </td>
            {/* ARAÇ ZULA KONTROLÜ TABLOSU */}
            <td style={{border: 'none', verticalAlign: 'top', padding: '0 0 0 2px', width: '50%'}}>
              <table style={styles.table}>
                <thead>
                    <tr><td colSpan={4} style={{...styles.td, ...styles.header}}>ARAÇ ZULA KONTROLÜ</td></tr>
                     <tr>
                        <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '50%'}}>Kontrol Noktası</td>
                        <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '15%'}}>Uygun ✔</td>
                        <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '15%'}}>Uygun Değil X</td>
                        <td style={{...styles.td, ...styles.header, ...styles.smallText, width: '20%'}}>Açıklama</td>
                    </tr>
                </thead>
                <tbody>
                  {ZULA_DEFAULT.map((item, index) => (
                       <tr key={`zula-${index}`}>
                          <td style={{ ...styles.td, ...styles.smallText, textAlign: 'left' }}>{item.label}</td>
                          <td style={{ ...styles.td }}><Checkbox checked={get(['zulaKontrol', index, 'uygun'])} /></td>
                          <td style={{ ...styles.td }}><Checkbox checked={!(get(['zulaKontrol', index, 'uygun']))} /></td>
                          <td style={{ ...styles.td, ...styles.smallText }}>{get(['zulaAciklama', index]) || ''}</td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
      </tbody></table>
      
       <div style={{height: '10px'}}></div>

      {/* SONUÇ BÖLÜMÜ */}
      <table style={styles.table}>
        <tbody>
           <tr>
            <td colSpan={14} style={{border: 'none'}}> {/* Boşluk bırakıldı */}
            </td>
            <td colSpan={8} style={{...styles.td, ...styles.boldText, height: '25px'}}>
                { get(['genelSonuc']) === 'uygun' 
                    ? 'KONTROL SONUCU: UYGUN ✔' 
                    : get(['genelSonuc']) === 'uygunsuz' 
                    ? 'KONTROL SONUCU: UYGUN DEĞİL X' 
                    : 'KONTROL SONUCU: BELİRTİLMEDİ' }
            </td>
          </tr>
          <tr>
             <td colSpan={14} style={{border: 'none'}}> {/* Boşluk bırakıldı */}
            </td>
            <td colSpan={8} style={{...styles.td, fontWeight: 700, verticalAlign:'top'}}>
                KONTROLÜ GERÇEKLEŞTİREN <br/>
                ADI SOYADI: <span style={{fontWeight:'normal'}}>{get(['kontrolEdenAd'])}</span>
                <br/>
                İMZA:
                <div style={styles.inspectorSignatureBox}>
                    {get(['kontrolEdenImza']) && <img src={get(['kontrolEdenImza'])} alt="kontrol imza" style={styles.signatureImg} />}
                </div>
             </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PdfTemplate;