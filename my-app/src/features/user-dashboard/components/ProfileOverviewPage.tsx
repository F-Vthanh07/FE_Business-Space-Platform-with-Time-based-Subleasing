import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import { CccdVerificationSection, VerificationWarningBanner, useIdentityVerification } from '../../identity-verification';
import { updateProfile } from '../../onboarding';
import './ProfileOverviewPage.css';

const EMPTY_DATE = '0001-01-01';

const formatDate = (value: string | null | undefined, locale: string, placeholder: string): string => {
  if (!value || value === EMPTY_DATE) return placeholder;
  const date = new Date(value);
  if (isNaN(date.getTime())) return placeholder;
  return date.toLocaleDateString(locale);
};

export const ProfileOverviewPage: React.FC = () => {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';
  const { isVerified, profile, isLoading, refetch } = useIdentityVerification();

  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [socialLink, setSocialLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const placeholder = isEn ? 'Not provided' : 'Chưa cập nhật';
  const storedName = localStorage.getItem('current_user_name');
  const displayName = profile?.fullName || storedName || placeholder;
  const initials = displayName !== placeholder ? displayName.substring(0, 2).toUpperCase() : '?';

  const infoRows: Array<[string, string]> = [
    [isEn ? 'Full Name' : 'Họ và tên', profile?.fullName || placeholder],
    [isEn ? 'Gender' : 'Giới tính', profile?.gender || placeholder],
    [isEn ? 'Date of Birth' : 'Ngày sinh', formatDate(profile?.dob, isEn ? 'en-US' : 'vi-VN', placeholder)],
    [isEn ? 'Citizen ID Number' : 'Số CCCD', profile?.citizenIDNumber || placeholder],
    [isEn ? 'Permanent Residence' : 'Nơi thường trú', profile?.permanentResidence || placeholder],
    [isEn ? 'ID Issue Date' : 'Ngày cấp CCCD', formatDate(profile?.dateOfIssue, isEn ? 'en-US' : 'vi-VN', placeholder)],
  ];

  const handleStartEdit = () => {
    setAvatarUrl(profile?.avatarUrl || '');
    setBio(profile?.bio || '');
    setSocialLink(profile?.socialLink || '');
    setError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setError('');
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const token = localStorage.getItem('portal_token') || '';
      await updateProfile(
        {
          avatarUrl: avatarUrl || undefined,
          bio: bio || undefined,
          socialLink: socialLink || undefined,
        },
        token
      );
      await refetch();
      setIsEditing(false);
    } catch (err) {
      const fallbackMessage = isEn ? 'Something went wrong.' : 'Đã xảy ra lỗi.';
      setError(err instanceof Error ? err.message : fallbackMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="renter-page-wrap">
      <div className="page-header animate-in">
        <div>
          <h1 className="page-title">{isEn ? 'Profile' : 'Hồ sơ cá nhân'}</h1>
          <p className="page-subtitle text-secondary">
            {isEn ? 'Manage your account and identity verification' : 'Quản lý tài khoản và xác thực định danh'}
          </p>
        </div>
      </div>

      {!isVerified && <VerificationWarningBanner />}

      <CccdVerificationSection />

      {isVerified && !isLoading && (
        <div className="glass-card profile-info-card">
          <div className="profile-info-header">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={displayName} className="profile-info-avatar-img" />
            ) : (
              <div className="avatar avatar--lg profile-info-avatar-fallback">{initials}</div>
            )}
            <div>
              <h3 className="profile-info-name">{displayName}</h3>
              <span className="badge badge--positive">{isEn ? 'Verified' : 'Đã xác thực'}</span>
            </div>
            {!isEditing && (
              <button type="button" className="btn-ghost profile-info-edit-btn" onClick={handleStartEdit}>
                <Pencil size={13} />
                {isEn ? 'Edit' : 'Chỉnh sửa'}
              </button>
            )}
          </div>

          <table className="cccd-review-table">
            <tbody>
              {infoRows.map(([label, value]) => (
                <tr key={label}>
                  <td className="text-secondary">{label}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {isEditing ? (
            <form className="profile-edit-form" onSubmit={handleSave}>
              <div className="profile-edit-field">
                <label className="profile-edit-label">{isEn ? 'Avatar URL' : 'Ảnh đại diện (URL)'}</label>
                <input
                  type="text"
                  className="profile-edit-input"
                  placeholder="https://..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>

              <div className="profile-edit-field">
                <label className="profile-edit-label">{isEn ? 'Bio' : 'Giới thiệu bản thân'}</label>
                <textarea
                  className="profile-edit-input profile-edit-textarea"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="profile-edit-field">
                <label className="profile-edit-label">{isEn ? 'Social Link' : 'Liên kết mạng xã hội'}</label>
                <input
                  type="text"
                  className="profile-edit-input"
                  placeholder="https://facebook.com/..."
                  value={socialLink}
                  onChange={(e) => setSocialLink(e.target.value)}
                />
              </div>

              {error && <p className="text-negative" style={{ fontSize: 13 }}>{error}</p>}

              <div className="profile-edit-actions">
                <button type="button" className="btn-ghost" onClick={handleCancelEdit} disabled={isSaving}>
                  {isEn ? 'Cancel' : 'Hủy'}
                </button>
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Save' : 'Lưu')}
                </button>
              </div>
            </form>
          ) : (
            <table className="cccd-review-table">
              <tbody>
                <tr>
                  <td className="text-secondary">{isEn ? 'Bio' : 'Giới thiệu'}</td>
                  <td>{profile?.bio || placeholder}</td>
                </tr>
                <tr>
                  <td className="text-secondary">{isEn ? 'Social Link' : 'Liên kết mạng xã hội'}</td>
                  <td>{profile?.socialLink || placeholder}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
