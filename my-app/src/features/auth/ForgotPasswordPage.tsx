import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useThemeLanguage } from '../../context/ThemeLanguageContext';
import { ROUTES } from '../../routes/routes';
import { requestPasswordReset, resetPassword } from './api/auth.api';
import './AuthPage.css';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useThemeLanguage();
  const isEn = language === 'en';

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 30, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
    );
  }, []);

  const passMet6Char = newPassword.length >= 6;
  const passMetLetters = /[a-zA-Z]/.test(newPassword);
  const passMetNumbers = /\d/.test(newPassword);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError(isEn ? 'Please enter your email address.' : 'Vui lòng nhập địa chỉ email.');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setStep('reset');
      setSuccessMsg(
        isEn
          ? `An OTP code has been sent to ${email}.`
          : `Mã OTP đã được gửi đến ${email}.`
      );
    } catch (err) {
      const fallbackMessage = isEn ? 'Something went wrong.' : 'Đã xảy ra lỗi.';
      setError(err instanceof Error ? err.message : fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otpCode.trim() || !newPassword || !confirmPassword) {
      setError(isEn ? 'Please fill in all fields.' : 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (!passMet6Char || !passMetLetters || !passMetNumbers) {
      setError(isEn ? 'Password does not meet all requirements.' : 'Mật khẩu chưa đáp ứng đủ yêu cầu.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(isEn ? 'Passwords do not match.' : 'Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email.trim(), otpCode.trim(), newPassword);
      setSuccessMsg(isEn ? 'Password reset successfully. You can now sign in.' : 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const fallbackMessage = isEn ? 'Something went wrong.' : 'Đã xảy ra lỗi.';
      setError(err instanceof Error ? err.message : fallbackMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const trans = {
    title: isEn ? 'Forgot Password' : 'Quên mật khẩu',
    subtitle: step === 'request'
      ? (isEn ? 'Enter your account email to receive an OTP code' : 'Nhập email tài khoản để nhận mã OTP')
      : (isEn ? 'Enter the OTP code and your new password' : 'Nhập mã OTP và mật khẩu mới của bạn'),
    emailPlaceholder: isEn ? 'Enter Email' : 'Nhập địa chỉ Email',
    otpPlaceholder: isEn ? 'Enter 6-digit OTP' : 'Nhập mã OTP 6 số',
    requestSubmit: isSubmitting ? (isEn ? 'Sending...' : 'Đang gửi...') : (isEn ? 'Send OTP Code' : 'Gửi mã OTP'),
    resetSubmit: isSubmitting ? (isEn ? 'Resetting...' : 'Đang đặt lại...') : (isEn ? 'Reset Password' : 'Đặt lại mật khẩu'),
    back: isEn ? 'Back' : 'Quay lại',
    backToLogin: isEn ? 'Back to Sign In' : 'Về trang đăng nhập',
    rememberPass: isEn ? 'Remember your password?' : 'Đã nhớ mật khẩu?',
  };

  return (
    <div className="auth-wrapper">
      <div ref={cardRef} className="auth-container">

        {/* VISUAL PANEL */}
        <div className="auth-visual-panel">
          <button className="auth-back-btn" onClick={() => navigate('/')}>
            ← {isEn ? 'Back to Home' : 'Về trang chủ'}
          </button>
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000"
            alt="Space"
            className="auth-visual-img"
          />
          <div className="auth-visual-overlay"></div>
        </div>

        {/* FORM PANEL */}
        <div className="auth-form-panel">

          <div className="auth-top-controls">
            <button className="auth-lang-btn" onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}>
              {language === 'en' ? 'VI / EN' : 'EN / VI'}
            </button>
          </div>

          <div className="auth-anim-wrapper">

            <div className="auth-header">
              <h1>{trans.title}</h1>
              <p style={{ color: '#8b949e', fontSize: 14, marginTop: 8 }}>{trans.subtitle}</p>
            </div>

            {step === 'request' ? (
              <form className="auth-form" onSubmit={handleRequestReset}>
                <div className="auth-field-group">
                  <label className="auth-label">Email <span>*</span></label>
                  <div className="auth-input-wrapper">
                    <input
                      type="email"
                      className="auth-input"
                      placeholder={trans.emailPlaceholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {error && <div className="auth-error-msg">{error}</div>}
                {successMsg && <div className="auth-success-msg">{successMsg}</div>}

                <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                  {trans.requestSubmit}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleResetPassword}>
                <div className="auth-field-group">
                  <label className="auth-label">Email</label>
                  <div className="auth-input-wrapper">
                    <input type="email" className="auth-input" value={email} disabled />
                  </div>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">{isEn ? 'OTP Code' : 'Mã OTP'} <span>*</span></label>
                  <div className="auth-input-wrapper">
                    <input
                      type="text"
                      className="auth-input"
                      placeholder={trans.otpPlaceholder}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">{isEn ? 'New Password' : 'Mật khẩu mới'} <span>*</span></label>
                  <div className="auth-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isSubmitting}
                      style={{ paddingRight: '50px' }}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                  <div className="pass-check-list">
                    <div className={`pass-check-item ${passMet6Char ? 'met' : ''}`}>
                      <span className="pass-check-icon">{passMet6Char ? '✓' : '○'}</span>
                      <span>{isEn ? 'At least 6 characters' : 'Ít nhất 6 ký tự'}</span>
                    </div>
                    <div className={`pass-check-item ${passMetLetters ? 'met' : ''}`}>
                      <span className="pass-check-icon">{passMetLetters ? '✓' : '○'}</span>
                      <span>{isEn ? 'Contains letters' : 'Chứa chữ cái'}</span>
                    </div>
                    <div className={`pass-check-item ${passMetNumbers ? 'met' : ''}`}>
                      <span className="pass-check-icon">{passMetNumbers ? '✓' : '○'}</span>
                      <span>{isEn ? 'Contains numbers' : 'Chứa chữ số'}</span>
                    </div>
                  </div>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">{isEn ? 'Confirm New Password' : 'Xác nhận mật khẩu mới'} <span>*</span></label>
                  <div className="auth-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {error && <div className="auth-error-msg">{error}</div>}
                {successMsg && <div className="auth-success-msg">{successMsg}</div>}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    className="auth-submit-btn"
                    style={{ backgroundColor: 'transparent', border: '1px solid #2A3A4A', color: '#c9d1d9' }}
                    onClick={() => { setStep('request'); setError(''); setSuccessMsg(''); }}
                    disabled={isSubmitting}
                  >
                    {trans.back}
                  </button>
                  <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                    {trans.resetSubmit}
                  </button>
                </div>
              </form>
            )}

            <div className="auth-footer-text" style={{ marginTop: 24 }}>
              {trans.rememberPass} <span onClick={() => navigate(ROUTES.LOGIN)}>{trans.backToLogin}</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
