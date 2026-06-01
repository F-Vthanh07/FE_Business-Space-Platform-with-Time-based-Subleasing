import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import './AuthPage.css';

type AuthTab = 'login' | 'register';
type UserRole = 'owner' | 'renter';

interface AuthPageProps {
  onLoginSuccess: (role: UserRole) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { language, setLanguage, theme, toggleTheme, t } = useThemeLanguage();

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('owner');
  const [error, setError] = useState('');

  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const animateExitAndRedirect = (loginToken: string) => {
    // Trigger GSAP slider exit animation transition
    const tl = gsap.timeline({
      onComplete: () => {
        // Set local storage variables
        localStorage.setItem('portal_role', role);
        localStorage.setItem('portal_token', loginToken);

        // Lift role state to App.tsx dynamically
        onLoginSuccess(role);

        // Perform in-memory routing navigation
        if (role === 'owner') {
          navigate('/owner');
        } else {
          navigate('/renter');
        }
      }
    });

    // Split slide-out cards left and right
    tl.to('.auth-visual-panel', {
      x: -150,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.inOut'
    }, 0);

    tl.to('.auth-form-panel', {
      x: 150,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.inOut'
    }, 0);

    tl.to('.auth-container', {
      boxShadow: 'none',
      border: 'none',
      background: 'transparent',
      duration: 0.5,
      ease: 'power3.inOut'
    }, 0);

    tl.to('.auth-wrapper', {
      background: 'rgba(8, 10, 15, 0)',
      backdropFilter: 'blur(0px)',
      duration: 0.7,
      ease: 'power3.inOut'
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError(t('auth.validationFill'));
      return;
    }

    if (activeTab === 'register') {
      if (password !== confirmPassword) {
        setError(t('auth.validationMatch'));
        return;
      }
    }

    animateExitAndRedirect(`mock_token_${Date.now()}`);
  };

  const handleGoogleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    animateExitAndRedirect(`google_mock_token_${Date.now()}`);
  };

  return (
    <div className="auth-wrapper">
      {/* Ambient Mesh Glows */}
      <div className="auth-ambient-glow">
        <div className="auth-glow-bubble auth-glow-1" />
        <div className="auth-glow-bubble auth-glow-2" />
      </div>

      <div className="auth-container glass-card">
        {/* Split Screen Layout */}
        <div className="auth-grid-layout">

          {/* Left Column: Abstract Generated Imagery */}
          <div className="auth-visual-panel">
            <img
              src="/auth_bg.png"
              alt="Visual asset"
              className="auth-visual-img"
            />
            <div className="auth-visual-overlay" />
            <div className="auth-visual-content">
              <div className="auth-visual-logo">
                <div className="logo-symbol-lg">E</div>
                <div className="logo-text-lg">EtherSpace</div>
              </div>
              <p className="auth-visual-desc">
                {language === 'en'
                  ? 'High-fidelity commercial retail time-sharing node.'
                  : 'Nút phân chia thời gian thuê mặt bằng bán lẻ cao cấp.'}
              </p>
            </div>
          </div>

          {/* Right Column: Auth Console */}
          <div className="auth-form-panel">

            {/* Header controls (Language & Theme switches) */}
            <div className="auth-panel-controls">
              <button
                className="btn-ghost"
                onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
                style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px' }}
              >
                {language.toUpperCase()}
              </button>
              <button
                className="btn-ghost"
                onClick={toggleTheme}
                style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px' }}
              >
                {theme.toUpperCase()}
              </button>
            </div>

            {/* Regular form credentials entry */}
            <div className="auth-form-content">
                <div className="auth-title-section">
                  <h1 className="auth-app-title">{t('auth.title')}</h1>
                  <p className="auth-app-subtitle text-secondary">{t('auth.subtitle')}</p>
                </div>

                {/* Form Tabs Switcher */}
                <div className="auth-tabs">
                  <button
                    type="button"
                    className={`auth-tab-btn ${activeTab === 'login' ? 'auth-tab-btn--active' : ''}`}
                    onClick={() => handleTabChange('login')}
                  >
                    {t('auth.loginTab')}
                  </button>
                  <button
                    type="button"
                    className={`auth-tab-btn ${activeTab === 'register' ? 'auth-tab-btn--active' : ''}`}
                    onClick={() => handleTabChange('register')}
                  >
                    {t('auth.registerTab')}
                  </button>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                  {/* Email address field */}
                  <div className="auth-input-group">
                    <label htmlFor="auth-email" className="auth-input-label">
                      {t('auth.emailLabel')}
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      className="auth-form-input"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {/* Password field */}
                  <div className="auth-input-group">
                    <label htmlFor="auth-password" className="auth-input-label">
                      {t('auth.passwordLabel')}
                    </label>
                    <input
                      id="auth-password"
                      type="password"
                      className="auth-form-input"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {/* Confirm password field (register only) */}
                  {activeTab === 'register' && (
                    <div className="auth-input-group animate-in">
                      <label htmlFor="auth-confirm-password" className="auth-input-label">
                        {t('auth.confirmPasswordLabel')}
                      </label>
                      <input
                        id="auth-confirm-password"
                        type="password"
                        className="auth-form-input"
                        placeholder={t('auth.confirmPasswordPlaceholder')}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* Role Selector badges (register only, or login as selection fallback) */}
                  {activeTab === 'register' && (
                    <div className="auth-input-group animate-in">
                      <label className="auth-input-label">
                        {t('auth.roleLabel')}
                      </label>
                      <div className="auth-role-badges">
                        <button
                          type="button"
                          className={`auth-role-badge ${role === 'owner' ? 'auth-role-badge--active' : ''}`}
                          onClick={() => setRole('owner')}
                        >
                          <span className="badge-abbr">[SO]</span> {t('app.ownerTitle').toUpperCase()}
                        </button>
                        <button
                          type="button"
                          className={`auth-role-badge ${role === 'renter' ? 'auth-role-badge--active' : ''}`}
                          onClick={() => setRole('renter')}
                        >
                          <span className="badge-abbr">[PT]</span> {t('app.renterTitle').toUpperCase()}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Display validation error */}
                  {error && (
                    <div className="auth-form-error-msg animate-in">
                      <span className="error-bullet">[!]</span> {error}
                    </div>
                  )}

                  {/* Submit Action CTA */}
                  <button
                    type="submit"
                    className="auth-submit-btn"
                  >
                    {activeTab === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')}
                  </button>
                </form>

                {/* Divider */}
                <div className="auth-divider">
                  <span className="auth-divider-line"></span>
                  <span className="auth-divider-text">{t('auth.orDivider')}</span>
                  <span className="auth-divider-line"></span>
                </div>

                {/* Google Sign-In */}
                <button
                  type="button"
                  className="auth-google-btn"
                  onClick={handleGoogleLogin}
                >
                  <span className="google-icon-wrapper">[G]</span>
                  <span className="google-btn-text">
                    {activeTab === 'login' 
                      ? t('auth.googleLogin')
                      : t('auth.googleRegister')}
                  </span>
                </button>

                {/* Bottom navigation link switcher */}
                <div className="auth-bottom-switch">
                  {activeTab === 'login' ? (
                    <span className="switch-link" onClick={() => handleTabChange('register')}>
                      {t('auth.switchRegisterText')}
                    </span>
                  ) : (
                    <span className="switch-link" onClick={() => handleTabChange('login')}>
                      {t('auth.switchLoginText')}
                    </span>
                  )}
                </div>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
};
