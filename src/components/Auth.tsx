import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, AlertCircle, CheckCircle } from 'lucide-react';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [wasSignedOut, setWasSignedOut] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    // Check if user was redirected here after signing out
    const checkSignOutStatus = async () => {
      const { data } = await supabase.auth.getSession();
      
      // Get URL parameters
      const params = new URLSearchParams(window.location.search);
      const signedOut = params.get('signedOut') === 'true';
      
      if (signedOut || (!data.session && sessionStorage.getItem('wasSignedIn') === 'true')) {
        setWasSignedOut(true);
        // Clear the flag
        sessionStorage.removeItem('wasSignedIn');
        // Remove the query parameter
        if (signedOut) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (data.session) {
        // Set a flag to detect sign out
        sessionStorage.setItem('wasSignedIn', 'true');
      }
    };
    
    checkSignOutStatus();
  }, []);

  // Validate email when it changes and has been touched
  useEffect(() => {
    if (emailTouched) {
      const isValid = validateEmail(email);
      setEmailError(!isValid);
    }
  }, [email, emailTouched]);

  // Validate password when it changes and has been touched
  useEffect(() => {
    if (passwordTouched) {
      const isValid = validatePassword(password);
      setPasswordError(!isValid);
    }
  }, [password, passwordTouched]);

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    setError(null);
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setError('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    const isValid = validateEmail(email);
    setEmailError(!isValid);
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    const isValid = validatePassword(password);
    setPasswordError(!isValid);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark both fields as touched
    setEmailTouched(true);
    setPasswordTouched(true);
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    setEmailError(!isEmailValid);
    setPasswordError(!isPasswordValid);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <MapPin className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          MCCI GPS Collector
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {wasSignedOut && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center">
            <CheckCircle size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-800 dark:text-blue-200">
              You have been successfully signed out.
            </span>
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSignIn}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    emailTouched && emailError
                      ? 'border-red-300 dark:border-red-700' 
                      : 'border-gray-300 dark:border-gray-700'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={handlePasswordBlur}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    passwordTouched && passwordError
                      ? 'border-red-300 dark:border-red-700' 
                      : 'border-gray-300 dark:border-gray-700'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-700 dark:text-red-400 flex items-center">
                <AlertCircle size={16} className="mr-1" />
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                <CheckCircle size={16} className="mr-1" />
                {success}
              </div>
            )}

            <div className="flex flex-col space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;



