import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { useUser } from '../contexts/UserContext';
import { Clock, User, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const passwordref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const isFocusedRef = useRef(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const { setUserProfile } = useUser();

  // 🔁 Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);

        // Fetch user profile to determine role
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          navigate('/', { replace: true });
          return;
        }
        setUserProfile(userProfile);

        // Add a small delay to ensure proper navigation
        setTimeout(() => {
          if (userProfile?.role === 'superadmin') {
            navigate('/superadmin', { replace: true });
          } else if (userProfile?.role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 100);
      }
    };
    checkSession();
  }, [navigate, setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: authData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid User, Please Check Your Email and Password');
        } else {
          throw signInError;
        }
      } else if (authData.user) {
        setUser(authData.user);

        // Fetch user profile from database
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          setError('Error loading user profile');
          return;
        }

        // Store metadata
        localStorage.setItem('user_id', authData.user.id);
        localStorage.setItem('user_email', authData.user.email || '');

        // Refresh user context and wait for it to complete
        // await refreshUserProfile();

        // Navigate based on user role from freshly fetched userProfile
        if (!userProfile || !userProfile.role) {
          setError('User role not found. Please contact support.');
          navigate('/', { replace: true });
          return;
        }

        // Add a small delay to ensure UserContext is updated
        setTimeout(() => {
          if (userProfile.role === 'superadmin') {
            navigate('/superadmin', { replace: true });
          } else if (userProfile.role === 'admin') {
            navigate('/admin', { replace: true });
          } else if (userProfile.role == 'user') {
            navigate('/user', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 100);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred during authentication'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-8">
            <Clock className="w-12 h-12 text-blue-600" />
          </div>

          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Employee Login
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full  p-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={passwordVisible ? 'text' : 'password'}
                  required
                  value={password}
                  ref={passwordref}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => {
                    isFocusedRef.current = true;
                  }}
                  onBlur={() => {
                    isFocusedRef.current = false;
                  }}
                  className="mt-1 block w-full rounded-md p-2 border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
                <span
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevents the input from losing focus
                    if (!isFocusedRef.current && passwordref.current) {
                      passwordref.current.focus(); // Focus only if not already focused
                    }
                    setPasswordVisible(!passwordVisible); // Toggle visibility
                  }}
                  className="absolute top-1 right-2 text-slate-700 cursor-pointer"
                >
                  {passwordVisible ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
