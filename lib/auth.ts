import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  name?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Static credentials (in production, these should be in environment variables)
const STATIC_CREDENTIALS = {
  user: {
    username: process.env.NEXT_PUBLIC_USER_USERNAME || 'oregon_user',
    password: process.env.NEXT_PUBLIC_USER_PASSWORD || 'oregon2025!',
    role: 'user' as const
  },
  admin: {
    username: process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'oregon_admin',
    password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin2025!',
    role: 'admin' as const
  }
};

class AuthManager {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Load user from localStorage on initialization
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const storedUser = localStorage.getItem('oregon_auth_user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        console.log('✅ User loaded from storage:', this.currentUser?.email);
      }
    } catch (error) {
      console.error('❌ Failed to load user from storage:', error);
      this.clearUserFromStorage();
    }
  }

  private saveUserToStorage(user: User): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('oregon_auth_user', JSON.stringify(user));
      console.log('✅ User saved to storage:', user.email);
    } catch (error) {
      console.error('❌ Failed to save user to storage:', error);
    }
  }

  private clearUserFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('oregon_auth_user');
      console.log('✅ User cleared from storage');
    } catch (error) {
      console.error('❌ Failed to clear user from storage:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  async signIn(username: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      console.log('🔄 Attempting sign in for:', username);

      // Check static credentials
      let matchedCredential: { username: string; password: string; role: 'user' | 'admin' } | null = null;

      if (username === STATIC_CREDENTIALS.user.username && password === STATIC_CREDENTIALS.user.password) {
        matchedCredential = STATIC_CREDENTIALS.user;
      } else if (username === STATIC_CREDENTIALS.admin.username && password === STATIC_CREDENTIALS.admin.password) {
        matchedCredential = STATIC_CREDENTIALS.admin;
      }

      if (!matchedCredential) {
        console.log('❌ Invalid credentials for:', username);
        return { user: null, error: 'Geçersiz kullanıcı adı veya şifre' };
      }

      // Create user object
      const user: User = {
        id: `static_${matchedCredential.role}_${Date.now()}`,
        email: `${matchedCredential.username}@oregon.local`,
        role: matchedCredential.role,
        name: matchedCredential.role === 'admin' ? 'Oregon Admin' : 'Oregon User'
      };

      // Save user
      this.currentUser = user;
      this.saveUserToStorage(user);
      this.notifyListeners();

      console.log('✅ Sign in successful:', user.email, 'Role:', user.role);
      return { user, error: null };

    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { user: null, error: 'Giriş yapılırken bir hata oluştu' };
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('🔄 Signing out user:', this.currentUser?.email);
      
      this.currentUser = null;
      this.clearUserFromStorage();
      this.notifyListeners();
      
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Helper method to check if user can edit a form
  canEditForm(formStatus: string): boolean {
    if (!this.currentUser) return false;
    
    // Admins can edit everything
    if (this.currentUser.role === 'admin') return true;
    
    // Regular users can only edit drafts
    return formStatus === 'draft';
  }

  // Helper method to check if user can view a form
  canViewForm(formStatus: string): boolean {
    if (!this.currentUser) return false;
    
    // Everyone can view their own forms
    return true;
  }
}

// Create singleton instance
export const authManager = new AuthManager();

// Convenience functions
export const signIn = (username: string, password: string) => authManager.signIn(username, password);
export const signOut = () => authManager.signOut();
export const getCurrentUser = () => authManager.getCurrentUser();
export const isAuthenticated = () => authManager.isAuthenticated();
export const isAdmin = () => authManager.isAdmin();
export const onAuthStateChange = (callback: (user: User | null) => void) => authManager.onAuthStateChange(callback);
export const canEditForm = (formStatus: string) => authManager.canEditForm(formStatus);
export const canViewForm = (formStatus: string) => authManager.canViewForm(formStatus);