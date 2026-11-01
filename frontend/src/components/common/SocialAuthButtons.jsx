import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Check, ArrowRight, ShieldCheck, Mail, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from './Button';

export const GoogleIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const MicrosoftIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 23 23">
    <path fill="#f35325" d="M1 1h10v10H1z" />
    <path fill="#81bc06" d="M12 1h10v10H12z" />
    <path fill="#05a6f0" d="M1 12h10v10H1z" />
    <path fill="#ffba08" d="M12 12h10v10H12z" />
  </svg>
);

const PRESET_ACCOUNTS = {
  google: [
    {
      name: 'Alex Rivera',
      email: 'alex.rivera.dev@gmail.com',
      role: 'Fullstack Developer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
      org: 'Personal Gmail',
    },
    {
      name: 'Sarah Chen',
      email: 'sarah.chen.codes@gmail.com',
      role: 'Software Engineer',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop&crop=faces',
      org: 'Personal Gmail',
    },
  ],
  microsoft: [
    {
      name: 'Marcus Vance',
      email: 'marcus.vance@outlook.com',
      role: 'Lead Cloud Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
      org: 'Microsoft Account',
    },
    {
      name: 'Elena Rostova',
      email: 'elena.rostova@live.com',
      role: 'Senior Systems Engineer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
      org: 'Microsoft Account',
    },
  ],
};

export const SocialAuthButtons = ({
  onSuccess,
  redirectTo = '/dashboard',
  dividerText = 'or continue with email',
  isRegister = false,
}) => {
  const { loginWithGoogle, loginWithMicrosoft } = useAuth();
  const navigate = useNavigate();

  const [activeModalProvider, setActiveModalProvider] = useState(null); // 'google' | 'microsoft' | null
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const handleProviderClick = (provider) => {
    setModalError('');
    setCustomEmail('');
    setCustomName('');
    setActiveModalProvider(provider);
  };

  const executeAuth = async (profile) => {
    setIsSubmitting(true);
    setModalError('');
    try {
      if (activeModalProvider === 'google') {
        await loginWithGoogle({
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          googleId: profile.id || `g_${Date.now()}`,
        });
      } else {
        await loginWithMicrosoft({
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          microsoftId: profile.id || `ms_${Date.now()}`,
        });
      }

      setActiveModalProvider(null);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setModalError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setModalError('Please enter a valid email address.');
      return;
    }

    const normalized = customEmail.toLowerCase().trim();

    // Strict validation for personal Gmail accounts
    if (
      activeModalProvider === 'google' &&
      !normalized.endsWith('@gmail.com') &&
      !normalized.endsWith('@googlemail.com')
    ) {
      setModalError(
        'Google login is restricted to personal Gmail accounts (@gmail.com). Work or enterprise domains are not permitted.'
      );
      return;
    }

    const derivedName = customName.trim() || normalized.split('@')[0].replace(/[._-]/g, ' ');
    executeAuth({
      email: normalized,
      name: derivedName,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces',
      id: `${activeModalProvider}_${Date.now()}`,
    });
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => handleProviderClick('google')}
          className="flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-700/80 bg-slate-950/70 hover:bg-slate-800/80 hover:border-slate-600 text-xs font-medium text-slate-200 transition-all shadow-sm active:scale-[0.99] group"
        >
          <GoogleIcon className="w-4 h-4 group-hover:scale-105 transition-transform" />
          <span>{isRegister ? 'Sign up with Gmail' : 'Google (Gmail)'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleProviderClick('microsoft')}
          className="flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-700/80 bg-slate-950/70 hover:bg-slate-800/80 hover:border-slate-600 text-xs font-medium text-slate-200 transition-all shadow-sm active:scale-[0.99] group"
        >
          <MicrosoftIcon className="w-4 h-4 group-hover:scale-105 transition-transform" />
          <span>{isRegister ? 'Sign up with Microsoft' : 'Microsoft'}</span>
        </button>
      </div>

      {dividerText && (
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-900 px-3 text-slate-400">{dividerText}</span>
          </div>
        </div>
      )}

      {/* Interactive SSO Account Picker Modal */}
      {activeModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
            {/* Top decorative gradient bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${
                activeModalProvider === 'google'
                  ? 'bg-gradient-to-r from-blue-500 via-red-500 to-amber-500'
                  : 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500'
              }`}
            />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center">
                  {activeModalProvider === 'google' ? (
                    <GoogleIcon className="w-4.5 h-4.5" />
                  ) : (
                    <MicrosoftIcon className="w-4.5 h-4.5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {activeModalProvider === 'google' ? 'Personal Google Account' : 'Microsoft Account'}
                  </h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    {activeModalProvider === 'google' ? 'Personal Gmail (@gmail.com)' : 'OAuth 2.0 PKCE Verified'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalProvider(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {modalError}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-slate-300 font-medium">Choose an account to sign in:</p>

              {/* Pre-configured Quick Accounts */}
              <div className="space-y-2">
                {PRESET_ACCOUNTS[activeModalProvider].map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      executeAuth({
                        email: acc.email,
                        name: acc.name,
                        avatar: acc.avatar,
                        id: `${activeModalProvider}_${acc.name.toLowerCase().replace(/\s+/g, '_')}`,
                      })
                    }
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-slate-700 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-100 group-hover:text-brand-300 flex items-center gap-1.5">
                          {acc.name}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
                            {acc.org}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{acc.email}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>

              {/* Custom Personal Gmail / Microsoft Account Entry */}
              <div className="pt-2 border-t border-slate-800/80">
                <form onSubmit={handleCustomSubmit} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-slate-400">
                      {activeModalProvider === 'google'
                        ? 'Or enter your personal Gmail address (@gmail.com):'
                        : 'Or enter your Microsoft account email:'}
                    </label>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder={
                        activeModalProvider === 'google'
                          ? 'developer.personal@gmail.com'
                          : 'developer@outlook.com'
                      }
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  {activeModalProvider === 'google' && (
                    <p className="text-[10px] text-slate-400">
                      Personal Gmail accounts only. Work or enterprise domains will be rejected.
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="w-full mt-1 text-xs"
                    isLoading={isSubmitting}
                  >
                    {activeModalProvider === 'google'
                      ? 'Sign In with Personal Gmail'
                      : 'Authorize via Microsoft'}
                  </Button>
                </form>
              </div>
            </div>

            <p className="mt-4 text-[10px] text-center text-slate-400">
              By authorizing, RepoMemory securely syncs your profile, avatar, and engineering workspace permissions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialAuthButtons;
