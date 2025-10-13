"use client";
import { useState } from "react";

interface WelcomeScreenProps {
  onStart: () => void;
  onShowHistory?: () => void;
}

export default function WelcomeScreen({ onStart, onShowHistory }: WelcomeScreenProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    setIsLoading(true);
    setTimeout(() => {
      onStart();
    }, 1000);
  };

  return (
    <div className="min-h-screen oregon-gradient flex items-center justify-center p-4">
      <div className="oregon-card max-w-md w-full p-8 text-center">
        {/* Oregon Keep Moving Image */}
        <div className="mb-8">
          <div className="w-full h-48 bg-gradient-to-r from-oregon-blue to-oregon-light-blue rounded-xl flex items-center justify-center mb-6 keep-moving-animation">
            <div className="text-center text-white">
              <div className="text-4xl font-bold mb-2">OREGON</div>
              <div className="text-xl font-light tracking-wider">KEEP MOVING</div>
              <div className="mt-4 text-sm opacity-90">Araç Güvenlik Kontrol Sistemi</div>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Araç Denetim Sistemi
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Araç güvenlik kontrol formunu dijital ortamda hızlı ve güvenli bir şekilde doldurun.
        </p>

        <div className="space-y-4">
          <button
            onClick={handleStart}
            disabled={isLoading}
            className={`w-full oregon-button-primary ${isLoading ? 'oregon-loading' : ''}`}
          >
            {isLoading ? 'Yükleniyor...' : 'Yeni Kontrol Başlat'}
          </button>

          {onShowHistory && (
            <button
              onClick={onShowHistory}
              className="w-full oregon-button-secondary"
            >
              📋 Kayıtlı Formlarım
            </button>
          )}
          
          <div className="text-xs text-gray-500 mt-4">
            Oregon Lojistik © 2025 - Tüm hakları saklıdır
          </div>
        </div>
      </div>
    </div>
  );
}