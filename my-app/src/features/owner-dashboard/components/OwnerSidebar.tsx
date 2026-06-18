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

const getTranslationKeys = (id: OwnerPage) => {
  switch (id) {
    case 'overview': return { label: 'sidebar.dashboard', sub: 'sidebar.dashboardSub' };
    case 'spaces': return { label: 'sidebar.assets', sub: 'sidebar.assetsSub' };
    case 'listings': return { label: 'sidebar.market', sub: 'sidebar.marketSub' };
    case 'tenants': return { label: 'sidebar.exchange', sub: 'sidebar.exchangeSub' };
    case 'analytics': return { label: 'sidebar.wallet', sub: 'sidebar.walletSub' };
    case 'settings': return { label: 'sidebar.settings', sub: 'sidebar.settingsSub' };
  }
};

export const OwnerSidebar: React.FC<OwnerSidebarProps> = ({ activePage, onNavigate, onNewSpaceClick, onLogout }) => {
  const { t, language, setLanguage } = useThemeLanguage();

  return (
    <aside className="owner-sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Ether UI</h2>
        <p className="sidebar-subtitle">System Console</p>
      </div>

      <nav className="owner-sidebar-nav">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const keys = getTranslationKeys(item.id);
          return (
            <button
              key={item.id}
              className={`owner-sidebar-item ${isActive ? 'owner-sidebar-item--active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="owner-sidebar-icon">{item.icon}</span>
              <div className="owner-sidebar-text">
                <span className="owner-sidebar-label">{t(keys.label) || item.id.toUpperCase()}</span>
                <span className="owner-sidebar-sublabel">{t(keys.sub) || 'Manage section'}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-divider" />
        <button className="sidebar-cta" onClick={onNewSpaceClick || (() => onNavigate('spaces'))}>
          <Plus size={16} />
          {t('sidebar.newTransaction') || 'NEW SPACE'}
        </button>
        
        <div className="sidebar-footer-actions">
          <button 
            className="sidebar-action-btn" 
            title={t('sidebar.languageNetwork')}
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          >
            <Globe size={16} />
          </button>
          <div className="sidebar-footer-divider" />
          {/* Đã xóa nút Theme ở đây */}
          <button 
            className="sidebar-action-btn" 
            title={t('sidebar.logout')} 
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                localStorage.removeItem('portal_role');
                localStorage.removeItem('portal_token');
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