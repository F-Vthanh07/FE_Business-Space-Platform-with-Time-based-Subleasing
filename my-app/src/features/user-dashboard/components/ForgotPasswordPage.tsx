import React, { useState } from 'react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { requestPasswordReset, resetPassword } from '../../auth';
import './ProfileOverviewPage.css';

export const ForgotPasswordPage: React.FC = () => {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setSuccessMsg(isEn ? 'Password reset successfully.' : 'Đặt lại mật khẩu thành công.');
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

  const subtitle = step === 'request'
    ? (isEn ? 'Enter your account email to receive an OTP code' : 'Nhập email tài khoản để nhận mã OTP')
    : (isEn ? 'Enter the OTP code and your new password' : 'Nhập mã OTP và mật khẩu mới của bạn');

  const requestSubmitLabel = isSubmitting
    ? (isEn ? 'Sending...' : 'Đang gửi...')
    : (isEn ? 'Send OTP Code' : 'Gửi mã OTP');

  const resetSubmitLabel = isSubmitting
    ? (isEn ? 'Resetting...' : 'Đang đặt lại...')
    : (isEn ? 'Reset Password' : 'Đặt lại mật khẩu');

  return (
    <div className="renter-page-wrap">
      <div className="page-header animate-in">
        <div>
          <h1 className="page-title">{isEn ? 'Forgot Password' : 'Quên mật khẩu'}</h1>
          <p className="page-subtitle text-secondary">{subtitle}</p>
        </div>
      </div>

      <div className="glass-card profile-info-card">
        {step === 'request' ? (
          <form className="profile-edit-form" onSubmit={handleRequestReset}>
            <div className="profile-edit-field">
              <label className="profile-edit-label">Email</label>
              <input
                type="email"
                className="profile-edit-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {error && <p className="text-negative" style={{ fontSize: 13 }}>{error}</p>}
            {successMsg && <p className="text-positive" style={{ fontSize: 13 }}>{successMsg}</p>}

            <div className="profile-edit-actions">
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {requestSubmitLabel}
              </button>
            </div>
          </form>
        ) : (
          <form className="profile-edit-form" onSubmit={handleResetPassword}>
            <div className="profile-edit-field">
              <label className="profile-edit-label">Email</label>
              <input type="email" className="profile-edit-input" value={email} disabled />
            </div>

            <div className="profile-edit-field">
              <label className="profile-edit-label">{isEn ? 'OTP Code' : 'Mã OTP'}</label>
              <input
                type="text"
                className="profile-edit-input"
                placeholder={isEn ? 'Enter 6-digit OTP' : 'Nhập mã OTP 6 số'}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="profile-edit-field">
              <label className="profile-edit-label">{isEn ? 'New Password' : 'Mật khẩu mới'}</label>
              <input
                type="password"
                className="profile-edit-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
              />
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

            <div className="profile-edit-field">
              <label className="profile-edit-label">{isEn ? 'Confirm New Password' : 'Xác nhận mật khẩu mới'}</label>
              <input
                type="password"
                className="profile-edit-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {error && <p className="text-negative" style={{ fontSize: 13 }}>{error}</p>}
            {successMsg && <p className="text-positive" style={{ fontSize: 13 }}>{successMsg}</p>}

            <div className="profile-edit-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => { setStep('request'); setError(''); setSuccessMsg(''); }}
                disabled={isSubmitting}
              >
                {isEn ? 'Back' : 'Quay lại'}
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {resetSubmitLabel}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
