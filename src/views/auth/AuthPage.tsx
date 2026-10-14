import React, { useState } from 'react';
import { Briefcase, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './AuthPage.css';

type Mode = 'login' | 'signup';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'signup' && fullName.trim().length < 2) {
      setError('Enter your full name.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          full_name: fullName,
          email,
          password,
          department,
          role,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not work.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <section className="auth-hero">
        <div>
          <div className="auth-kicker">Culture Connect</div>
          <h1>Your workforce twin, signed in as you.</h1>
          <p>Career plans, learning, and succession stay tied to the person who logged in.</p>
        </div>
        <div className="auth-points">
          <div>
            <Sparkles size={18} />
            <div>
              <strong>Personal twin</strong>
              <span>Dashboard, career coach, and learning open on your profile.</span>
            </div>
          </div>
          <div>
            <Briefcase size={18} />
            <div>
              <strong>Work email</strong>
              <span>Create an account with your name, role, and department.</span>
            </div>
          </div>
          <div>
            <ShieldCheck size={18} />
            <div>
              <strong>Your session</strong>
              <span>Sign out from the profile menu when you are done.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-card">
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-switch" role="tablist" aria-label="Account">
            <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')}>
              Sign in
            </button>
            <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => switchMode('signup')}>
              Create account
            </button>
          </div>
          <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="auth-lead">
            {mode === 'login'
              ? 'Use the email and password for your employee account.'
              : 'This creates your employee profile and signs you in.'}
          </p>

          {mode === 'signup' && (
            <label className="auth-field">
              Full name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Your name" />
            </label>
          )}
          <label className="auth-field">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@company.com" />
          </label>
          <label className="auth-field">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="At least 8 characters"
            />
          </label>
          {mode === 'signup' && (
            <div className="auth-grid">
              <label className="auth-field">
                Department
                <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Data" />
              </label>
              <label className="auth-field">
                Role
                <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Analyst" />
              </label>
            </div>
          )}
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </section>
    </div>
  );
};
