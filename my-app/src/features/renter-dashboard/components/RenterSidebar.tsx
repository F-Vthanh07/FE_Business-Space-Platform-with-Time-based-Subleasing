import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
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
import './RenterSidebar.css';
import type { RenterPage } from '../types';

interface RenterSidebarProps {
  activePage: RenterPage;
  onNavigate: (page: RenterPage) => void;
  onNewSlotClick?: () => void;
}

interface NavItem {
  id: RenterPage;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'overview', icon: <LayoutDashboard size={15} /> },
  { id: 'calendar', icon: <CalendarDays size={15} /> },
  { id: 'sublease-listings', icon: <FileText size={15} /> },
  { id: 'sub-tenants', icon: <Users size={15} /> },
  { id: 'analytics', icon: <BarChart3 size={15} /> },
  { id: 'settings', icon: <Settings size={15} /> },
];

export const RenterSidebar: React.FC<RenterSidebarProps> = ({ activePage, onNavigate, onNewSlotClick }) => {
  const { t, language, setLanguage, theme, toggleTheme } = useThemeLanguage();

  const getNavLabel = (id: RenterPage) => {
    switch (id) {
      case 'overview':
        return { label: 'Dashboard', sub: t('sidebar.dashboardSub') };
      case 'calendar':
        return { label: language === 'en' ? 'Calendar' : 'Lịch', sub: t('sidebar.calendarSub') };
      case 'sublease-listings':
        return { label: language === 'en' ? 'Market' : 'Chợ', sub: t('sidebar.subleaseSub') };
      case 'sub-tenants':
        return { label: language === 'en' ? 'Tenants' : 'Khách phụ', sub: t('sidebar.subTenantsSub') };
      case 'analytics':
        return { label: 'Wallet', sub: t('sidebar.walletSub') };
      case 'settings':
        return { label: 'Settings', sub: t('sidebar.settingsSub') };
    }
  };

  return (
    <aside className="renter-sidebar glass-card">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Ether UI</h2>
        <p className="sidebar-subtitle">EDITORIAL SOFT-FORM</p>
        <div className="sidebar-role-badge">
          <span>{t('sidebar.renterRoleBadge')}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const labels = getNavLabel(item.id);
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <div className="sidebar-nav-text">
                <span className="sidebar-nav-label">{labels.label}</span>
                <span className="sidebar-nav-sublabel">{labels.sub}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-divider" />
        <button className="btn-primary sidebar-cta" onClick={onNewSlotClick || (() => onNavigate('sublease-listings'))}>
          <Plus size={14} />
          {t('sidebar.newTransactionRenter')}
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
