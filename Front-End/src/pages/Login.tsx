import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth';
import { LogIn, UserPlus, Building, User as UserIcon } from 'lucide-react';
import { navigate } from '../components/Router';
import { User } from '../types';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [loginType, setLoginType] = useState<'user' | 'customer'>('user');
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [entityId, setEntityId] = useState<number | null>(null);
  const [entityType, setEntityType] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (redirectTo) {
      navigate(redirectTo);
      setRedirectTo(null);
    }
  }, [redirectTo]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated]);

  // ✅ STEP 1: Send credentials, get OTP
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      
      if (loginType === 'customer') {
        response = await authService.customerLogin({ email, password });
      } else {
        response = await authService.login({ email, password });
      }
      
      console.log('📧 Login response:', response);
      
      if (response.message && response.message.includes('OTP sent')) {
        setNeedsOtp(true);
        setEntityId(response.entity_id);
        setEntityType(response.entity_type);
        console.log('✅ Stored entity_id:', response.entity_id, 'entity_type:', response.entity_type);
        setError('');
      } else {
        setError('Failed to send OTP');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper function to map entityType to valid role
  const mapEntityTypeToRole = (type: string): 'admin' | 'user' | 'customer' => {
    const upperType = type.toUpperCase();
    if (upperType === 'USER') return 'user';
    if (upperType === 'CUSTOMER') return 'customer';
    if (upperType === 'ADMIN') return 'admin';
    return 'user'; // default fallback
  };

  // ✅ STEP 2: Verify OTP, get token and create user object
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!entityId || !entityType) {
        setError('Session expired. Please login again.');
        setNeedsOtp(false);
        return;
      }

      console.log('🔍 Sending OTP verification:', {
        entity_id: entityId,
        entity_type: entityType,
        otp_code: otp
      });
      
      const response = await authService.verifyOTP({ 
        entity_id: entityId,
        entity_type: entityType,
        otp_code: otp
      });
      
      console.log('✅ OTP verification response:', response);
      
      if (response.token) {
        setOtp('');
        setNeedsOtp(false);
        
        try {
          const tokenParts = response.token.split('.');
          const decodedPayload = JSON.parse(atob(tokenParts[1]));
          
          console.log('🔑 Decoded token:', decodedPayload);
          
          // ✅ FIXED: Properly map the role from decoded payload or entityType
          let userRole: 'admin' | 'user' | 'customer';
          
          if (decodedPayload.role) {
            const roleLower = decodedPayload.role.toLowerCase();
            if (roleLower === 'admin') userRole = 'admin';
            else if (roleLower === 'user') userRole = 'user';
            else if (roleLower === 'customer') userRole = 'customer';
            else userRole = mapEntityTypeToRole(entityType);
          } else {
            userRole = mapEntityTypeToRole(entityType);
          }
          
          const user: User = {
            id: decodedPayload.userId || decodedPayload.customerId || entityId,
            email: email,
            role: userRole,
            name: decodedPayload.name || email.split('@')[0],
            phone: '',
            status: 'approved'
          };
          
          console.log('👤 Created user object:', user);
          
          login(response.token, user);
          
          const role = user.role.toLowerCase();
          console.log('🎯 User role:', role);
          
          if (role === 'admin') {
            setRedirectTo('/admin');
          } else if (role === 'user') {
            setRedirectTo('/user');
          } else if (role === 'customer') {
            setRedirectTo('/customer');
          } else {
            setRedirectTo('/');
          }
          
        } catch (decodeError) {
          console.error('❌ Token decode error:', decodeError);
          
          // ✅ FIXED: Properly map entityType to valid role
          const userRole = mapEntityTypeToRole(entityType);
          
          const user: User = {
            id: entityId,
            email: email,
            role: userRole,
            name: email.split('@')[0],
            phone: '',
            status: 'approved'
          };
          
          login(response.token, user);
          
          if (userRole === 'user') {
            setRedirectTo('/user');
          } else if (userRole === 'customer') {
            setRedirectTo('/customer');
          } else if (userRole === 'admin') {
            setRedirectTo('/admin');
          } else {
            setRedirectTo('/');
          }
        }
      } else {
        console.error('❌ No token in response:', response);
        setError(response.message || 'Verification failed - no token received');
      }
    } catch (err: any) {
      console.error('❌ OTP verification error:', err);
      setError(err.message || 'Invalid OTP or expired');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (loginType === 'customer') {
        response = await authService.customerLogin({ email, password });
      } else {
        response = await authService.login({ email, password });
      }
      
      if (response.message && response.message.includes('OTP sent')) {
        setEntityId(response.entity_id);
        setEntityType(response.entity_type);
        alert('OTP resent successfully');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {!needsOtp ? (
          <>
            <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Welcome Back</h2>
            <p className="text-center text-gray-600 mb-8">Sign in to your account</p>

            <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-2 rounded-md transition ${
                  loginType === 'user' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
                onClick={() => setLoginType('user')}
              >
                User/Admin
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-md transition ${
                  loginType === 'customer' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                }`}
                onClick={() => setLoginType('customer')}
              >
                Customer
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Verify OTP</h2>
            <p className="text-center text-gray-600 mb-8">Enter the OTP sent to {email}</p>
            {entityType && (
              <p className="text-center text-sm text-gray-500 mb-4">
                {entityType} ID: {entityId}
              </p>
            )}
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {!needsOtp ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter 6-digit OTP"
                required
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Resend OTP
              </button>
            </div>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setNeedsOtp(false);
                  setOtp('');
                  setEntityId(null);    
                  setEntityType(null);
                }}
                className="text-gray-500 hover:text-gray-700 font-medium text-sm"
              >
                ← Back to login
              </button>
            </div>
          </form>
        )}

        {/* REGISTER SECTION */}
        {!needsOtp && (
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">New to our banking system?</span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="/register"
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Create New Account
              </a>
            </div>

            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">📋 Registration Options:</p>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-start gap-2">
                  <Building className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><span className="font-semibold">User:</span> Bank staff who manage accounts and approvals</span>
                </div>
                <div className="flex items-start gap-2">
                  <UserIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span><span className="font-semibold">Customer:</span> Bank customers who create accounts and perform transactions</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}