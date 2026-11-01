import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layers,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  ShieldAlert,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const { resetPassword, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password requirements calculation
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token.trim()) {
      setErrorMessage('A valid password reset token is required.');
      return;
    }

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setErrorMessage(
        'Password must be at least 8 characters long and contain both letters and numbers.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        token: token.trim(),
        newPassword,
      });
      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to reset password. Token may have expired.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-brand-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white shadow-glow-brand group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">
            RepoMemory <span className="text-brand-400">Impact</span>
          </span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold text-slate-100">Set new password</h2>
        <p className="mt-1 text-xs text-slate-400">
          Enter and confirm your new secure password to restore access to your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          {isSuccess ? (
            <div className="space-y-5 animate-fade-in text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-100">Password Updated!</h3>
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                  Your credentials have been updated securely. You can now log in using your new password.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full text-xs"
                  onClick={() => navigate('/login')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Sign In
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                  {errorMessage}
                </div>
              )}

              {/* Reset Token field (shown if missing from URL query string) */}
              {!tokenFromUrl && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Reset Token
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste recovery token"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-400 font-mono focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoFocus={!!tokenFromUrl}
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password strength checklist */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
                <div
                  className={`flex items-center gap-1.5 ${
                    hasMinLength ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>At least 8 characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasLetter ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {hasLetter ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Contains at least one letter</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasNumber ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Contains at least one number</span>
                </div>
                {confirmPassword && (
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordsMatch ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>Passwords match</span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isSubmitting || authLoading}
              >
                Save New Password
              </Button>

              <div className="pt-4 text-center border-t border-slate-800">
                <Link
                  to="/login"
                  className="text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors"
                >
                  Cancel and return to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
