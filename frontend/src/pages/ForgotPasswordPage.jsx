import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';

export const ForgotPasswordPage = () => {
  const { forgotPassword, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPassword(email);
      setSuccessData({
        email,
        message:
          res.data?.message ||
          res.message ||
          'If an account with that email exists, password reset instructions have been sent.',
        resetToken: res.data?.resetToken || res.resetToken,
        resetUrl: res.data?.resetUrl || res.resetUrl,
      });
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to submit password reset request.'
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
        <h2 className="mt-6 text-2xl font-bold text-slate-100">Reset your password</h2>
        <p className="mt-1 text-xs text-slate-400">
          Enter your registered email and we'll send you a secure link to reset your credentials.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          {successData ? (
            <div className="space-y-5 animate-fade-in text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-100">Check your inbox</h3>
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                  We've sent recovery instructions to{' '}
                  <span className="text-slate-200 font-medium">{successData.email}</span>.
                </p>
              </div>

              {/* Developer instant-reset convenience card (when resetToken is available) */}
              {successData.resetToken && (
                <div className="p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-left space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Reset Action</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Your password recovery token was generated. You can proceed directly to choose a new password:
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate(`/reset-password?token=${successData.resetToken}`)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Reset Password Now
                  </Button>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-slate-400 hover:text-slate-200"
                  onClick={() => {
                    setSuccessData(null);
                    setEmail('');
                  }}
                >
                  Resend or use another email
                </Button>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium pt-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@example.com"
                    autoFocus
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isSubmitting || authLoading}
              >
                Send Recovery Instructions
              </Button>

              <div className="pt-4 text-center border-t border-slate-800">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
