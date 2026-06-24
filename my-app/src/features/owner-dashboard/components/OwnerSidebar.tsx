import React from 'react';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  BarChart3,
  Settings,
  Plus,
  Globe,
  LogOut,
} from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './OwnerSidebar.css';

type OwnerPage = 'overview' | 'spaces' | 'listings' | 'tenants' | 'analytics' | 'settings';

interface OwnerSidebarProps {
  activePage: OwnerPage;
  onNavigate: (page: OwnerPage) => void;
  onNewSpaceClick?: () => void;
  onLogout?: () => void;
}

interface NavItem {
  id: OwnerPage;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'overview', icon: <LayoutDashboard size={16} /> },
  { id: 'spaces', icon: <Building2 size={16} /> },
  { id: 'listings', icon: <FileText size={16} /> },
  { id: 'tenants', icon: <Users size={16} /> },
  { id: 'analytics', icon: <BarChart3 size={16} /> },
  { id: 'settings', icon: <Settings size={16} /> },
];

const getPageLabels = (id: OwnerPage, lang: string) => {
  const isEn = lang === 'en';
  switch (id) {
    case 'overview': return { title: isEn ? 'Dashboard' : 'Bảng điều khiển', sub: isEn ? 'System overview' : 'Tổng quan hệ thống' };
    case 'spaces': return { title: isEn ? 'My Spaces' : 'Quản lý Mặt bằng', sub: isEn ? 'Physical locations' : 'Tài sản vật lý' };
    case 'listings': return { title: isEn ? 'My Listings' : 'Quản lý Tin đăng', sub: isEn ? 'Public market ads' : 'Bài đăng cho thuê' };
    case 'tenants': return { title: isEn ? 'Tenants' : 'Khách thuê', sub: isEn ? 'Manage contracts' : 'Quản lý hợp đồng' };
    case 'analytics': return { title: isEn ? 'Analytics' : 'Doanh thu', sub: isEn ? 'Financial reports' : 'Báo cáo tài chính' };
    case 'settings': return { title: isEn ? 'Settings' : 'Cài đặt', sub: isEn ? 'Account prefs' : 'Hệ thống' };
    default: return { title: id, sub: '' };
  }
};

export const OwnerSidebar: React.FC<OwnerSidebarProps> = ({ activePage, onNavigate, onNewSpaceClick, onLogout }) => {
  const { language, setLanguage } = useThemeLanguage();

  return (
    <aside className="owner-sidebar">
      <div className="owner-sidebar-header">
        <h2 className="owner-sidebar-title">Ether UI</h2>
        <p className="owner-sidebar-subtitle">System Console</p>
      </div>

      <nav className="owner-sidebar-nav">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const labels = getPageLabels(item.id, language);
          return (
            <button
              key={item.id}
              className={`owner-sidebar-item ${isActive ? 'owner-sidebar-item--active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="owner-sidebar-icon">{item.icon}</span>
              <div className="owner-sidebar-text">
                <span className="owner-sidebar-label">{labels.title}</span>
                <span className="owner-sidebar-sublabel">{labels.sub}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="owner-sidebar-footer">
        <div className="owner-sidebar-divider" />
        {/* Nút to dưới cùng để thêm Mặt bằng */}
        <button className="owner-sidebar-cta" onClick={onNewSpaceClick || (() => onNavigate('spaces'))}>
          <Plus size={16} />
          {language === 'en' ? 'NEW SPACE' : 'THÊM MẶT BẰNG'}
        </button>
        
        <div className="owner-sidebar-footer-actions">
          <button 
            className="owner-sidebar-action-btn" 
            title="Ngôn ngữ"
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          >
            <Globe size={16} />
          </button>
          <div className="owner-sidebar-footer-divider" />
          <button 
            className="owner-sidebar-action-btn" 
            title="Đăng xuất" 
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