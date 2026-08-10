import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Tag,
  Wallet,
  Zap,
  Building2,
} from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './AdminSidebar.css';

export type AdminPage = 'overview' | 'users' | 'listings' | 'categories' | 'wallets' | 'priorityLevels' | 'spaces';

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
  { id: 'wallets', icon: <Wallet size={16} /> },
  { id: 'priorityLevels', icon: <Zap size={16} /> },
  { id: 'categories', icon: <Tag size={16} /> },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activePage, onNavigate, onLogout }) => {
  const { language } = useThemeLanguage();

  const getPageLabels = (id: AdminPage) => {
    const isEn = language === 'en';
    switch (id) {
      case 'overview':
        return { title: isEn ? 'Overview' : 'Tổng quan', sub: isEn ? 'System statistics' : 'Số liệu hệ thống' };
      case 'users':
        return { title: isEn ? 'Users' : 'Người dùng', sub: isEn ? 'Accounts registry' : 'Danh sách tài khoản' };
      case 'spaces':
        return { title: isEn ? 'Spaces' : 'Mặt bằng', sub: isEn ? 'All registered spaces' : 'Tất cả mặt bằng đã đăng ký' };
      case 'listings':
        return { title: isEn ? 'Listings Approval' : 'Duyệt tin đăng', sub: isEn ? 'Market offers' : 'Tin thuê chờ duyệt' };
      case 'wallets':
        return { title: isEn ? 'Wallets' : 'Ví', sub: isEn ? 'User balances' : 'Số dư người dùng' };
      case 'priorityLevels':
        return { title: isEn ? 'Priority Packages' : 'Gói giá đăng bài', sub: isEn ? 'Listing boosts' : 'Ưu tiên hiển thị' };
      case 'categories':
        return { title: isEn ? 'Categories' : 'Ngành nghề', sub: isEn ? 'Business niches' : 'Ngành hàng kinh doanh' };
      default:
        return { title: id, sub: '' };
    }
  };

  return (
    <aside className="admin-sidebar glass-card">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Admin Portal</h2>
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
