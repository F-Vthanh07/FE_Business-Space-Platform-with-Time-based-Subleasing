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
  onLogout?: () => void;
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

export const RenterSidebar: React.FC<RenterSidebarProps> = ({ activePage, onNavigate, onNewSlotClick, onLogout }) => {
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
      <div className="renter-sidebar-header">
        <h2 className="renter-sidebar-title">Ether UI</h2>
        <p className="renter-sidebar-subtitle">EDITORIAL SOFT-FORM</p>
        <div className="renter-sidebar-role-badge">
          <span>{t('sidebar.renterRoleBadge')}</span>
        </div>
      </div>

      <nav className="renter-sidebar-nav">
        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const labels = getNavLabel(item.id);
          return (
            <button
              key={item.id}
              className={`renter-sidebar-item ${isActive ? 'renter-sidebar-item--active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="renter-sidebar-icon">{item.icon}</span>
              <div className="renter-sidebar-text">
                <span className="renter-sidebar-label">{labels.label}</span>
                <span className="renter-sidebar-sublabel">{labels.sub}</span>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="renter-sidebar-footer">
        <div className="renter-sidebar-divider" />
        <button className="btn-primary renter-sidebar-cta" onClick={onNewSlotClick || (() => onNavigate('sublease-listings'))}>
          <Plus size={14} />
          {t('sidebar.newTransactionRenter')}
        </button>
        
        <div className="renter-sidebar-footer-actions">
          <button 
            className="renter-sidebar-action-btn" 
            title={t('sidebar.languageNetwork')}
            onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          >
            <Globe size={14} />
          </button>
          <div className="renter-sidebar-footer-divider" />
          <button 
            className="renter-sidebar-action-btn" 
            title={theme === 'dark' ? t('common.themeLight') : t('common.themeDark')}
            onClick={toggleTheme}
            type="button"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <div className="renter-sidebar-footer-divider" />
          <button 
            className="renter-sidebar-action-btn" 
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
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
