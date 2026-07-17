import React from 'react';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  CalendarDays,
  BarChart3,
  Settings,
  IdCard,
  Plus,
  Globe,
  LogOut,
  Sun,
  Moon,
  Wallet,
  Inbox // <-- THÊM ICON INBOX VÀO ĐÂY
} from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './UserSidebar.css';
import type { UserPage } from '../types';

interface UserSidebarProps {
  activePage: UserPage | string; // Nới lỏng type một chút để khỏi báo lỗi
  onNavigate: (page: UserPage | string) => void;
  onNewSpaceClick?: () => void;
  onNewSlotClick?: () => void;
  onLogout?: () => void;
}

interface NavItem {
  id: UserPage | string; // Nới lỏng type
  icon: React.ReactNode;
}

const dashboardNavItems: NavItem[] = [
  { id: 'overview', icon: <LayoutDashboard size={16} /> },
];

const spaceNavItems: NavItem[] = [
  { id: 'spaces', icon: <Building2 size={16} /> },
  { id: 'listings', icon: <FileText size={16} /> },
  { id: 'booking-requests', icon: <Inbox size={16} /> }, // <-- THÊM NÚT DUYỆT ĐƠN VÀO ĐÂY
  { id: 'tenants', icon: <Users size={16} /> },
];

const subleaseNavItems: NavItem[] = [
  { id: 'calendar', icon: <CalendarDays size={16} /> },
  { id: 'sublease-listings', icon: <FileText size={16} /> },
  { id: 'sub-tenants', icon: <Users size={16} /> },
];

const walletNavItems: NavItem[] = [
  { id: 'wallet', icon: <Wallet size={16} /> },
];

const commonNavItems: NavItem[] = [
  { id: 'analytics', icon: <BarChart3 size={16} /> },
  { id: 'profile', icon: <IdCard size={16} /> },
  { id: 'settings', icon: <Settings size={16} /> },
];

const getPageLabels = (id: string, lang: string) => {
  const isEn = lang === 'en';
  switch (id) {
    case 'overview': return { title: isEn ? 'Dashboard' : 'Bảng điều khiển', sub: isEn ? 'System overview' : 'Tổng quan hệ thống' };
    case 'spaces': return { title: isEn ? 'My Spaces' : 'Quản lý Mặt bằng', sub: isEn ? 'Physical locations' : 'Tài sản vật lý' };
    case 'listings': return { title: isEn ? 'My Listings' : 'Quản lý Tin đăng', sub: isEn ? 'Public market ads' : 'Bài đăng cho thuê' };
    
    // <-- THÊM LABEL CHO NÚT DUYỆT ĐƠN
    case 'booking-requests': return { title: isEn ? 'Booking Requests' : 'Yêu cầu chờ duyệt', sub: isEn ? 'Manage applications' : 'Duyệt đơn khách thuê' };
    
    case 'tenants': return { title: isEn ? 'Tenants' : 'Khách thuê', sub: isEn ? 'Manage contracts' : 'Quản lý hợp đồng' };
    case 'calendar': return { title: isEn ? 'Calendar' : 'Lịch cho thuê lại', sub: isEn ? 'Sublease slots' : 'Khung giờ cho thuê lại' };
    case 'sublease-listings': return { title: isEn ? 'Sublease Market' : 'Chợ cho thuê lại', sub: isEn ? 'Your sublease ads' : 'Tin cho thuê lại' };
    case 'sub-tenants': return { title: isEn ? 'Sub-tenants' : 'Khách thuê phụ', sub: isEn ? 'Secondary renters' : 'Người thuê lại' };
    case 'wallet': return { title: isEn ? 'Wallet' : 'Ví của tôi', sub: isEn ? 'Balance & transactions' : 'Số dư & giao dịch' };
    case 'analytics': return { title: isEn ? 'Analytics' : 'Doanh thu', sub: isEn ? 'Financial reports' : 'Báo cáo tài chính' };
    case 'profile': return { title: isEn ? 'Profile' : 'Hồ sơ cá nhân', sub: isEn ? 'Identity verification' : 'Xác thực định danh' };
    case 'settings': return { title: isEn ? 'Settings' : 'Cài đặt', sub: isEn ? 'Account prefs' : 'Hệ thống' };
    default: return { title: id, sub: '' };
  }
};

export const UserSidebar: React.FC<UserSidebarProps> = ({ activePage, onNavigate, onNewSpaceClick, onNewSlotClick, onLogout }) => {
  const { t, language, setLanguage, theme, toggleTheme } = useThemeLanguage();

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
        <h2 className="user-sidebar-title">Ether UI</h2>
        <p className="user-sidebar-subtitle">System Console</p>
      </div>

      <nav className="user-sidebar-nav">
        {renderNavGroup(dashboardNavItems)}
        {renderNavGroup(walletNavItems)}

        <span className="user-sidebar-group-label">
          {language === 'en' ? 'MY SPACES' : 'MẶT BẰNG CỦA TÔI'}
        </span>
        {renderNavGroup(spaceNavItems)}

        <span className="user-sidebar-group-label">
          {language === 'en' ? 'SUBLEASING' : 'CHO THUÊ LẠI'}
        </span>
        {renderNavGroup(subleaseNavItems)}

        <div className="user-sidebar-divider" />
        {renderNavGroup(commonNavItems)}
      </nav>

      <div className="user-sidebar-footer">
        <div className="user-sidebar-divider" />
        <button className="btn-primary user-sidebar-cta" onClick={onNewSpaceClick || (() => onNavigate('spaces'))}>
          <Plus size={16} />
          {language === 'en' ? 'NEW SPACE' : 'THÊM MẶT BẰNG'}
        </button>
        <button className="user-sidebar-cta-secondary" onClick={onNewSlotClick || (() => onNavigate('sublease-listings'))}>
          <Plus size={14} />
          {language === 'en' ? 'NEW SLOT' : 'THÊM KHUNG GIỜ'}
        </button>

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
            title={theme === 'dark' ? t('common.themeLight') : t('common.themeDark')}
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="user-sidebar-footer-divider" />
          <button
            className="user-sidebar-action-btn"
            title={t('sidebar.logout')}
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                const keepKeys = ['app-language', 'app-theme'];
                const saved: Record<string, string> = {};
                keepKeys.forEach((k) => { const v = localStorage.getItem(k); if (v !== null) saved[k] = v; });
                localStorage.clear();
                Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v));
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