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
  Sun,
  Moon,
} from 'lucide-react';
import { useThemeLanguage } from '../../../context/ThemeLanguageContext';
import './OwnerSidebar.css';

type OwnerPage = 'overview' | 'spaces' | 'listings' | 'tenants' | 'analytics' | 'settings';

interface OwnerSidebarProps {
  activePage: OwnerPage;
  onNavigate: (page: OwnerPage) => void;
  onNewSpaceClick?: () => void;
}

interface NavItem {
  id: OwnerPage;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'overview', icon: <LayoutDashboard size={15} /> },
  { id: 'spaces', icon: <Building2 size={15} /> },
  { id: 'listings', icon: <FileText size={15} /> },
  { id: 'tenants', icon: <Users size={15} /> },
  { id: 'analytics', icon: <BarChart3 size={15} /> },
  { id: 'settings', icon: <Settings size={15} /> },
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

export const OwnerSidebar: React.FC<OwnerSidebarProps> = ({ activePage, onNavigate, onNewSpaceClick }) => {
  const { t, language, setLanguage, theme, toggleTheme } = useThemeLanguage();

  return (
    <aside className="owner-sidebar glass-card">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Ether UI</h2>
        <p className="sidebar-subtitle">EDITORIAL SOFT-FORM</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const keys = getTranslationKeys(item.id);
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <div className="sidebar-nav-text">
                <span className="sidebar-nav-label">{t(keys.label)}</span>
                <span className="sidebar-nav-sublabel">{t(keys.sub)}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-divider" />
        <button className="btn-primary sidebar-cta" onClick={onNewSpaceClick || (() => onNavigate('spaces'))}>
          <Plus size={14} />
          {t('sidebar.newTransaction')}
        </button>
        
        <div className="sidebar-footer-actions">
          <button 
            className="sidebar-action-btn" 
            title={t('sidebar.languageNetwork')}
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          >
            <Globe size={14} />
          </button>
          <div className="sidebar-footer-divider" />
          <button 
            className="sidebar-action-btn" 
            title={theme === 'dark' ? t('common.themeLight') : t('common.themeDark')}
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <div className="sidebar-footer-divider" />
          <button className="sidebar-action-btn" title={t('sidebar.logout')} onClick={() => window.location.reload()}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
