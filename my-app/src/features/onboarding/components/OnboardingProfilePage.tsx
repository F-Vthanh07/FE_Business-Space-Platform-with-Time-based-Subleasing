import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { CccdVerificationSection } from '../../identity-verification';
import { updateProfile } from '../api/onboarding.api';
import { ROUTES } from '../../../routes/routes';
import '../onboarding.css';

export const OnboardingProfilePage: React.FC = () => {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';
  const navigate = useNavigate();

  const [bio, setBio] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'profile' | 'verify'>('profile');

  const finishOnboarding = () => {
    navigate(ROUTES.LOGIN);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const token = localStorage.getItem('portal_token') || '';
      await updateProfile(
        {
          bio: bio || undefined,
          socialLink: socialLink || undefined,
        },
        token
      );
      setStep('verify');
    } catch (err) {
      const fallbackMessage = isEn ? 'Something went wrong.' : 'Đã xảy ra lỗi.';
      setError(err instanceof Error ? err.message : fallbackMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="onboarding-screen">
      <div className="onboarding-logo">EtherSpace</div>

      <div className="glass-card onboarding-card animate-in">
        <div className="onboarding-steps">
          <span className={`onboarding-step ${step === 'profile' ? 'onboarding-step--active' : 'onboarding-step--done'}`}>
            1. {isEn ? 'Profile' : 'Hồ sơ'}
          </span>
          <span className="onboarding-step-divider" />
          <span className={`onboarding-step ${step === 'verify' ? 'onboarding-step--active' : ''}`}>
            2. {isEn ? 'Identity (optional)' : 'Định danh (tùy chọn)'}
          </span>
        </div>

        {step === 'profile' ? (
          <>
            <h1 className="onboarding-title">{isEn ? 'Complete your profile' : 'Hoàn tất hồ sơ của bạn'}</h1>
            <p className="onboarding-subtitle text-secondary">
              {isEn
                ? 'Add a short bio so others recognize you.'
                : 'Thêm giới thiệu ngắn để mọi người dễ nhận ra bạn.'}
            </p>

            <form className="onboarding-form" onSubmit={handleSaveProfile}>
              <div className="onboarding-field-group">
                <label className="onboarding-label">{isEn ? 'Bio' : 'Giới thiệu bản thân'}</label>
                <textarea
                  className="onboarding-input onboarding-textarea"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="onboarding-field-group">
                <label className="onboarding-label">{isEn ? 'Social Link' : 'Liên kết mạng xã hội'}</label>
                <input
                  type="text"
                  className="onboarding-input"
                  placeholder="https://facebook.com/..."
                  value={socialLink}
                  onChange={(e) => setSocialLink(e.target.value)}
                />
              </div>

              {error && <p className="text-negative" style={{ fontSize: 13 }}>{error}</p>}

              <div className="onboarding-actions">
                <button type="button" className="btn-ghost" onClick={() => setStep('verify')}>
                  {isEn ? 'Skip for now' : 'Bỏ qua'}
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Continue' : 'Tiếp tục')}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1 className="onboarding-title">{isEn ? 'Verify your identity' : 'Xác thực định danh'}</h1>
            <p className="onboarding-subtitle text-secondary">
              {isEn
                ? 'Optional for now, but required later to post listings or book a space.'
                : 'Bước này không bắt buộc, nhưng cần thiết sau này để đăng tin cho thuê hoặc đặt thuê mặt bằng.'}
            </p>

            <CccdVerificationSection onConfirm={finishOnboarding} />

            <div className="onboarding-actions" style={{ marginTop: 20 }}>
              <button type="button" className="btn-ghost" onClick={finishOnboarding}>
                {isEn ? 'Skip, go to login' : 'Bỏ qua, đến trang đăng nhập'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
