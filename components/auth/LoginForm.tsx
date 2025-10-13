"use client";
import { useState } from 'react';
import { signIn } from '../../lib/auth';

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { user, error: authError } = await signIn(username, password);
      
      if (authError) {
        setError(authError);
        return;
      }

      if (user) {
        console.log('✅ Login successful:', user.email, 'Role:', user.role);
        onSuccess();
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('Giriş yapılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen oregon-gradient flex items-center justify-center p-4">
      <div className="oregon-card max-w-md w-full p-8">
        {/* Oregon Logo */}
        <div className="text-center mb-8">
          <div className="w-full h-32 bg-gradient-to-r from-oregon-blue to-oregon-light-blue rounded-xl flex items-center justify-center mb-6">
            <div className="text-center text-white">
              <div className="text-3xl font-bold mb-1">OREGON</div>
              <div className="text-lg font-light tracking-wider">KEEP MOVING</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Araç Denetim Sistemi
          </h1>
          <p className="text-gray-600">
            Giriş yaparak devam edin
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="oregon-error rounded-lg p-4 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="oregon-input w-full"
              placeholder="Kullanıcı adınızı girin"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="oregon-input w-full"
              placeholder="Şifrenizi girin"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full oregon-button-primary text-lg py-4 ${
              isLoading ? 'oregon-loading' : ''
            }`}
          >
            {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">Demo Hesapları:</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Kullanıcı:</strong> oregon_user / oregon2025!
            </div>
            <div>
              <strong>Admin:</strong> oregon_admin / admin2025!
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center mt-6">
          Oregon Lojistik © 2025 - Tüm hakları saklıdır
        </div>
      </div>
    </div>
  );
}