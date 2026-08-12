import React from 'react';
import {
  IdCard,
  KeyRound,
  HelpCircle,
  Globe,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { useThemeLanguage } from '../../../../context/ThemeLanguageContext';
import { clearLocalStorageForLogout } from '../../../../utils/preserveLocalStorage';
import '../layout/UserSidebar.css';
import type { UserPage } from '../../types';

interface ProfileSidebarProps {
  activePage: UserPage | string;
  onNavigate: (page: UserPage | string) => void;
  onLogout?: () => void;
}

interface NavItem {
  id: UserPage | string;
  icon: React.ReactNode;
}

const profileNavItems: NavItem[] = [
  { id: 'profile', icon: <IdCard size={16} /> },
  { id: 'change-password', icon: <KeyRound size={16} /> },
  { id: 'forgot-password', icon: <HelpCircle size={16} /> },
];

const getPageLabels = (id: string, lang: string) => {
  const isEn = lang === 'en';
  switch (id) {
    case 'profile': return { title: isEn ? 'Profile' : 'Hồ sơ cá nhân', sub: isEn ? 'Identity verification' : 'Xác thực định danh' };
    case 'wallet': return { title: isEn ? 'Wallet' : 'Ví của tôi', sub: isEn ? 'Balance & transactions' : 'Số dư & giao dịch' };
    case 'change-password': return { title: isEn ? 'Change Password' : 'Đổi mật khẩu', sub: isEn ? 'Update your credentials' : 'Cập nhật thông tin đăng nhập' };
    case 'forgot-password': return { title: isEn ? 'Forgot Password' : 'Quên mật khẩu', sub: isEn ? 'Recover your account' : 'Khôi phục tài khoản' };
    default: return { title: id, sub: '' };
  }
};

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ activePage, onNavigate, onLogout }) => {
  const { t, language, setLanguage } = useThemeLanguage();

  const renderNavGroup = (items: NavItem[]) =>
    items.map((item) => {
      const isActive = activePage === item.id || activePage.startsWith(`${item.id}-`);
      const labels = getPageLabels(item.id as string, language);
      return (
        <button
          key={item.id}
          className={`user-sidebar-item ${isActive ? 'user-sidebar-item--active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <span className="user-sidebar-icon">{item.icon}</span>
          <div className="user-sidebar-text">
            <span className="user-sidebar-label">{labels.title}</span>
            <span className="user-sidebar-sublabel">{labels.sub}</span>
          </div>
        </button>
      );
    });

  return (
    <aside className="user-sidebar glass-card">
      <div className="user-sidebar-header">
        <p className="user-sidebar-subtitle">
          {language === 'en' ? 'Account Settings' : 'Cài đặt tài khoản'}
        </p>
      </div>

      <nav className="user-sidebar-nav">
        <button className="user-sidebar-item" onClick={() => onNavigate('overview')}>
          <span className="user-sidebar-icon"><ArrowLeft size={16} /></span>
          <div className="user-sidebar-text">
            <span className="user-sidebar-label">{language === 'en' ? 'Back to Dashboard' : 'Về Bảng điều khiển'}</span>
          </div>
        </button>

        <div className="user-sidebar-divider" />

        <span className="user-sidebar-group-label">
          {language === 'en' ? 'ACCOUNT' : 'TÀI KHOẢN'}
        </span>
        {renderNavGroup(profileNavItems)}
      </nav>

      <div className="user-sidebar-footer">
        <div className="user-sidebar-divider" />
        <div className="user-sidebar-footer-actions">
          <button
            className="user-sidebar-action-btn"
            title={t('sidebar.languageNetwork')}
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          >
            <Globe size={16} />
          </button>
          <div className="user-sidebar-footer-divider" />
          <button
            className="user-sidebar-action-btn"
            title={t('sidebar.logout')}
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                clearLocalStorageForLogout();
                window.location.reload();
              }
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

