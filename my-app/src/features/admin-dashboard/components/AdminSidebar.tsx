import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  CreditCard,
  Globe,
  LogOut,
  Sun,
  Moon,
  Tag,
} from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './AdminSidebar.css';

export type AdminPage = 'overview' | 'users' | 'spaces' | 'listings' | 'transactions' | 'categories';

interface AdminSidebarProps {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onLogout: () => void;
}

interface NavItem {
  id: AdminPage;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'overview', icon: <LayoutDashboard size={16} /> },
  { id: 'users', icon: <Users size={16} /> },
  { id: 'spaces', icon: <Building2 size={16} /> },
  { id: 'listings', icon: <FileText size={16} /> },
  { id: 'transactions', icon: <CreditCard size={16} /> },
  { id: 'categories', icon: <Tag size={16} /> },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activePage, onNavigate, onLogout }) => {
  const { language, setLanguage, theme, toggleTheme } = useThemeLanguage();

  const getPageLabels = (id: AdminPage) => {
    const isEn = language === 'en';
    switch (id) {
      case 'overview':
        return { title: isEn ? 'Overview' : 'Tổng quan', sub: isEn ? 'System statistics' : 'Số liệu hệ thống' };
      case 'users':
        return { title: isEn ? 'Users' : 'Người dùng', sub: isEn ? 'Accounts registry' : 'Danh sách tài khoản' };
      case 'spaces':
        return { title: isEn ? 'Spaces Approval' : 'Duyệt mặt bằng', sub: isEn ? 'Pending properties' : 'Bất động sản chờ duyệt' };
      case 'listings':
        return { title: isEn ? 'Listings Approval' : 'Duyệt tin đăng', sub: isEn ? 'Market offers' : 'Tin thuê chờ duyệt' };
      case 'transactions':
        return { title: isEn ? 'Transactions' : 'Giao dịch', sub: isEn ? 'Escrow & payouts' : 'Ví ký quỹ & thanh toán' };
      case 'categories':
        return { title: isEn ? 'Categories' : 'Ngành nghề', sub: isEn ? 'Business niches' : 'Ngành hàng kinh doanh' };
      default:
        return { title: id, sub: '' };
    }
  };

  return (
    <aside className="admin-sidebar glass-card">
      <div className="sidebar-header">
        <h2 className="sidebar-title font-press-start">Admin Portal</h2>
        <p className="sidebar-subtitle text-neon-green">SYSTEM CONTROLLER</p>
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const labels = getPageLabels(item.id);
          return (
            <button
              key={item.id}
              className={`admin-sidebar-item ${isActive ? 'admin-sidebar-item--active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="admin-sidebar-icon">{item.icon}</span>
              <div className="admin-sidebar-text">
                <span className="admin-sidebar-label">{labels.title}</span>
                <span className="admin-sidebar-sublabel">{labels.sub}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-divider" />
        
        <div className="sidebar-footer-actions">
          <button 
            className="sidebar-action-btn" 
            title={language === 'en' ? 'Tiếng Việt' : 'English'}
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          >
            <Globe size={15} />
            <span style={{ fontSize: '9px', fontWeight: 'bold', marginLeft: '2px' }}>
              {language.toUpperCase()}
            </span>
          </button>
          <div className="sidebar-footer-divider" />
          <button 
            className="sidebar-action-btn" 
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <div className="sidebar-footer-divider" />
          <button 
            className="sidebar-action-btn logout-btn" 
            title={language === 'en' ? 'Logout' : 'Đăng xuất'} 
            onClick={onLogout}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
