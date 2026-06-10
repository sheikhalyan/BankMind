import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Decode JWT expiry (returns ms timestamp or null) ─────────────
const getTokenExpiry = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const expiry = getTokenExpiry(token);
  return expiry === null || expiry <= Date.now();
};

// ── Clear everything from storage ────────────────────────────────
const clearStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // ref to hold the auto-logout timer so we can cancel it on logout/re-login
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Schedule auto-logout when token expires ───────────────────
  const scheduleExpiry = (token: string) => {
    // Clear any existing timer first
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const msUntilExpiry = expiry - Date.now();
    if (msUntilExpiry <= 0) return; // already expired

    expiryTimerRef.current = setTimeout(() => {
      // Dispatch event so any other listener can react
      window.dispatchEvent(new Event('auth:expired'));
    }, msUntilExpiry);
  };

  // ── On mount: restore session or clear it ────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr && !isTokenExpired(token)) {
      try {
        const user = JSON.parse(userStr);
        setState({ user, token, isAuthenticated: true, isLoading: false });
        scheduleExpiry(token);
      } catch {
        clearStorage();
        setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      clearStorage();
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }

    return () => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    };
  }, []);

  // ── Listen for auth:expired event → clear state + redirect ───
  useEffect(() => {
    const handleExpired = () => {
      clearStorage();
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = null;
      }
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      // Hard redirect — works even outside React Router context
      window.location.href = '/login?reason=session_expired';
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  // ── Login ─────────────────────────────────────────────────────
  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setState({ user, token, isAuthenticated: true, isLoading: false });
    scheduleExpiry(token);
  };

  // ── Logout ────────────────────────────────────────────────────
  const logout = () => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
    clearStorage();
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    window.location.href = '/login';
  };

  // ── Update user ───────────────────────────────────────────────
  const updateUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setState(prev => ({ ...prev, user }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}