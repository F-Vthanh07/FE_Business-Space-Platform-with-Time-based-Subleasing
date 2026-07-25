import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useThemeLanguage } from '../../../../context/ThemeLanguageContext';
import { changePassword } from '../../../auth/api/auth.api';
import './ProfileOverviewPage.css';

export const ChangePasswordPage: React.FC = () => {
  const { language } = useThemeLanguage();
  const isEn = language === 'en';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const passMet6Char = newPassword.length >= 6;
  const passMetLetters = /[a-zA-Z]/.test(newPassword);
  const passMetNumbers = /\d/.test(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const email = localStorage.getItem('portal_email') || '';
    const token = localStorage.getItem('portal_token') || '';

    if (!email) {
      setError(isEn ? 'User email not found. Please log in again.' : 'Không tìm thấy email người dùng. Vui lòng đăng nhập lại.');
      return;
    }

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
    try {
      const serverMsg = await changePassword(email, currentPassword, newPassword, token);
      setSuccessMsg(serverMsg || (isEn ? 'Password updated successfully.' : 'Đổi mật khẩu thành công.'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : (isEn ? 'Failed to update password.' : 'Lỗi đổi mật khẩu. Vui lòng thử lại.'));
    } finally {
      setIsSaving(false);
    }
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
          {/* Mật khẩu hiện tại */}
          <div className="profile-edit-field">
            <label className="profile-edit-label">{isEn ? 'Current Password' : 'Mật khẩu hiện tại'}</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                className="profile-edit-input"
                style={{ width: '100%', paddingRight: 44 }}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                }}
                title={showCurrentPassword ? (isEn ? 'Hide password' : 'Ẩn mật khẩu') : (isEn ? 'Show password' : 'Xem mật khẩu')}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div className="profile-edit-field">
            <label className="profile-edit-label">{isEn ? 'New Password' : 'Mật khẩu mới'}</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="profile-edit-input"
                style={{ width: '100%', paddingRight: 44 }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                }}
                title={showNewPassword ? (isEn ? 'Hide password' : 'Ẩn mật khẩu') : (isEn ? 'Show password' : 'Xem mật khẩu')}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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

          {/* Xác nhận mật khẩu mới */}
          <div className="profile-edit-field">
            <label className="profile-edit-label">{isEn ? 'Confirm New Password' : 'Xác nhận mật khẩu mới'}</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="profile-edit-input"
                style={{ width: '100%', paddingRight: 44 }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                }}
                title={showConfirmPassword ? (isEn ? 'Hide password' : 'Ẩn mật khẩu') : (isEn ? 'Show password' : 'Xem mật khẩu')}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
