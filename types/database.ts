export type Database = {
  public: {
    Tables: {
      forms: {
        Row: {
          id: string;
          status: 'draft' | 'submitted';
          custom_status: string | null;
          created_at: string;
          updated_at: string | null;
          tasiyici_firma: string | null;
          arac_turu: string | null;
          cekici_plaka: string | null;
          genel_sonuc: string | null;
          pdf_path: string | null;
          photos: string | null;
          signature_path: string | null;
          summary: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          status?: 'draft' | 'submitted';
          custom_status?: string | null;
          created_at?: string;
          updated_at?: string | null;
          tasiyici_firma?: string | null;
          arac_turu?: string | null;
          cekici_plaka?: string | null;
          genel_sonuc?: string | null;
          pdf_path?: string | null;
          photos?: string | null;
          signature_path?: string | null;
          summary?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          status?: 'draft' | 'submitted';
          custom_status?: string | null;
          created_at?: string;
          updated_at?: string | null;
          tasiyici_firma?: string | null;
          arac_turu?: string | null;
          cekici_plaka?: string | null;
          genel_sonuc?: string | null;
          pdf_path?: string | null;
          photos?: string | null;
          signature_path?: string | null;
          summary?: Record<string, any> | null;
        };
      };
    };
  };
};
