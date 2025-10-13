"use client";
import { useState, useEffect } from 'react';
import { onAuthStateChange, User } from '../lib/auth';
import LoginForm from '../components/auth/LoginForm';
import Dashboard from '../components/dashboard/Dashboard';
import EnhancedFormWizard from '../components/form/EnhancedFormWizard';

type AppState = 'login' | 'dashboard' | 'form';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('login');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFormId, setSelectedFormId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((currentUser) => {
      console.log('🔄 Auth state changed:', currentUser?.email || 'No user');
      setUser(currentUser);
      
      if (currentUser) {
        setAppState('dashboard');
      } else {
        setAppState('login');
        setSelectedFormId(undefined);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLoginSuccess = () => {
    console.log('✅ Login successful, redirecting to dashboard');
    setAppState('dashboard');
  };

  const handleStartNewForm = () => {
    console.log('🔄 Starting new form');
    setSelectedFormId(undefined);
    setAppState('form');
  };

  const handleLoadForm = (formId: string) => {
    console.log('🔄 Loading form:', formId);
    setSelectedFormId(formId);
    setAppState('form');
  };

  const handleBackToDashboard = () => {
    console.log('🔄 Returning to dashboard');
    setSelectedFormId(undefined);
    setAppState('dashboard');
  };

  const handleLogout = () => {
    console.log('🔄 Logging out');
    setUser(null);
    setAppState('login');
    setSelectedFormId(undefined);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen oregon-gradient flex items-center justify-center">
        <div className="oregon-card p-8 text-center">
          <div className="oregon-loading w-16 h-16 mx-auto mb-4 rounded-full"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Yükleniyor...</h2>
          <p className="text-gray-600">Oregon Araç Denetim Sistemi</p>
        </div>
      </div>
    );
  }

  if (appState === 'login') {
    return <LoginForm onSuccess={handleLoginSuccess} />;
  }

  if (appState === 'dashboard') {
    return (
      <Dashboard
        onStartNewForm={handleStartNewForm}
        onLoadForm={handleLoadForm}
        onLogout={handleLogout}
      />
    );
  }

  if (appState === 'form') {
    return (
      <EnhancedFormWizard
        formId={selectedFormId}
        onBack={handleBackToDashboard}
      />
    );
  }

  return null;
}