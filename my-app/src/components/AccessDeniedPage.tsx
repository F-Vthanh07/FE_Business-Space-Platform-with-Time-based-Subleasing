import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import './AccessDeniedPage.css';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();

  const handleLogout = () => {
    // Clear localStorage and go to login
    const keepKeys = ['app-language', 'app-theme'];
    const saved: Record<string, string> = {};
    keepKeys.forEach((k) => { const v = localStorage.getItem(k); if (v !== null) saved[k] = v; });
    localStorage.clear();
    Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));
    window.location.href = '/login';
  };

  return (
    <div className="access-denied-wrapper">
      <div className="access-denied-glass-card">
        <div className="alert-icon-container">
          <div className="alert-pulse-ring" />
          <ShieldAlert size={48} className="alert-shield-icon" />
        </div>
        
        <h1 className="access-denied-title">
          {language === 'en' ? 'ACCESS DENIED' : 'TỪ CHỐI TRUY CẬP'}
        </h1>
        
        <div className="error-code">ERROR 403: FORBIDDEN</div>
        
        <p className="access-denied-desc">
          {language === 'en' 
            ? "You do not have authorization to view this secure administrative panel. If you believe this is an error, please contact the system administrator." 
            : "Bạn không có quyền truy cập vào bảng điều khiển quản trị bảo mật này. Nếu bạn tin đây là một sự nhầm lẫn, vui lòng liên hệ với quản trị viên hệ thống."}
        </p>

        <div className="access-denied-actions">
          <button className="btn-back-home" onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
            {language === 'en' ? 'Back to Home' : 'Quay lại Trang chủ'}
          </button>
          
          <button className="btn-logout-switch" onClick={handleLogout}>
            <LogOut size={16} />
            {language === 'en' ? 'Login with another account' : 'Đăng nhập tài khoản khác'}
          </button>
        </div>
      </div>
    </div>
  );
};
