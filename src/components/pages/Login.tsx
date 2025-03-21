import { useState } from 'react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    try {
      if (isResettingPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage('Password reset email sent. Please check your inbox.');
        setIsResettingPassword(false);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'github' | 'facebook') => {
    try {
      switch (provider) {
        case 'google':
          await signInWithPopup(auth, new GoogleAuthProvider());
          break;
        case 'github':
          await signInWithPopup(auth, new GithubAuthProvider());
          break;
        case 'facebook':
          await signInWithPopup(auth, new FacebookAuthProvider());
          break;
        default:
          break;
      }
      navigate('/home');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden relative">
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-50"></div>
      <div className="max-w-md w-full mx-4 p-6 sm:p-8 bg-gray-900/40 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-gray-700/30 relative z-10">
        <div className="text-center space-y-1">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-purple-500 filter drop-shadow-lg">SynCodeX</h1>
          <h2 className="text-lg sm:text-xl font-medium text-gray-200">
            {isResettingPassword ? 'Reset Password' : 'Sign in to your account'}
          </h2>
        </div>

        <form onSubmit={handleEmailAuth} className="mt-8 space-y-4">
          <div className="space-y-3">
            <div className="relative group">
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-700/50 bg-gray-900/50 placeholder-gray-500 text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 group-hover:border-gray-600/50"
                placeholder="Email address"
              />
            </div>
            {!isResettingPassword && (
              <div className="relative group">
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-700/50 bg-gray-900/50 placeholder-gray-500 text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 group-hover:border-gray-600/50"
                  placeholder="Password"
                />
              </div>
            )}
          </div>

          {error && <div className="text-red-400 text-sm mt-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20 backdrop-blur-sm">{error}</div>}
          {successMessage && <div className="text-green-400 text-sm mt-2 bg-green-500/10 p-3 rounded-xl border border-green-500/20 backdrop-blur-sm">{successMessage}</div>}

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg shadow-md"
          >
            {isResettingPassword ? 'Send Reset Link' : 'Sign in'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsResettingPassword(!isResettingPassword);
                setError('');
                setSuccessMessage('');
              }}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors duration-200 underline-offset-4 hover:underline"
            >
              {isResettingPassword ? 'Back to login' : 'Forgot password?'}
            </button>
          </div>
        </form>

        {!isResettingPassword && (
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-gray-400 bg-gray-900/80 backdrop-blur-xl rounded-full">Or continue with</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <button
                onClick={() => handleSocialAuth('google')}
                className="w-full inline-flex justify-center items-center py-2.5 px-3 border-2 border-gray-700/50 rounded-xl bg-gray-900/30 hover:bg-gray-800/50 text-gray-300 hover:text-white transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg backdrop-blur-xl group"
              >
                <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
              <button
                onClick={() => handleSocialAuth('github')}
                className="w-full inline-flex justify-center items-center py-2.5 px-3 border-2 border-gray-700/50 rounded-xl bg-gray-900/30 hover:bg-gray-800/50 text-gray-300 hover:text-white transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg backdrop-blur-xl group"
              >
                <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                  <path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.24.73-.53v-1.85c-3.03.66-3.67-1.45-3.67-1.45-.5-1.27-1.21-1.6-1.21-1.6-.99-.67.07-.66.07-.66 1.09.08 1.67 1.12 1.67 1.12.97 1.66 2.54 1.18 3.16.9.1-.7.38-1.18.69-1.45-2.42-.27-4.96-1.21-4.96-5.38 0-1.19.42-2.16 1.12-2.92-.11-.28-.49-1.4.11-2.91 0 0 .92-.29 3 1.12a10.44 10.44 0 015.5 0c2.08-1.41 3-1.12 3-1.12.6 1.51.22 2.63.11 2.91.7.76 1.12 1.73 1.12 2.92 0 4.18-2.55 5.11-4.98 5.37.39.34.74 1 .74 2.02v3c0 .29.19.63.74.53A11 11 0 0012 1.27" fill="currentColor"/>
                </svg>
              </button>
              <button
                onClick={() => handleSocialAuth('facebook')}
                className="w-full inline-flex justify-center items-center py-2.5 px-3 border-2 border-gray-700/50 rounded-xl bg-gray-900/30 hover:bg-gray-800/50 text-gray-300 hover:text-white transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg backdrop-blur-xl group"
              >
                <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;