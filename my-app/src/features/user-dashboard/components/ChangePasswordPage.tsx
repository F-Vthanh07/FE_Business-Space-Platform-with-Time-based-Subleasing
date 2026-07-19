import React, { useState } from 'react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './ProfileOverviewPage.css';

export const ChangePasswordPage: React.FC = () => {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const passMet6Char = newPassword.length >= 6;
  const passMetLetters = /[a-zA-Z]/.test(newPassword);
  const passMetNumbers = /[0-9]/.test(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!currentPassword || !newPassword || !confirmPassword) {
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

    setIsSaving(true);
    // TODO: nối API đổi mật khẩu khi BE cung cấp endpoint (POST /api/Auth/change-password)
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMsg(isEn ? 'Password updated successfully.' : 'Đổi mật khẩu thành công.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 600);
  };

  return (
    <div className="renter-page-wrap">
      <div className="page-header animate-in">
        <div>
          <h1 className="page-title">{isEn ? 'Change Password' : 'Đổi mật khẩu'}</h1>
          <p className="page-subtitle text-secondary">
            {isEn ? 'Update the password used to sign in to your account' : 'Cập nhật mật khẩu dùng để đăng nhập vào tài khoản của bạn'}
          </p>
        </div>
      </div>

      <div className="glass-card profile-info-card">
        <form className="profile-edit-form" onSubmit={handleSubmit}>
          <div className="profile-edit-field">
            <label className="profile-edit-label">{isEn ? 'Current Password' : 'Mật khẩu hiện tại'}</label>
            <input
              type="password"
              className="profile-edit-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="profile-edit-field">
            <label className="profile-edit-label">{isEn ? 'New Password' : 'Mật khẩu mới'}</label>
            <input
              type="password"
              className="profile-edit-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSaving}
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
              disabled={isSaving}
            />
          </div>

          {error && <p className="text-negative" style={{ fontSize: 13 }}>{error}</p>}
          {successMsg && <p className="text-positive" style={{ fontSize: 13 }}>{successMsg}</p>}

          <div className="profile-edit-actions">
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? (isEn ? 'Saving...' : 'Đang lưu...') : (isEn ? 'Update Password' : 'Cập nhật mật khẩu')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
