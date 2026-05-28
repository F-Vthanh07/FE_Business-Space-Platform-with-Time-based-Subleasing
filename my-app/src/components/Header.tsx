import React, { useState } from 'react';
import {
  Bell,
  Search,
  Settings,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import './Header.css';

interface HeaderProps {
  userName: string;
  userRole: string;
  userInitials: string;
}

export const Header: React.FC<HeaderProps> = ({ userInitials }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'reports'>('overview');
  const { language, setLanguage, theme, toggleTheme, t } = useThemeLanguage();

  return (
    <header className="dashboard-header glass-card">
      <div className="header-left">
        <div className="header-logo-text">EtherDashboard</div>
      </div>

      <div className="header-center">
        <nav className="header-nav">
          <button
            className={`header-nav-item ${activeTab === 'overview' ? 'header-nav-item--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            {t('header.overview')}
          </button>
          <button
            className={`header-nav-item ${activeTab === 'analytics' ? 'header-nav-item--active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            {t('header.analytics')}
          </button>
          <button
            className={`header-nav-item ${activeTab === 'reports' ? 'header-nav-item--active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            {t('header.reports')}
          </button>
        </nav>
      </div>

      <div className="header-right">
        <div className="search-bar">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder={t('header.exploreAssets')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        {/* Language Switcher */}
        <button 
          className="header-icon-btn" 
          onClick={() => setLanguage(language === 'en' ? 'vi' : 'en')}
          title={language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang tiếng Anh'}
          style={{ width: 'auto', padding: '0 8px', display: 'flex', gap: 4, alignItems: 'center' }}
        >
          <Globe size={14} />
          <span style={{ fontSize: 10, fontWeight: 700 }}>{language.toUpperCase()}</span>
        </button>

        {/* Theme Toggle */}
        <button 
          className="header-icon-btn" 
          onClick={toggleTheme}
          title={theme === 'dark' ? t('common.themeLight') : t('common.themeDark')}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button className="header-icon-btn" title={t('header.notifications')}>
          <Bell size={15} />
          <span className="notif-dot" />
        </button>
        <button className="header-icon-btn" title={t('header.settings')}>
          <Settings size={15} />
        </button>
        <div className="header-avatar">
          {userInitials || 'NC'}
        </div>
      </div>
    </header>
  );
};
